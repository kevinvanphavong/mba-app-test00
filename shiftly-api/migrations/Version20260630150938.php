<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260630150938 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Reservation.stripe_session_id + paid_at — paiement de l\'acompte (Stripe Checkout + webhook).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reservation ADD stripe_session_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE reservation ADD paid_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE reservation DROP stripe_session_id');
        $this->addSql('ALTER TABLE reservation DROP paid_at');
    }
}
