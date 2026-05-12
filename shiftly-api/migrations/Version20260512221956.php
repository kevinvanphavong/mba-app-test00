<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * MissionCategorie : table catalogue administrable des catégories par centre.
 *
 * - Création de la table + index unique (centre_id, nom).
 * - Seed des 4 catégories historiques (Ouverture / Pendant / Ménage / Fermeture)
 *   pour chaque centre existant, avec couleurs et icônes alignées sur les
 *   constantes front (categoryColors). Permet un usage immédiat de la feature
 *   admin sans étape manuelle.
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15).
 * SQL portable : pas de __temp__ table, pas d'identifiants quotés SQLite-style.
 */
final class Version20260512221956 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'MissionCategorie — catalogue admin des catégories de mission par centre + seed';
    }

    public function up(Schema $schema): void
    {
        $isSqlite = $this->connection->getDatabasePlatform() instanceof SqlitePlatform;

        // ── 1. Création de la table ──
        if ($isSqlite) {
            $this->addSql('CREATE TABLE mission_categorie (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                centre_id INTEGER NOT NULL,
                nom VARCHAR(50) NOT NULL,
                couleur VARCHAR(20) NOT NULL,
                icone VARCHAR(32) DEFAULT NULL,
                ordre INTEGER NOT NULL DEFAULT 0,
                CONSTRAINT FK_mission_cat_centre FOREIGN KEY (centre_id) REFERENCES centre (id) ON DELETE CASCADE
            )');
        } else {
            // MySQL / PostgreSQL — pas de quotes SQLite, AUTO_INCREMENT / SERIAL géré
            // via la plateforme abstraite. On utilise la syntaxe portable Doctrine.
            $this->addSql('CREATE TABLE mission_categorie (
                id INT AUTO_INCREMENT NOT NULL,
                centre_id INT NOT NULL,
                nom VARCHAR(50) NOT NULL,
                couleur VARCHAR(20) NOT NULL,
                icone VARCHAR(32) DEFAULT NULL,
                ordre INT NOT NULL DEFAULT 0,
                PRIMARY KEY(id),
                CONSTRAINT FK_mission_cat_centre FOREIGN KEY (centre_id) REFERENCES centre (id) ON DELETE CASCADE
            )');
        }
        $this->addSql('CREATE INDEX IDX_mission_cat_centre ON mission_categorie (centre_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_mission_cat_centre_nom ON mission_categorie (centre_id, nom)');
    }

    /**
     * Seed exécuté APRÈS le commit de up() — la table existe désormais.
     * Crée 4 catégories par défaut (alignées sur les anciennes constantes front)
     * pour chaque centre déjà présent en BDD.
     */
    public function postUp(Schema $schema): void
    {
        $defaults = [
            ['Ouverture', '#3b82f6', '🔓', 1],
            ['Pendant',   '#22c55e', '⚡', 2],
            ['Ménage',    '#a855f7', '🧽', 3],
            ['Fermeture', '#f97316', '🔒', 4],
        ];

        $rows = $this->connection->fetchAllAssociative('SELECT id FROM centre');
        foreach ($rows as $row) {
            $centreId = (int) $row['id'];
            foreach ($defaults as [$nom, $couleur, $icone, $ordre]) {
                $this->connection->executeStatement(
                    'INSERT INTO mission_categorie (centre_id, nom, couleur, icone, ordre) VALUES (?, ?, ?, ?, ?)',
                    [$centreId, $nom, $couleur, $icone, $ordre]
                );
            }
        }
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE mission_categorie');
    }
}
