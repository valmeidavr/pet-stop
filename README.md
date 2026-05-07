# Pet Stop

Aplicação Next.js para clínicas, pet shops, emergência veterinária e babás (demo Vale do Paraíba / Sul Fluminense).

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Prisma 6 + Neon Postgres (`@prisma/adapter-neon`)
- NextAuth v5 (Credentials provider)
- Leaflet + react-leaflet (mapa)

## Setup local

1. Copiar `.env.example` para `.env.local` e preencher:
   - `DATABASE_URL`, `DIRECT_URL` (do painel Neon)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `AUTH_URL=http://localhost:3000`
   - `SEED_ADMIN_PASSWORD` (senha do admin de demo)
2. Instalar e migrar:
   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```
3. Abrir `http://localhost:3000`.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm test` — testes (Vitest)
- `npm run db:migrate` — aplica migrations em produção (`prisma migrate deploy`)
- `npm run db:seed` — roda seed
- `npx prisma studio` — UI para inspecionar o banco

## Deploy Vercel

1. `vercel link`.
2. Em Settings → Environment Variables, adicionar `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL` (=domínio público), `SEED_ADMIN_PASSWORD`. Alternativa: instalar a integração Neon do Marketplace (auto-injeta `DATABASE_URL`/`DIRECT_URL`).
3. Build command padrão (`next build`); `prisma generate` roda automaticamente via `postinstall`.
4. Migrations em produção: rodar `npm run db:migrate` em deploy hook ou GitHub Action.
