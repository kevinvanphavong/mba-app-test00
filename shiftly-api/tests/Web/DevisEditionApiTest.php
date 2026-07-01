<?php

namespace App\Tests\Web;

use App\Entity\Centre;
use App\Entity\DemandeB2B;
use App\Entity\Devis;
use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Édition gérant d'un devis (Patch) : le total est TOUJOURS recalculé côté serveur
 * (un total/montant client falsifié est ignoré), le statut est contraint, et un devis
 * d'un autre centre est inaccessible (cross-tenant).
 */
class DevisEditionApiTest extends WebTestCase
{
    private const PASSWORD = 'devis-edit-pass-2026';

    private KernelBrowser $client;
    private Connection $db;
    private EntityManagerInterface $em;
    private int $centreA;
    private int $centreB;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);

        // Un manager (centre A) + un autre centre B.
        $email = $this->db->fetchOne('SELECT email FROM "user" WHERE role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1');
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($hasher->hashPassword($user, self::PASSWORD));
        $this->em->flush();
        $this->centreA = (int) $user->getCentre()->getId();
        $this->centreB = (int) $this->db->fetchOne('SELECT id FROM centre WHERE id <> :a ORDER BY id LIMIT 1', ['a' => $this->centreA]);

        $this->client->request('POST', '/api/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: json_encode(['email' => $email, 'password' => self::PASSWORD]));
        $this->assertResponseIsSuccessful('Login manager');
    }

    private function makeDevis(int $centreId): int
    {
        $centre = $this->em->getRepository(Centre::class)->find($centreId);
        $demande = (new DemandeB2B())->setCentre($centre)->setNomContact('X')->setEmail('x@y.fr')
            ->setTelephone('0600000000')->setTypeEvenement('Séminaire')->setMessage('m');
        $devis = (new Devis())->setCentre($centre)->setDemande($demande)
            ->setLignes([['designation' => 'Base', 'quantite' => 1, 'prixUnitaireCents' => 1000, 'montantCents' => 1000]])
            ->setTotalCents(1000);
        $this->em->persist($demande);
        $this->em->persist($devis);
        $this->em->flush();

        return (int) $devis->getId();
    }

    private function patch(int $id, array $body): int
    {
        $this->client->request('PATCH', "/api/devis/{$id}", server: [
            'CONTENT_TYPE' => 'application/merge-patch+json',
            'HTTP_ACCEPT' => 'application/ld+json',
            'HTTP_X-CSRF' => '1',
        ], content: json_encode($body));

        return $this->client->getResponse()->getStatusCode();
    }

    public function testTotalRecalculeServeurEtTotalClientIgnore(): void
    {
        $id = $this->makeDevis($this->centreA);

        // Le client édite les lignes ET tente d'imposer un total + un montant de ligne faux.
        $status = $this->patch($id, [
            'lignes' => [
                ['designation' => 'Salle', 'quantite' => 2, 'prixUnitaireCents' => 5000, 'montantCents' => 1],
                ['designation' => 'Repas', 'quantite' => 10, 'prixUnitaireCents' => 2500, 'montantCents' => 1],
            ],
            'totalCents' => 1, // falsifié
        ]);
        $this->assertSame(200, $status);

        // Serveur : montant ligne = qté×PU, total = somme → 2×5000 + 10×2500 = 35000.
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame(35000, $body['totalCents'], 'Total recalculé serveur, total client ignoré.');
        $this->assertSame(10000, $body['lignes'][0]['montantCents']);
        $this->assertSame(25000, $body['lignes'][1]['montantCents']);

        // Persisté en base.
        $this->assertSame(35000, (int) $this->db->fetchOne('SELECT total_cents FROM devis WHERE id = :id', ['id' => $id]));
    }

    public function testChangementStatutValide(): void
    {
        $id = $this->makeDevis($this->centreA);
        $this->assertSame(200, $this->patch($id, ['statut' => Devis::STATUT_ENVOYE]));
        $this->assertSame('ENVOYE', $this->db->fetchOne('SELECT statut FROM devis WHERE id = :id', ['id' => $id]));
    }

    public function testStatutInvalideRejete(): void
    {
        $id = $this->makeDevis($this->centreA);
        $this->assertSame(422, $this->patch($id, ['statut' => 'PIRATE']));
    }

    public function testEditionCrossTenantRefusee(): void
    {
        $idB = $this->makeDevis($this->centreB);
        // Manager du centre A édite un devis du centre B → introuvable (filtré) → 404.
        $this->assertSame(404, $this->patch($idB, ['statut' => Devis::STATUT_ENVOYE]));
    }
}
