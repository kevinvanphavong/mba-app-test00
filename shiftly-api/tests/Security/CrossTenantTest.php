<?php

namespace App\Tests\Security;

use App\Entity\User;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Palier 2 — prouve l'isolation multi-tenant sur TOUTES les ressources exposées :
 * un user du centre A ne voit jamais les données du centre B (collection), ne peut
 * pas lire un item B (404), ni le modifier/supprimer (403/404).
 *
 * Données : fixtures Alice chargées en base de test (cf. CI). On choisit 2 centres
 * réels distincts ayant des données, et on fixe un mot de passe connu sur un manager
 * de chacun (la transaction dama est rollback en fin de test).
 */
class CrossTenantTest extends WebTestCase
{
    private const PASSWORD = 'cross-tenant-pass-2026';

    /**
     * Inventaire des ressources exposées rattachées à un centre.
     * Chaque entrée : chemin API + SQL renvoyant les ids appartenant à un centre.
     *
     * @return array<string, array{path: string, idsSql: string}>
     */
    private function resources(): array
    {
        return [
            'zones' => ['path' => '/api/zones',               'idsSql' => 'SELECT id FROM zone WHERE centre_id = :c'],
            'services' => ['path' => '/api/services',            'idsSql' => 'SELECT id FROM service WHERE centre_id = :c'],
            'tutoriels' => ['path' => '/api/tutoriels',           'idsSql' => 'SELECT id FROM tutoriel WHERE centre_id = :c'],
            'mission_categories' => ['path' => '/api/mission_categories',  'idsSql' => 'SELECT id FROM mission_categorie WHERE centre_id = :c'],
            'incidents' => ['path' => '/api/incidents',           'idsSql' => 'SELECT id FROM incident WHERE centre_id = :c'],
            'haccp_equipements' => ['path' => '/api/haccp_equipements',   'idsSql' => 'SELECT id FROM haccp_equipement WHERE centre_id = :c'],
            'users' => ['path' => '/api/users',               'idsSql' => 'SELECT id FROM "user" WHERE centre_id = :c'],
            'missions' => ['path' => '/api/missions',            'idsSql' => 'SELECT m.id FROM mission m JOIN zone z ON m.zone_id = z.id WHERE z.centre_id = :c'],
            'competences' => ['path' => '/api/competences',         'idsSql' => 'SELECT cp.id FROM competence cp JOIN zone z ON cp.zone_id = z.id WHERE z.centre_id = :c'],
            'postes' => ['path' => '/api/postes',              'idsSql' => 'SELECT p.id FROM poste p JOIN service s ON p.service_id = s.id WHERE s.centre_id = :c'],
        ];
    }

    private KernelBrowser $client;
    private Connection $db;
    private int $centreA;
    private int $centreB;
    private string $emailA;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $container = static::getContainer();
        $em = $container->get(EntityManagerInterface::class);
        $this->db = $em->getConnection();
        $hasher = $container->get(UserPasswordHasherInterface::class);

        // 2 centres distincts ayant chacun un manager actif + des zones (donc des données).
        $centres = $this->db->fetchFirstColumn(
            'SELECT c.id FROM centre c
             JOIN "user" u ON u.centre_id = c.id AND u.role = \'MANAGER\' AND u.actif = true
             JOIN zone z ON z.centre_id = c.id
             GROUP BY c.id ORDER BY c.id LIMIT 2'
        );
        $this->assertCount(2, $centres, 'Il faut 2 centres avec données pour le test cross-tenant.');
        [$this->centreA, $this->centreB] = [(int) $centres[0], (int) $centres[1]];

        $this->emailA = $this->setKnownPassword($em, $hasher, $this->centreA);
    }

    private function setKnownPassword(EntityManagerInterface $em, UserPasswordHasherInterface $hasher, int $centreId): string
    {
        $email = $this->db->fetchOne(
            'SELECT email FROM "user" WHERE centre_id = :c AND role = \'MANAGER\' AND actif = true ORDER BY id LIMIT 1',
            ['c' => $centreId]
        );
        $user = $em->getRepository(User::class)->findOneBy(['email' => $email]);
        $user->setPassword($hasher->hashPassword($user, self::PASSWORD));
        $em->flush();

        return $email;
    }

    public function testIsolationCollectionEtItemSurToutesLesRessources(): void
    {
        $this->login($this->emailA, self::PASSWORD);

        foreach ($this->resources() as $name => $spec) {
            $idsA = array_map('intval', $this->db->fetchFirstColumn($spec['idsSql'], ['c' => $this->centreA]));
            $idsB = array_map('intval', $this->db->fetchFirstColumn($spec['idsSql'], ['c' => $this->centreB]));

            // 1) Collection : le user A ne voit QUE les items de A.
            $this->client->request('GET', $spec['path'], server: ['HTTP_ACCEPT' => 'application/ld+json']);
            $this->assertResponseIsSuccessful("Collection $name");
            $body = json_decode($this->client->getResponse()->getContent(), true);
            $this->assertSame(
                count($idsA),
                $body['totalItems'] ?? $body['hydra:totalItems'] ?? -1,
                "Collection $name : le user A doit voir exactement ses ".count($idsA).' items.'
            );

            // 2) Item du centre B → 404 (filtré par CentreQueryExtension).
            if ([] !== $idsB) {
                $this->client->request('GET', $spec['path'].'/'.$idsB[0], server: ['HTTP_ACCEPT' => 'application/ld+json']);
                $this->assertSame(404, $this->client->getResponse()->getStatusCode(), "Item B de $name lu par A doit être 404.");

                // 3) Écriture (DELETE) sur un item B → jamais 200/204.
                $this->client->request('DELETE', $spec['path'].'/'.$idsB[0], server: ['HTTP_X-CSRF' => '1']);
                $this->assertContains(
                    $this->client->getResponse()->getStatusCode(),
                    [403, 404, 405],
                    "DELETE item B de $name par A ne doit jamais réussir."
                );
            }
        }
    }

    public function testCentreCollectionNeRevelePasLesAutresTenants(): void
    {
        $this->login($this->emailA, self::PASSWORD);

        // GET /centres → uniquement le sien.
        $this->client->request('GET', '/api/centres', server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertResponseIsSuccessful();
        $body = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertSame(1, $body['totalItems'] ?? $body['hydra:totalItems'] ?? -1, 'Un user ne voit que SON centre.');

        // GET /centres/{B} → 404.
        $this->client->request('GET', '/api/centres/'.$this->centreB, server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertSame(404, $this->client->getResponse()->getStatusCode());

        // GET /centres/{A} (le sien) → 200.
        $this->client->request('GET', '/api/centres/'.$this->centreA, server: ['HTTP_ACCEPT' => 'application/ld+json']);
        $this->assertResponseIsSuccessful();
    }

    /**
     * Routes CUSTOM (hors API Platform) prenant un {id}/{centreId} de centre ou
     * d'entité : un user du centre A ne doit jamais agir sur une ressource du centre B.
     */
    public function testRoutesCustomAvecIdCentreSontIsolees(): void
    {
        $this->login($this->emailA, self::PASSWORD);

        $zoneB = $this->db->fetchOne('SELECT id FROM zone WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);
        $missionB = $this->db->fetchOne('SELECT m.id FROM mission m JOIN zone z ON m.zone_id = z.id WHERE z.centre_id = :c ORDER BY m.id LIMIT 1', ['c' => $this->centreB]);
        $compB = $this->db->fetchOne('SELECT cp.id FROM competence cp JOIN zone z ON cp.zone_id = z.id WHERE z.centre_id = :c ORDER BY cp.id LIMIT 1', ['c' => $this->centreB]);
        $tutoB = $this->db->fetchOne('SELECT id FROM tutoriel WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);

        $cases = [
            ['GET', "/api/centres/{$this->centreB}/horaires"],
            ['PUT', "/api/centres/{$this->centreB}/horaires"],
        ];
        if ($zoneB) {
            $cases[] = ['PUT', "/api/editeur/zones/{$zoneB}"];
            $cases[] = ['DELETE', "/api/editeur/zones/{$zoneB}"];
            $cases[] = ['GET', "/api/editeur/zones/{$zoneB}/missions"];
            $cases[] = ['GET', "/api/editeur/zones/{$zoneB}/competences"];
        }
        if ($missionB) {
            $cases[] = ['PUT', "/api/editeur/missions/{$missionB}"];
            $cases[] = ['DELETE', "/api/editeur/missions/{$missionB}"];
        }
        if ($compB) {
            $cases[] = ['PUT', "/api/editeur/competences/{$compB}"];
            $cases[] = ['DELETE', "/api/editeur/competences/{$compB}"];
        }
        if ($tutoB) {
            $cases[] = ['PUT', "/api/editeur/tutoriels/{$tutoB}"];
            $cases[] = ['DELETE', "/api/editeur/tutoriels/{$tutoB}"];
        }

        foreach ($cases as [$method, $path]) {
            $this->client->request($method, $path, server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X-CSRF' => '1'], content: '{}');
            $this->assertContains(
                $this->client->getResponse()->getStatusCode(),
                [403, 404],
                "$method $path : accès cross-tenant doit être refusé (403/404)."
            );
        }
    }

    private function login(string $email, string $password): void
    {
        $this->client->request(
            'POST',
            '/api/auth/login',
            server: ['CONTENT_TYPE' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => $password]),
        );
        $this->assertResponseIsSuccessful('Login '.$email);
    }
}
