# Adoção, Campanhas e BuscaPet — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os 3 placeholders `EmBreve` (`/adocao`, `/campanhas`, `/buscapet`) por catálogos reais alimentados via seed, no mesmo padrão demo de `/babas` e `/estabelecimento`.

**Architecture:** 3 modelos Prisma novos (Adoptable, Campaign, BuscaPetPost), helpers de query em `src/lib/queries/`, páginas Server Components com listas e detail pages. Filtro client-side em BuscaPet. Helper `whatsappLink()` extraído pra `src/lib/whatsapp.ts` e reusado pela `/babas`. Spec: [`docs/superpowers/specs/2026-05-07-adocao-campanhas-buscapet-design.md`](../specs/2026-05-07-adocao-campanhas-buscapet-design.md).

**Tech Stack:** Prisma 6 + Neon, Next.js 16 (App Router), React 19, Server Components, TypeScript 5.9.

---

## File Structure

```
prisma/
  schema.prisma                                       # MODIFY: +5 enums, +3 models
  seed-data-extras.ts                                 # CREATE: dados demo
  seed.ts                                             # MODIFY: +3 blocos upsert
src/
  lib/
    whatsapp.ts                                       # CREATE: helper compartilhado
    queries/
      adocao.ts                                       # CREATE
      campanhas.ts                                    # CREATE
      buscapet.ts                                     # CREATE
  app/
    babas/[id]/page.tsx                               # MODIFY: usar @/lib/whatsapp
    adocao/
      page.tsx                                        # REPLACE EmBreve
      adocao.css                                      # CREATE
      [slug]/
        page.tsx                                      # CREATE
        profile.css                                   # CREATE
    campanhas/
      page.tsx                                        # REPLACE EmBreve
      campanhas.css                                   # CREATE
      [slug]/
        page.tsx                                      # CREATE
        profile.css                                   # CREATE
    buscapet/
      page.tsx                                        # REPLACE EmBreve
      BuscaPetList.tsx                                # CREATE: client component
      buscapet.css                                    # CREATE
      [slug]/
        page.tsx                                      # CREATE
        profile.css                                   # CREATE
```

---

### Task 1: Helper WhatsApp compartilhado

**Files:**
- Create: `src/lib/whatsapp.ts`
- Modify: `src/app/babas/[id]/page.tsx`

- [ ] **Step 1: Criar `src/lib/whatsapp.ts`**

```ts
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
}
```

- [ ] **Step 2: Substituir helper inline em `src/app/babas/[id]/page.tsx`**

Localizar e remover:
```ts
function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
}
```

Adicionar import no topo (junto aos outros):
```ts
import { whatsappLink } from '@/lib/whatsapp'
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add src/lib/whatsapp.ts src/app/babas/[id]/page.tsx
git commit -m "refactor: extract whatsappLink helper to src/lib/whatsapp.ts"
```

---

### Task 2: Schema Prisma + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Adicionar enums e models ao final de `prisma/schema.prisma`**

Anexar ao final do arquivo (depois do `model Review`):

```prisma
enum AdoptableSpecies {
  cao
  gato
  outro
}

enum AdoptableSize {
  pequeno
  medio
  grande
}

enum AdoptableGender {
  macho
  femea
}

enum BuscaPetType {
  perdido
  encontrado
}

enum CampaignStatus {
  ativa
  encerrada
}

model Adoptable {
  id            String            @id @default(cuid())
  slug          String            @unique
  name          String
  species       AdoptableSpecies
  breed         String?
  ageYears      Float
  size          AdoptableSize
  gender        AdoptableGender
  photo         String
  description   String
  location      String
  contactPhone  String
  contactEmail  String
  adoptedAt     DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([species])
  @@index([adoptedAt])
}

model Campaign {
  id            String          @id @default(cuid())
  slug          String          @unique
  title         String
  description   String
  bannerImage   String
  location      String
  startsAt      DateTime
  endsAt        DateTime
  organizer     String
  status        CampaignStatus  @default(ativa)
  infoUrl       String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([status])
  @@index([startsAt])
}

model BuscaPetPost {
  id                  String           @id @default(cuid())
  slug                String           @unique
  type                BuscaPetType
  petName             String?
  species             AdoptableSpecies
  photo               String
  lastSeenLocation    String
  lastSeenAt          DateTime
  description         String
  contactPhone        String
  contactEmail        String
  resolvedAt          DateTime?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  @@index([type])
  @@index([resolvedAt])
}
```

- [ ] **Step 2: Rodar migration**

```bash
npx prisma migrate dev --name add_adoption_campaigns_buscapet
```

Expected: cria `prisma/migrations/<timestamp>_add_adoption_campaigns_buscapet/migration.sql`, aplica no Neon, regenera o client. Zero erros.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add adoptable, campaign, buscapetpost models"
```

---

### Task 3: Seed data extras + atualizar `seed.ts`

**Files:**
- Create: `prisma/seed-data-extras.ts`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Criar `prisma/seed-data-extras.ts`**

```ts
import type {
  AdoptableGender,
  AdoptableSize,
  AdoptableSpecies,
  BuscaPetType,
  CampaignStatus,
} from '@prisma/client'

type AdoptableSeed = {
  slug: string
  name: string
  species: AdoptableSpecies
  breed: string | null
  ageYears: number
  size: AdoptableSize
  gender: AdoptableGender
  photo: string
  description: string
  location: string
  contactPhone: string
  contactEmail: string
  adoptedAt: Date | null
}

type CampaignSeed = {
  slug: string
  title: string
  description: string
  bannerImage: string
  location: string
  startsAt: Date
  endsAt: Date
  organizer: string
  status: CampaignStatus
  infoUrl: string | null
}

type BuscaPetSeed = {
  slug: string
  type: BuscaPetType
  petName: string | null
  species: AdoptableSpecies
  photo: string
  lastSeenLocation: string
  lastSeenAt: Date
  description: string
  contactPhone: string
  contactEmail: string
  resolvedAt: Date | null
}

export const adoptables: AdoptableSeed[] = [
  {
    slug: 'luna-2-anos',
    name: 'Luna',
    species: 'cao',
    breed: 'Vira-lata caramelo',
    ageYears: 2,
    size: 'medio',
    gender: 'femea',
    photo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
    description:
      'Luna é dócil, brincalhona, ótima com crianças e já é castrada e vacinada. Resgatada em Barra Mansa.',
    location: 'Barra Mansa — RJ',
    contactPhone: '(24) 99888-1010',
    contactEmail: 'adocao.luna@petstop.demo',
    adoptedAt: null,
  },
  {
    slug: 'thor-filhote-cao',
    name: 'Thor',
    species: 'cao',
    breed: 'Vira-lata',
    ageYears: 0.6,
    size: 'pequeno',
    gender: 'macho',
    photo: 'https://images.unsplash.com/photo-1583511655802-41f9af7b46df?w=800',
    description:
      'Filhote brincalhão, encontrado abandonado em Volta Redonda. Já está vermifugado e tomou a primeira dose da V8.',
    location: 'Volta Redonda — RJ',
    contactPhone: '(24) 98777-2020',
    contactEmail: 'adocao.thor@petstop.demo',
    adoptedAt: null,
  },
  {
    slug: 'mel-senhora-pacata',
    name: 'Mel',
    species: 'cao',
    breed: 'Vira-lata idosa',
    ageYears: 11,
    size: 'medio',
    gender: 'femea',
    photo: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=800',
    description:
      'Senhora calma, ideal pra quem busca companhia tranquila. Tem artrose leve e já toma anti-inflamatório natural.',
    location: 'Pinheiral — RJ',
    contactPhone: '(24) 97666-3030',
    contactEmail: 'adocao.mel@petstop.demo',
    adoptedAt: null,
  },
  {
    slug: 'mia-gata-tricolor',
    name: 'Mia',
    species: 'gato',
    breed: 'Tricolor SRD',
    ageYears: 1.5,
    size: 'pequeno',
    gender: 'femea',
    photo: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800',
    description:
      'Gatinha social, gosta de outros gatos e de gente. Castrada e com FIV/FeLV negativos.',
    location: 'Quatis — RJ',
    contactPhone: '(24) 96555-4040',
    contactEmail: 'adocao.mia@petstop.demo',
    adoptedAt: null,
  },
  {
    slug: 'simba-gato-laranja',
    name: 'Simba',
    species: 'gato',
    breed: 'Laranja SRD',
    ageYears: 3,
    size: 'medio',
    gender: 'macho',
    photo: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800',
    description:
      'Manso, dorme no colo. Resgatado de uma colônia de rua. Castrado e vacinado.',
    location: 'Barra Mansa — RJ',
    contactPhone: '(24) 95444-5050',
    contactEmail: 'adocao.simba@petstop.demo',
    adoptedAt: null,
  },
  {
    slug: 'pipoca-coelha',
    name: 'Pipoca',
    species: 'outro',
    breed: 'Coelha holandesa',
    ageYears: 2,
    size: 'pequeno',
    gender: 'femea',
    photo: 'https://images.unsplash.com/photo-1535241749838-299277b6305f?w=800',
    description:
      'Coelhinha sociável, vive solta em casa. Procura tutor que tenha experiência com pets de pequeno porte.',
    location: 'Volta Redonda — RJ',
    contactPhone: '(24) 94333-6060',
    contactEmail: 'adocao.pipoca@petstop.demo',
    adoptedAt: null,
  },
]

export const campaigns: CampaignSeed[] = [
  {
    slug: 'vacinacao-gratuita-bm',
    title: 'Vacinação antirrábica gratuita',
    description:
      'Mutirão de vacinação antirrábica para cães e gatos da região central de Barra Mansa. Levar carteira de vacinação se houver.',
    bannerImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200',
    location: 'Praça da Matriz, Barra Mansa — RJ',
    startsAt: new Date('2026-06-01T08:00:00-03:00'),
    endsAt: new Date('2026-06-01T17:00:00-03:00'),
    organizer: 'Secretaria Municipal de Saúde',
    status: 'ativa',
    infoUrl: 'https://barramansa.rj.gov.br',
  },
  {
    slug: 'castracao-popular-vr',
    title: 'Castração popular — agendamento aberto',
    description:
      'Programa de castração a preço social em Volta Redonda. Vagas limitadas, agendamento via formulário no site oficial.',
    bannerImage: 'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=1200',
    location: 'Centro Veterinário Municipal, Volta Redonda — RJ',
    startsAt: new Date('2026-05-15T09:00:00-03:00'),
    endsAt: new Date('2026-07-15T18:00:00-03:00'),
    organizer: 'Prefeitura de Volta Redonda',
    status: 'ativa',
    infoUrl: 'https://voltaredonda.rj.gov.br',
  },
  {
    slug: 'doacao-racao-quatis',
    title: 'Campanha de doação de ração',
    description:
      'Estamos arrecadando ração para o abrigo municipal de Quatis. Pontos de coleta em pet shops parceiros até 30 de junho.',
    bannerImage: 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=1200',
    location: 'Pontos de coleta — Quatis — RJ',
    startsAt: new Date('2026-05-01T00:00:00-03:00'),
    endsAt: new Date('2026-06-30T23:59:00-03:00'),
    organizer: 'Abrigo Quatis Pet',
    status: 'ativa',
    infoUrl: null,
  },
  {
    slug: 'feirao-adocao-pinheiral-2026-04',
    title: 'Feirão de adoção em Pinheiral',
    description:
      'Feirão realizado em abril/2026 — 14 pets adotados. Obrigado a todos que participaram!',
    bannerImage: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200',
    location: 'Praça Central, Pinheiral — RJ',
    startsAt: new Date('2026-04-12T09:00:00-03:00'),
    endsAt: new Date('2026-04-12T17:00:00-03:00'),
    organizer: 'ONG Patas do Vale',
    status: 'encerrada',
    infoUrl: null,
  },
]

export const buscaPetPosts: BuscaPetSeed[] = [
  {
    slug: 'perdido-bidu-bm-centro',
    type: 'perdido',
    petName: 'Bidu',
    species: 'cao',
    photo: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=800',
    lastSeenLocation: 'Rua Floriano Peixoto, Centro — Barra Mansa',
    lastSeenAt: new Date('2026-05-04T18:30:00-03:00'),
    description:
      'Cão pequeno, pelagem branca com manchas marrons, coleira azul. Sumiu na hora do passeio. Recompensa.',
    contactPhone: '(24) 99111-2233',
    contactEmail: 'familia.bidu@petstop.demo',
    resolvedAt: null,
  },
  {
    slug: 'perdido-tom-vr-aterrado',
    type: 'perdido',
    petName: 'Tom',
    species: 'gato',
    photo: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800',
    lastSeenLocation: 'Bairro Aterrado, Volta Redonda',
    lastSeenAt: new Date('2026-04-30T21:00:00-03:00'),
    description:
      'Gato preto, pescoço com marca branca. Saiu pela janela e não voltou. Não tem coleira.',
    contactPhone: '(24) 99222-4455',
    contactEmail: 'familia.tom@petstop.demo',
    resolvedAt: null,
  },
  {
    slug: 'perdido-nina-quatis-resolvido',
    type: 'perdido',
    petName: 'Nina',
    species: 'cao',
    photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    lastSeenLocation: 'Centro de Quatis',
    lastSeenAt: new Date('2026-04-22T15:00:00-03:00'),
    description:
      'Cadela vira-lata caramelo, médio porte. Reconectada com a família depois de 3 dias!',
    contactPhone: '(24) 99333-6677',
    contactEmail: 'familia.nina@petstop.demo',
    resolvedAt: new Date('2026-04-25T11:00:00-03:00'),
  },
  {
    slug: 'encontrado-cao-bm-saudade',
    type: 'encontrado',
    petName: null,
    species: 'cao',
    photo: 'https://images.unsplash.com/photo-1601758174039-71e0f1eaf6e3?w=800',
    lastSeenLocation: 'Bairro Saudade, Barra Mansa',
    lastSeenAt: new Date('2026-05-05T08:00:00-03:00'),
    description:
      'Cão médio, pelagem preta, parece dócil. Sem coleira. Está abrigado em casa de morador, dono pode entrar em contato.',
    contactPhone: '(24) 99444-8899',
    contactEmail: 'achados.bm@petstop.demo',
    resolvedAt: null,
  },
  {
    slug: 'encontrado-gato-pinheiral',
    type: 'encontrado',
    petName: null,
    species: 'gato',
    photo: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800',
    lastSeenLocation: 'Próximo à Praça Central, Pinheiral',
    lastSeenAt: new Date('2026-05-06T19:00:00-03:00'),
    description:
      'Gato cinza listrado, magrinho, parece filhote (4-5 meses). Está sendo cuidado por uma vizinha. Aceita reencontro.',
    contactPhone: '(24) 99555-1010',
    contactEmail: 'achados.pinheiral@petstop.demo',
    resolvedAt: null,
  },
]
```

- [ ] **Step 2: Atualizar `prisma/seed.ts` para fazer upsert dos novos dados**

Adicionar import no topo (junto aos existentes):
```ts
import { adoptables, campaigns, buscaPetPosts } from './seed-data-extras'
```

Antes do bloco `const adminPassword = process.env.SEED_ADMIN_PASSWORD` (ou em qualquer lugar dentro do `main()`), adicionar:

```ts
  for (const a of adoptables) {
    await prisma.adoptable.upsert({
      where: { slug: a.slug },
      create: a,
      update: { ...a },
    })
  }

  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { slug: c.slug },
      create: c,
      update: { ...c },
    })
  }

  for (const p of buscaPetPosts) {
    await prisma.buscaPetPost.upsert({
      where: { slug: p.slug },
      create: p,
      update: { ...p },
    })
  }
```

- [ ] **Step 3: Rodar seed**

```bash
SEED_ADMIN_PASSWORD="$(grep '^SEED_ADMIN_PASSWORD=' .env.local | cut -d'"' -f2)" npx prisma db seed
```

Expected: log `Seed concluído.` sem erros.

- [ ] **Step 4: Verificar contagens**

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  console.log('adoptables:', await p.adoptable.count())
  console.log('campaigns:', await p.campaign.count())
  console.log('buscapet:', await p.buscaPetPost.count())
}
main().finally(() => p.\$disconnect())
"
```

Expected: `adoptables: 6`, `campaigns: 4`, `buscapet: 5`.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed-data-extras.ts prisma/seed.ts
git commit -m "feat(db): seed adoptables, campaigns, buscapet posts"
```

---

### Task 4: Query helpers

**Files:**
- Create: `src/lib/queries/adocao.ts`, `src/lib/queries/campanhas.ts`, `src/lib/queries/buscapet.ts`

- [ ] **Step 1: Criar `src/lib/queries/adocao.ts`**

```ts
import { prisma } from '@/lib/prisma'

export async function getAllAdoptables() {
  return prisma.adoptable.findMany({
    where: { adoptedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAdoptableBySlug(slug: string) {
  return prisma.adoptable.findUnique({ where: { slug } })
}
```

- [ ] **Step 2: Criar `src/lib/queries/campanhas.ts`**

```ts
import { prisma } from '@/lib/prisma'

export async function getAllCampaigns() {
  return prisma.campaign.findMany({
    orderBy: [{ status: 'asc' }, { startsAt: 'desc' }],
  })
}

export async function getCampaignBySlug(slug: string) {
  return prisma.campaign.findUnique({ where: { slug } })
}
```

(Ordem: `status: 'asc'` faz `ativa` vir antes de `encerrada` — `'a' < 'e'` no enum string ordering Postgres.)

- [ ] **Step 3: Criar `src/lib/queries/buscapet.ts`**

```ts
import { prisma } from '@/lib/prisma'

export async function getAllBuscaPetPosts() {
  return prisma.buscaPetPost.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBuscaPetPostBySlug(slug: string) {
  return prisma.buscaPetPost.findUnique({ where: { slug } })
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/adocao.ts src/lib/queries/campanhas.ts src/lib/queries/buscapet.ts
git commit -m "feat(queries): add adoptable, campaign, buscapet query helpers"
```

---

### Task 5: Página `/adocao` — lista

**Files:**
- Modify: `src/app/adocao/page.tsx` (substitui EmBreve)
- Create: `src/app/adocao/adocao.css`

- [ ] **Step 1: Criar `src/app/adocao/adocao.css`**

```css
.adocao-page {
  position: relative;
  overflow: hidden;
}

.adocao-hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem max(1rem, env(safe-area-inset-left)) 1.25rem
    max(1rem, env(safe-area-inset-right));
  text-align: center;
}

.adocao-hero__title {
  margin: 0 0 0.5rem;
  font-size: clamp(1.45rem, 5vw, 2rem);
  font-weight: 800;
  color: var(--green-dark);
}

.adocao-hero__text {
  margin: 0;
  color: #475569;
}

.adocao-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 max(1rem, env(safe-area-inset-left)) 2rem
    max(1rem, env(safe-area-inset-right));
}

.adocao-card {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}

.adocao-card:hover {
  transform: translateY(-2px);
}

.adocao-card__photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.adocao-card__body {
  padding: 1rem 1.15rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.adocao-card__name {
  margin: 0;
  font-size: 1.15rem;
  color: var(--green-dark);
}

.adocao-card__meta {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.adocao-card__loc {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
}

.adocao-card__btn {
  margin-top: auto;
  align-self: flex-start;
}

.adocao-empty {
  text-align: center;
  color: #64748b;
  padding: 2rem;
}
```

- [ ] **Step 2: Substituir `src/app/adocao/page.tsx`**

```tsx
import Link from 'next/link'
import { getAllAdoptables } from '@/lib/queries/adocao'
import './adocao.css'

const speciesLabel: Record<string, string> = {
  cao: 'Cão',
  gato: 'Gato',
  outro: 'Outro',
}

const sizeLabel: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
}

function ageDisplay(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} meses`
  return years === 1 ? '1 ano' : `${years} anos`
}

export default async function AdocaoPage() {
  const items = await getAllAdoptables()

  return (
    <main className="page adocao-page">
      <section className="adocao-hero">
        <h1 className="adocao-hero__title">Pets para adoção</h1>
        <p className="adocao-hero__text">
          Conheça os pets disponíveis para adoção responsável na região.
        </p>
      </section>

      <section className="adocao-grid" aria-label="Lista de pets para adoção">
        {items.map((p) => (
          <Link key={p.id} href={`/adocao/${p.slug}`} className="adocao-card">
            <img src={p.photo} alt="" className="adocao-card__photo" />
            <div className="adocao-card__body">
              <h2 className="adocao-card__name">{p.name}</h2>
              <p className="adocao-card__meta">
                {speciesLabel[p.species]} • {ageDisplay(p.ageYears)} • {sizeLabel[p.size]}
              </p>
              <p className="adocao-card__loc">📍 {p.location}</p>
              <span className="btn btn-green adocao-card__btn">Ver perfil</span>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="adocao-empty">Nenhum pet disponível no momento.</p>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Verificar localmente**

```bash
npm run dev
```

Em outro terminal:
```bash
curl -s http://localhost:3000/adocao | grep -i "Pets para adoção" | head -1
```

Expected: linha contendo "Pets para adoção". Parar dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/adocao/page.tsx src/app/adocao/adocao.css
git commit -m "feat(adocao): replace placeholder with adoptable list"
```

---

### Task 6: Página `/adocao/[slug]` — detalhe

**Files:**
- Create: `src/app/adocao/[slug]/page.tsx`, `src/app/adocao/[slug]/profile.css`

- [ ] **Step 1: Criar `src/app/adocao/[slug]/profile.css`**

```css
.adocao-profile {
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem max(1rem, env(safe-area-inset-left)) 3rem
    max(1rem, env(safe-area-inset-right));
}

.adocao-profile__hero {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 720px) {
  .adocao-profile__hero {
    flex-direction: row;
  }
}

.adocao-profile__photo {
  width: 100%;
  max-width: 320px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  aspect-ratio: 1 / 1;
  box-shadow: var(--shadow-soft);
}

.adocao-profile__info {
  flex: 1;
}

.adocao-profile__name {
  margin: 0 0 0.4rem;
  color: var(--green-dark);
  font-size: clamp(1.5rem, 4vw, 2rem);
}

.adocao-profile__meta {
  margin: 0 0 0.4rem;
  color: #475569;
}

.adocao-profile__loc {
  margin: 0 0 1rem;
  color: #64748b;
}

.adocao-profile__contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.adocao-profile__section {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-soft);
  margin-bottom: 1.25rem;
}

.adocao-profile__section-title {
  margin: 0 0 0.6rem;
  color: var(--green-dark);
  font-size: 1.1rem;
}

.adocao-profile__bio {
  margin: 0;
  line-height: 1.55;
  color: #334155;
}

.adocao-profile__back {
  display: inline-block;
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.95rem;
}

.adocao-profile__back:hover {
  color: var(--orange-text);
}
```

- [ ] **Step 2: Criar `src/app/adocao/[slug]/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdoptableBySlug } from '@/lib/queries/adocao'
import { whatsappLink } from '@/lib/whatsapp'
import './profile.css'

const speciesLabel: Record<string, string> = {
  cao: 'Cão',
  gato: 'Gato',
  outro: 'Outro',
}

const sizeLabel: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
}

const genderLabel: Record<string, string> = {
  macho: 'Macho',
  femea: 'Fêmea',
}

function ageDisplay(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} meses`
  return years === 1 ? '1 ano' : `${years} anos`
}

export default async function AdoptableProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pet = await getAdoptableBySlug(slug)
  if (!pet) notFound()

  return (
    <main className="page adocao-profile">
      <div className="adocao-profile__hero">
        <img src={pet.photo} alt="" className="adocao-profile__photo" />
        <div className="adocao-profile__info">
          <h1 className="adocao-profile__name">{pet.name}</h1>
          <p className="adocao-profile__meta">
            {speciesLabel[pet.species]}
            {pet.breed ? ` • ${pet.breed}` : ''} • {ageDisplay(pet.ageYears)} •{' '}
            {sizeLabel[pet.size]} • {genderLabel[pet.gender]}
          </p>
          <p className="adocao-profile__loc">📍 {pet.location}</p>
          <div className="adocao-profile__contacts">
            <a
              href={whatsappLink(pet.contactPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-green"
            >
              💬 WhatsApp
            </a>
            <a
              href={`mailto:${pet.contactEmail}`}
              className="btn btn-outline-green"
            >
              E-mail
            </a>
          </div>
        </div>
      </div>

      <section className="adocao-profile__section">
        <h2 className="adocao-profile__section-title">Sobre {pet.name}</h2>
        <p className="adocao-profile__bio">{pet.description}</p>
      </section>

      <Link href="/adocao" className="adocao-profile__back">
        ← Voltar para adoção
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Verificar localmente**

```bash
npm run dev
```

Em outro terminal:
```bash
curl -s http://localhost:3000/adocao/luna-2-anos | grep -i "Sobre Luna"
```

Expected: linha contendo "Sobre Luna". Parar dev server.

- [ ] **Step 4: Commit**

```bash
git add "src/app/adocao/[slug]/page.tsx" "src/app/adocao/[slug]/profile.css"
git commit -m "feat(adocao): add adoptable detail page"
```

---

### Task 7: Página `/campanhas` — lista

**Files:**
- Modify: `src/app/campanhas/page.tsx` (substitui EmBreve)
- Create: `src/app/campanhas/campanhas.css`

- [ ] **Step 1: Criar `src/app/campanhas/campanhas.css`**

```css
.campanhas-page {
  position: relative;
}

.campanhas-hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem max(1rem, env(safe-area-inset-left)) 1.25rem
    max(1rem, env(safe-area-inset-right));
  text-align: center;
}

.campanhas-hero__title {
  margin: 0 0 0.5rem;
  color: var(--green-dark);
  font-size: clamp(1.45rem, 5vw, 2rem);
  font-weight: 800;
}

.campanhas-hero__text {
  margin: 0;
  color: #475569;
}

.campanhas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 max(1rem, env(safe-area-inset-left)) 2rem
    max(1rem, env(safe-area-inset-right));
}

.campaign-card {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}

.campaign-card:hover {
  transform: translateY(-2px);
}

.campaign-card--encerrada {
  opacity: 0.7;
}

.campaign-card__banner {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.campaign-card__body {
  padding: 1rem 1.15rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.campaign-card__badge {
  align-self: flex-start;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.campaign-card__badge--ativa {
  background: #dcfce7;
  color: #166534;
}

.campaign-card__badge--encerrada {
  background: #f1f5f9;
  color: #475569;
}

.campaign-card__title {
  margin: 0;
  color: var(--green-dark);
  font-size: 1.1rem;
}

.campaign-card__meta {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.campaign-card__btn {
  margin-top: auto;
  align-self: flex-start;
}

.campanhas-empty {
  text-align: center;
  color: #64748b;
  padding: 2rem;
}
```

- [ ] **Step 2: Substituir `src/app/campanhas/page.tsx`**

```tsx
import Link from 'next/link'
import { getAllCampaigns } from '@/lib/queries/campanhas'
import './campanhas.css'

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export default async function CampanhasPage() {
  const items = await getAllCampaigns()

  return (
    <main className="page campanhas-page">
      <section className="campanhas-hero">
        <h1 className="campanhas-hero__title">Campanhas</h1>
        <p className="campanhas-hero__text">
          Mutirões, vacinação, castração e ações sociais na região.
        </p>
      </section>

      <section className="campanhas-grid" aria-label="Lista de campanhas">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/campanhas/${c.slug}`}
            className={`campaign-card${c.status === 'encerrada' ? ' campaign-card--encerrada' : ''}`}
          >
            <img src={c.bannerImage} alt="" className="campaign-card__banner" />
            <div className="campaign-card__body">
              <span
                className={`campaign-card__badge campaign-card__badge--${c.status}`}
              >
                {c.status === 'ativa' ? 'Ativa' : 'Encerrada'}
              </span>
              <h2 className="campaign-card__title">{c.title}</h2>
              <p className="campaign-card__meta">
                📅 {dateFmt.format(c.startsAt)} – {dateFmt.format(c.endsAt)}
              </p>
              <p className="campaign-card__meta">📍 {c.location}</p>
              <span className="btn btn-green campaign-card__btn">Ver detalhes</span>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="campanhas-empty">Nenhuma campanha ativa.</p>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Verificar localmente**

```bash
npm run dev
```

```bash
curl -s http://localhost:3000/campanhas | grep -i "Mutirões, vacinação"
```

Expected: linha contendo o texto do hero. Parar dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/campanhas/page.tsx src/app/campanhas/campanhas.css
git commit -m "feat(campanhas): replace placeholder with campaign list"
```

---

### Task 8: Página `/campanhas/[slug]` — detalhe

**Files:**
- Create: `src/app/campanhas/[slug]/page.tsx`, `src/app/campanhas/[slug]/profile.css`

- [ ] **Step 1: Criar `src/app/campanhas/[slug]/profile.css`**

```css
.campaign-profile {
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem max(1rem, env(safe-area-inset-left)) 3rem
    max(1rem, env(safe-area-inset-right));
}

.campaign-profile__banner {
  width: 100%;
  max-height: 320px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  margin-bottom: 1.25rem;
}

.campaign-profile__title {
  margin: 0 0 0.4rem;
  color: var(--green-dark);
  font-size: clamp(1.5rem, 4vw, 2rem);
}

.campaign-profile__badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.campaign-profile__badge--ativa {
  background: #dcfce7;
  color: #166534;
}

.campaign-profile__badge--encerrada {
  background: #f1f5f9;
  color: #475569;
}

.campaign-profile__meta {
  color: #475569;
  margin: 0 0 0.35rem;
}

.campaign-profile__section {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-soft);
  margin: 1.25rem 0;
}

.campaign-profile__section-title {
  margin: 0 0 0.6rem;
  color: var(--green-dark);
  font-size: 1.1rem;
}

.campaign-profile__description {
  margin: 0;
  line-height: 1.55;
  color: #334155;
  white-space: pre-line;
}

.campaign-profile__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 1rem 0;
}

.campaign-profile__back {
  display: inline-block;
  color: #64748b;
  font-size: 0.95rem;
}

.campaign-profile__back:hover {
  color: var(--orange-text);
}
```

- [ ] **Step 2: Criar `src/app/campanhas/[slug]/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCampaignBySlug } from '@/lib/queries/campanhas'
import './profile.css'

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export default async function CampaignProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const c = await getCampaignBySlug(slug)
  if (!c) notFound()

  return (
    <main className="page campaign-profile">
      <img src={c.bannerImage} alt="" className="campaign-profile__banner" />
      <span
        className={`campaign-profile__badge campaign-profile__badge--${c.status}`}
      >
        {c.status === 'ativa' ? 'Ativa' : 'Encerrada'}
      </span>
      <h1 className="campaign-profile__title">{c.title}</h1>
      <p className="campaign-profile__meta">
        📅 {dateFmt.format(c.startsAt)} – {dateFmt.format(c.endsAt)}
      </p>
      <p className="campaign-profile__meta">📍 {c.location}</p>
      <p className="campaign-profile__meta">🤝 {c.organizer}</p>

      <div className="campaign-profile__cta">
        {c.infoUrl && (
          <a
            href={c.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-orange"
          >
            Mais informações
          </a>
        )}
      </div>

      <section className="campaign-profile__section">
        <h2 className="campaign-profile__section-title">Sobre a campanha</h2>
        <p className="campaign-profile__description">{c.description}</p>
      </section>

      <Link href="/campanhas" className="campaign-profile__back">
        ← Voltar para campanhas
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Verificar**

```bash
npm run dev
```

```bash
curl -s http://localhost:3000/campanhas/vacinacao-gratuita-bm | grep -i "Sobre a campanha"
```

Expected: linha contendo "Sobre a campanha". Parar dev server.

- [ ] **Step 4: Commit**

```bash
git add "src/app/campanhas/[slug]/page.tsx" "src/app/campanhas/[slug]/profile.css"
git commit -m "feat(campanhas): add campaign detail page"
```

---

### Task 9: Página `/buscapet` — lista com filtro client-side

**Files:**
- Modify: `src/app/buscapet/page.tsx` (substitui EmBreve)
- Create: `src/app/buscapet/BuscaPetList.tsx`, `src/app/buscapet/buscapet.css`

- [ ] **Step 1: Criar `src/app/buscapet/buscapet.css`**

```css
.buscapet-page {
  position: relative;
}

.buscapet-hero {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem max(1rem, env(safe-area-inset-left)) 1rem
    max(1rem, env(safe-area-inset-right));
  text-align: center;
}

.buscapet-hero__title {
  margin: 0 0 0.4rem;
  color: var(--green-dark);
  font-size: clamp(1.45rem, 5vw, 2rem);
  font-weight: 800;
}

.buscapet-hero__text {
  margin: 0;
  color: #475569;
}

.buscapet-filter {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin: 1rem auto 1.5rem;
  flex-wrap: wrap;
  padding: 0 1rem;
}

.buscapet-filter__btn {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 2px solid var(--green-btn);
  background: var(--white);
  color: var(--green-btn);
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}

.buscapet-filter__btn--active {
  background: var(--green-btn);
  color: var(--white);
}

.buscapet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 max(1rem, env(safe-area-inset-left)) 2rem
    max(1rem, env(safe-area-inset-right));
}

.buscapet-card {
  display: flex;
  flex-direction: column;
  background: var(--white);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease;
}

.buscapet-card:hover {
  transform: translateY(-2px);
}

.buscapet-card--resolved {
  opacity: 0.6;
  filter: grayscale(0.3);
}

.buscapet-card__photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.buscapet-card__body {
  padding: 1rem 1.15rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.buscapet-card__badges {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.buscapet-card__badge {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.buscapet-card__badge--perdido {
  background: #fee2e2;
  color: #b91c1c;
}

.buscapet-card__badge--encontrado {
  background: #dcfce7;
  color: #166534;
}

.buscapet-card__badge--resolved {
  background: #e0e7ff;
  color: #3730a3;
}

.buscapet-card__title {
  margin: 0;
  color: var(--green-dark);
  font-size: 1.1rem;
}

.buscapet-card__loc {
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
}

.buscapet-card__btn {
  margin-top: auto;
  align-self: flex-start;
}

.buscapet-empty {
  text-align: center;
  color: #64748b;
  padding: 2rem;
  grid-column: 1 / -1;
}
```

- [ ] **Step 2: Criar `src/app/buscapet/BuscaPetList.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { BuscaPetPost } from '@prisma/client'

type Filter = 'todos' | 'perdido' | 'encontrado'

const speciesLabel: Record<string, string> = {
  cao: 'Cão',
  gato: 'Gato',
  outro: 'Outro',
}

export function BuscaPetList({ posts }: { posts: BuscaPetPost[] }) {
  const [filter, setFilter] = useState<Filter>('todos')

  const filtered = useMemo(() => {
    if (filter === 'todos') return posts
    return posts.filter((p) => p.type === filter)
  }, [filter, posts])

  return (
    <>
      <div className="buscapet-filter" role="group" aria-label="Filtrar por tipo">
        {(['todos', 'perdido', 'encontrado'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`buscapet-filter__btn${filter === f ? ' buscapet-filter__btn--active' : ''}`}
          >
            {f === 'todos' ? 'Todos' : f === 'perdido' ? 'Perdidos' : 'Encontrados'}
          </button>
        ))}
      </div>

      <section className="buscapet-grid" aria-label="Lista de posts">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/buscapet/${p.slug}`}
            className={`buscapet-card${p.resolvedAt ? ' buscapet-card--resolved' : ''}`}
          >
            <img src={p.photo} alt="" className="buscapet-card__photo" />
            <div className="buscapet-card__body">
              <div className="buscapet-card__badges">
                <span
                  className={`buscapet-card__badge buscapet-card__badge--${p.type}`}
                >
                  {p.type === 'perdido' ? 'Perdido' : 'Encontrado'}
                </span>
                {p.resolvedAt && (
                  <span className="buscapet-card__badge buscapet-card__badge--resolved">
                    Reconectado
                  </span>
                )}
              </div>
              <h2 className="buscapet-card__title">
                {p.petName ?? speciesLabel[p.species]}
              </h2>
              <p className="buscapet-card__loc">📍 {p.lastSeenLocation}</p>
              <span className="btn btn-green buscapet-card__btn">Ver detalhes</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="buscapet-empty">Nenhum post nessa categoria.</p>
        )}
      </section>
    </>
  )
}
```

- [ ] **Step 3: Substituir `src/app/buscapet/page.tsx`**

```tsx
import { getAllBuscaPetPosts } from '@/lib/queries/buscapet'
import { BuscaPetList } from './BuscaPetList'
import './buscapet.css'

export default async function BuscaPetPage() {
  const posts = await getAllBuscaPetPosts()

  return (
    <main className="page buscapet-page">
      <section className="buscapet-hero">
        <h1 className="buscapet-hero__title">BuscaPet</h1>
        <p className="buscapet-hero__text">
          Mural de pets perdidos e encontrados na região. Ajude a reconectar.
        </p>
      </section>

      <BuscaPetList posts={posts} />
    </main>
  )
}
```

- [ ] **Step 4: Verificar**

```bash
npm run dev
```

```bash
curl -s http://localhost:3000/buscapet | grep -i "Mural de pets"
```

Expected: linha contendo "Mural de pets". Parar dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/buscapet/page.tsx src/app/buscapet/BuscaPetList.tsx src/app/buscapet/buscapet.css
git commit -m "feat(buscapet): replace placeholder with lost/found list and filter"
```

---

### Task 10: Página `/buscapet/[slug]` — detalhe

**Files:**
- Create: `src/app/buscapet/[slug]/page.tsx`, `src/app/buscapet/[slug]/profile.css`

- [ ] **Step 1: Criar `src/app/buscapet/[slug]/profile.css`**

```css
.buscapet-profile {
  max-width: 880px;
  margin: 0 auto;
  padding: 1.5rem max(1rem, env(safe-area-inset-left)) 3rem
    max(1rem, env(safe-area-inset-right));
}

.buscapet-profile__hero {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 720px) {
  .buscapet-profile__hero {
    flex-direction: row;
  }
}

.buscapet-profile__photo {
  width: 100%;
  max-width: 360px;
  border-radius: var(--radius-lg);
  object-fit: cover;
  aspect-ratio: 1 / 1;
  box-shadow: var(--shadow-soft);
}

.buscapet-profile__info {
  flex: 1;
}

.buscapet-profile__badges {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}

.buscapet-profile__badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.buscapet-profile__badge--perdido {
  background: #fee2e2;
  color: #b91c1c;
}

.buscapet-profile__badge--encontrado {
  background: #dcfce7;
  color: #166534;
}

.buscapet-profile__badge--resolved {
  background: #e0e7ff;
  color: #3730a3;
}

.buscapet-profile__title {
  margin: 0 0 0.4rem;
  color: var(--green-dark);
  font-size: clamp(1.5rem, 4vw, 2rem);
}

.buscapet-profile__meta {
  margin: 0 0 0.35rem;
  color: #475569;
}

.buscapet-profile__contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.buscapet-profile__section {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-soft);
  margin: 1.25rem 0;
}

.buscapet-profile__section-title {
  margin: 0 0 0.6rem;
  color: var(--green-dark);
  font-size: 1.1rem;
}

.buscapet-profile__description {
  margin: 0;
  line-height: 1.55;
  color: #334155;
  white-space: pre-line;
}

.buscapet-profile__back {
  display: inline-block;
  color: #64748b;
  font-size: 0.95rem;
}

.buscapet-profile__back:hover {
  color: var(--orange-text);
}
```

- [ ] **Step 2: Criar `src/app/buscapet/[slug]/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBuscaPetPostBySlug } from '@/lib/queries/buscapet'
import { whatsappLink } from '@/lib/whatsapp'
import './profile.css'

const speciesLabel: Record<string, string> = {
  cao: 'Cão',
  gato: 'Gato',
  outro: 'Outro',
}

const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function BuscaPetProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const p = await getBuscaPetPostBySlug(slug)
  if (!p) notFound()

  const title = p.petName ?? `${speciesLabel[p.species]} ${p.type === 'perdido' ? 'perdido' : 'encontrado'}`

  return (
    <main className="page buscapet-profile">
      <div className="buscapet-profile__hero">
        <img src={p.photo} alt="" className="buscapet-profile__photo" />
        <div className="buscapet-profile__info">
          <div className="buscapet-profile__badges">
            <span
              className={`buscapet-profile__badge buscapet-profile__badge--${p.type}`}
            >
              {p.type === 'perdido' ? 'Perdido' : 'Encontrado'}
            </span>
            {p.resolvedAt && (
              <span className="buscapet-profile__badge buscapet-profile__badge--resolved">
                Reconectado
              </span>
            )}
          </div>
          <h1 className="buscapet-profile__title">{title}</h1>
          <p className="buscapet-profile__meta">
            🐾 {speciesLabel[p.species]}
          </p>
          <p className="buscapet-profile__meta">📍 {p.lastSeenLocation}</p>
          <p className="buscapet-profile__meta">
            🕒 Visto pela última vez em {dateTimeFmt.format(p.lastSeenAt)}
          </p>
          <div className="buscapet-profile__contacts">
            <a
              href={whatsappLink(p.contactPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-green"
            >
              💬 WhatsApp
            </a>
            <a href={`mailto:${p.contactEmail}`} className="btn btn-outline-green">
              E-mail
            </a>
          </div>
        </div>
      </div>

      <section className="buscapet-profile__section">
        <h2 className="buscapet-profile__section-title">Descrição</h2>
        <p className="buscapet-profile__description">{p.description}</p>
      </section>

      <Link href="/buscapet" className="buscapet-profile__back">
        ← Voltar para o mural
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Verificar**

```bash
npm run dev
```

```bash
curl -s http://localhost:3000/buscapet/perdido-bidu-bm-centro | grep -i "Visto pela última vez"
```

Expected: linha contendo "Visto pela última vez". Parar dev server.

- [ ] **Step 4: Commit**

```bash
git add "src/app/buscapet/[slug]/page.tsx" "src/app/buscapet/[slug]/profile.css"
git commit -m "feat(buscapet): add lost/found post detail page"
```

---

### Task 11: Build, type-check final e deploy

**Files:**
- (nenhum — só verificações)

- [ ] **Step 1: Type-check final**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build completa sem erros. As novas rotas aparecem no relatório:
- `○ /adocao` (static)
- `ƒ /adocao/[slug]` (dynamic)
- `○ /campanhas` (static)
- `ƒ /campanhas/[slug]` (dynamic)
- `○ /buscapet` (static)
- `ƒ /buscapet/[slug]` (dynamic)

- [ ] **Step 3: Testes**

```bash
npm test
```

Expected: 6/6 testes passando (não adicionamos testes novos — escopo é UI fetcher).

- [ ] **Step 4: Smoke test local**

```bash
npm run dev
```

Curl em outro terminal:
```bash
for path in /adocao /adocao/luna-2-anos /campanhas /campanhas/vacinacao-gratuita-bm /buscapet /buscapet/perdido-bidu-bm-centro; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$path)  $path"
done
```

Expected: 6 linhas com `200`. Parar dev server.

- [ ] **Step 5: Deploy production**

```bash
git push origin main
vercel --prod --yes
```

Expected: deploy completa, retorna URL `https://pet-stop-phi.vercel.app`.

- [ ] **Step 6: Smoke test produção**

```bash
URL="https://pet-stop-phi.vercel.app"
for path in /adocao /adocao/luna-2-anos /campanhas /campanhas/vacinacao-gratuita-bm /buscapet /buscapet/perdido-bidu-bm-centro; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 30 $URL$path)  $path"
done
```

Expected: 6 linhas com `200`.

- [ ] **Step 7: Confirmar EmBreve sumiu das 3 rotas**

```bash
grep -l "EmBreve" src/app/adocao src/app/campanhas src/app/buscapet 2>/dev/null
```

Expected: vazio (nenhuma referência a EmBreve nas 3 pastas).

---

## Critérios de sucesso (verificação final)

Ao terminar todas as tasks, confirmar:

- [ ] Migration aplicada no Neon (3 tabelas + 5 enums) e seed populado (6+4+5 itens).
- [ ] As 6 novas rotas respondem 200 em produção.
- [ ] `/adocao` lista 6 cards com foto + nome + espécie + idade + local.
- [ ] `/adocao/luna-2-anos` mostra detalhe com foto, descrição, WhatsApp + email.
- [ ] `/campanhas` mostra 4 cards (3 ativas + 1 encerrada esmaecida).
- [ ] `/campanhas/<slug>` mostra detalhe com banner, datas, botão "Mais informações" (se infoUrl).
- [ ] `/buscapet` lista 5 cards com badges Perdido/Encontrado, filtro toggle muda a lista.
- [ ] `/buscapet/<slug>` mostra detalhe com foto, "Visto pela última vez", WhatsApp + email.
- [ ] `src/lib/whatsapp.ts` é usado por `/babas/[id]`, `/adocao/[slug]`, `/buscapet/[slug]`.
- [ ] `grep -r "EmBreve" src/app/adocao src/app/campanhas src/app/buscapet` retorna vazio.
- [ ] `npm run build` passa.
- [ ] `npm test` passa.
