<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class CorsSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onRequest', 9999],
            KernelEvents::RESPONSE => ['onResponse', 9999],
        ];
    }

    public function onRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        if ('OPTIONS' !== $request->getMethod()) {
            return;
        }

        $response = new Response('', 200, $this->corsHeaders());
        $event->setResponse($response);
    }

    public function onResponse(ResponseEvent $event): void
    {
        $response = $event->getResponse();
        foreach ($this->corsHeaders() as $name => $value) {
            $response->headers->set($name, $value);
        }
    }

    private function corsHeaders(): array
    {
        return [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, Accept',
            'Access-Control-Max-Age' => '3600',
            'X-Cors-Debug' => 'subscriber-ran',
        ];
    }
}
