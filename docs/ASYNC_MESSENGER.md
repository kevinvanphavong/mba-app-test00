# Effets de bord asynchrones (Symfony Messenger)

> Les opérations coûteuses ou faillibles (mails, suppression R2, audit log) ne
> bloquent plus la requête : elles sont dispatchées sur un transport **Doctrine**
> et traitées par un **worker** (CLAUDE.md règle 8 : effets de bord via Messenger).

## Transport & retry

- Config : `config/packages/messenger.yaml`. Transport `async` = Doctrine
  (`MESSENGER_TRANSPORT_DSN=doctrine://default?auto_setup=1`), table `messenger_messages`.
- **Retry** : 3 tentatives, backoff exponentiel (delay 1s ×2). Après échec définitif,
  le message part sur le transport `failed` (rejeu manuel : `make worker-retry`).
- En **test** : transport `in-memory://` (messages collectés, pas d'appel réseau réel).

## Messages routés en async

| Message | Déclencheur | Handler |
|---|---|---|
| `Symfony\…\SendEmailMessage` | tout `MailerInterface::send()` (ex : notif lead) | Mailer |
| `App\Message\CleanupR2ObjectMessage` | les 5 listeners de suppression (Media, Mission, Tutoriel, Completion photo, SupportAttachment) | `CleanupR2ObjectHandler` (delete R2 idempotent) |
| `App\Message\LogAuditEventMessage` | `AuditLogService::log()` (actions superadmin) | `LogAuditEventHandler` |

## Worker

```bash
make worker        # consomme la file async (à superviser en prod)
make worker-stats  # compte async / failed
make worker-retry  # rejoue les messages en échec
```

**En prod** : lancer `messenger:consume async` en service supervisé (systemd/supervisor),
avec `--time-limit` pour recycler le process. Sans worker actif, les mails/cleanups/audits
restent en file (non perdus) mais ne sont pas traités.

## Hors scope (resté synchrone)

- **Génération PDF** (export registre du personnel) : c'est un **téléchargement** — la
  réponse HTTP EST le PDF, l'utilisateur attend le fichier. Non différable → reste synchrone.
- **Recalcul du taux de complétion** : doit être immédiat (l'UI affiche le taux au cochage)
  → synchrone au point d'écriture (cf. `CompletionRateCalculator`), pas via le worker.
