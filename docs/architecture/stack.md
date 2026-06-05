# Stack, dépendances & environnement

> ARCHITECTURE — [retour à l'index](../../ARCHITECTURE.md)

## Stack technique complète

```
Backend   : Symfony 8.0 + API Platform 3 + Doctrine ORM + PHP 8.4
Frontend  : Next.js 14 (App Router) + TypeScript strict + Tailwind CSS
BDD       : MySQL 8.0 (local) | Docker Compose avec PostgreSQL 16 disponible
Auth      : Lexik JWT Bundle (Symfony) + localStorage + axios interceptor (Next.js)
State     : Zustand (auth, UI global) + React Query (server state)
Data fetch: TanStack React Query v5 — jamais useEffect pour les API
Forms     : React Hook Form + Zod (front) | Symfony Validator (back)
Animations: Framer Motion — variants dans lib/animations.ts
HTTP      : Axios — client centralisé lib/api.ts
Fixtures  : Hautelook Alice Bundle
Fonts     : Syne (titres) + DM Sans (corps)
Dates     : date-fns
```

---

## Dépendances principales


### Backend
```bash
composer require symfony/framework-bundle symfony/serializer symfony/validator
composer require api-platform/core
composer require lexik/jwt-authentication-bundle
composer require nelmio/cors-bundle
composer require doctrine/doctrine-bundle doctrine/orm doctrine/doctrine-migrations-bundle
composer require hautelook/alice-bundle --dev
composer require symfony/maker-bundle --dev
composer require async-aws/s3                # module Media — wrapper R2
```

### Frontend
```bash
npm install @tanstack/react-query axios zustand
npm install react-hook-form @hookform/resolvers zod
npm install framer-motion
npm install date-fns
npm install class-variance-authority clsx tailwind-merge
```

---

## Variables d'environnement


### Backend (`shiftly-api/.env.example`)
```
DATABASE_URL="mysql://root:@127.0.0.1:3306/shiftly"
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=CHANGE_ME
JWT_TTL=3600
CORS_ALLOW_ORIGIN=http://localhost:3000
APP_ENV=dev
APP_SECRET=CHANGE_ME

# Cloudflare R2 — module Media (object storage S3-compatible)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=shiftly-dev
R2_ENDPOINT=https://your-r2-account-id.r2.cloudflarestorage.com
```

### Frontend (`shiftly-app/.env.example`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```
