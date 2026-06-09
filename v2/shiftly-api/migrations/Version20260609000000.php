<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260609000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Migration d\'amorçage — activation pgcrypto pour gen_random_uuid()';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP EXTENSION IF EXISTS pgcrypto');
    }
}
