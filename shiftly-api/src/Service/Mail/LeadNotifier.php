<?php

namespace App\Service\Mail;

use App\Entity\Lead;
use App\Event\LeadCreatedEvent;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

/**
 * Notifie Kévin par email Gmail SMTP à chaque nouveau lead public.
 * Try/catch silencieux : un échec d'envoi ne doit JAMAIS faire planter la
 * création du Lead — on log et on continue.
 */
#[AsEventListener(event: LeadCreatedEvent::class)]
class LeadNotifier
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        private readonly string $notificationEmail,
        private readonly string $appBaseUrl,
    ) {
    }

    public function __invoke(LeadCreatedEvent $event): void
    {
        $lead = $event->lead;

        try {
            $subject = sprintf(
                '[Shiftly] Nouveau lead · %s · %s',
                self::intentLabel($lead->getIntent()),
                self::planLabel($lead->getPlan()),
            );

            $html = $this->renderHtml($lead);

            $email = (new Email())
                ->from($this->notificationEmail)
                ->to($this->notificationEmail)
                ->replyTo($lead->getEmail() ?: $this->notificationEmail)
                ->subject($subject)
                ->html($html)
                ->text($this->renderText($lead));

            $this->mailer->send($email);
        } catch (TransportExceptionInterface $e) {
            $this->logger->error('Lead notification email failed', [
                'leadId' => $lead->getId(),
                'error' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            $this->logger->error('Lead notification email unexpected error', [
                'leadId' => $lead->getId(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function renderHtml(Lead $lead): string
    {
        $rows = $this->buildRows($lead);
        $tbody = '';
        foreach ($rows as [$label, $value]) {
            $tbody .= sprintf(
                '<tr><td style="padding:8px 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.6px;width:160px;vertical-align:top;">%s</td><td style="padding:8px 12px;color:#0d0f14;font-size:14px;">%s</td></tr>',
                htmlspecialchars($label, ENT_QUOTES, 'UTF-8'),
                nl2br(htmlspecialchars($value, ENT_QUOTES, 'UTF-8')),
            );
        }

        $link = rtrim($this->appBaseUrl, '/').'/superadmin/leads/'.$lead->getId();

        return <<<HTML
<!doctype html>
<html lang="fr"><body style="margin:0;background:#f4f5f8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:640px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:20px 24px;background:linear-gradient(135deg,#f97316,#fb923c);color:#fff;">
      <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.9;">Shiftly · Nouveau lead</div>
      <div style="font-size:22px;font-weight:800;margin-top:4px;">{$this->safe(self::intentLabel($lead->getIntent()))} · {$this->safe(self::planLabel($lead->getPlan()))}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">{$tbody}</table>
    <div style="padding:18px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <a href="{$link}" style="display:inline-block;background:#0d0f14;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:600;font-size:13px;">Ouvrir dans le back-office →</a>
    </div>
  </div>
</body></html>
HTML;
    }

    private function renderText(Lead $lead): string
    {
        $out = "Nouveau lead Shiftly\n\n";
        foreach ($this->buildRows($lead) as [$label, $value]) {
            $out .= "{$label} : {$value}\n";
        }
        $out .= "\nOuvrir : ".rtrim($this->appBaseUrl, '/').'/superadmin/leads/'.$lead->getId()."\n";

        return $out;
    }

    /** @return list<array{0:string,1:string}> */
    private function buildRows(Lead $lead): array
    {
        return array_filter([
            ['Intent',         self::intentLabel($lead->getIntent())],
            ['Plan',           self::planLabel($lead->getPlan())],
            ['Nom',            $lead->getName()],
            ['Email',          $lead->getEmail()],
            ['Téléphone',      $lead->getPhone()],
            ['Centre',         $lead->getCentre()],
            ['Activité',       $lead->getActivity()],
            ['Effectif',       $lead->getStaffSize() ?: '—'],
            ['Ville',          trim(($lead->getZip() ?? '').' '.($lead->getCity() ?? '')) ?: '—'],
            $lead->getPreferredSlot() ? ['Créneau souhaité', $lead->getPreferredSlot()] : null,
            $lead->getChannel() ? ['Canal',            $lead->getChannel()] : null,
            $lead->getCustomNeeds() ? ['Besoins sur-mesure', $lead->getCustomNeeds()] : null,
            $lead->getMessage() ? ['Message',          $lead->getMessage()] : null,
            ['Source',         $lead->getSource()],
            ['Consentement',   $lead->getConsent() ? ('oui · '.($lead->getConsentAt()?->format('Y-m-d H:i:s') ?? '')) : 'NON'],
        ], static fn ($row) => null !== $row);
    }

    private function safe(string $s): string
    {
        return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
    }

    public static function intentLabel(string $intent): string
    {
        return match ($intent) {
            Lead::INTENT_TRIAL => 'Essai gratuit',
            Lead::INTENT_DEMO => 'Démo en visio',
            Lead::INTENT_CUSTOM => 'Projet sur mesure',
            default => $intent,
        };
    }

    public static function planLabel(string $plan): string
    {
        return match ($plan) {
            Lead::PLAN_STARTER => 'Starter',
            Lead::PLAN_PRO => 'Pro',
            Lead::PLAN_PREMIUM => 'Premium',
            Lead::PLAN_UNDECIDED => 'Indécis',
            default => $plan,
        };
    }
}
