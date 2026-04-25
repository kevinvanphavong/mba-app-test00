<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Rattrapage prod (suite et fin) : aligne le schéma BDD sur les entités
 * pour les écarts détectés par doctrine:schema:update --dump-sql.
 *
 * Origine : `migrations:version --add --all` initial avait marqué
 * d'anciennes migrations comme exécutées sans appliquer leur SQL.
 *
 * Cette migration applique tout ce qui restait :
 *  - user.taille_haut / taille_bas → VARCHAR(255) (champs texte libre,
 *    données métier > 10 chars confirmées en prod)
 *  - service : missions_snapshot JSON, taux_completion DOUBLE NOT NULL DEFAULT 0,
 *    note LONGTEXT
 *  - centre : actif TINYINT NOT NULL DEFAULT 1, opening_hours JSON
 *  - poste : heure_debut TIME, heure_fin TIME, pause_minutes INT NOT NULL DEFAULT 0
 *  - validation_hebdo : tous les CHANGE NOT NULL + types + index renames
 *  - tutoriel.contenu : JSON NOT NULL
 *  - competence.description : LONGTEXT
 *
 * Stratégie :
 *  - ADD : guard via information_schema (idempotent)
 *  - CHANGE : exécuté inconditionnellement (no-op si déjà au bon type)
 *  - SQLite (dev) : no-op total
 */
final class Version20260425040000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Rattrapage final : aligne schéma prod sur entités (MySQL only)';
    }

    public function up(Schema $schema): void
    {
        if ($this->connection->getDatabasePlatform() instanceof SqlitePlatform) {
            return;
        }

        $dbName = $this->connection->getDatabase();

        // ----- user : élargissement texte libre -----
        $this->addSql('ALTER TABLE user CHANGE taille_haut taille_haut VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE user CHANGE taille_bas taille_bas VARCHAR(255) DEFAULT NULL');

        // ----- service -----
        if (!$this->columnExists($dbName, 'service', 'missions_snapshot')) {
            $this->addSql('ALTER TABLE service ADD missions_snapshot JSON DEFAULT NULL');
        }
        $this->addSql('ALTER TABLE service CHANGE taux_completion taux_completion DOUBLE PRECISION DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE service CHANGE note note LONGTEXT DEFAULT NULL');

        // ----- centre -----
        if (!$this->columnExists($dbName, 'centre', 'actif')) {
            $this->addSql('ALTER TABLE centre ADD actif TINYINT(1) DEFAULT 1 NOT NULL');
        }
        $this->addSql('ALTER TABLE centre CHANGE opening_hours opening_hours JSON DEFAULT NULL');

        // ----- poste -----
        if (!$this->columnExists($dbName, 'poste', 'heure_debut')) {
            $this->addSql('ALTER TABLE poste ADD heure_debut TIME DEFAULT NULL');
        }
        if (!$this->columnExists($dbName, 'poste', 'heure_fin')) {
            $this->addSql('ALTER TABLE poste ADD heure_fin TIME DEFAULT NULL');
        }
        if (!$this->columnExists($dbName, 'poste', 'pause_minutes')) {
            $this->addSql('ALTER TABLE poste ADD pause_minutes INT DEFAULT 0 NOT NULL');
        }

        // ----- validation_hebdo : alignement types + NOT NULL -----
        $this->addSql('ALTER TABLE validation_hebdo
            CHANGE statut statut VARCHAR(20) NOT NULL,
            CHANGE heures_travaillees heures_travaillees INT NOT NULL,
            CHANGE heures_prevues heures_prevues INT NOT NULL,
            CHANGE ecart ecart INT NOT NULL,
            CHANGE heures_sup heures_sup INT NOT NULL,
            CHANGE nb_retards nb_retards INT NOT NULL,
            CHANGE nb_absences nb_absences INT NOT NULL,
            CHANGE commentaire commentaire LONGTEXT DEFAULT NULL,
            CHANGE valide_at valide_at DATETIME DEFAULT NULL,
            CHANGE created_at created_at DATETIME NOT NULL,
            CHANGE updated_at updated_at DATETIME DEFAULT NULL');

        // Renames d'index : guard via information_schema.STATISTICS.
        $this->renameIndexIfExists($dbName, 'validation_hebdo', 'idx_vh_centre',     'IDX_1C440497463CD7C3');
        $this->renameIndexIfExists($dbName, 'validation_hebdo', 'idx_vh_user',       'IDX_1C440497A76ED395');
        $this->renameIndexIfExists($dbName, 'validation_hebdo', 'fk_vh_valide_par',  'IDX_1C4404976AF12ED9');

        // ----- tutoriel -----
        $this->addSql('ALTER TABLE tutoriel CHANGE contenu contenu JSON NOT NULL');

        // ----- competence -----
        $this->addSql('ALTER TABLE competence CHANGE description description LONGTEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // Pas de rollback : migration de rattrapage idempotente.
    }

    private function columnExists(string $db, string $table, string $column): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
            [$db, $table, $column]
        ) > 0;
    }

    private function indexExists(string $db, string $table, string $index): bool
    {
        return (int) $this->connection->fetchOne(
            'SELECT COUNT(*) FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
            [$db, $table, $index]
        ) > 0;
    }

    private function renameIndexIfExists(string $db, string $table, string $oldName, string $newName): void
    {
        if ($this->indexExists($db, $table, $oldName) && !$this->indexExists($db, $table, $newName)) {
            $this->addSql(sprintf('ALTER TABLE %s RENAME INDEX %s TO %s', $table, $oldName, $newName));
        }
    }
}
