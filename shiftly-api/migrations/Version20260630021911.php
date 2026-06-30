<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260630021911 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Prestation.prix_cents — prix unitaire public en centimes (base de calcul des réservations).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE prestation ADD prix_cents INT DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE prestation DROP prix_cents');
    }
}
