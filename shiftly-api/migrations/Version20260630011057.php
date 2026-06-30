<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260630011057 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Centre.domaine (unique, nullable) — résolution publique du tenant par host (PostgreSQL).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE centre ADD domaine VARCHAR(255) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C6A0EA7578AF0ACC ON centre (domaine)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_C6A0EA7578AF0ACC');
        $this->addSql('ALTER TABLE centre DROP domaine');
    }
}
