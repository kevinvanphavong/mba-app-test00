<?php

namespace App\Controller;

use App\Core\Ia\IaGeneratorInterface;
use App\Repository\CentreRepository;
use App\Service\AgenceKpiService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Console agence — vision multi-clients du super-admin (KPI + résumé IA).
 *
 * Sous `^/api/superadmin` (firewall + access_control ROLE_SUPERADMIN) ; garde
 * `#[IsGranted('ROLE_SUPERADMIN')]` en défense en profondeur. Agrégation cross-tenant
 * VOLONTAIRE. LECTURE SEULE sur les données clients — seule exception : le super-admin
 * règle `abonnementMensuelCents`. Le résumé IA tourne sur le budget PLATEFORME (jamais
 * le quota d'un client).
 */
#[IsGranted('ROLE_SUPERADMIN')]
class ConsoleAgenceController extends AbstractController
{
    public function __construct(
        private readonly AgenceKpiService $kpis,
        private readonly CentreRepository $centres,
        private readonly IaGeneratorInterface $ia,
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/superadmin/console/kpis', name: 'superadmin_console_kpis', methods: ['GET'])]
    public function kpis(): JsonResponse
    {
        return $this->json([
            'global' => $this->kpis->kpisGlobaux(),
            'centres' => $this->kpis->kpisParCentre(),
        ]);
    }

    /** Seule écriture de la console : le super-admin règle l'abonnement d'un centre. */
    #[Route('/api/superadmin/console/centres/{id}/abonnement', name: 'superadmin_console_abonnement', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function reglerAbonnement(int $id, Request $request): JsonResponse
    {
        $centre = $this->centres->find($id);
        if (null === $centre) {
            throw $this->createNotFoundException();
        }

        $data = json_decode($request->getContent(), true);
        $montant = (int) ($data['abonnementMensuelCents'] ?? -1);
        if ($montant < 0) {
            return $this->json(['message' => 'Montant invalide.'], 422);
        }

        $centre->setAbonnementMensuelCents($montant);
        $this->em->flush();

        return $this->json(['id' => $centre->getId(), 'abonnementMensuelCents' => $centre->getAbonnementMensuelCents()]);
    }

    /**
     * Résumé IA mensuel d'un client. Tourne sur le budget PLATEFORME (super-admin) :
     * n'entame jamais le quota du client. IaQuotaDepassee/IaIndisponible → 429/503.
     */
    #[Route('/api/superadmin/console/centres/{id}/resume-ia', name: 'superadmin_console_resume_ia', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function resumeIa(int $id): JsonResponse
    {
        $centre = $this->centres->find($id);
        if (null === $centre) {
            throw $this->createNotFoundException();
        }

        $kpi = null;
        foreach ($this->kpis->kpisParCentre() as $c) {
            if ($c['id'] === $id) {
                $kpi = $c;
                break;
            }
        }

        $prompt = sprintf(
            'Client : %s. Réservations : %d. CA estimé : %.2f €. Relances no-show : %d. Avis : %d (note moyenne %s). '
            .'Rédige un résumé mensuel factuel (3-4 phrases) pour le pilotage agence.',
            $centre->getNom() ?? '',
            $kpi['reservations'] ?? 0,
            ($kpi['caEstimeCents'] ?? 0) / 100,
            $kpi['noShowRelances'] ?? 0,
            $kpi['avis'] ?? 0,
            null !== ($kpi['noteMoyenne'] ?? null) ? (string) $kpi['noteMoyenne'] : 'n.c.',
        );

        // Budget plateforme : ne touche PAS le quota du client.
        $resume = $this->ia->generatePourPlateforme($prompt, [
            'systeme' => 'Tu es analyste d\'une agence SaaS. Résumés concis et factuels.',
            'maxTokens' => 400,
        ]);

        return $this->json(['centreId' => $id, 'resume' => $resume]);
    }
}
