<?php

namespace App\Controller;

use App\Entity\Completion;
use App\Entity\CompletionHaccpProof;
use App\Entity\HaccpEquipement;
use App\Entity\Mission;
use App\Entity\MissionHaccpSpec;
use App\Entity\Poste;
use App\Entity\User;
use App\Repository\CompletionHaccpProofRepository;
use App\Service\Haccp\HaccpMissionGenerator;
use App\Service\R2StorageService;
use App\Service\Upload\HaccpPhotoUploader;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Twig\Environment;

/**
 * Endpoints HACCP — saisie (cascade Completion + Proof), proxy photo,
 * sync manuelle des missions, registre filtré + export PDF mensuel.
 *
 * Le voter direct + le filtre auto multi-tenant (CentreQueryExtension)
 * assurent qu'un user ne voit jamais les données d'un autre centre.
 */
#[IsGranted('ROLE_USER')]
class HaccpController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly HaccpPhotoUploader $uploader,
        private readonly R2StorageService $r2,
        private readonly HaccpMissionGenerator $generator,
        private readonly CompletionHaccpProofRepository $proofRepo,
        private readonly Environment $twig,
    ) {}

    // ─── Saisie depuis /service ──────────────────────────────────────────────

    /**
     * POST /api/completions/haccp  (multipart/form-data ou JSON)
     *
     * Champs :
     *   posteId, missionId (entiers, requis)
     *   valeurNumerique (float, optionnel — TEMPERATURE / RECEPTION)
     *   dateReleve (YYYY-MM-DD, optionnel — DLC)
     *   note (string, optionnel)
     *   photo (UploadedFile, optionnel — requis si spec.photoObligatoire)
     *
     * Crée Completion + CompletionHaccpProof en une seule transaction.
     * Le listener HaccpProofConformityChecker calcule est_conforme à l'insert.
     */
    #[Route('/api/completions/haccp', name: 'api_completion_haccp', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $posteId   = (int) ($request->request->get('posteId',   $request->toArray()['posteId']   ?? 0));
        $missionId = (int) ($request->request->get('missionId', $request->toArray()['missionId'] ?? 0));

        if (!$posteId || !$missionId) {
            throw new BadRequestHttpException('posteId et missionId sont requis.');
        }

        [$poste, $mission, $user] = $this->resolveAndGuard($posteId, $missionId);
        $spec = $mission->getHaccpSpec();
        if (!$spec instanceof MissionHaccpSpec) {
            throw new BadRequestHttpException('Cette mission n\'a pas de spec HACCP.');
        }

        $body = $request->request->all() ?: ($request->toArray() ?? []);
        $valeur = isset($body['valeurNumerique']) && $body['valeurNumerique'] !== ''
            ? (float) $body['valeurNumerique'] : null;
        $dateReleveRaw = $body['dateReleve'] ?? null;
        $note = $body['note'] ?? null;
        $photoFile = $request->files->get('photo');

        // Validation métier — selon typeReleve
        $this->validateProofBusiness($spec, $valeur, $dateReleveRaw, $note, $photoFile !== null);

        $stored = null;
        if ($photoFile) {
            try {
                $stored = $this->uploader->upload($photoFile);
            } catch (\InvalidArgumentException $e) {
                throw new BadRequestHttpException($e->getMessage());
            }
        }

        $completion = (new Completion())
            ->setPoste($poste)
            ->setMission($mission)
            ->setUser($user);

        $proof = (new CompletionHaccpProof())
            ->setCompletion($completion)
            ->setCentre($spec->getCentre())
            ->setValeurNumerique($valeur)
            ->setDateReleve($dateReleveRaw ? new \DateTimeImmutable($dateReleveRaw) : null)
            ->setNote($note)
            ->setRelevePar($user);

        if ($stored) {
            $proof->setPhotoPath($stored['storedPath'])->setPhotoMimeType($stored['mime']);
        }

        $completion->setHaccpProof($proof);

        try {
            $this->em->persist($completion);
            $this->em->persist($proof);
            $this->em->flush();
        } catch (UniqueConstraintViolationException) {
            return $this->json(['error' => 'Cette mission est déjà cochée pour ce poste.'], Response::HTTP_CONFLICT);
        }

        return $this->json([
            'completion' => [
                'id'          => $completion->getId(),
                'completedAt' => $completion->getCompletedAt()?->format(\DateTimeInterface::ATOM),
            ],
            'haccpProof' => [
                'id'              => $proof->getId(),
                'valeurNumerique' => $proof->getValeurNumerique(),
                'dateReleve'      => $proof->getDateReleve()?->format('Y-m-d'),
                'estConforme'     => $proof->getEstConforme(),
                'hasPhoto'        => $proof->getPhotoPath() !== null,
            ],
        ], Response::HTTP_CREATED);
    }

    /** Proxy auth-guarded de la photo de preuve HACCP depuis R2. */
    #[Route('/api/haccp/proofs/{id}/photo', name: 'api_haccp_proof_photo', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function servePhoto(int $id): Response
    {
        $proof = $this->em->find(CompletionHaccpProof::class, $id);
        if (!$proof || !$proof->getPhotoPath()) {
            throw $this->createNotFoundException('Photo introuvable.');
        }

        /** @var User $currentUser */
        $currentUser = $this->getUser();
        if ($proof->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé.');
        }

        try {
            $object = $this->r2->getObject($proof->getPhotoPath());
        } catch (\Throwable $e) {
            error_log('[HaccpController] Fetch photo R2 failed: ' . $e->getMessage());
            throw $this->createNotFoundException('Photo introuvable sur le stockage.');
        }

        return new Response($object['body'], Response::HTTP_OK, [
            'Content-Type'  => $proof->getPhotoMimeType() ?: $object['mime'],
            'Cache-Control' => 'private, max-age=300, no-store',
        ]);
    }

    // ─── Sync manuelle des missions (manager) ────────────────────────────────

    #[Route('/api/haccp/equipements/{id}/sync-missions', name: 'api_haccp_sync_equipement', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_MANAGER')]
    public function syncEquipement(int $id): JsonResponse
    {
        $equip = $this->em->find(HaccpEquipement::class, $id);
        if (!$equip) throw $this->createNotFoundException('Équipement introuvable.');

        /** @var User $currentUser */
        $currentUser = $this->getUser();
        if ($equip->getCentre()?->getId() !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé.');
        }

        $result = $this->generator->synchronizeForCentre($equip->getCentre());
        return $this->json($result->toArray());
    }

    #[Route('/api/haccp/sync-missions', name: 'api_haccp_sync_centre', methods: ['POST'])]
    #[IsGranted('ROLE_MANAGER')]
    public function syncCentre(): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        $centre = $currentUser->getCentre();
        if (!$centre) throw $this->createAccessDeniedException('Centre absent.');

        return $this->json($this->generator->synchronizeForCentre($centre)->toArray());
    }

    // ─── Registre filtré ──────────────────────────────────────────────────────

    #[Route('/api/haccp/registre', name: 'api_haccp_registre', methods: ['GET'], format: 'json')]
    public function registre(Request $request): JsonResponse
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        $centre = $currentUser->getCentre();
        if (!$centre) throw $this->createAccessDeniedException('Centre absent.');

        $mois     = $request->query->get('mois');
        $type     = $request->query->get('type');
        $conforme = $request->query->has('conforme')
            ? filter_var($request->query->get('conforme'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : null;

        $rows = $this->proofRepo->findRegistre($centre, $mois, $type, $conforme);

        $items = array_map(fn(CompletionHaccpProof $p) => $this->serializeProof($p), $rows);

        // KPIs : nb total, conformes, non conformes, taux conformité (sur applicables)
        $total       = count($items);
        $applicables = array_filter($items, fn($i) => $i['estConforme'] !== null);
        $conformes   = array_filter($applicables, fn($i) => $i['estConforme'] === true);
        $nonConf     = array_filter($applicables, fn($i) => $i['estConforme'] === false);

        return $this->json([
            'mois'        => $mois,
            'kpis'        => [
                'total'        => $total,
                'conformes'    => count($conformes),
                'nonConformes' => count($nonConf),
                'tauxConformite' => count($applicables) > 0
                    ? round(count($conformes) / count($applicables) * 100, 1)
                    : null,
            ],
            'items'       => $items,
        ]);
    }

    #[Route('/api/haccp/export', name: 'api_haccp_export_pdf', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function exportPdf(Request $request): Response
    {
        /** @var User $currentUser */
        $currentUser = $this->getUser();
        $centre = $currentUser->getCentre();
        if (!$centre) throw $this->createAccessDeniedException('Centre absent.');

        $mois = $request->query->get('mois') ?? (new \DateTimeImmutable())->format('Y-m');

        $rows = $this->proofRepo->findRegistre($centre, $mois);
        $items = array_map(fn(CompletionHaccpProof $p) => $this->serializeProof($p), $rows);

        // Groupage par jour
        $byDay = [];
        foreach ($items as $it) {
            $day = substr($it['createdAt'] ?? '', 0, 10);
            $byDay[$day] ??= [];
            $byDay[$day][] = $it;
        }
        ksort($byDay);

        $html = $this->twig->render('haccp/export.html.twig', [
            'centre'   => $centre,
            'mois'     => $mois,
            'manager'  => $currentUser,
            'byDay'    => $byDay,
            'total'    => count($items),
        ]);

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $filename = sprintf('registre-haccp-%s-%s.pdf', $centre->getSlug() ?? 'centre', $mois);
        return new Response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => sprintf('attachment; filename="%s"', $filename),
            'Cache-Control'       => 'private, no-store',
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** @return array{0: Poste, 1: Mission, 2: User} */
    private function resolveAndGuard(int $posteId, int $missionId): array
    {
        $poste   = $this->em->find(Poste::class, $posteId);
        $mission = $this->em->find(Mission::class, $missionId);
        if (!$poste || !$mission) throw $this->createNotFoundException('Poste ou Mission introuvable.');

        /** @var User $currentUser */
        $currentUser = $this->getUser();
        $posteCentreId = $poste->getService()?->getCentre()?->getId();
        if ($posteCentreId !== $currentUser->getCentre()?->getId()) {
            throw $this->createAccessDeniedException('Accès refusé.');
        }
        return [$poste, $mission, $currentUser];
    }

    private function validateProofBusiness(
        MissionHaccpSpec $spec,
        ?float $valeur,
        ?string $dateReleve,
        ?string $note,
        bool $hasPhoto,
    ): void {
        switch ($spec->getTypeReleve()) {
            case MissionHaccpSpec::TYPE_TEMPERATURE:
                if ($valeur === null) {
                    throw new BadRequestHttpException('Une température (valeurNumerique) est requise.');
                }
                break;
            case MissionHaccpSpec::TYPE_DLC:
                if (!$dateReleve) {
                    throw new BadRequestHttpException('Une date (dateReleve) est requise pour un contrôle DLC.');
                }
                break;
            case MissionHaccpSpec::TYPE_PHOTO:
                if (!$hasPhoto) {
                    throw new BadRequestHttpException('Une photo est requise pour cette mission.');
                }
                break;
            case MissionHaccpSpec::TYPE_RECEPTION:
                if ($valeur === null) {
                    throw new BadRequestHttpException('Une température de réception est requise.');
                }
                break;
        }
        if ($spec->isPhotoObligatoire() && !$hasPhoto) {
            throw new BadRequestHttpException('Une photo est obligatoire pour cette mission.');
        }
        if ($spec->isCommentaireObligatoire() && !$note) {
            throw new BadRequestHttpException('Un commentaire est obligatoire pour cette mission.');
        }
    }

    private function serializeProof(CompletionHaccpProof $p): array
    {
        $completion = $p->getCompletion();
        $mission    = $completion?->getMission();
        $spec       = $mission?->getHaccpSpec();
        $equip      = $spec?->getEquipement();
        $user       = $p->getRelevePar();

        return [
            'id'              => $p->getId(),
            'createdAt'       => $p->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'valeurNumerique' => $p->getValeurNumerique(),
            'dateReleve'      => $p->getDateReleve()?->format('Y-m-d'),
            'note'            => $p->getNote(),
            'estConforme'     => $p->getEstConforme(),
            'hasPhoto'        => $p->getPhotoPath() !== null,
            'photoUrl'        => $p->getPhotoPath() !== null
                ? '/api/haccp/proofs/' . $p->getId() . '/photo'
                : null,
            'completion'      => $completion ? [
                'id'          => $completion->getId(),
                'completedAt' => $completion->getCompletedAt()?->format(\DateTimeInterface::ATOM),
            ] : null,
            'mission'         => $mission ? [
                'id'    => $mission->getId(),
                'texte' => $mission->getTexte(),
            ] : null,
            'spec'            => $spec ? [
                'typeReleve' => $spec->getTypeReleve(),
                'moment'     => $spec->getMoment(),
                'seuils'     => $spec->getEffectiveSeuils(),
            ] : null,
            'equipement'      => $equip ? [
                'id'   => $equip->getId(),
                'nom'  => $equip->getNom(),
                'type' => $equip->getType(),
            ] : null,
            'relevePar'       => $user ? [
                'id'     => $user->getId(),
                'nom'    => $user->getNom(),
                'prenom' => $user->getPrenom(),
            ] : null,
        ];
    }
}
