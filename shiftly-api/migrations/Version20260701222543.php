<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260701222543 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Centre : contenu de site public editable (hero titre/sous-titre, description).';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE centre ADD site_hero_titre VARCHAR(150) DEFAULT NULL');
        $this->addSql('ALTER TABLE centre ADD site_hero_sous_titre VARCHAR(200) DEFAULT NULL');
        $this->addSql('ALTER TABLE centre ADD site_description TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE centre DROP site_hero_titre');
        $this->addSql('ALTER TABLE centre DROP site_hero_sous_titre');
        $this->addSql('ALTER TABLE centre DROP site_description');
    }
}
