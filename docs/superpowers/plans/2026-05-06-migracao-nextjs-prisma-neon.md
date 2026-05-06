# Migração Vite → Next.js + Prisma + Neon — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar a SPA Pet Stop (Vite + React 19 + React Router) para Next.js 15 (App Router) com Prisma 6 + Neon Postgres e autenticação real via NextAuth v5, preservando todas as páginas/componentes e migrando os dados de demo do `mock.ts` para o banco via seed.

**Architecture:** Migração in-place no mesmo repo. Substituir Vite por Next.js mantendo `src/` como raiz, traduzindo rotas do React Router para o sistema de arquivos do App Router. Camada de dados via Prisma + adapter Neon serverless. Auth via NextAuth Credentials + JWT sessions. Detalhes em [`docs/superpowers/specs/2026-05-06-migracao-nextjs-prisma-neon-design.md`](../specs/2026-05-06-migracao-nextjs-prisma-neon-design.md).

**Tech Stack:** Next.js 15, React 19, TypeScript 5.9, Prisma 6, `@prisma/adapter-neon`, `@neondatabase/serverless`, NextAuth v5 (Auth.js), `bcryptjs`, Zod, Leaflet 1.9, react-leaflet 5, Vitest (validators), `tsx` (seed).

**Pré-requisitos do executor:**
- Node.js 18.18+ instalado
- `git` configurado
- Acesso a um banco Neon. **Antes de começar:** rotacionar a senha do Neon (a credencial original foi exposta em chat). Pegar duas connection strings no painel Neon: a "Pooler" (vai em `DATABASE_URL`) e a "Direct" (vai em `DIRECT_URL`).
- Criar `.env.local` na raiz com `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` (gerado com `openssl rand -base64 32`), `AUTH_URL=http://localhost:3000`, `SEED_ADMIN_PASSWORD=<senha forte>`.

---

## File Structure

Final state after this plan:

```
prisma/
  schema.prisma
  seed.ts
  seed-data.ts
  migrations/                    # gerado
src/
  app/
    layout.tsx
    page.tsx                     # Home
    globals.css                  # antiga src/index.css
    login/page.tsx
    login/actions.ts
    cadastro/page.tsx
    cadastro/actions.ts
    babas/page.tsx
    babas/[id]/page.tsx
    paradas-pets/page.tsx
    emergencia/page.tsx
    estabelecimento/[id]/page.tsx
    adocao/page.tsx
    campanhas/page.tsx
    buscapet/page.tsx
    api/auth/[...nextauth]/route.ts
  components/
    Navbar.tsx + Navbar.css
    Footer.tsx + Footer.css
    PetMap.tsx + PetMap.css      # 'use client'
    PetMapClient.tsx             # wrapper p/ next/dynamic ssr:false
    AdSlot.tsx + AdSlot.css
    BrandLogo.tsx
    StarRating.tsx + StarRating.css
    EmBreve.tsx + EmBreve.css    # antes era pages/EmBreve.tsx
  lib/
    prisma.ts
    auth.ts
    validators.ts
    queries/
      establishments.ts
      babas.ts
  types/
    next-auth.d.ts
middleware.ts
next.config.ts
tsconfig.json
next-env.d.ts                    # gerado
package.json
.env.local                       # NÃO comitado
.env.example                     # comitado
```

---

### Task 1: Limpar config do Vite e instalar Next.js

**Files:**
- Delete: `vite.config.ts`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`
- Modify: `package.json`, `.gitignore`
- Create: `next.config.ts`, `next-env.d.ts` será gerado pelo Next no primeiro run

- [ ] **Step 1: Remover dependências do Vite e adicionar Next.js**

```bash
npm uninstall vite @vitejs/plugin-react vite-plugin-pwa react-router-dom
npm install next@latest react@^19.0.0 react-dom@^19.0.0
npm install -D @types/node
```

Expected: `package.json` ganha `next`, perde `vite` e `react-router-dom`.

- [ ] **Step 2: Apagar arquivos do Vite**

```bash
rm vite.config.ts index.html src/main.tsx src/vite-env.d.ts
```

- [ ] **Step 3: Substituir scripts em `package.json`**

Substituir o bloco `"scripts"` por:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "postinstall": "prisma generate || true"
}
```

(O `|| true` no postinstall evita falha antes do schema existir; será removido depois da Task 11.)

- [ ] **Step 4: Criar `next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 5: Atualizar `.gitignore`**

Substituir conteúdo por:

```
# Logs
logs
*.log
npm-debug.log*

node_modules
.next
out

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.sw?

# Env
.env
.env.local
.env.*.local

.vercel
```

- [ ] **Step 6: Substituir `tsconfig.json` pelo preset Next**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove vite scaffold and install next.js 15"
```

---

### Task 2: Criar layout raiz e Home placeholder, validar Next.js sobe

**Files:**
- Delete: `src/App.tsx`, `src/index.css`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Mover CSS global**

```bash
mv src/index.css src/app/globals.css
```

(Conteúdo permanece igual ao [`src/index.css`](../../../src/index.css) original.)

- [ ] **Step 2: Criar `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pet Stop',
  description: 'Clínicas, pet shops, emergência veterinária e babás — Vale do Paraíba e Sul Fluminense.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Criar `src/app/page.tsx` placeholder**

```tsx
export default function Page() {
  return <main className="page"><h1>Pet Stop — em migração</h1></main>
}
```

- [ ] **Step 4: Apagar `src/App.tsx`**

```bash
rm src/App.tsx
```

- [ ] **Step 5: Rodar dev server e verificar**

```bash
npm run dev
```

Em outro terminal:

```bash
curl -s http://localhost:3000 | grep "em migração"
```

Expected: linha contendo "Pet Stop — em migração". Parar o dev server (Ctrl+C).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: bootstrap next.js app router with root layout"
```

---

### Task 3: Migrar componentes simples (sem dependências de roteamento)

**Files:**
- Modify: `src/components/Footer.tsx`, `src/components/BrandLogo.tsx`, `src/components/AdSlot.tsx`, `src/components/StarRating.tsx`

Esses componentes não usam `react-router-dom`. Os ajustes esperados são pequenos: adicionar `'use client'` apenas se houver `useState`/`useEffect`/handlers de evento.

- [ ] **Step 1: Inspecionar cada componente e classificar**

```bash
grep -l "useState\|useEffect\|onClick\|onChange" src/components/Footer.tsx src/components/BrandLogo.tsx src/components/AdSlot.tsx src/components/StarRating.tsx
```

- [ ] **Step 2: Para cada arquivo retornado pelo grep, adicionar `'use client'` na primeira linha (se ainda não tiver)**

Exemplo (`src/components/Footer.tsx`):

```tsx
'use client'

import './Footer.css'
// ... resto sem mudanças
```

- [ ] **Step 3: Substituir qualquer `<a href="/...">` interno por `<Link href="/...">` do `next/link`**

Em qualquer arquivo dos quatro acima que contenha `<a href="/`, trocar:

```tsx
// antes
<a href="/babas">Babás</a>

// depois
import Link from 'next/link'
<Link href="/babas">Babás</Link>
```

(Se nenhum tiver links internos, pular.)

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero erros nos arquivos editados (pode haver erros em outros arquivos ainda não migrados — anotar e continuar).

- [ ] **Step 5: Commit**

```bash
git add src/components/Footer.tsx src/components/BrandLogo.tsx src/components/AdSlot.tsx src/components/StarRating.tsx
git commit -m "refactor: prep simple components for next.js client/server boundary"
```

---

### Task 4: Migrar `Navbar` para Next.js

**Files:**
- Modify: `src/components/Navbar.tsx`

`Navbar` certamente usa `<Link>` do `react-router-dom` e provavelmente `useLocation` ou state.

- [ ] **Step 1: Adicionar `'use client'` no topo**

```tsx
'use client'
```

- [ ] **Step 2: Trocar imports**

```tsx
// remover
import { Link, NavLink, useLocation } from 'react-router-dom'

// adicionar
import Link from 'next/link'
import { usePathname } from 'next/navigation'
```

- [ ] **Step 3: Trocar `<Link to="...">` por `<Link href="...">`**

`replace_all` global no arquivo: `to=` → `href=` apenas dentro de `<Link` (verificar manualmente cada ocorrência).

- [ ] **Step 4: Substituir `useLocation()` por `usePathname()`**

```tsx
// antes
const { pathname } = useLocation()

// depois
const pathname = usePathname()
```

E qualquer `NavLink` vira `Link` + comparação manual:

```tsx
<Link
  href="/babas"
  className={pathname === '/babas' ? 'nav-link nav-link--active' : 'nav-link'}
>
  Babás
</Link>
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero erros em `src/components/Navbar.tsx`.

- [ ] **Step 6: Wire Navbar+Footer no layout**

Editar `src/app/layout.tsx` para envolver `children` com Navbar e Footer:

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Pet Stop',
  description: 'Clínicas, pet shops, emergência veterinária e babás — Vale do Paraíba e Sul Fluminense.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Verificar no browser**

```bash
npm run dev
```

Abrir `http://localhost:3000`. Confirmar visualmente:
- Navbar renderiza no topo
- Footer renderiza embaixo
- "Pet Stop — em migração" no meio
- Sem erros no console do browser
- Sem erros no terminal do Next

Parar dev server.

- [ ] **Step 8: Commit**

```bash
git add src/components/Navbar.tsx src/app/layout.tsx
git commit -m "feat: navbar + footer in root layout"
```

---

### Task 5: Migrar página `EmBreve` e as 3 rotas placeholder

**Files:**
- Move: `src/pages/EmBreve.tsx` → `src/components/EmBreve.tsx`
- Move: `src/pages/EmBreve.css` → `src/components/EmBreve.css`
- Create: `src/app/adocao/page.tsx`, `src/app/campanhas/page.tsx`, `src/app/buscapet/page.tsx`

- [ ] **Step 1: Mover EmBreve para `components/`**

```bash
mv src/pages/EmBreve.tsx src/components/EmBreve.tsx
mv src/pages/EmBreve.css src/components/EmBreve.css
```

- [ ] **Step 2: Verificar imports dentro de `EmBreve.tsx`**

```bash
grep -E "from \"\\.\\./.*\"|from '\\.\\./.*'" src/components/EmBreve.tsx
```

Para cada import com `../`, trocar pelo alias `@/`. Exemplo:
```tsx
// antes
import './EmBreve.css'   // OK, fica
import logo from '../assets/foo.png'  // trocar para '@/assets/foo.png' se existir
```

`'./EmBreve.css'` continua igual (mesmo diretório).

- [ ] **Step 3: Criar `src/app/adocao/page.tsx`**

```tsx
import { EmBreve } from '@/components/EmBreve'

export default function Page() {
  return <EmBreve title="Adoção" />
}
```

- [ ] **Step 4: Criar `src/app/campanhas/page.tsx`**

```tsx
import { EmBreve } from '@/components/EmBreve'

export default function Page() {
  return <EmBreve title="Campanhas" />
}
```

- [ ] **Step 5: Criar `src/app/buscapet/page.tsx`**

```tsx
import { EmBreve } from '@/components/EmBreve'

export default function Page() {
  return <EmBreve title="BuscaPet" />
}
```

- [ ] **Step 6: Verificar**

```bash
npm run dev
```

Em outro terminal:
```bash
curl -s http://localhost:3000/adocao | grep -i "adoção"
curl -s http://localhost:3000/campanhas | grep -i "campanhas"
curl -s http://localhost:3000/buscapet | grep -i "buscapet"
```

Expected: cada curl retorna pelo menos uma linha contendo o título. Parar dev server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: migrate placeholder pages (adocao, campanhas, buscapet)"
```

---

### Task 6: Migrar Home, Login, Cadastro (UI ainda mockada)

**Files:**
- Move: `src/pages/Home.tsx` → conteúdo vai para `src/app/page.tsx`
- Move: `src/pages/Home.css` → `src/app/home.css`
- Move: `src/pages/Login.tsx` → `src/app/login/page.tsx`
- Move: `src/pages/Cadastro.tsx` → `src/app/cadastro/page.tsx`
- Move: `src/pages/Auth.css` → `src/app/login/auth.css` (cópia também em `cadastro/`)

- [ ] **Step 1: Migrar Home**

Apagar a `src/app/page.tsx` placeholder. Criar nova com o conteúdo de `src/pages/Home.tsx`, ajustando:
- Trocar `import { Link } from 'react-router-dom'` por `import Link from 'next/link'`
- Trocar `to=` por `href=` em `<Link>`
- Trocar `import './Home.css'` por `import './home.css'` (e mover o CSS)

```bash
mv src/pages/Home.css src/app/home.css
```

Sobrescrever `src/app/page.tsx` com o conteúdo de `src/pages/Home.tsx` adaptado. Se Home tiver `useState`/`useEffect`, adicionar `'use client'` no topo. Caso contrário, deixar como Server Component.

```bash
rm src/pages/Home.tsx
```

- [ ] **Step 2: Migrar Login**

```bash
mkdir -p src/app/login
cp src/pages/Auth.css src/app/login/auth.css
```

Criar `src/app/login/page.tsx` com:

```tsx
'use client'

import Link from 'next/link'
import './auth.css'

export default function LoginPage() {
  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Entrar</h1>
        <p className="auth-card__lead">Acesse sua conta Pet Stop</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-label">
            E-mail
            <input type="email" name="email" className="auth-input" placeholder="seu@email.com" required />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" name="password" className="auth-input" placeholder="••••••••" required />
          </label>
          <button type="submit" className="btn btn-orange auth-submit">Entrar</button>
        </form>
        <p className="auth-footer">
          Não tem conta? <Link href="/cadastro">Cadastre-se</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
```

```bash
rm src/pages/Login.tsx
```

- [ ] **Step 3: Migrar Cadastro**

```bash
mkdir -p src/app/cadastro
cp src/pages/Auth.css src/app/cadastro/auth.css
```

Criar `src/app/cadastro/page.tsx` com:

```tsx
'use client'

import Link from 'next/link'
import './auth.css'

export default function CadastroPage() {
  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Cadastre-se</h1>
        <p className="auth-card__lead">Crie sua conta na Pet Stop</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-label">
            Nome
            <input type="text" name="name" className="auth-input" placeholder="Seu nome" required />
          </label>
          <label className="auth-label">
            E-mail
            <input type="email" name="email" className="auth-input" placeholder="seu@email.com" required />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" name="password" className="auth-input" placeholder="••••••••" required minLength={8} />
          </label>
          <button type="submit" className="btn btn-green auth-submit">Criar conta</button>
        </form>
        <p className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
```

```bash
rm src/pages/Cadastro.tsx src/pages/Auth.css
```

- [ ] **Step 4: Verificar**

```bash
npm run dev
```

Abrir no browser:
- `http://localhost:3000/` — home renderiza
- `http://localhost:3000/login` — form de login
- `http://localhost:3000/cadastro` — form de cadastro

Confirmar links cruzados funcionam (ex: clicar "Cadastre-se" no /login leva para /cadastro). Parar dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate home, login, cadastro pages"
```

---

### Task 7: Migrar Babas, BabaProfile, EstablishmentProfile

**Files:**
- Create: `src/app/babas/page.tsx`, `src/app/babas/[id]/page.tsx`, `src/app/estabelecimento/[id]/page.tsx`
- Move: `src/pages/Babas.css` → `src/app/babas/babas.css`
- Move: `src/pages/BabaProfile.css` → `src/app/babas/[id]/profile.css`
- Move: `src/pages/EstablishmentProfile.css` → `src/app/estabelecimento/[id]/profile.css`
- Delete: `src/pages/Babas.tsx`, `src/pages/BabaProfile.tsx`, `src/pages/EstablishmentProfile.tsx`

Estas páginas hoje importam `getBaba`, `getEstablishment`, `babas`, `establishments` de `src/data/mock.ts`. Por enquanto, manter o import de mock — Task 12 substitui por Prisma.

- [ ] **Step 1: Migrar `Babas`**

```bash
mkdir -p src/app/babas
mv src/pages/Babas.css src/app/babas/babas.css
```

Criar `src/app/babas/page.tsx` com base em `src/pages/Babas.tsx`:
- Trocar `import { Link } from 'react-router-dom'` por `import Link from 'next/link'`
- Trocar `to=` por `href=` em `<Link>`
- Trocar `import './Babas.css'` por `import './babas.css'`
- Trocar import de `../data/mock` por `@/data/mock`
- Manter como Server Component (sem `'use client'`) se possível

```bash
rm src/pages/Babas.tsx
```

- [ ] **Step 2: Migrar `BabaProfile`**

```bash
mkdir -p "src/app/babas/[id]"
mv src/pages/BabaProfile.css "src/app/babas/[id]/profile.css"
```

Criar `src/app/babas/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBaba } from '@/data/mock'
import './profile.css'
// ... outros imports usados pelo conteúdo original

export default async function BabaProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const baba = getBaba(id)
  if (!baba) notFound()

  // ... copiar JSX de src/pages/BabaProfile.tsx, adaptando:
  //   - useParams() → usar `id` acima
  //   - Link to=  → Link href=
  //   - imports relativos → alias @/
  return (
    <main className="page baba-profile">
      {/* JSX copiado e adaptado */}
    </main>
  )
}
```

```bash
rm src/pages/BabaProfile.tsx
```

- [ ] **Step 3: Migrar `EstablishmentProfile`**

```bash
mkdir -p "src/app/estabelecimento/[id]"
mv src/pages/EstablishmentProfile.css "src/app/estabelecimento/[id]/profile.css"
```

Criar `src/app/estabelecimento/[id]/page.tsx` com a mesma estratégia da Task 7 Step 2: Server Component que recebe `params`, chama `getEstablishment(id)`, chama `notFound()` se não achar, renderiza o JSX adaptado de `src/pages/EstablishmentProfile.tsx`.

```bash
rm src/pages/EstablishmentProfile.tsx
```

- [ ] **Step 4: Verificar**

```bash
npm run dev
```

Abrir no browser:
- `http://localhost:3000/babas` — lista
- `http://localhost:3000/babas/ana-silva` — perfil de uma babá
- `http://localhost:3000/estabelecimento/clinica-vet-bm` — perfil de estabelecimento

Confirmar renderização e parar dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: migrate baba and establishment profile pages"
```

---

### Task 8: Migrar `PetMap`, `ParadasPets` e `Emergencia` com `next/dynamic`

**Files:**
- Modify: `src/components/PetMap.tsx` (adicionar `'use client'`, substituir `react-router-dom`)
- Create: `src/components/PetMapClient.tsx`
- Create: `src/app/paradas-pets/page.tsx`, `src/app/emergencia/page.tsx`
- Move: `src/pages/ParadasPets.tsx` deletado, `src/pages/Emergencia.tsx` deletado

Leaflet acessa `window` na importação. Solução: PetMap fica `'use client'`, mas é importado pelas páginas via `next/dynamic({ ssr: false })`.

- [ ] **Step 1: Atualizar `src/components/PetMap.tsx`**

No topo, adicionar `'use client'`. Trocar `import { Link } from 'react-router-dom'` por `import Link from 'next/link'`. Trocar `to=` por `href=` em `<Link>`. Trocar import de `../data/mock` por `@/data/mock`. CSS de leaflet já é importado dentro do componente — mantém.

- [ ] **Step 2: Criar wrapper dinâmico `src/components/PetMapClient.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'

export const PetMapClient = dynamic(
  () => import('./PetMap').then((m) => m.PetMap),
  { ssr: false, loading: () => <div className="pet-map-loading">Carregando mapa…</div> },
)
```

- [ ] **Step 3: Criar `src/app/paradas-pets/page.tsx`**

```tsx
import { PetMapClient } from '@/components/PetMapClient'

export default function ParadasPetsPage() {
  return (
    <main className="page page--flush page--pet-map">
      <PetMapClient />
    </main>
  )
}
```

- [ ] **Step 4: Criar `src/app/emergencia/page.tsx`**

```tsx
import { PetMapClient } from '@/components/PetMapClient'

export default function EmergenciaPage() {
  return (
    <main className="page page--flush page--pet-map">
      <PetMapClient emergencyMode />
    </main>
  )
}
```

- [ ] **Step 5: Apagar arquivos antigos**

```bash
rm src/pages/ParadasPets.tsx src/pages/Emergencia.tsx
```

- [ ] **Step 6: Verificar mapa no browser**

```bash
npm run dev
```

Abrir no browser:
- `http://localhost:3000/paradas-pets` — confirmar mapa carrega, marcadores aparecem, filtros funcionam
- `http://localhost:3000/emergencia` — confirmar banner de emergência, mapa, popup com clínica mais próxima

Olhar o console do navegador: zero erros sobre `window is not defined`. Parar dev server.

- [ ] **Step 7: Limpar `src/pages/` se vazio**

```bash
[ -z "$(ls -A src/pages 2>/dev/null)" ] && rmdir src/pages || ls src/pages
```

(Se ainda houver arquivos, anotar e limpar manualmente.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: migrate map pages with dynamic import (ssr: false)"
```

---

### Task 9: Setup Prisma + Neon adapter

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`, `.env.example`
- Modify: `package.json` (remover `|| true` do postinstall)

- [ ] **Step 1: Instalar dependências**

```bash
npm install prisma @prisma/client @prisma/adapter-neon @neondatabase/serverless
npm install -D tsx
```

- [ ] **Step 2: Criar `prisma/schema.prisma` mínimo (validar conexão antes do schema completo)**

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
```

- [ ] **Step 3: Criar `.env.example` (comitado)**

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.NEON_REGION.aws.neon.tech/DB?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST.NEON_REGION.aws.neon.tech/DB?sslmode=require"
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
SEED_ADMIN_PASSWORD="define-a-strong-password"
```

- [ ] **Step 4: Confirmar `.env.local` existe e tem todas as 5 variáveis** (criado pelo executor antes de começar; se não existir, criar agora a partir de `.env.example`)

```bash
test -f .env.local && grep -E "DATABASE_URL|DIRECT_URL|AUTH_SECRET|AUTH_URL|SEED_ADMIN_PASSWORD" .env.local | wc -l
```

Expected: `5`. Se menor, parar e completar o `.env.local` antes de prosseguir.

- [ ] **Step 5: Validar conexão Neon**

```bash
npx prisma db pull --force --print 2>&1 | head -5
```

Expected: saída sem erro de "Can't reach database server" (pode reclamar de schema vazio — OK). Se houver erro de conexão, abortar e corrigir credenciais.

- [ ] **Step 6: Criar `src/lib/prisma.ts`**

```ts
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function makeClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaNeon(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.prisma ?? makeClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
```

- [ ] **Step 7: Remover `|| true` do postinstall em `package.json`**

```json
"postinstall": "prisma generate"
```

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts .env.example package.json package-lock.json
git commit -m "feat: setup prisma with neon serverless adapter"
```

---

### Task 10: Schema completo + primeira migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Substituir `prisma/schema.prisma` pelo schema completo**

(Conteúdo idêntico ao da seção "Schema Prisma" do spec — colar bloco completo definido em [`docs/superpowers/specs/2026-05-06-migracao-nextjs-prisma-neon-design.md`](../specs/2026-05-06-migracao-nextjs-prisma-neon-design.md), modelos `User`, `Account`, `Session`, `VerificationToken`, `Establishment`, `Professional`, `SamplePrice`, `Baba`, `Review`, e enums `Role`, `EstablishmentType`, `PublicPrivate`.)

- [ ] **Step 2: Rodar a primeira migration**

```bash
npx prisma migrate dev --name init
```

Expected: Prisma cria `prisma/migrations/<timestamp>_init/migration.sql`, aplica no Neon, gera o client. Sem erros.

- [ ] **Step 3: Verificar com `prisma studio` (opcional, manual)**

```bash
npx prisma studio
```

Confirmar 9 modelos visíveis vazios. Fechar (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: prisma schema with users, establishments, babas, reviews"
```

---

### Task 11: Mover mock para `prisma/seed-data.ts` + escrever seed

**Files:**
- Move: `src/data/mock.ts` → `prisma/seed-data.ts`
- Create: `prisma/seed.ts`
- Modify: `package.json` (config `prisma.seed`)

- [ ] **Step 1: Mover arquivo de dados**

```bash
mv src/data/mock.ts prisma/seed-data.ts
rmdir src/data 2>/dev/null || true
```

- [ ] **Step 2: Limpar helpers React do `seed-data.ts`**

Editar `prisma/seed-data.ts`: manter apenas `EstablishmentType`, `Review`, `Establishment`, `Baba` types; manter as constantes `establishments` e `babas`; **remover** `getEstablishment`, `getBaba`, `defaultMapCenter` (esses devem ir para `src/lib/queries/`).

- [ ] **Step 3: Criar `src/lib/queries/establishments.ts`**

```ts
import { prisma } from '@/lib/prisma'

export const defaultMapCenter: [number, number] = [-22.41, -44.12]

export async function getAllEstablishments() {
  return prisma.establishment.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getEstablishmentBySlug(slug: string) {
  return prisma.establishment.findUnique({
    where: { slug },
    include: {
      professionals: true,
      samplePrices: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
}
```

- [ ] **Step 4: Criar `src/lib/queries/babas.ts`**

```ts
import { prisma } from '@/lib/prisma'

export async function getAllBabas() {
  return prisma.baba.findMany({ orderBy: { name: 'asc' } })
}

export async function getBabaBySlug(slug: string) {
  return prisma.baba.findUnique({
    where: { slug },
    include: { reviews: { orderBy: { createdAt: 'desc' } } },
  })
}
```

- [ ] **Step 5: Criar `prisma/seed.ts`**

```ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { establishments, babas } from './seed-data'

const prisma = new PrismaClient()

async function main() {
  for (const e of establishments) {
    await prisma.establishment.upsert({
      where: { slug: e.id },
      create: {
        slug: e.id,
        type: e.type,
        name: e.name,
        lat: e.lat,
        lng: e.lng,
        address: e.address,
        phone: e.phone,
        email: e.email,
        rating: e.rating,
        bannerImage: e.bannerImage,
        logoImage: e.logoImage,
        publicPrivate: e.publicPrivate,
        about: e.about,
        plans: e.plans ?? [],
        exams: e.exams ?? [],
        vaccines: e.vaccines ?? [],
        medications: e.medications ?? [],
        shopServices: e.shopServices ?? [],
        galleryImages: e.galleryImages ?? [],
        professionals: { create: (e.professionals ?? []).map((p) => ({ name: p.name, specialty: p.specialty })) },
        samplePrices: { create: (e.samplePrices ?? []).map((s) => ({ item: s.item, price: s.price })) },
        reviews: {
          create: (e.testimonials ?? []).map((r) => ({
            authorName: r.author,
            rating: r.rating,
            text: r.text,
          })),
        },
      },
      update: {
        type: e.type,
        name: e.name,
        lat: e.lat,
        lng: e.lng,
        address: e.address,
        phone: e.phone,
        email: e.email,
        rating: e.rating,
        bannerImage: e.bannerImage,
        logoImage: e.logoImage,
        publicPrivate: e.publicPrivate,
        about: e.about,
        plans: e.plans ?? [],
        exams: e.exams ?? [],
        vaccines: e.vaccines ?? [],
        medications: e.medications ?? [],
        shopServices: e.shopServices ?? [],
        galleryImages: e.galleryImages ?? [],
      },
    })
  }

  for (const b of babas) {
    await prisma.baba.upsert({
      where: { slug: b.id },
      create: {
        slug: b.id,
        name: b.name,
        photo: b.photo,
        rating: b.rating,
        reviewCount: b.reviewCount,
        location: b.location,
        phone: b.phone,
        email: b.email,
        bio: b.bio,
        reviews: {
          create: b.reviews.map((r) => ({
            authorName: r.author,
            rating: r.rating,
            text: r.text,
          })),
        },
      },
      update: {
        name: b.name,
        photo: b.photo,
        rating: b.rating,
        reviewCount: b.reviewCount,
        location: b.location,
        phone: b.phone,
        email: b.email,
        bio: b.bio,
      },
    })
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminPassword) {
    console.warn('[seed] SEED_ADMIN_PASSWORD não definida — pulando criação de admin demo')
  } else {
    await prisma.user.upsert({
      where: { email: 'admin@petstop.local' },
      create: {
        email: 'admin@petstop.local',
        name: 'Admin Demo',
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: 'ADMIN',
      },
      update: {
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    })
  }

  console.log('Seed concluído.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 6: Instalar `bcryptjs`**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 7: Configurar `prisma.seed` em `package.json`**

Adicionar (no topo do JSON, depois de `"scripts"`):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 8: Rodar seed**

```bash
npx prisma db seed
```

Expected: log `Seed concluído.` sem erros.

- [ ] **Step 9: Verificar contagem no banco**

```bash
npx prisma studio
```

Confirmar manualmente: 13 establishments, 3 babas, 1 user (admin@petstop.local). Fechar.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: seed neon db with mock establishments, babas, admin user"
```

---

### Task 12: Substituir uso de mock por queries Prisma nas páginas

**Files:**
- Modify: `src/app/babas/page.tsx`, `src/app/babas/[id]/page.tsx`, `src/app/estabelecimento/[id]/page.tsx`, `src/app/page.tsx` (se Home usar dados), `src/components/PetMap.tsx`

- [ ] **Step 1: `app/babas/page.tsx` busca do banco**

Substituir o conteúdo do arquivo. A estrutura é: Server Component → `await getAllBabas()` → renderiza grid de cards. Cada card tem `<Link href={`/babas/${b.slug}`}>` (não mais `b.id`). Manter exatamente as mesmas classes CSS que existiam em `src/pages/Babas.tsx`:

```tsx
import Link from 'next/link'
import { getAllBabas } from '@/lib/queries/babas'
import './babas.css'

export default async function BabasPage() {
  const babas = await getAllBabas()

  return (
    <main className="page babas-page">
      <header className="babas-page__header">
        <h1>Babás Pet</h1>
        <p>Profissionais para cuidar do seu pet quando você não está.</p>
      </header>
      <div className="babas-grid">
        {babas.map((b) => (
          <Link key={b.id} href={`/babas/${b.slug}`} className="baba-card">
            <img className="baba-card__photo" src={b.photo} alt={b.name} />
            <div className="baba-card__body">
              <h2 className="baba-card__name">{b.name}</h2>
              <p className="baba-card__location">{b.location}</p>
              <p className="baba-card__rating">⭐ {b.rating.toFixed(1)} ({b.reviewCount})</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

Nota: se a versão original em `src/pages/Babas.tsx` usar classes ou estrutura diferentes (ex: `<StarRating>`), substituir pelas referências corretas vistas naquele arquivo. O JSX acima é o esqueleto mínimo — preservar elementos visuais existentes.

- [ ] **Step 2: `app/babas/[id]/page.tsx` busca por slug**

```tsx
import { notFound } from 'next/navigation'
import { getBabaBySlug } from '@/lib/queries/babas'

export default async function BabaProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const baba = await getBabaBySlug(id)
  if (!baba) notFound()
  // resto: trocar referências `baba.reviews` etc. — schema Prisma já tem os mesmos nomes
}
```

Nota: o param é o `slug` (mantém compatibilidade com URLs antigas tipo `/babas/ana-silva`).

- [ ] **Step 3: `app/estabelecimento/[id]/page.tsx` busca por slug**

```tsx
import { notFound } from 'next/navigation'
import { getEstablishmentBySlug } from '@/lib/queries/establishments'

export default async function EstablishmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const e = await getEstablishmentBySlug(id)
  if (!e) notFound()
  // adaptar JSX existente
}
```

- [ ] **Step 4: Adaptar `PetMap` para receber dados via props (não importar do mock)**

Editar `src/components/PetMap.tsx`:

- Remover `import { defaultMapCenter, establishments, type Establishment, type EstablishmentType } from '@/data/mock'`
- Importar tipos do Prisma:
  ```tsx
  import type { Establishment, EstablishmentType } from '@prisma/client'
  ```
- Aceitar `establishments` e `defaultMapCenter` como props:
  ```tsx
  type Props = {
    emergencyMode?: boolean
    establishments: Establishment[]
    defaultMapCenter: [number, number]
  }
  export function PetMap({ emergencyMode = false, establishments, defaultMapCenter }: Props) { ... }
  ```
- No `<Link href={`/estabelecimento/${selected.id}`}>`, trocar para `selected.slug`.

- [ ] **Step 5: Atualizar `PetMapClient` para repassar props**

```tsx
'use client'

import dynamic from 'next/dynamic'
import type { Establishment } from '@prisma/client'

type Props = {
  emergencyMode?: boolean
  establishments: Establishment[]
  defaultMapCenter: [number, number]
}

const PetMapInner = dynamic(() => import('./PetMap').then((m) => m.PetMap), {
  ssr: false,
  loading: () => <div className="pet-map-loading">Carregando mapa…</div>,
})

export function PetMapClient(props: Props) {
  return <PetMapInner {...props} />
}
```

- [ ] **Step 6: Páginas do mapa buscam dados antes**

`src/app/paradas-pets/page.tsx`:

```tsx
import { PetMapClient } from '@/components/PetMapClient'
import { getAllEstablishments, defaultMapCenter } from '@/lib/queries/establishments'

export default async function ParadasPetsPage() {
  const establishments = await getAllEstablishments()
  return (
    <main className="page page--flush page--pet-map">
      <PetMapClient establishments={establishments} defaultMapCenter={defaultMapCenter} />
    </main>
  )
}
```

`src/app/emergencia/page.tsx`:

```tsx
import { PetMapClient } from '@/components/PetMapClient'
import { getAllEstablishments, defaultMapCenter } from '@/lib/queries/establishments'

export default async function EmergenciaPage() {
  const establishments = await getAllEstablishments()
  return (
    <main className="page page--flush page--pet-map">
      <PetMapClient emergencyMode establishments={establishments} defaultMapCenter={defaultMapCenter} />
    </main>
  )
}
```

- [ ] **Step 7: Adaptar Home se usa dados**

Se `src/app/page.tsx` lê `establishments` ou `babas`, trocar para `await getAllEstablishments()` / `await getAllBabas()` no Server Component.

- [ ] **Step 8: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 9: Verificar no browser**

```bash
npm run dev
```

Testar todas as rotas que dependem de dados:
- `/` (se usar dados)
- `/babas` e `/babas/ana-silva`
- `/estabelecimento/clinica-vet-bm`
- `/paradas-pets` (mapa com 13 marcadores)
- `/emergencia` (banner + clínica mais próxima)

Console do browser sem erros. Parar dev server.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: replace mock imports with prisma queries"
```

---

### Task 13: Validators (Zod) com testes unitários

**Files:**
- Create: `src/lib/validators.ts`, `src/lib/validators.test.ts`, `vitest.config.ts`

- [ ] **Step 1: Instalar Zod e Vitest**

```bash
npm install zod
npm install -D vitest
```

- [ ] **Step 2: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
})
```

- [ ] **Step 3: Adicionar script de teste em `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Escrever testes que falham**

`src/lib/validators.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { registerSchema, loginSchema } from './validators'

describe('registerSchema', () => {
  it('aceita payload válido', () => {
    const r = registerSchema.safeParse({ name: 'Ana', email: 'a@b.com', password: 'secret12' })
    expect(r.success).toBe(true)
  })

  it('rejeita senha curta', () => {
    const r = registerSchema.safeParse({ name: 'Ana', email: 'a@b.com', password: 'short' })
    expect(r.success).toBe(false)
  })

  it('rejeita email inválido', () => {
    const r = registerSchema.safeParse({ name: 'Ana', email: 'not-email', password: 'secret12' })
    expect(r.success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    const r = registerSchema.safeParse({ name: '', email: 'a@b.com', password: 'secret12' })
    expect(r.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('aceita payload válido', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'secret12' })
    expect(r.success).toBe(true)
  })

  it('rejeita senha curta', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '1' })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 5: Rodar para confirmar falha**

```bash
npm test
```

Expected: FAIL, módulo não encontrado.

- [ ] **Step 6: Implementar `src/lib/validators.ts`**

```ts
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

- [ ] **Step 7: Rodar testes**

```bash
npm test
```

Expected: PASS, 6 testes verdes.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: zod validators with unit tests"
```

---

### Task 14: Setup NextAuth (config, route handler, types)

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`, `middleware.ts`

- [ ] **Step 1: Instalar NextAuth**

```bash
npm install next-auth@beta @auth/prisma-adapter
```

- [ ] **Step 2: Criar `src/types/next-auth.d.ts`**

```ts
import type { Role } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: Role
  }
}
```

- [ ] **Step 3: Criar `src/lib/auth.ts`**

```ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validators'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return { id: user.id, email: user.email, name: user.name ?? undefined, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role?: typeof token.role }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id
      if (token.role) session.user.role = token.role
      return session
    },
  },
})
```

- [ ] **Step 4: Criar `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 5: Criar `middleware.ts` placeholder**

```ts
import { auth } from '@/lib/auth'

export default auth((req) => {
  // No MVP, sem rotas protegidas. Manter estrutura para futuro.
  return undefined
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 7: Verificar route handler responde**

```bash
npm run dev
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/providers
```

Expected: `200`. Parar dev server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: nextauth credentials provider with prisma adapter"
```

---

### Task 15: Server actions de cadastro e login + integrar nos forms

**Files:**
- Create: `src/app/cadastro/actions.ts`, `src/app/login/actions.ts`
- Modify: `src/app/cadastro/page.tsx`, `src/app/login/page.tsx`

- [ ] **Step 1: Criar `src/app/cadastro/actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'

export type RegisterState = { error?: string }

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email já cadastrado' }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, passwordHash, role: 'CUSTOMER' },
  })

  await signIn('credentials', { email, password, redirect: false })
  redirect('/')
}
```

- [ ] **Step 2: Criar `src/app/login/actions.ts`**

```ts
'use server'

import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: 'Email ou senha inválidos' }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch {
    return { error: 'Email ou senha inválidos' }
  }

  redirect('/')
}
```

- [ ] **Step 3: Atualizar `src/app/cadastro/page.tsx` para usar `useActionState`**

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { register, type RegisterState } from './actions'
import './auth.css'

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, {})

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Cadastre-se</h1>
        <p className="auth-card__lead">Crie sua conta na Pet Stop</p>
        <form className="auth-form" action={formAction}>
          <label className="auth-label">
            Nome
            <input type="text" name="name" className="auth-input" placeholder="Seu nome" required />
          </label>
          <label className="auth-label">
            E-mail
            <input type="email" name="email" className="auth-input" placeholder="seu@email.com" required />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" name="password" className="auth-input" placeholder="••••••••" required minLength={8} />
          </label>
          {state.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button type="submit" className="btn btn-green auth-submit" disabled={pending}>
            {pending ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
        <p className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Atualizar `src/app/login/page.tsx` analogamente**

```tsx
'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, type LoginState } from './actions'
import './auth.css'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Entrar</h1>
        <p className="auth-card__lead">Acesse sua conta Pet Stop</p>
        <form className="auth-form" action={formAction}>
          <label className="auth-label">
            E-mail
            <input type="email" name="email" className="auth-input" placeholder="seu@email.com" required />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" name="password" className="auth-input" placeholder="••••••••" required minLength={8} />
          </label>
          {state.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button type="submit" className="btn btn-orange auth-submit" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="auth-footer">
          Não tem conta? <Link href="/cadastro">Cadastre-se</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Adicionar regra CSS para `.auth-error`**

Anexar ao final dos dois `auth.css` (em `src/app/login/` e `src/app/cadastro/`):

```css
.auth-error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}
```

- [ ] **Step 6: Smoke test E2E manual**

```bash
npm run dev
```

No browser:
1. Ir para `/cadastro`. Cadastrar `teste@local` / `secret123`. Esperado: redireciona para `/` e cria user no banco.
2. Verificar via `npx prisma studio` (em outro terminal) que o user existe com `passwordHash` preenchido.
3. Logout não está implementado ainda — limpar cookies manualmente no DevTools.
4. Ir para `/login`. Logar com `teste@local` / `secret123`. Esperado: redireciona para `/`.
5. Tentar `/login` com senha errada. Esperado: mensagem "Email ou senha inválidos".
6. Tentar `/cadastro` com email já existente. Esperado: mensagem "Email já cadastrado".

Parar dev server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: register and login server actions with nextauth"
```

---

### Task 16: Build verification e prep para deploy Vercel

**Files:**
- Modify: `package.json` (script `db:migrate`), `README.md`

- [ ] **Step 1: Adicionar script `db:migrate`**

Em `package.json`, dentro de `"scripts"`:

```json
"db:migrate": "prisma migrate deploy",
"db:seed": "prisma db seed"
```

- [ ] **Step 2: Atualizar `README.md`**

Substituir o conteúdo por:

```md
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
```

- [ ] **Step 3: Build de produção**

```bash
npm run build
```

Expected: build completa sem erros. Avisos sobre Edge runtime para auth são esperados se houver — não bloqueiam.

- [ ] **Step 4: Smoke test do build**

```bash
npm start
```

Em outro terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/babas
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/login
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/providers
```

Expected: todos `200`. Parar com Ctrl+C.

- [ ] **Step 5: Rodar testes uma última vez**

```bash
npm test
```

Expected: todos os testes passam.

- [ ] **Step 6: Type-check final**

```bash
npx tsc --noEmit
```

Expected: zero erros.

- [ ] **Step 7: Commit final**

```bash
git add -A
git commit -m "chore: build verification and deploy docs"
```

---

## Critérios de sucesso (verificação final)

Ao terminar todas as tasks, confirmar:

- [ ] `npm run dev` sobe sem erros, todas as rotas respondem (`/`, `/login`, `/cadastro`, `/babas`, `/babas/<slug>`, `/estabelecimento/<slug>`, `/paradas-pets`, `/emergencia`, `/adocao`, `/campanhas`, `/buscapet`).
- [ ] Mapa renderiza nas duas páginas com 13 marcadores (sem `window is not defined`).
- [ ] `/babas/ana-silva` e `/estabelecimento/clinica-vet-bm` (slugs antigos preservados) funcionam.
- [ ] Cadastro cria User real no banco com `passwordHash`. Login autentica. Senha errada mostra erro.
- [ ] `npm run build` passa sem erros de tipo.
- [ ] `npm test` passa.
- [ ] `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/data/`, `src/pages/` não existem mais.
- [ ] `react-router-dom` não aparece em `package.json` nem em nenhum `import` (`grep -r "react-router-dom" src/` retorna vazio).
- [ ] Senha do Neon foi rotacionada antes de qualquer push para repo público / deploy.
