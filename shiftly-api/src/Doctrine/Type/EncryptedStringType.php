<?php

namespace App\Doctrine\Type;

use App\Service\PiiCipher;
use Doctrine\DBAL\Platforms\AbstractPlatform;
use Doctrine\DBAL\Types\Type;

/**
 * Type Doctrine « encrypted_string » : chiffre/déchiffre de façon TRANSPARENTE une
 * colonne texte via {@see PiiCipher}. En base on ne voit que du ciphertext ; l'entité
 * manipule la valeur en clair. Utilisé pour les PII des contacts (nom, email, tél).
 *
 * La clé est lue de l'environnement (PII_ENCRYPTION_KEY), pas injectée : un type DBAL
 * est instancié par Doctrine hors conteneur DI.
 */
final class EncryptedStringType extends Type
{
    public const NAME = 'encrypted_string';

    private static ?PiiCipher $cipher = null;

    public function getSQLDeclaration(array $column, AbstractPlatform $platform): string
    {
        return $platform->getClobTypeDeclarationSQL($column);
    }

    public function convertToDatabaseValue($value, AbstractPlatform $platform): ?string
    {
        if (null === $value || '' === $value) {
            return $value;
        }

        return self::cipher()->encrypt((string) $value);
    }

    public function convertToPHPValue($value, AbstractPlatform $platform): ?string
    {
        if (null === $value || '' === $value) {
            return $value;
        }

        return self::cipher()->decrypt((string) $value);
    }

    public function getName(): string
    {
        return self::NAME;
    }

    public function requiresSQLCommentHint(AbstractPlatform $platform): bool
    {
        return true;
    }

    private static function cipher(): PiiCipher
    {
        return self::$cipher ??= new PiiCipher(
            (string) ($_SERVER['PII_ENCRYPTION_KEY'] ?? $_ENV['PII_ENCRYPTION_KEY'] ?? getenv('PII_ENCRYPTION_KEY') ?: ''),
        );
    }
}
