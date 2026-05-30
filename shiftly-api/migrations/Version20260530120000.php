<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * EventLog — journal append-only des événements métier.
 *
 * Crée la table event_log + ses 3 index composés. FK :
 *  - centre_id NOT NULL (cloison multi-tenant)
 *  - user_id / poste_id / mission_id NULLABLE avec ON DELETE SET NULL
 *    (préserver l'historique si l'entité d'origine est supprimée).
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15).
 */
final class Version20260530120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'EventLog — journal append-only (Completion: CHECK/UNCHECK) + 3 index composés';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('CREATE TABLE event_log (
                id BIGINT AUTO_INCREMENT NOT NULL,
                centre_id INT NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INT DEFAULT NULL,
                action VARCHAR(20) NOT NULL,
                user_id INT DEFAULT NULL,
                poste_id INT DEFAULT NULL,
                mission_id INT DEFAULT NULL,
                payload JSON NOT NULL,
                occurred_at DATETIME NOT NULL,
                PRIMARY KEY (id),
                INDEX idx_eventlog_centre_type_date (centre_id, entity_type, occurred_at),
                INDEX idx_eventlog_centre_user_date (centre_id, user_id, occurred_at),
                INDEX idx_eventlog_poste (poste_id),
                INDEX idx_eventlog_mission (mission_id),
                INDEX idx_eventlog_user (user_id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');

            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_centre FOREIGN KEY (centre_id) REFERENCES centre (id)');
            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_user FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE SET NULL');
            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_poste FOREIGN KEY (poste_id) REFERENCES poste (id) ON DELETE SET NULL');
            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_mission FOREIGN KEY (mission_id) REFERENCES mission (id) ON DELETE SET NULL');
            return;
        }

        if ($platform instanceof PostgreSQLPlatform) {
            $this->addSql('CREATE TABLE event_log (
                id BIGSERIAL NOT NULL,
                centre_id INT NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INT DEFAULT NULL,
                action VARCHAR(20) NOT NULL,
                user_id INT DEFAULT NULL,
                poste_id INT DEFAULT NULL,
                mission_id INT DEFAULT NULL,
                payload JSON NOT NULL,
                occurred_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
                PRIMARY KEY (id)
            )');
            $this->addSql('CREATE INDEX idx_eventlog_centre_type_date ON event_log (centre_id, entity_type, occurred_at)');
            $this->addSql('CREATE INDEX idx_eventlog_centre_user_date ON event_log (centre_id, user_id, occurred_at)');
            $this->addSql('CREATE INDEX idx_eventlog_poste   ON event_log (poste_id)');
            $this->addSql('CREATE INDEX idx_eventlog_mission ON event_log (mission_id)');
            $this->addSql('CREATE INDEX idx_eventlog_user    ON event_log (user_id)');

            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_centre FOREIGN KEY (centre_id) REFERENCES centre (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_user FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_poste FOREIGN KEY (poste_id) REFERENCES poste (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
            $this->addSql('ALTER TABLE event_log
                ADD CONSTRAINT FK_eventlog_mission FOREIGN KEY (mission_id) REFERENCES mission (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
            return;
        }

        if ($platform instanceof SqlitePlatform) {
            // SQLite : pas de FK inline robuste, mais l'intégrité ORM reste OK.
            $this->addSql('CREATE TABLE event_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                centre_id INTEGER NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER DEFAULT NULL,
                action VARCHAR(20) NOT NULL,
                user_id INTEGER DEFAULT NULL,
                poste_id INTEGER DEFAULT NULL,
                mission_id INTEGER DEFAULT NULL,
                payload CLOB NOT NULL,
                occurred_at DATETIME NOT NULL,
                FOREIGN KEY (centre_id) REFERENCES centre (id),
                FOREIGN KEY (user_id)    REFERENCES "user" (id) ON DELETE SET NULL,
                FOREIGN KEY (poste_id)   REFERENCES poste (id) ON DELETE SET NULL,
                FOREIGN KEY (mission_id) REFERENCES mission (id) ON DELETE SET NULL
            )');
            $this->addSql('CREATE INDEX idx_eventlog_centre_type_date ON event_log (centre_id, entity_type, occurred_at)');
            $this->addSql('CREATE INDEX idx_eventlog_centre_user_date ON event_log (centre_id, user_id, occurred_at)');
            $this->addSql('CREATE INDEX idx_eventlog_poste   ON event_log (poste_id)');
            $this->addSql('CREATE INDEX idx_eventlog_mission ON event_log (mission_id)');
            $this->addSql('CREATE INDEX idx_eventlog_user    ON event_log (user_id)');
            return;
        }

        $this->abortIf(true, 'Platform non supportée pour la migration EventLog.');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE event_log');
    }
}
