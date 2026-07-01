<?php

namespace App\Tests\Security;

use ApiPlatform\Doctrine\Orm\Util\QueryNameGenerator;
use App\Doctrine\CentreQueryExtension;
use App\Entity\Avis;
use App\Entity\Centre;
use App\Entity\Contact;
use App\Entity\DemandeB2B;
use App\Entity\Devis;
use App\Entity\Relance;
use App\Entity\User;
use App\Entity\Zone;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;

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
            'demandes' => ['path' => '/api/demande_b2_bs',       'idsSql' => 'SELECT id FROM demande_b2b WHERE centre_id = :c'],
            'devis' => ['path' => '/api/devis',               'idsSql' => 'SELECT id FROM devis WHERE centre_id = :c'],
            'contacts' => ['path' => '/api/contacts',            'idsSql' => 'SELECT id FROM contact WHERE centre_id = :c'],
            'avis' => ['path' => '/api/avis',               'idsSql' => 'SELECT id FROM avis WHERE centre_id = :c'],
            'relances' => ['path' => '/api/relances',            'idsSql' => 'SELECT id FROM relance WHERE centre_id = :c'],
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

        // Demande/devis + contact/avis/relance par centre : de quoi prouver l'isolation.
        $this->seedB2b($em, $this->centreA);
        $this->seedB2b($em, $this->centreB);
        $this->seedCrm($em, $this->centreA);
        $this->seedCrm($em, $this->centreB);
    }

    private function seedB2b(EntityManagerInterface $em, int $centreId): void
    {
        $centre = $em->getRepository(Centre::class)->find($centreId);
        $demande = (new DemandeB2B())
            ->setCentre($centre)->setNomContact('X')->setEmail('x@y.fr')->setTelephone('0600000000')
            ->setTypeEvenement('Séminaire')->setMessage('Demande de test.');
        $devis = (new Devis())->setCentre($centre)->setDemande($demande)->setLignes([])->setTotalCents(0);
        $em->persist($demande);
        $em->persist($devis);
        $em->flush();
    }

    private function seedCrm(EntityManagerInterface $em, int $centreId): void
    {
        $centre = $em->getRepository(Centre::class)->find($centreId);
        $contact = (new Contact())->setCentre($centre)->setNom('C')->setEmail('c@y.fr')
            ->setEmailHash('hash-'.$centreId)->setSegments([Contact::SEGMENT_B2C]);
        $avis = (new Avis())->setCentre($centre)->setNote(5)->setCommentaire('Top');
        $relance = (new Relance())->setCentre($centre)->setContact($contact);
        $em->persist($contact);
        $em->persist($avis);
        $em->persist($relance);
        $em->flush();
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
        $demandeB = $this->db->fetchOne('SELECT id FROM demande_b2b WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);
        $avisB = $this->db->fetchOne('SELECT id FROM avis WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);
        $relanceB = $this->db->fetchOne('SELECT id FROM relance WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);

        $cases = [
            ['GET', "/api/centres/{$this->centreB}/horaires"],
            ['PUT', "/api/centres/{$this->centreB}/horaires"],
            // Actions gérant sur des ressources d'un autre centre → refusées (404).
            ['POST', "/api/demandes/{$demandeB}/generer-devis"],
            ['POST', "/api/avis/{$avisB}/rediger-reponse"],
            ['POST', "/api/relances/{$relanceB}/envoyer"],
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

    /**
     * Routes custom avec un param qui n'est PAS un centre (userId, serviceId,
     * equipementId…) : la cible d'un autre centre ne doit jamais être accessible.
     * Deux issues acceptables et prouvées : 403/404 (garde), ou payload vide (filtre JWT).
     */
    public function testRoutesCustomAutresParamsSontIsolees(): void
    {
        $this->login($this->emailA, self::PASSWORD);

        $userB = $this->db->fetchOne('SELECT id FROM "user" WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);
        $serviceB = $this->db->fetchOne('SELECT id FROM service WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);
        $equipB = $this->db->fetchOne('SELECT id FROM haccp_equipement WHERE centre_id = :c ORDER BY id LIMIT 1', ['c' => $this->centreB]);

        // ── Cas "garde explicite" → 403/404 ──────────────────────────────────────
        $denied = [];
        if ($userB) {
            $denied[] = ['GET', "/api/pointages/validation/detail/{$userB}/2026-01-05"];
            $denied[] = ['POST', "/api/pointages/validation/valider/{$userB}/2026-01-05"];
            $denied[] = ['POST', "/api/pointages/validation/devalider/{$userB}/2026-01-05"];
            $denied[] = ['GET', "/api/editeur/staff/{$userB}/competences"];
            $denied[] = ['PUT', "/api/editeur/staff/{$userB}"];
        }
        if ($serviceB) {
            $denied[] = ['GET', "/api/pointage/service/{$serviceB}"];
            $denied[] = ['POST', "/api/pointage/cloturer-service/{$serviceB}"];
        }
        if ($equipB) {
            $denied[] = ['POST', "/api/haccp/equipements/{$equipB}/sync-missions"];
        }

        foreach ($denied as [$method, $path]) {
            $this->client->request($method, $path, server: ['CONTENT_TYPE' => 'application/json', 'HTTP_X-CSRF' => '1'], content: '{}');
            $this->assertContains(
                $this->client->getResponse()->getStatusCode(),
                [403, 404],
                "$method $path : cible d'un autre centre doit être refusée."
            );
        }

        // ── Cas "filtre JWT" → 200 mais AUCUNE donnée du centre B ────────────────
        if ($serviceB) {
            $this->client->request('GET', "/api/dashboard/completion-history/services/{$serviceB}", server: ['HTTP_ACCEPT' => 'application/json']);
            $this->assertResponseIsSuccessful();
            $body = json_decode($this->client->getResponse()->getContent(), true);
            $this->assertSame([], $body['events'] ?? null, 'Le dashboard ne doit renvoyer aucun événement du service d\'un autre centre.');
        }
    }

    /**
     * Fail-closed : sans aucun centre résolvable (ni JWT ni domaine connu), le
     * filtre BDD doit ramener un jeu de résultats VIDE — jamais les données d'un
     * autre tenant par absence de centre. On exerce directement l'extension sur
     * une collection à centre (Zone), alors que la base contient des zones.
     */
    public function testFailClosedSansCentreCollectionVide(): void
    {
        // Aucun user authentifié, host inconnu → aucun centre résolu.
        $this->pushHost('domaine-inconnu.invalid');

        $ids = $this->zoneIdsAfterExtension();

        $this->assertSame([], $ids, 'Sans centre résolu, une collection à centre doit être VIDE (fail-closed).');
        // Sanity : la base contient pourtant bien des zones (sinon le test ne prouve rien).
        $this->assertGreaterThan(0, (int) $this->db->fetchOne('SELECT count(*) FROM zone'), 'La base de test doit contenir des zones.');
    }

    /**
     * Résolution publique par domaine : si le host de la requête correspond au
     * `domaine` d'un centre connu (et qu'aucun user n'est authentifié), la
     * collection ne renvoie QUE les données de ce centre.
     */
    public function testResolutionParDomaineLimiteAuCentre(): void
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $centre = $em->getRepository(Centre::class)->find($this->centreA);
        $centre->setDomaine('resolveur-tenant-test.example');
        $em->flush();

        $this->pushHost('resolveur-tenant-test.example');

        $ids = $this->zoneIdsAfterExtension();
        $expected = array_map('intval', $this->db->fetchFirstColumn('SELECT id FROM zone WHERE centre_id = :c', ['c' => $this->centreA]));

        sort($ids);
        sort($expected);
        $this->assertSame($expected, $ids, 'Le domaine connu ne doit exposer que les zones de SON centre.');
        $this->assertNotEmpty($ids, 'Le centre A doit avoir des zones (préalable du test).');
    }

    /**
     * Non-régression SUPERADMIN : un super-admin opère légitimement sans centre
     * unique. Le filtre fail-closed ne doit JAMAIS s'appliquer à lui — il voit les
     * zones de tous les centres.
     */
    public function testSuperAdminNEstPasFiltreParCentre(): void
    {
        $superadmin = (new User())
            ->setEmail('superadmin-resolveur-test@shiftly.test')
            ->setRole(User::ROLE_SUPERADMIN);
        static::getContainer()->get('security.token_storage')
            ->setToken(new UsernamePasswordToken($superadmin, 'api', $superadmin->getRoles()));

        $ids = $this->zoneIdsAfterExtension();

        $total = (int) $this->db->fetchOne('SELECT count(*) FROM zone');
        $this->assertCount($total, $ids, 'Le SUPERADMIN ne doit jamais être filtré ni fail-closed par centre.');
        $this->assertGreaterThan(
            count($this->db->fetchFirstColumn('SELECT id FROM zone WHERE centre_id = :c', ['c' => $this->centreA])),
            count($ids),
            'Le SUPERADMIN voit les zones de plusieurs centres, pas d\'un seul.'
        );
    }

    /**
     * Pousse une requête avec le host donné sur la pile, sans utilisateur
     * authentifié (contexte public). Le kernel est rebooté à chaque test
     * (createClient en setUp), donc la pile est repartie de zéro entre les cas.
     */
    private function pushHost(string $host): void
    {
        static::getContainer()->get('request_stack')->push(Request::create('http://'.$host.'/'));
    }

    /**
     * Applique CentreQueryExtension à une collection Zone et renvoie les ids vus.
     *
     * @return list<int>
     */
    private function zoneIdsAfterExtension(): array
    {
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $qb = $em->createQueryBuilder()->select('z')->from(Zone::class, 'z');

        static::getContainer()->get(CentreQueryExtension::class)
            ->applyToCollection($qb, new QueryNameGenerator(), Zone::class);

        return array_map(static fn (Zone $z): int => (int) $z->getId(), $qb->getQuery()->getResult());
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
