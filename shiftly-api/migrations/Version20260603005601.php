<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Platforms\AbstractMySQLPlatform;
use Doctrine\DBAL\Platforms\PostgreSQLPlatform;
use Doctrine\DBAL\Platforms\SqlitePlatform;
use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Module Leads — table `lead` (prospects capturés depuis la landing publique).
 * Hors multi-tenant : pas de centre_id, c'est un prospect, pas un user.
 * Workflow : nouveau → contacte → qualifie → converti | perdu.
 *
 * Compatible MySQL, PostgreSQL et SQLite (cf. CLAUDE.md règle 15 +
 * incident 2026-04-25 RESYNC_SCHEMA).
 */
final class Version20260603005601 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Leads — table lead (prospects landing publique)';
    }

    public function up(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();

        if ($platform instanceof AbstractMySQLPlatform) {
            $this->upMysql();
            return;
        }
        if ($platform instanceof PostgreSQLPlatform) {
            $this->upPostgres();
            return;
        }
        if ($platform instanceof SqlitePlatform) {
            $this->upSqlite();
            return;
        }
        $this->abortIf(true, 'Platform non supportée pour la migration Leads.');
    }

    private function upMysql(): void
    {
        // Note : valeurs par défaut gérées côté PHP (constructeur Lead) plutôt que
        // dans le schéma — évite le drift Doctrine sur les colonnes consent/source/status.
        $this->addSql("CREATE TABLE `lead` (
            id INT AUTO_INCREMENT NOT NULL,
            intent VARCHAR(20) NOT NULL,
            plan VARCHAR(20) NOT NULL,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(180) NOT NULL,
            phone VARCHAR(30) NOT NULL,
            centre VARCHAR(180) NOT NULL,
            activity VARCHAR(30) NOT NULL,
            staff_size VARCHAR(20) NOT NULL,
            city VARCHAR(120) DEFAULT NULL,
            zip VARCHAR(10) DEFAULT NULL,
            preferred_slot LONGTEXT DEFAULT NULL,
            channel VARCHAR(20) DEFAULT NULL,
            custom_needs LONGTEXT DEFAULT NULL,
            message LONGTEXT DEFAULT NULL,
            consent TINYINT NOT NULL,
            consent_at DATETIME NOT NULL,
            source VARCHAR(80) NOT NULL,
            status VARCHAR(20) NOT NULL,
            notes LONGTEXT DEFAULT NULL,
            handled_by_id INT DEFAULT NULL,
            handled_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            INDEX idx_lead_status     (status),
            INDEX idx_lead_created_at (created_at),
            INDEX idx_lead_intent     (intent),
            INDEX IDX_289161CBFE65AF40 (handled_by_id),
            CONSTRAINT FK_289161CBFE65AF40 FOREIGN KEY (handled_by_id) REFERENCES `user` (id) ON DELETE SET NULL
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE=InnoDB");
    }

    private function upPostgres(): void
    {
        $this->addSql("CREATE TABLE \"lead\" (
            id SERIAL PRIMARY KEY,
            intent VARCHAR(20) NOT NULL,
            plan VARCHAR(20) NOT NULL,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(180) NOT NULL,
            phone VARCHAR(30) NOT NULL,
            centre VARCHAR(180) NOT NULL,
            activity VARCHAR(30) NOT NULL,
            staff_size VARCHAR(20) NOT NULL,
            city VARCHAR(120) DEFAULT NULL,
            zip VARCHAR(10) DEFAULT NULL,
            preferred_slot TEXT DEFAULT NULL,
            channel VARCHAR(20) DEFAULT NULL,
            custom_needs TEXT DEFAULT NULL,
            message TEXT DEFAULT NULL,
            consent BOOLEAN NOT NULL,
            consent_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            source VARCHAR(80) NOT NULL,
            status VARCHAR(20) NOT NULL,
            notes TEXT DEFAULT NULL,
            handled_by_id INT DEFAULT NULL,
            handled_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL
        )");
        $this->addSql('CREATE INDEX idx_lead_status     ON "lead" (status)');
        $this->addSql('CREATE INDEX idx_lead_created_at ON "lead" (created_at)');
        $this->addSql('CREATE INDEX idx_lead_intent     ON "lead" (intent)');
        $this->addSql('CREATE INDEX IDX_289161CBFE65AF40 ON "lead" (handled_by_id)');
        $this->addSql('ALTER TABLE "lead" ADD CONSTRAINT FK_289161CBFE65AF40 FOREIGN KEY (handled_by_id) REFERENCES "user" (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    private function upSqlite(): void
    {
        $this->addSql("CREATE TABLE \"lead\" (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            intent VARCHAR(20) NOT NULL,
            plan VARCHAR(20) NOT NULL,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(180) NOT NULL,
            phone VARCHAR(30) NOT NULL,
            centre VARCHAR(180) NOT NULL,
            activity VARCHAR(30) NOT NULL,
            staff_size VARCHAR(20) NOT NULL,
            city VARCHAR(120) DEFAULT NULL,
            zip VARCHAR(10) DEFAULT NULL,
            preferred_slot CLOB DEFAULT NULL,
            channel VARCHAR(20) DEFAULT NULL,
            custom_needs CLOB DEFAULT NULL,
            message CLOB DEFAULT NULL,
            consent INTEGER NOT NULL,
            consent_at DATETIME NOT NULL,
            source VARCHAR(80) NOT NULL,
            status VARCHAR(20) NOT NULL,
            notes CLOB DEFAULT NULL,
            handled_by_id INTEGER DEFAULT NULL,
            handled_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME DEFAULT NULL,
            FOREIGN KEY (handled_by_id) REFERENCES \"user\" (id) ON DELETE SET NULL
        )");
        $this->addSql('CREATE INDEX idx_lead_status     ON "lead" (status)');
        $this->addSql('CREATE INDEX idx_lead_created_at ON "lead" (created_at)');
        $this->addSql('CREATE INDEX idx_lead_intent     ON "lead" (intent)');
        $this->addSql('CREATE INDEX IDX_289161CBFE65AF40 ON "lead" (handled_by_id)');
    }

    public function down(Schema $schema): void
    {
        $platform = $this->connection->getDatabasePlatform();
        if ($platform instanceof AbstractMySQLPlatform) {
            $this->addSql('DROP TABLE `lead`');
            return;
        }
        $this->addSql('DROP TABLE "lead"');
    }
}
