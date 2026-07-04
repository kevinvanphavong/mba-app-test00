<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260704032420 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Billing : Plan.jours_essai/stripe_product_id/stripe_price_id + subscription.stripe_subscription_id nullable (état d\'attente Checkout).';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE plan ADD jours_essai INT DEFAULT 14 NOT NULL');
        $this->addSql('ALTER TABLE plan ADD stripe_product_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE plan ADD stripe_price_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE subscription ALTER stripe_subscription_id DROP NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE plan DROP jours_essai');
        $this->addSql('ALTER TABLE plan DROP stripe_product_id');
        $this->addSql('ALTER TABLE plan DROP stripe_price_id');
        $this->addSql('ALTER TABLE subscription ALTER stripe_subscription_id SET NOT NULL');
    }
}
