<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Chiffrement des données personnelles (PII) au repos — libsodium (secretbox,
 * XSalsa20-Poly1305). La clé vient de l'env `PII_ENCRYPTION_KEY` (jamais committée) ;
 * elle est dérivée en 32 octets par SHA-256, donc n'importe quelle chaîne non vide
 * convient. Chaque chiffrement utilise un nonce aléatoire (préfixé au ciphertext).
 *
 * Pour la déduplication, l'email a AUSSI un hash déterministe (`hashEmail`) : on
 * peut retrouver/unicité sans jamais stocker l'email en clair.
 */
final class PiiCipher
{
    private readonly string $key;

    public function __construct(
        #[Autowire(env: 'PII_ENCRYPTION_KEY')]
        string $rawKey,
    ) {
        // Dérivation → clé 32 octets stable (secretbox exige exactement 32 octets).
        $this->key = '' === trim($rawKey) ? '' : hash('sha256', $rawKey, true);
    }

    public function isConfigured(): bool
    {
        return '' !== $this->key;
    }

    public function encrypt(string $plain): string
    {
        $this->assertConfigured();
        $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

        return base64_encode($nonce.sodium_crypto_secretbox($plain, $nonce, $this->key));
    }

    public function decrypt(string $ciphertext): string
    {
        $this->assertConfigured();
        $raw = base64_decode($ciphertext, true);
        if (false === $raw || \strlen($raw) < SODIUM_CRYPTO_SECRETBOX_NONCEBYTES) {
            return '';
        }

        $nonce = substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $cipher = substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
        $plain = sodium_crypto_secretbox_open($cipher, $nonce, $this->key);

        return false === $plain ? '' : $plain;
    }

    /**
     * Hash déterministe d'un email normalisé (minuscules, trim) pour la dédup et
     * l'unicité par centre — jamais réversible, jamais l'email en clair.
     *
     * **Salé par centre** : le hash intègre l'id du centre, donc un même email produit
     * un hash DIFFÉRENT dans chaque centre. Un accès en lecture BDD ne peut plus
     * corréler une même personne entre centres via `GROUP BY email_hash`.
     */
    public function hashEmail(string $email, int $centreId): string
    {
        $this->assertConfigured();

        return hash_hmac('sha256', $centreId.'|'.mb_strtolower(trim($email)), $this->key);
    }

    private function assertConfigured(): void
    {
        if ('' === $this->key) {
            throw new \RuntimeException('PII_ENCRYPTION_KEY manquante : chiffrement des contacts indisponible.');
        }
    }
}
