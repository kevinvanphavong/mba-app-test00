<?php

namespace App\Controller;

use App\Service\ActivityFeedService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Journal d'activité super-admin — timeline agrégée AuditLog + EventLog, LECTURE SEULE.
 *
 * Sous `^/api/superadmin` (firewall + access_control ROLE_SUPERADMIN) + `#[IsGranted]`
 * de classe (défense en profondeur). Agrégation cross-tenant volontaire. Aucune mutation :
 * uniquement des GET. La logique d'agrégation est dans {@see ActivityFeedService}.
 */
#[IsGranted('ROLE_SUPERADMIN')]
class SuperAdminActivityController extends AbstractController
{
    public function __construct(
        private readonly ActivityFeedService $feed,
    ) {
    }

    #[Route('/api/superadmin/activity', name: 'superadmin_activity', methods: ['GET'])]
    public function __invoke(Request $request): JsonResponse
    {
        $centre = $request->query->get('centre');

        return $this->json($this->feed->feed(
            [
                'centre' => null !== $centre && '' !== $centre ? (int) $centre : null,
                'from' => $request->query->get('from') ?: null,
                'to' => $request->query->get('to') ?: null,
                'type' => $request->query->get('type') ?: null,
            ],
            $request->query->getInt('page', 1),
            $request->query->getInt('perPage', 20),
        ));
    }
}
