<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class SentryApiService
{
    private string $authToken;
    private string $org;
    private string $project;

    public function __construct(
        private HttpClientInterface $httpClient,
        string $sentryAuthToken,
        string $sentryOrg,
        string $sentryProject
    ) {
        $this->authToken = $sentryAuthToken;
        $this->org       = $sentryOrg;
        $this->project   = $sentryProject;
    }

    /** Nombre d'erreurs sur les 7 derniers jours */
    public function getStats7Days(): array
    {
        if (empty($this->authToken) || $this->authToken === 'changeme') {
            return ['total' => 0, 'topCentres' => []];
        }

        try {
            $response = $this->httpClient->request('GET',
                "https://sentry.io/api/0/projects/{$this->org}/{$this->project}/stats/",
                [
                    'headers' => ['Authorization' => "Bearer {$this->authToken}"],
                    'query'   => ['stat' => 'received', 'resolution' => '1d', 'since' => strtotime('-7 days')],
                ]
            );

            $data  = $response->toArray();
            $total = array_sum(array_column($data, 1));

            return ['total' => $total, 'topCentres' => []];
        } catch (\Throwable) {
            return ['total' => 0, 'topCentres' => []];
        }
    }

    /** Issues Sentry filtrées par tag centre_id */
    public function getIssuesByCentreId(string $centreId): array
    {
        if (empty($this->authToken) || $this->authToken === 'changeme') {
            return [];
        }

        try {
            $response = $this->httpClient->request('GET',
                "https://sentry.io/api/0/projects/{$this->org}/{$this->project}/issues/",
                [
                    'headers' => ['Authorization' => "Bearer {$this->authToken}"],
                    'query'   => ['query' => "centre_id:{$centreId}", 'limit' => 20],
                ]
            );

            return $response->toArray();
        } catch (\Throwable) {
            return [];
        }
    }
}
