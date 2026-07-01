<?php

namespace App\Tests\Service;

use App\Entity\Centre;
use App\Entity\Prestation;
use App\Entity\Reservation;
use App\Message\ReservationConfirmeeMessage;
use App\Service\ReservationConfirmer;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Messenger\Transport\InMemory\InMemoryTransport;

/**
 * Confirmation Stripe idempotente et anti-course : la transition EN_ATTENTE → CONFIRMEE
 * est atomique (UPDATE conditionnel), donc une livraison concurrente du même event ne
 * peut ni reconfirmer ni ré-envoyer l'email.
 */
class ReservationConfirmerTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private Connection $db;
    private ReservationConfirmer $confirmer;

    protected function setUp(): void
    {
        self::bootKernel();
        $c = static::getContainer();
        $this->em = $c->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $this->confirmer = $c->get(ReservationConfirmer::class);
    }

    private function makeReservation(): Reservation
    {
        $centre = $this->em->getRepository(Centre::class)->find((int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1'));
        $presta = (new Prestation())->setCentre($centre)->setNom('Bowling')->setPrixCents(2000)->setActif(true);
        $this->em->persist($presta);
        $resa = (new Reservation())
            ->setCentre($centre)->setPrestation($presta)
            ->setDateCreneau(new \DateTimeImmutable('2030-06-15 18:00'))
            ->setNbPersonnes(2)->setNomInvite('Bob')->setEmailInvite('bob@example.com')
            ->setTelephoneInvite('0601020304')->setMontantTotalCents(4000)->setAcompteCents(800);
        $this->em->persist($resa);
        $this->em->flush();

        return $resa;
    }

    private function nbEmails(): int
    {
        /** @var InMemoryTransport $t */
        $t = static::getContainer()->get('messenger.transport.async');
        $n = 0;
        foreach ($t->getSent() as $e) {
            if ($e->getMessage() instanceof ReservationConfirmeeMessage) {
                ++$n;
            }
        }

        return $n;
    }

    public function testConfirmationSimpleDispatcheUnEmail(): void
    {
        $resa = $this->makeReservation();

        $this->assertTrue($this->confirmer->confirmPaid((int) $resa->getId(), 800));
        $this->assertSame('CONFIRMEE', $this->db->fetchOne('SELECT statut FROM reservation WHERE id = :id', ['id' => $resa->getId()]));
        $this->assertSame(1, $this->nbEmails());
    }

    public function testCourseConcurrenteLaSecondeNeConfirmePasNiNEnvoieDEmail(): void
    {
        $resa = $this->makeReservation();
        $id = (int) $resa->getId();

        // L'entité reste EN_ATTENTE dans l'identity map (chargée par makeReservation)…
        // …pendant qu'une livraison concurrente confirme la ligne en base (hors EM).
        $this->db->executeStatement(
            "UPDATE reservation SET statut = 'CONFIRMEE', paid_at = NOW() WHERE id = :id",
            ['id' => $id],
        );

        // Le webhook (entité vue EN_ATTENTE) tente de confirmer : l'UPDATE conditionnel
        // n'affecte 0 ligne (déjà CONFIRMEE) → pas de second email.
        $this->assertFalse($this->confirmer->confirmPaid($id, 800));
        $this->assertSame(0, $this->nbEmails(), 'Aucun email pour la confirmation perdante de la course.');
    }

    public function testRejeuSequentielIdempotent(): void
    {
        $resa = $this->makeReservation();
        $id = (int) $resa->getId();

        $this->assertTrue($this->confirmer->confirmPaid($id, 800));
        // Rejeu (l'entité est maintenant CONFIRMEE) → no-op, pas de second email.
        $this->assertFalse($this->confirmer->confirmPaid($id, 800));
        $this->assertSame(1, $this->nbEmails());
    }

    public function testMontantIncoherentNeConfirmePas(): void
    {
        $resa = $this->makeReservation();

        $this->assertFalse($this->confirmer->confirmPaid((int) $resa->getId(), 1));
        $this->assertSame('EN_ATTENTE_ACOMPTE', $this->db->fetchOne('SELECT statut FROM reservation WHERE id = :id', ['id' => $resa->getId()]));
        $this->assertSame(0, $this->nbEmails());
    }
}
