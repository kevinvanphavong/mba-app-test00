<?php

namespace App\Tests\Service;

use App\Core\Ia\Exception\IaQuotaDepasseException;
use App\Core\Ia\IaGeneratorInterface;
use App\Entity\Centre;
use App\Entity\Prestation;
use App\Entity\Relance;
use App\Entity\Reservation;
use App\Message\RelanceNoShowMessage;
use App\MessageHandler\RelanceNoShowHandler;
use App\Repository\ReservationRepository;
use App\Service\ContactDeriver;
use App\Service\CrmScheduler;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\NullLogger;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Messenger\Stamp\DelayStamp;
use Symfony\Component\Messenger\Transport\InMemory\InMemoryTransport;

/**
 * CRM — relance no-show : planifiée via Messenger (différée, jamais onFlush), et
 * traitée en best-effort (relance créée même sans texte IA). Vraie base (DAMA).
 */
class NoShowRelanceTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private Connection $db;
    private Centre $centre;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->db = $this->em->getConnection();
        $id = (int) $this->db->fetchOne('SELECT id FROM centre ORDER BY id LIMIT 1');
        $this->centre = $this->em->getRepository(Centre::class)->find($id);
    }

    private function makeReservation(string $statut = Reservation::STATUT_EN_ATTENTE_ACOMPTE): Reservation
    {
        $presta = (new Prestation())->setCentre($this->centre)->setNom('Bowling')->setPrixCents(2000)->setActif(true);
        $this->em->persist($presta);
        $resa = (new Reservation())
            ->setCentre($this->centre)->setPrestation($presta)
            ->setDateCreneau(new \DateTimeImmutable('2030-06-15 18:00'))
            ->setNbPersonnes(2)->setNomInvite('Bob')->setEmailInvite('bob@example.com')
            ->setTelephoneInvite('0601020304')->setMontantTotalCents(4000)->setAcompteCents(800)
            ->setStatut($statut);
        $this->em->persist($resa);
        $this->em->flush();

        return $resa;
    }

    private function asyncTransport(): InMemoryTransport
    {
        return static::getContainer()->get('messenger.transport.async');
    }

    private function handler(IaGeneratorInterface $ia): RelanceNoShowHandler
    {
        return new RelanceNoShowHandler(
            static::getContainer()->get(ReservationRepository::class),
            static::getContainer()->get(ContactDeriver::class),
            $ia,
            $this->em,
            new NullLogger(),
        );
    }

    private function iaStub(): IaGeneratorInterface
    {
        $ia = $this->createStub(IaGeneratorInterface::class);
        $ia->method('generate')->willReturn('Bonjour Bob, on aimerait vous revoir !');

        return $ia;
    }

    public function testPlanificationViaMessengerAvecDelai(): void
    {
        $resa = $this->makeReservation();

        static::getContainer()->get(CrmScheduler::class)->planifierDepuisReservation($resa);

        $relances = array_filter(
            $this->asyncTransport()->getSent(),
            static fn ($e) => $e->getMessage() instanceof RelanceNoShowMessage,
        );
        $this->assertCount(1, $relances, 'La relance no-show doit être planifiée via Messenger.');

        // Différée (DelayStamp) : pas synchrone, pas onFlush.
        $envelope = array_values($relances)[0];
        $delay = $envelope->last(DelayStamp::class);
        $this->assertNotNull($delay, 'La relance doit être différée (DelayStamp).');
        $this->assertGreaterThan(0, $delay->getDelay());
    }

    public function testHandlerCreeUneRelanceRedigeeParIa(): void
    {
        $resa = $this->makeReservation();

        ($this->handler($this->iaStub()))(new RelanceNoShowMessage((int) $resa->getId()));

        $row = $this->db->fetchAssociative('SELECT statut, texte FROM relance WHERE centre_id = :c', ['c' => $this->centre->getId()]);
        $this->assertNotFalse($row, 'Une relance doit être créée.');
        $this->assertSame(Relance::STATUT_A_ENVOYER, $row['statut']);
        $this->assertNotEmpty($row['texte']);
    }

    public function testQuotaIaDepasseRelanceQuandMemeCreeeSansTexte(): void
    {
        $resa = $this->makeReservation();
        $ia = $this->createStub(IaGeneratorInterface::class);
        $ia->method('generate')->willThrowException(new IaQuotaDepasseException());

        ($this->handler($ia))(new RelanceNoShowMessage((int) $resa->getId()));

        $row = $this->db->fetchAssociative('SELECT statut, texte FROM relance WHERE centre_id = :c', ['c' => $this->centre->getId()]);
        $this->assertNotFalse($row, 'La relance est planifiée même si l\'IA est indisponible.');
        $this->assertSame(Relance::STATUT_A_REDIGER, $row['statut']);
        $this->assertNull($row['texte'], 'Seul le texte manque, la relance existe.');
    }

    public function testReservationHonoreeAucuneRelance(): void
    {
        $resa = $this->makeReservation(Reservation::STATUT_CONFIRMEE);

        ($this->handler($this->iaStub()))(new RelanceNoShowMessage((int) $resa->getId()));

        $this->assertSame(0, (int) $this->db->fetchOne('SELECT count(*) FROM relance WHERE centre_id = :c', ['c' => $this->centre->getId()]));
    }
}
