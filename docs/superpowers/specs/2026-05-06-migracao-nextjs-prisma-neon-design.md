# Migração Vite → Next.js + Prisma + Neon (Pet Stop)

**Data:** 2026-05-06
**Autor:** Vini (com Claude)
**Status:** Em design — aguardando review

## Contexto

Hoje o Pet Stop é uma SPA **Vite + React 19 + React Router** com dados em `src/data/mock.ts`. Páginas de Login/Cadastro são puramente visuais (formulários sem backend). O app cobre busca de estabelecimentos no mapa (leaflet), perfis de babás, página de emergência e algumas rotas placeholder.

O objetivo é migrar para **Next.js 15 (App Router) + Prisma 6 + Neon Postgres**, com autenticação real via NextAuth v5 (Credentials), preservando todas as páginas/componentes existentes e migrando os dados de demo para o banco via seed.

## Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | **Migração in-place** (mesmo repo, troca Vite por Next.js) | Projeto pequeno (12 páginas, 6 componentes); React Router → App Router é tradução quase mecânica; mantém histórico Git. |
| 2 | **Schema completo de uma vez** (User + Establishment + Baba + Review + Professional + SamplePrice) | Schema realista evita refatorações encadeadas. Custo extra é pequeno comparado a migrar incremental. |
| 3 | **NextAuth v5 + Credentials + Prisma adapter + JWT sessions** | Padrão de facto no Next; abre porta para social login depois. JWT (não DB sessions) é o suportado pelo adapter Prisma com Credentials. |
| 4 | **Role enum** (`CUSTOMER`, `BABA`, `ESTABLISHMENT_OWNER`, `ADMIN`) com `ownerId?` em `Baba`/`Establishment` | Schema futuro-tolerante sem complicar o cadastro inicial (default `CUSTOMER`). |
| 5 | **Slug separado de id** | Preserva URLs atuais (`/estabelecimento/clinica-vet-bm`) enquanto IDs são `cuid`. |
| 6 | **Arrays Postgres `String[]`** para `plans`, `exams`, `vaccines`, `medications`, `shopServices`, `galleryImages` | Evita 5 tabelas pequenas; nativo no Postgres; refatora se virar filtro. |
| 7 | **Review polimórfico** via dois FKs nullable (`establishmentId` ou `babaId`) | Mais simples que duas tabelas duplicadas. |
| 8 | **Adapter Neon serverless** (`@prisma/adapter-neon` + `@neondatabase/serverless`) | Pooling adequado para Vercel serverless; evita esgotar conexões. |
| 9 | **Seed do `mock.ts` migrado para `prisma/seed-data.ts`** + `prisma/seed.ts` idempotente via `upsert` | Mantém dados de demo funcionando após migração; rodável em qualquer ambiente. |
| 10 | **Deploy Vercel** + integração Neon do Marketplace | Auto-injeta env vars em Preview/Production e cria branches de banco por PR. |

## Arquitetura

### Estrutura de pastas final

```
.
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── seed-data.ts            # establishments[] e babas[] migrados de src/data/mock.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # html/body + Navbar + Footer + SessionProvider
│   │   ├── globals.css         # antiga src/index.css
│   │   ├── page.tsx            # Home
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── cadastro/
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── babas/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx   # busca por slug
│   │   ├── paradas-pets/page.tsx
│   │   ├── emergencia/page.tsx
│   │   ├── estabelecimento/[id]/page.tsx
│   │   ├── adocao/page.tsx     # <EmBreve title="Adoção" />
│   │   ├── campanhas/page.tsx
│   │   ├── buscapet/page.tsx
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── components/             # Navbar, Footer, PetMap, AdSlot, BrandLogo, StarRating
│   ├── lib/
│   │   ├── prisma.ts           # PrismaClient singleton + Neon adapter
│   │   ├── auth.ts             # NextAuth config (handlers, auth, signIn, signOut)
│   │   ├── validators.ts       # Zod schemas (registerSchema, loginSchema)
│   │   └── queries/            # funções tipadas que envolvem Prisma (getEstablishmentBySlug, etc.)
│   └── types/
│       └── next-auth.d.ts      # augmentações de Session/JWT
├── public/                     # assets estáticos (mantém o atual)
├── middleware.ts               # protege rotas privadas (placeholder p/ futuro)
├── next.config.ts
├── tsconfig.json               # preset do Next
└── package.json
```

### Mapa de migração de rotas

| React Router (atual) | App Router (novo) | Estratégia |
|---|---|---|
| `/` → `Home` | `app/page.tsx` | Server Component; busca `establishments` em destaque do banco |
| `/login` | `app/login/page.tsx` | Client (form) + server action `login` |
| `/cadastro` | `app/cadastro/page.tsx` | Client (form) + server action `register` |
| `/babas` | `app/babas/page.tsx` | Server (lista do banco) |
| `/babas/:id` | `app/babas/[id]/page.tsx` | Server; param resolvido por slug |
| `/paradas-pets` | `app/paradas-pets/page.tsx` | Server; passa lista para componente cliente do mapa |
| `/emergencia` | `app/emergencia/page.tsx` | Server; filtra `type IN (clinica, hospital)` |
| `/estabelecimento/:id` | `app/estabelecimento/[id]/page.tsx` | Server; busca por slug |
| `/adocao`, `/campanhas`, `/buscapet` | 3 páginas que renderizam `<EmBreve title="…" />` | Server |

### Mudanças mecânicas obrigatórias

- `react-router-dom` → removido. `<Link>` vira `next/link`. `useParams` → param da page.
- `BrowserRouter` some — `Navbar` e `Footer` migram para `app/layout.tsx`.
- `index.html` + `main.tsx` substituídos por `app/layout.tsx` + `app/globals.css`.
- `vite.config.ts` + `vite-plugin-pwa` removidos. PWA fica para ciclo futuro (via `next-pwa` ou App Router manifest).
- `tsconfig.json` reescrito para preset Next (paths, jsx preserve, etc.).
- Scripts em `package.json`: `dev: next dev`, `build: next build`, `start: next start`, `lint: next lint`, `postinstall: prisma generate`.

### Componentes que precisam `'use client'`

- `Navbar`, `Footer` (estado de menu, eventos de clique) — sim.
- `PetMap` (leaflet) — sim, **e** importado via `next/dynamic({ ssr: false })` no consumidor (leaflet acessa `window`).
- Forms de login/cadastro — sim.
- `StarRating`, `BrandLogo`, `AdSlot` — server por padrão (revisar caso a caso).

## Schema Prisma

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  CUSTOMER
  BABA
  ESTABLISHMENT_OWNER
  ADMIN
}

enum EstablishmentType {
  loja
  clinica
  farmacia
  hospital
  banho_tosa
}

enum PublicPrivate {
  publico
  privado
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  role          Role      @default(CUSTOMER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts     Account[]
  sessions     Session[]
  reviews      Review[]
  ownedBabas   Baba[]          @relation("BabaOwner")
  ownedEstabs  Establishment[] @relation("EstablishmentOwner")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model Establishment {
  id            String            @id @default(cuid())
  slug          String            @unique
  type          EstablishmentType
  name          String
  lat           Float
  lng           Float
  address       String
  phone         String
  email         String
  rating        Float             @default(0)
  bannerImage   String
  logoImage     String
  publicPrivate PublicPrivate?
  about         String

  ownerId String?
  owner   User?   @relation("EstablishmentOwner", fields: [ownerId], references: [id], onDelete: SetNull)

  plans         String[]
  exams         String[]
  vaccines      String[]
  medications   String[]
  shopServices  String[]
  galleryImages String[]

  professionals Professional[]
  samplePrices  SamplePrice[]
  reviews       Review[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([type])
  @@index([lat, lng])
}

model Professional {
  id              String        @id @default(cuid())
  establishmentId String
  establishment   Establishment @relation(fields: [establishmentId], references: [id], onDelete: Cascade)
  name            String
  specialty       String
}

model SamplePrice {
  id              String        @id @default(cuid())
  establishmentId String
  establishment   Establishment @relation(fields: [establishmentId], references: [id], onDelete: Cascade)
  item            String
  price           String
}

model Baba {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  photo       String
  rating      Float    @default(0)
  reviewCount Int      @default(0)
  location    String
  phone       String
  email       String
  bio         String

  ownerId String?
  owner   User?   @relation("BabaOwner", fields: [ownerId], references: [id], onDelete: SetNull)

  reviews   Review[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Review {
  id        String   @id @default(cuid())
  rating    Float
  text      String
  createdAt DateTime @default(now())

  authorName String?
  userId     String?
  user       User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  establishmentId String?
  establishment   Establishment? @relation(fields: [establishmentId], references: [id], onDelete: Cascade)

  babaId String?
  baba   Baba?   @relation(fields: [babaId], references: [id], onDelete: Cascade)

  @@index([establishmentId])
  @@index([babaId])
}
```

## Autenticação

### Arquivos

| Caminho | Responsabilidade |
|---|---|
| `src/lib/auth.ts` | Config NextAuth: providers, callbacks (`jwt`, `session`), `authorize()` do Credentials. Exporta `{ handlers, auth, signIn, signOut }`. |
| `src/lib/prisma.ts` | Singleton `PrismaClient` com adapter Neon. Reuso via `globalThis` em dev. |
| `src/app/api/auth/[...nextauth]/route.ts` | Re-export `{ GET, POST } = handlers`. |
| `middleware.ts` | Placeholder (sem rotas privadas no MVP). Estrutura pronta para futuro. |
| `src/app/login/actions.ts` | Server action `login(formData)` → chama `signIn('credentials', ...)`. Retorna `{ error?: string }`. |
| `src/app/cadastro/actions.ts` | Server action `register(formData)` → valida com Zod, hash com `bcryptjs`, cria `User { role: CUSTOMER }`, faz `signIn`. |
| `src/lib/validators.ts` | `registerSchema` (name 2-100, email, password ≥ 8) e `loginSchema`. |
| `src/types/next-auth.d.ts` | Augmenta `Session.user` e `JWT` com `id: string` e `role: Role`. |

### Fluxos

**Cadastro:**
1. Form em `app/cadastro/page.tsx` ('use client') chama action `register(formData)`.
2. Action valida com `registerSchema`. Erro → retorna `{ error }` para exibir no form.
3. Verifica unicidade de email. Duplicado → `{ error: 'Email já cadastrado' }`.
4. `bcryptjs.hash(password, 10)`. Cria `User { name, email, passwordHash, role: CUSTOMER }`.
5. Chama `signIn('credentials', { email, password, redirect: false })`. Sucesso → `redirect('/')`.

**Login:**
1. Form em `app/login/page.tsx` ('use client') chama action `login(formData)`.
2. Action valida com `loginSchema`. Erro → `{ error }`.
3. Chama `signIn('credentials', ...)`. Em `authorize()`, busca user por email, compara com `bcryptjs.compare`. Sucesso → retorna `{ id, email, name, role }`. Falha → `null`.
4. NextAuth gera JWT em cookie httpOnly. `jwt` callback adiciona `role`. `session` callback espelha para `session.user.role`.

### Segurança

- `AUTH_SECRET` obrigatório (gerado com `openssl rand -base64 32`).
- `bcryptjs` cost factor 10.
- Cookies httpOnly + Secure em produção (`AUTH_URL=https://...`).
- Senha nunca volta para o cliente; Server Components que precisam de identidade usam `auth()`.

## Seed e dados iniciais

**`prisma/seed-data.ts`** — cópia de `src/data/mock.ts` (apenas as constantes `establishments`, `babas`; sem helpers React).

**`prisma/seed.ts`:**
1. Carrega data, mapeia `id` antigo → `slug` (cuid novo é gerado pelo Prisma).
2. `upsert` por `slug`:
   - Para cada `Establishment`: nested `create` de `professionals`, `samplePrices`, `reviews` (com `authorName` preenchido, `userId` nulo).
   - Para cada `Baba`: nested `create` de `reviews`.
3. Cria admin de demo: `admin@petstop.local` com senha em `SEED_ADMIN_PASSWORD` (bcrypt), role `ADMIN`. `upsert` por email — idempotente.

**`package.json`:**
```json
{
  "prisma": { "seed": "tsx prisma/seed.ts" }
}
```

Comando: `npx prisma db seed` (após `prisma migrate dev`).

## Conexão Neon

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaNeon(pool)

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Variáveis de ambiente

`.env.local` (NÃO comitado):
```
DATABASE_URL="postgresql://...pooler.../neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://...direta.../neondb?sslmode=require"
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
SEED_ADMIN_PASSWORD="<senha forte>"
```

`.gitignore`: garantir `.env*.local`, `.next/`, remover `dist/`.

**⚠️ Ação imediata:** rotacionar a senha do Neon que foi colada no chat antes de qualquer deploy.

## Deploy Vercel

1. `vercel link` no diretório.
2. Idealmente: instalar a **integração Neon do Marketplace** — auto-injeta `DATABASE_URL` e `DIRECT_URL` em Preview/Production e cria branches de banco por PR. Alternativa manual: adicionar as 5 vars acima em **Settings → Environment Variables** (Production, Preview, Development).
3. `package.json`:
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "next lint",
     "postinstall": "prisma generate",
     "db:migrate": "prisma migrate deploy"
   }
   ```
4. Migrações: rodar localmente apontando para Neon (`prisma migrate dev`); em produção `prisma migrate deploy` no build (via custom build command na Vercel ou via GitHub Action separada).
5. `AUTH_URL` em produção = domínio público da Vercel (ou domínio customizado).

## Trade-offs aceitos / fora de escopo

- **Fora do MVP:** PWA (deferida do `vite-plugin-pwa`), social login, painel de admin, fluxo de "reivindicar perfil de babá/estabelecimento", upload de imagens (galleryImages permanece como URL externa), busca/filtro avançado.
- **`SamplePrice.price` como `String`** — mantém formato "R$ 199,00" do mock; mudar para `Decimal` + currency é trabalho futuro.
- **Sessão JWT (não DB)** — escolhida por compatibilidade do Credentials provider com Prisma adapter no NextAuth v5.
- **`Review` polimórfico** com FKs nullable — duplicação rejeitada; constraint de "exatamente um dos dois preenchidos" fica como validação de aplicação (e não check constraint) por simplicidade.

## Critérios de sucesso

- [ ] `npm run dev` sobe Next.js 15 em `localhost:3000`, com todas as rotas atuais respondendo.
- [ ] Mapa renderiza em `/paradas-pets` e `/emergencia` (sem erro de SSR/`window`).
- [ ] `prisma migrate dev` aplica schema no Neon sem erro.
- [ ] `npx prisma db seed` popula banco; banco contém 13 estabelecimentos + 3 babás + 1 admin.
- [ ] `/estabelecimento/clinica-vet-bm` e demais slugs antigos continuam funcionando.
- [ ] Cadastro cria user real no banco com `passwordHash`. Login autentica e a sessão fica disponível em Server Components via `auth()`.
- [ ] Build (`next build`) passa sem erros de tipo.
- [ ] Deploy Preview na Vercel sobe e responde.
