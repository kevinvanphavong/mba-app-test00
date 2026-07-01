<?php

namespace App\Tests\Service;

use App\Entity\Centre;
use App\Entity\Contact;
use App\Repository\ContactRepository;
use App\Service\ContactDeriver;
use App\Service\PiiCipher;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * CRM — dérivation de contacts : dédup par email DANS le centre, isolation entre
 * centres, PII chiffrées au repos (vérif SQL brute). Vraie base de test (DAMA rollback).
 */
class ContactDeriverTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private Connection $db;
    private ContactDeriver $deriver;
    private PiiCipher $cipher;
    private Centre $centreA;
    private Centre $centreB;

    protected function setUp(): void
    {
        self::bootKernel();
        $c = static::getContainer();
        $this->em = $c->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $this->deriver = $c->get(ContactDeriver::class);
        $this->cipher = $c->get(PiiCipher::class);

        $ids = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM centre ORDER BY id LIMIT 2'));
        $repo = $this->em->getRepository(Centre::class);
        $this->centreA = $repo->find($ids[0]);
        $this->centreB = $repo->find($ids[1]);
    }

    private function countContacts(Centre $c): int
    {
        return (int) $this->db->fetchOne('SELECT count(*) FROM contact WHERE centre_id = :c', ['c' => $c->getId()]);
    }

    public function testDedupParEmailDansLeMemeCentre(): void
    {
        $c1 = $this->deriver->upsert($this->centreA, 'Bob Martin', 'BOB@example.com', '0601020304', Contact::SEGMENT_B2C);
        // Même email (casse différente) → doit retrouver le MÊME contact, pas un doublon.
        $c2 = $this->deriver->upsert($this->centreA, 'Bob M.', 'bob@example.com', null, Contact::SEGMENT_B2B);

        $this->assertSame($c1->getId(), $c2->getId(), 'Même email dans le centre = même contact.');
        $this->assertSame(1, $this->countContacts($this->centreA));
        // Les segments s'accumulent.
        $this->assertEqualsCanonicalizing([Contact::SEGMENT_B2C, Contact::SEGMENT_B2B], $c2->getSegments());
    }

    public function testMemeEmailDansDeuxCentresRestentDistincts(): void
    {
        $a = $this->deriver->upsert($this->centreA, 'Bob', 'bob@example.com', null, Contact::SEGMENT_B2C);
        $b = $this->deriver->upsert($this->centreB, 'Bob', 'bob@example.com', null, Contact::SEGMENT_B2C);

        $this->assertNotSame($a->getId(), $b->getId(), 'La dédup ne franchit jamais la frontière du centre.');
        $this->assertSame(1, $this->countContacts($this->centreA));
        $this->assertSame(1, $this->countContacts($this->centreB));
    }

    public function testPiiChiffreesEnBaseEtDechiffrablesEnLecture(): void
    {
        $contact = $this->deriver->upsert($this->centreA, 'Alice Secret', 'alice.secret@example.com', '0611223344', Contact::SEGMENT_B2C);
        $id = $contact->getId();

        // En base, les PII sont du ciphertext — jamais le clair.
        $row = $this->db->fetchAssociative('SELECT nom, email, telephone, email_hash FROM contact WHERE id = :id', ['id' => $id]);
        $this->assertNotSame('Alice Secret', $row['nom']);
        $this->assertNotSame('alice.secret@example.com', $row['email']);
        $this->assertStringNotContainsString('alice.secret@example.com', (string) $row['email']);
        $this->assertStringNotContainsString('0611223344', (string) $row['telephone']);
        // Le hash de dédup est déterministe (jamais l'email en clair).
        $this->assertSame($this->cipher->hashEmail('alice.secret@example.com'), $row['email_hash']);

        // Après vidage de l'identity map, la relecture déchiffre correctement.
        $this->em->clear();
        $relu = static::getContainer()->get(ContactRepository::class)->find($id);
        $this->assertSame('Alice Secret', $relu->getNom());
        $this->assertSame('alice.secret@example.com', $relu->getEmail());
        $this->assertSame('0611223344', $relu->getTelephone());
    }

    public function testFailClosedSansCentre(): void
    {
        $this->assertNull($this->deriver->upsert(null, 'X', 'x@y.fr', null, Contact::SEGMENT_B2C));
    }
}
