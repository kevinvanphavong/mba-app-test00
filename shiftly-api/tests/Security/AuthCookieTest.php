<?php

namespace App\Tests\Security;

use App\Entity\Centre;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Palier 1 — prouve que l'auth passe par un cookie httpOnly (jamais en JS) et que
 * le brute-force login + la protection CSRF par en-tête sont actifs.
 */
class AuthCookieTest extends WebTestCase
{
    private KernelBrowser $client;
    private EntityManagerInterface $em;
    private string $email;
    private string $password = 'test-password-2026';

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $this->em = $container->get(EntityManagerInterface::class);
        $hasher = $container->get(UserPasswordHasherInterface::class);

        // Email unique par test → isole le bucket du rate limiter et évite les collisions.
        $this->email = 'auth-test-'.uniqid().'@shiftly.test';

        $centre = (new Centre())->setNom('Centre Test Auth')->setSlug('centre-test-auth-'.uniqid());
        $this->em->persist($centre);

        $user = (new User())
            ->setNom('Test')
            ->setPrenom('Auth')
            ->setEmail($this->email)
            ->setRole('MANAGER')
            ->setRoles([])
            ->setPoints(0)
            ->setActif(true)
            ->setCentre($centre);
        $user->setPassword($hasher->hashPassword($user, $this->password));
        $this->em->persist($user);
        $this->em->flush();
    }

    public function testLoginPosesCookieHttpOnlySansTokenDansLeBody(): void
    {
        $this->login($this->email, $this->password);

        $this->assertResponseIsSuccessful();

        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayNotHasKey('token', $body, 'Le token ne doit JAMAIS être dans le body.');
        $this->assertSame($this->email, $body['email']);

        $cookie = $this->client->getResponse()->headers->getCookies()[0] ?? null;
        $this->assertNotNull($cookie);
        $this->assertSame('token', $cookie->getName());
        $this->assertTrue($cookie->isHttpOnly(), 'Le cookie token doit être httpOnly.');
        $this->assertSame('lax', $cookie->getSameSite());
    }

    public function testMeAccessibleParCookieSeulPuis401SansCookie(): void
    {
        $this->login($this->email, $this->password);
        $this->client->request('GET', '/api/me');
        $this->assertResponseIsSuccessful();

        // Sans cookie → 401
        $this->client->getCookieJar()->clear();
        $this->client->request('GET', '/api/me');
        $this->assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testLogoutExpireLeCookie(): void
    {
        $this->login($this->email, $this->password);
        $this->client->request('POST', '/api/auth/logout', server: ['HTTP_X-CSRF' => '1']);
        $this->assertResponseIsSuccessful();

        $this->client->request('GET', '/api/me');
        $this->assertSame(401, $this->client->getResponse()->getStatusCode());
    }

    public function testMutationSansEnteteCsrfEstRefusee(): void
    {
        $this->login($this->email, $this->password);

        // Sans X-CSRF → 403 (avant même le controller)
        $this->client->request('POST', '/api/services', server: ['CONTENT_TYPE' => 'application/json'], content: '{}');
        $this->assertSame(403, $this->client->getResponse()->getStatusCode());
    }

    public function testLoginRateLimiteApres5Echecs(): void
    {
        for ($i = 1; $i <= 5; ++$i) {
            $this->login($this->email, 'mauvais-mot-de-passe');
            $this->assertSame(401, $this->client->getResponse()->getStatusCode(), "Tentative $i");
        }

        // 6e tentative → 429
        $this->login($this->email, 'mauvais-mot-de-passe');
        $this->assertSame(429, $this->client->getResponse()->getStatusCode());
    }

    private function login(string $email, string $password): void
    {
        $this->client->request(
            'POST',
            '/api/auth/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => $password]),
        );
    }
}
