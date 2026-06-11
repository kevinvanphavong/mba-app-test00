<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Dompdf\Dompdf;
use Dompdf\Options;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Twig\Environment;

/**
 * Registre du personnel — export PDF officiel (Art. L1221-13 et D1221-23
 * du Code du travail).
 *
 * Filtre automatiquement par centre du JWT (multi-tenant). Inclut les
 * salariés présents + les sortis dans les 5 dernières années (durée de
 * conservation légale).
 */
class RegistrePersonnelController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepo,
        private readonly Environment $twig,
    ) {
    }

    #[Route('/api/registre-personnel/export.pdf', name: 'registre_personnel_export', methods: ['GET'])]
    #[IsGranted('ROLE_MANAGER')]
    public function export(): Response
    {
        /** @var User $manager */
        $manager = $this->getUser();
        $centre = $manager->getCentre();
        if (!$centre) {
            throw $this->createAccessDeniedException('Centre absent du JWT.');
        }

        // Sortis < 5 ans OU encore présents (actifs)
        $cutoff = new \DateTimeImmutable('-5 years');
        $users = $this->userRepo->createQueryBuilder('u')
            ->andWhere('u.centre = :centre')->setParameter('centre', $centre)
            ->andWhere('u.actif = true OR u.dateSortie IS NULL OR u.dateSortie >= :cutoff')
            ->setParameter('cutoff', $cutoff)
            ->orderBy('u.dateEmbauche', 'ASC')
            ->addOrderBy('u.nom', 'ASC')
            ->getQuery()
            ->getResult();

        $presents = array_filter($users, fn (User $u) => $u->isActif() && null === $u->getDateSortie());
        $sortis = array_filter($users, fn (User $u) => null !== $u->getDateSortie());

        $html = $this->twig->render('registre/export.html.twig', [
            'centre' => $centre,
            'manager' => $manager,
            'users' => $users,
            'totalCount' => count($users),
            'presentCount' => count($presents),
            'sortisCount' => count($sortis),
            'generatedAt' => new \DateTimeImmutable(),
            'motifLabels' => self::motifLabels(),
        ]);

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $slug = $centre->getSlug() ?: 'centre';
        $filename = sprintf('registre-personnel-%s-%s.pdf', $slug, (new \DateTimeImmutable())->format('Ymd'));

        return new Response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => sprintf('attachment; filename="%s"', $filename),
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /** @return array<string,string> */
    public static function motifLabels(): array
    {
        return [
            User::MOTIF_DEMISSION => 'Démission',
            User::MOTIF_RUPTURE_CONVENTIONNELLE => 'Rupture conventionnelle',
            User::MOTIF_LICENCIEMENT => 'Licenciement',
            User::MOTIF_FIN_CDD => 'Fin de CDD',
            User::MOTIF_FIN_PERIODE_ESSAI => 'Fin de période d\'essai',
            User::MOTIF_RETRAITE => 'Retraite',
            User::MOTIF_AUTRE => 'Autre',
        ];
    }
}
