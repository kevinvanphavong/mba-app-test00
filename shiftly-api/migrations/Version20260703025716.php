<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260703025716 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ingestion externe : centre.ingestKey + reservation.source/sourceRef/formule (prestation nullable, index unique idempotence).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE centre ADD ingest_key VARCHAR(64) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_C6A0EA753E228335 ON centre (ingest_key)');
        $this->addSql('ALTER TABLE reservation DROP CONSTRAINT fk_42c849559e45c554');
        $this->addSql('ALTER TABLE reservation ADD source VARCHAR(40) DEFAULT NULL');
        $this->addSql('ALTER TABLE reservation ADD source_ref VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE reservation ADD formule VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE reservation ALTER prestation_id DROP NOT NULL');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT FK_42C849559E45C554 FOREIGN KEY (prestation_id) REFERENCES prestation (id) ON DELETE SET NULL NOT DEFERRABLE');
        $this->addSql('CREATE UNIQUE INDEX uniq_reservation_source ON reservation (centre_id, source, source_ref)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP INDEX UNIQ_C6A0EA753E228335');
        $this->addSql('ALTER TABLE centre DROP ingest_key');
        $this->addSql('ALTER TABLE reservation DROP CONSTRAINT FK_42C849559E45C554');
        $this->addSql('DROP INDEX uniq_reservation_source');
        $this->addSql('ALTER TABLE reservation DROP source');
        $this->addSql('ALTER TABLE reservation DROP source_ref');
        $this->addSql('ALTER TABLE reservation DROP formule');
        $this->addSql('ALTER TABLE reservation ALTER prestation_id SET NOT NULL');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT fk_42c849559e45c554 FOREIGN KEY (prestation_id) REFERENCES prestation (id) ON DELETE RESTRICT NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
