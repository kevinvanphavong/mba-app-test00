<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Ajout des champs prenom, tailleHaut, tailleBas, pointure, actif sur l'entité User.
 */
final class Version20260327100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'User : ajout prenom, taille_haut, taille_bas, pointure, actif';
    }

    public function up(Schema $schema): void
    {
        // SQLite : une seule colonne par ALTER TABLE
        $this->addSql('ALTER TABLE "user" ADD COLUMN prenom VARCHAR(100) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD COLUMN taille_haut VARCHAR(10) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD COLUMN taille_bas VARCHAR(10) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD COLUMN pointure VARCHAR(10) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD COLUMN actif INTEGER NOT NULL DEFAULT 1');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" DROP COLUMN prenom');
        $this->addSql('ALTER TABLE "user" DROP COLUMN taille_haut');
        $this->addSql('ALTER TABLE "user" DROP COLUMN taille_bas');
        $this->addSql('ALTER TABLE "user" DROP COLUMN pointure');
        $this->addSql('ALTER TABLE "user" DROP COLUMN actif');
    }
}
