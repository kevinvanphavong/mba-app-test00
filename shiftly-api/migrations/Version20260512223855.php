<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Data migration : aligne les slugs `mission.categorie` sur les noms des
 * MissionCategorie seedées (`Ouverture` / `Pendant` / `Ménage` / `Fermeture`).
 *
 * Avant ce refactor, les missions stockaient leur catégorie en MAJUSCULES
 * (héritage de l'enum Mission::CAT_*). Le catalogue admin par centre utilise
 * des noms capitalize-case lisibles → le lookup runtime côté front ne
 * matchait plus → badge mission rendu en fallback "orphelin".
 *
 * Idempotente : si re-exécutée sur une BDD déjà migrée, les UPDATE ne touchent
 * aucune ligne (slugs déjà en minuscules capitalize).
 */
final class Version20260512223855 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Aligne les slugs mission.categorie sur les noms MissionCategorie seedés';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("UPDATE mission SET categorie = 'Ouverture' WHERE categorie = 'OUVERTURE'");
        $this->addSql("UPDATE mission SET categorie = 'Pendant'   WHERE categorie = 'PENDANT'");
        $this->addSql("UPDATE mission SET categorie = 'Ménage'    WHERE categorie = 'MENAGE'");
        $this->addSql("UPDATE mission SET categorie = 'Fermeture' WHERE categorie = 'FERMETURE'");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("UPDATE mission SET categorie = 'OUVERTURE' WHERE categorie = 'Ouverture'");
        $this->addSql("UPDATE mission SET categorie = 'PENDANT'   WHERE categorie = 'Pendant'");
        $this->addSql("UPDATE mission SET categorie = 'MENAGE'    WHERE categorie = 'Ménage'");
        $this->addSql("UPDATE mission SET categorie = 'FERMETURE' WHERE categorie = 'Fermeture'");
    }
}
