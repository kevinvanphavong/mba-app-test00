<?php

namespace App\Tests\Web;

use App\EventSubscriber\PublicRateLimitSubscriber;
use App\Service\CurrentCentreResolver;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\InMemoryStorage;

/**
 * Anti-abus des écritures publiques : au-delà de la limite (IP + centre), 429.
 * Testé avec un limiter ISOLÉ (limite basse, stockage mémoire) pour un 429
 * déterministe, sans interférer avec les tests HTTP publics (limite haute en test).
 */
class PublicRateLimitTest extends KernelTestCase
{
    private const LIMITE = 3;

    private function subscriber(): PublicRateLimitSubscriber
    {
        self::bootKernel();
        $factory = new RateLimiterFactory(
            ['id' => 'test_public_write', 'policy' => 'sliding_window', 'limit' => self::LIMITE, 'interval' => '1 minute'],
            new InMemoryStorage(),
        );

        return new PublicRateLimitSubscriber($factory, static::getContainer()->get(CurrentCentreResolver::class));
    }

    private function event(string $method, string $path, string $ip = '1.2.3.4'): RequestEvent
    {
        $request = Request::create('http://client.example'.$path, $method, server: ['REMOTE_ADDR' => $ip]);

        return new RequestEvent(self::$kernel, $request, HttpKernelInterface::MAIN_REQUEST);
    }

    public function testAuDelaDeLaLimiteRenvoie429(): void
    {
        $sub = $this->subscriber();

        // Les LIMITE premières écritures passent (aucune réponse imposée)…
        for ($i = 0; $i < self::LIMITE; ++$i) {
            $e = $this->event('POST', '/api/public/demandes');
            $sub->onKernelRequest($e);
            $this->assertNull($e->getResponse(), "Requête $i doit passer.");
        }

        // …la suivante est bloquée (429).
        $e = $this->event('POST', '/api/public/demandes');
        $sub->onKernelRequest($e);
        $this->assertNotNull($e->getResponse());
        $this->assertSame(429, $e->getResponse()->getStatusCode());
    }

    public function testLesIpDifferentesOntDesQuotasSepares(): void
    {
        $sub = $this->subscriber();
        // Épuise l'IP A.
        for ($i = 0; $i < self::LIMITE; ++$i) {
            $sub->onKernelRequest($this->event('POST', '/api/public/demandes', '10.0.0.1'));
        }
        // L'IP B garde son quota.
        $e = $this->event('POST', '/api/public/demandes', '10.0.0.2');
        $sub->onKernelRequest($e);
        $this->assertNull($e->getResponse(), 'Une autre IP ne doit pas être pénalisée.');
    }

    public function testLecturesEtWebhookNonLimites(): void
    {
        $sub = $this->subscriber();
        // Bien au-delà de la limite, mais non concernés → jamais 429.
        for ($i = 0; $i < self::LIMITE + 3; ++$i) {
            $get = $this->event('GET', '/api/public/site');
            $sub->onKernelRequest($get);
            $this->assertNull($get->getResponse(), 'GET public non limité.');

            $hook = $this->event('POST', '/api/public/stripe/webhook');
            $sub->onKernelRequest($hook);
            $this->assertNull($hook->getResponse(), 'Webhook Stripe (signé) non limité.');
        }
    }

    public function testHorsZonePubliqueIgnoree(): void
    {
        $sub = $this->subscriber();
        for ($i = 0; $i < self::LIMITE + 3; ++$i) {
            $e = $this->event('POST', '/api/reservations');
            $sub->onKernelRequest($e);
            $this->assertNull($e->getResponse(), 'Hors ^/api/public/ : pas de limite ici.');
        }
    }
}
