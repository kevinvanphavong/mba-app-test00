<?php

namespace App\Service;

use Doctrine\DBAL\Connection;

/**
 * Journal d'activité du super-admin : fusionne `AuditLog` (actions super-admin) et
 * `EventLog` (événements métier par centre) en un flux UNIFIÉ trié par date décroissante.
 *
 * LECTURE SEULE (aucune mutation). Agrégation cross-tenant volontaire (réservée
 * ROLE_SUPERADMIN côté contrôleur/firewall). N'expose que ce que les deux sources
 * contiennent déjà — pas de PII client superflue (l'acteur est un utilisateur interne).
 */
final class ActivityFeedService
{
    private const PER_PAGE_MAX = 100;

    public function __construct(private readonly Connection $db)
    {
    }

    /**
     * @param array{centre?: ?int, from?: ?string, to?: ?string, type?: ?string} $filtres
     *
     * @return array{items: list<array<string, mixed>>, total: int, page: int, perPage: int, types: list<string>}
     */
    public function feed(array $filtres, int $page = 1, int $perPage = 20): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(self::PER_PAGE_MAX, $perPage));
        $centre = $filtres['centre'] ?? null;
        $from = $filtres['from'] ?? null;
        $to = isset($filtres['to']) && 10 === \strlen($filtres['to']) ? $filtres['to'].' 23:59:59' : ($filtres['to'] ?? null);
        $type = $filtres['type'] ?? null;

        $params = ['centre' => $centre, 'from' => $from, 'to' => $to, 'type' => $type];
        $plafond = $page * $perPage; // on ramène le sommet nécessaire de chaque source

        $audit = $this->db->fetchAllAssociative(
            "SELECT a.created_at AS date, a.action, a.target_type AS entity_type, a.target_id AS entity_id,
                    u.nom AS acteur_nom, u.prenom AS acteur_prenom,
                    (CASE WHEN a.target_type = 'centre' THEN a.target_id ELSE NULL END) AS centre_id, c.nom AS centre_nom
             FROM audit_log a
             LEFT JOIN \"user\" u ON u.id = a.super_admin_user_id
             LEFT JOIN centre c ON a.target_type = 'centre' AND c.id = a.target_id
             WHERE (CAST(:centre AS INTEGER) IS NULL OR (a.target_type = 'centre' AND a.target_id = CAST(:centre AS INTEGER)))
               AND (CAST(:from AS TIMESTAMP) IS NULL OR a.created_at >= CAST(:from AS TIMESTAMP))
               AND (CAST(:to AS TIMESTAMP) IS NULL OR a.created_at <= CAST(:to AS TIMESTAMP))
               AND (CAST(:type AS VARCHAR) IS NULL OR a.action = CAST(:type AS VARCHAR))
             ORDER BY a.created_at DESC LIMIT $plafond",
            $params
        );

        $event = $this->db->fetchAllAssociative(
            "SELECT e.occurred_at AS date, e.action, e.entity_type, e.entity_id,
                    u.nom AS acteur_nom, u.prenom AS acteur_prenom, e.centre_id, c.nom AS centre_nom
             FROM event_log e
             LEFT JOIN \"user\" u ON u.id = e.user_id
             LEFT JOIN centre c ON c.id = e.centre_id
             WHERE (CAST(:centre AS INTEGER) IS NULL OR e.centre_id = CAST(:centre AS INTEGER))
               AND (CAST(:from AS TIMESTAMP) IS NULL OR e.occurred_at >= CAST(:from AS TIMESTAMP))
               AND (CAST(:to AS TIMESTAMP) IS NULL OR e.occurred_at <= CAST(:to AS TIMESTAMP))
               AND (CAST(:type AS VARCHAR) IS NULL OR e.action = CAST(:type AS VARCHAR))
             ORDER BY e.occurred_at DESC LIMIT $plafond",
            $params
        );

        $items = [
            ...array_map(fn (array $r): array => $this->normaliser($r, 'audit'), $audit),
            ...array_map(fn (array $r): array => $this->normaliser($r, 'event'), $event),
        ];
        usort($items, static fn (array $a, array $b): int => $b['date'] <=> $a['date']);

        $total = $this->count('audit_log', 'created_at', 'target_id', "target_type = 'centre'", $params)
            + $this->count('event_log', 'occurred_at', 'centre_id', '1 = 1', $params);

        return [
            'items' => array_slice($items, ($page - 1) * $perPage, $perPage),
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'types' => $this->db->fetchFirstColumn(
                'SELECT DISTINCT action FROM (SELECT action FROM audit_log UNION SELECT action FROM event_log) t ORDER BY action'
            ),
        ];
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array<string, mixed>
     */
    private function normaliser(array $row, string $source): array
    {
        $acteur = trim(($row['acteur_prenom'] ?? '').' '.($row['acteur_nom'] ?? ''));

        return [
            'source' => $source,
            'date' => (new \DateTimeImmutable((string) $row['date']))->format(\DateTimeInterface::ATOM),
            'acteur' => '' !== $acteur ? $acteur : ('audit' === $source ? 'Super Admin' : 'Système'),
            'centreId' => null !== $row['centre_id'] ? (int) $row['centre_id'] : null,
            'centreNom' => null !== $row['centre_nom'] ? (string) $row['centre_nom'] : null,
            'type' => (string) $row['action'],
            'resume' => trim(sprintf('%s · %s%s', (string) $row['action'], (string) ($row['entity_type'] ?? ''), null !== $row['entity_id'] ? ' #'.$row['entity_id'] : '')),
        ];
    }

    /**
     * @param array<string, mixed> $params
     */
    private function count(string $table, string $dateCol, string $centreCol, string $centreCond, array $params): int
    {
        $centreClause = 'audit_log' === $table
            ? "(CAST(:centre AS INTEGER) IS NULL OR ($centreCond AND $centreCol = CAST(:centre AS INTEGER)))"
            : "(CAST(:centre AS INTEGER) IS NULL OR $centreCol = CAST(:centre AS INTEGER))";

        return (int) $this->db->fetchOne(
            "SELECT COUNT(*) FROM $table WHERE $centreClause
               AND (CAST(:from AS TIMESTAMP) IS NULL OR $dateCol >= CAST(:from AS TIMESTAMP))
               AND (CAST(:to AS TIMESTAMP) IS NULL OR $dateCol <= CAST(:to AS TIMESTAMP))
               AND (CAST(:type AS VARCHAR) IS NULL OR action = CAST(:type AS VARCHAR))",
            $params
        );
    }
}
