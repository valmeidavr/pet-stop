# Cadastro Fase 2 — Área da babá (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma babá logada preenche seu perfil (foto, nome, contato, endereço por CEP, breve descrição e quais animais cuida) numa área protegida, e esse perfil — vinculado ao usuário — aparece em `/babas`.

**Architecture:** Migração do `Baba` com endereço estruturado + `animalsCared`. Helpers puros (ViaCEP, slug) e schema Zod, todos testáveis. Área logada `/painel` protegida por papel, com editor da babá que faz `upsert` do `Baba` com `ownerId = session.user.id`. Upload de foto via Vercel Blob entra por último (precisa conectar o store ao projeto).

**Tech Stack:** Next.js 16 (App Router, Server Actions, route handlers), React 19, Prisma 6 (Neon), Zod v4, next-auth v5, `@vercel/blob`, vitest. Gerenciador: **npm**.

## Global Constraints

- Todo texto de UI em **português (PT-BR)**.
- Testes com **vitest**; rodar com `npm run test`.
- Um papel por conta (campo `Role` já existe). Papéis: `CUSTOMER`, `BABA`, `ESTABLISHMENT_OWNER`, `ADMIN`.
- Publicação imediata: ao salvar, o perfil já aparece em `/babas` (sem moderação).
- `/babas` é lista (sem mapa) → a babá **não** precisa de coordenadas.
- UF em `<select>` com as 27 unidades federativas.
- Foto via **Vercel Blob** (`@vercel/blob`, `BLOB_READ_WRITE_TOKEN`). O store `pet-stop-fotos` já foi criado; falta conectá-lo ao projeto `pet-stop` no dashboard (Task 10).
- Migração não pode quebrar linhas existentes: novos campos são opcionais/têm default.

## File Structure

- `prisma/schema.prisma` — campos novos no `Baba` (Task 1).
- `src/lib/address/viacep.ts` (+ teste) — busca de CEP (Task 2).
- `src/lib/address/ufs.ts` — lista de UFs para o `<select>` (Task 2).
- `src/lib/slug.ts` (+ teste) — geração de slug único (Task 3).
- `src/lib/validators.ts` — `babaProfileSchema` (Task 4).
- `src/lib/session.ts` — helper `requireRole` (Task 5).
- `src/app/painel/page.tsx`, `src/app/painel/painel.css` — landing do painel (Task 5).
- `src/app/cadastro/actions.ts` — redirecionar por papel (Task 6).
- `src/components/CepAddressFields.tsx` — campos de endereço compartilhados (Task 7).
- `src/app/painel/perfil-baba/page.tsx`, `actions.ts`, `BabaProfileForm.tsx`, `perfil-baba.css` — editor (Task 8).
- `src/lib/queries/babas.ts` — incluir busca por owner (Task 8).
- `src/app/babas/[id]/page.tsx` — exibir `animalsCared` + endereço (Task 9).
- `src/components/PhotoUpload.tsx`, `src/app/api/upload/route.ts` — upload Blob (Task 10).

---

### Task 1: Migração do `Baba` (endereço + animais cuidados)

**Files:**
- Modify: `prisma/schema.prisma:134-152` (model `Baba`)

**Interfaces:**
- Produces: campos novos no `Baba`: `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `animalsCared` — todos `String` com default `""` (não quebram linhas existentes).

- [ ] **Step 1: Editar o model `Baba`**

Adicionar, logo após o campo `bio String` (linha 144), antes de `ownerId`:

```prisma
  cep          String  @default("")
  logradouro   String  @default("")
  numero       String  @default("")
  complemento  String  @default("")
  bairro       String  @default("")
  cidade       String  @default("")
  estado       String  @default("")
  animalsCared String  @default("")
```

- [ ] **Step 2: Criar e aplicar a migração**

Run: `npx prisma migrate dev --name baba_endereco_animais`
Expected: cria `prisma/migrations/<timestamp>_baba_endereco_animais/` e aplica; "Your database is now in sync". Regenera o client.

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0 (o tipo `Baba` do Prisma agora tem os campos novos).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(baba): endereço estruturado e animais cuidados no schema"
```

---

### Task 2: Helper ViaCEP + lista de UFs

**Files:**
- Create: `src/lib/address/viacep.ts`
- Create: `src/lib/address/ufs.ts`
- Test: `src/lib/address/viacep.test.ts`

**Interfaces:**
- Produces:
  - `type CepResult = { logradouro: string; bairro: string; cidade: string; uf: string }`
  - `function parseViaCep(json: unknown): CepResult | null` — `null` se `{ erro: true }` ou formato inesperado.
  - `function normalizeCep(cep: string): string` — só dígitos, 8 chars (ex.: "27330-000" → "27330000").
  - `async function lookupCep(cep: string): Promise<CepResult | null>` — chama `https://viacep.com.br/ws/<cep>/json/`, usa `parseViaCep`; retorna `null` em erro de rede ou CEP inválido.
  - `ufs.ts`: `const UFS: readonly string[]` com as 27 siglas.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// src/lib/address/viacep.test.ts
import { describe, expect, it } from 'vitest'
import { parseViaCep, normalizeCep } from './viacep'

describe('normalizeCep', () => {
  it('remove máscara e mantém 8 dígitos', () => {
    expect(normalizeCep('27330-000')).toBe('27330000')
  })
  it('remove letras e espaços', () => {
    expect(normalizeCep(' 27.330-000 ')).toBe('27330000')
  })
})

describe('parseViaCep', () => {
  it('mapeia resposta válida', () => {
    const json = {
      logradouro: 'Rua A',
      bairro: 'Centro',
      localidade: 'Barra Mansa',
      uf: 'RJ',
    }
    expect(parseViaCep(json)).toEqual({
      logradouro: 'Rua A',
      bairro: 'Centro',
      cidade: 'Barra Mansa',
      uf: 'RJ',
    })
  })
  it('retorna null quando { erro: true }', () => {
    expect(parseViaCep({ erro: true })).toBeNull()
  })
  it('retorna null para formato inesperado', () => {
    expect(parseViaCep('nope')).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- src/lib/address/viacep.test.ts`
Expected: FAIL ("Cannot find module './viacep'").

- [ ] **Step 3: Implementar**

```ts
// src/lib/address/viacep.ts
export type CepResult = {
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '').slice(0, 8)
}

export function parseViaCep(json: unknown): CepResult | null {
  if (!json || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  if (o.erro) return null
  if (typeof o.localidade !== 'string' || typeof o.uf !== 'string') return null
  return {
    logradouro: typeof o.logradouro === 'string' ? o.logradouro : '',
    bairro: typeof o.bairro === 'string' ? o.bairro : '',
    cidade: o.localidade,
    uf: o.uf,
  }
}

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const c = normalizeCep(cep)
  if (c.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${c}/json/`)
    if (!res.ok) return null
    return parseViaCep(await res.json())
  } catch {
    return null
  }
}
```

```ts
// src/lib/address/ufs.ts
export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- src/lib/address/viacep.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/address/viacep.ts src/lib/address/ufs.ts src/lib/address/viacep.test.ts
git commit -m "feat(endereco): helper ViaCEP e lista de UFs"
```

---

### Task 3: Helper de slug único

**Files:**
- Create: `src/lib/slug.ts`
- Test: `src/lib/slug.test.ts`

**Interfaces:**
- Produces:
  - `function slugify(text: string): string` — minúsculas, sem acento, espaços→`-`, só `[a-z0-9-]`.
  - `async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string>` — anexa `-2`, `-3`… até `exists` retornar `false`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// src/lib/slug.test.ts
import { describe, expect, it } from 'vitest'
import { slugify, uniqueSlug } from './slug'

describe('slugify', () => {
  it('normaliza acentos e espaços', () => {
    expect(slugify('Ana São João')).toBe('ana-sao-joao')
  })
  it('remove símbolos', () => {
    expect(slugify('Maria & Cia!!')).toBe('maria-cia')
  })
})

describe('uniqueSlug', () => {
  it('retorna o base quando livre', async () => {
    const r = await uniqueSlug('ana', async () => false)
    expect(r).toBe('ana')
  })
  it('incrementa quando ocupado', async () => {
    const taken = new Set(['ana', 'ana-2'])
    const r = await uniqueSlug('ana', async (s) => taken.has(s))
    expect(r).toBe('ana-3')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- src/lib/slug.test.ts`
Expected: FAIL ("Cannot find module './slug'").

- [ ] **Step 3: Implementar**

```ts
// src/lib/slug.ts
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'perfil'
  let candidate = root
  let n = 1
  while (await exists(candidate)) {
    n++
    candidate = `${root}-${n}`
  }
  return candidate
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- src/lib/slug.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts src/lib/slug.test.ts
git commit -m "feat(slug): helpers slugify e uniqueSlug"
```

---

### Task 4: Schema Zod do perfil da babá

**Files:**
- Modify: `src/lib/validators.ts` (adicionar ao final, antes dos exports de tipo)
- Test: `src/lib/validators.test.ts` (adicionar bloco)

**Interfaces:**
- Produces:
  - `babaProfileSchema` exige `name` (1..100), `phone` (>=8), `email` (email), `bio` (1..1000), `animalsCared` (1..2000), `cep`, `logradouro`, `numero`, `bairro`, `cidade`, `estado` (todos string >=1, exceto `complemento` opcional default `''`), `photo` (string, opcional default `''`).
  - `type BabaProfileInput = z.infer<typeof babaProfileSchema>`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// adicionar em src/lib/validators.test.ts
import { babaProfileSchema } from './validators'

describe('babaProfileSchema', () => {
  const base = {
    name: 'Ana',
    phone: '24999990000',
    email: 'ana@b.com',
    bio: 'Cuido de pets há 10 anos.',
    animalsCared: 'Cães de pequeno porte e gatos.',
    cep: '27330000',
    logradouro: 'Rua A',
    numero: '100',
    complemento: '',
    bairro: 'Centro',
    cidade: 'Barra Mansa',
    estado: 'RJ',
    photo: '',
  }

  it('aceita perfil válido', () => {
    expect(babaProfileSchema.safeParse(base).success).toBe(true)
  })
  it('rejeita sem animais cuidados', () => {
    expect(babaProfileSchema.safeParse({ ...base, animalsCared: '' }).success).toBe(false)
  })
  it('rejeita sem cidade', () => {
    expect(babaProfileSchema.safeParse({ ...base, cidade: '' }).success).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: FAIL ("babaProfileSchema is not exported"/undefined).

- [ ] **Step 3: Implementar (adicionar em `src/lib/validators.ts`)**

```ts
export const babaProfileSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
  phone: z.string().min(8, 'Telefone obrigatório'),
  email: z.email('Email inválido'),
  bio: z.string().min(1, 'Descrição obrigatória').max(1000),
  animalsCared: z.string().min(1, 'Informe quais animais você cuida').max(2000),
  cep: z.string().min(1, 'CEP obrigatório'),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional().default(''),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z.string().min(2, 'Estado obrigatório').max(2),
  photo: z.string().optional().default(''),
})

export type BabaProfileInput = z.infer<typeof babaProfileSchema>
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: PASS (todos os blocos, incluindo os 3 novos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators.ts src/lib/validators.test.ts
git commit -m "feat(baba): schema de validação do perfil"
```

---

### Task 5: Painel protegido por papel

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/app/painel/page.tsx`
- Create: `src/app/painel/painel.css`

**Interfaces:**
- Consumes: `auth` de `@/lib/auth`.
- Produces:
  - `async function requireUser(): Promise<{ id: string; role: Role; name?: string | null }>` — usa `auth()`; se não logado, `redirect('/login')`.
  - `/painel` mostra atalho para o editor conforme o papel.

- [ ] **Step 1: Implementar o helper de sessão**

```ts
// src/lib/session.ts
import { redirect } from 'next/navigation'
import type { Role } from '@prisma/client'
import { auth } from '@/lib/auth'

export async function requireUser(): Promise<{
  id: string
  role: Role
  name?: string | null
}> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return {
    id: session.user.id,
    role: session.user.role as Role,
    name: session.user.name,
  }
}
```

- [ ] **Step 2: Implementar a página do painel**

```tsx
// src/app/painel/page.tsx
import Link from 'next/link'
import { requireUser } from '@/lib/session'
import './painel.css'

export default async function PainelPage() {
  const user = await requireUser()

  return (
    <main className="page painel">
      <h1 className="painel__title">Meu painel</h1>
      <p className="painel__lead">Olá{user.name ? `, ${user.name}` : ''}!</p>

      {user.role === 'BABA' && (
        <Link href="/painel/perfil-baba" className="btn btn-green">
          Editar meu perfil de babá
        </Link>
      )}
      {user.role === 'ESTABLISHMENT_OWNER' && (
        <p className="painel__hint">A edição do perfil de estabelecimento chega em breve.</p>
      )}
      {user.role === 'CUSTOMER' && (
        <p className="painel__hint">Sua conta é de usuário comum.</p>
      )}

      <Link href="/" className="painel__back">← Voltar ao início</Link>
    </main>
  )
}
```

```css
/* src/app/painel/painel.css */
.painel { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
.painel__title { font-size: 1.75rem; font-weight: 700; }
.painel__lead { color: #374151; }
.painel__hint { color: #6b7280; }
.painel__back { color: #16a34a; margin-top: 1rem; }
```

- [ ] **Step 3: Verificar tipos + acesso**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

Verificação manual: `npm run dev`, abrir `/painel` deslogado → redireciona para `/login`. Logado como babá → mostra o botão "Editar meu perfil de babá".

- [ ] **Step 4: Commit**

```bash
git add src/lib/session.ts src/app/painel/page.tsx src/app/painel/painel.css
git commit -m "feat(painel): área logada protegida por papel"
```

---

### Task 6: Redirecionar por papel após o cadastro

**Files:**
- Modify: `src/app/cadastro/actions.ts:30-31` (o final da action `register`)

**Interfaces:**
- Consumes: `register` (Fase 1).
- Produces: após cadastro+login, babá/estabelecimento → `/painel`; comum → `/`.

- [ ] **Step 1: Ajustar o redirect final**

Substituir, no fim de `register`, o bloco:

```ts
  await signIn('credentials', { email, password, redirect: false })
  redirect('/')
```

por:

```ts
  await signIn('credentials', { email, password, redirect: false })
  redirect(role === 'CUSTOMER' ? '/' : '/painel')
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/cadastro/actions.ts
git commit -m "feat(cadastro): redirecionar babá/estabelecimento para o painel"
```

---

### Task 7: Componente de endereço com CEP

**Files:**
- Create: `src/components/CepAddressFields.tsx`

**Interfaces:**
- Consumes: `lookupCep` (Task 2), `UFS` (Task 2).
- Produces: `<CepAddressFields defaultValues?={Partial<AddressValues>} />` — campos `name="cep|logradouro|numero|complemento|bairro|cidade|estado"`; botão "Buscar CEP" autopreenche logradouro/bairro/cidade/estado.
  - `type AddressValues = { cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string }`

- [ ] **Step 1: Implementar o componente**

```tsx
// src/components/CepAddressFields.tsx
'use client'

import { useState } from 'react'
import { lookupCep } from '@/lib/address/viacep'
import { UFS } from '@/lib/address/ufs'

export type AddressValues = {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export function CepAddressFields({ defaultValues }: { defaultValues?: Partial<AddressValues> }) {
  const [cep, setCep] = useState(defaultValues?.cep ?? '')
  const [logradouro, setLogradouro] = useState(defaultValues?.logradouro ?? '')
  const [bairro, setBairro] = useState(defaultValues?.bairro ?? '')
  const [cidade, setCidade] = useState(defaultValues?.cidade ?? '')
  const [estado, setEstado] = useState(defaultValues?.estado ?? '')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function buscar() {
    setLoading(true)
    setErro('')
    const r = await lookupCep(cep)
    setLoading(false)
    if (!r) {
      setErro('CEP não encontrado.')
      return
    }
    setLogradouro(r.logradouro)
    setBairro(r.bairro)
    setCidade(r.cidade)
    setEstado(r.uf)
  }

  return (
    <div className="cep-fields">
      <label className="auth-label">
        CEP
        <div className="cep-fields__row">
          <input
            type="text"
            name="cep"
            className="auth-input"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="00000-000"
            required
          />
          <button type="button" className="btn btn-outline-green" onClick={buscar} disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar CEP'}
          </button>
        </div>
      </label>
      {erro && <p className="auth-error" role="alert">{erro}</p>}

      <label className="auth-label">
        Logradouro
        <input type="text" name="logradouro" className="auth-input" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} required />
      </label>
      <label className="auth-label">
        Número
        <input type="text" name="numero" className="auth-input" defaultValue={defaultValues?.numero ?? ''} required />
      </label>
      <label className="auth-label">
        Complemento
        <input type="text" name="complemento" className="auth-input" defaultValue={defaultValues?.complemento ?? ''} />
      </label>
      <label className="auth-label">
        Bairro
        <input type="text" name="bairro" className="auth-input" value={bairro} onChange={(e) => setBairro(e.target.value)} required />
      </label>
      <label className="auth-label">
        Cidade
        <input type="text" name="cidade" className="auth-input" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
      </label>
      <label className="auth-label">
        Estado
        <select name="estado" className="auth-input" value={estado} onChange={(e) => setEstado(e.target.value)} required>
          <option value="">UF</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/CepAddressFields.tsx
git commit -m "feat(endereco): componente de campos com busca de CEP"
```

---

### Task 8: Editor de perfil da babá + persistência

**Files:**
- Create: `src/app/painel/perfil-baba/page.tsx`
- Create: `src/app/painel/perfil-baba/actions.ts`
- Create: `src/app/painel/perfil-baba/BabaProfileForm.tsx`
- Create: `src/app/painel/perfil-baba/perfil-baba.css`
- Modify: `src/lib/queries/babas.ts` (adicionar `getBabaByOwner`)

**Interfaces:**
- Consumes: `requireUser` (Task 5), `babaProfileSchema` (Task 4), `uniqueSlug`/`slugify` (Task 3), `CepAddressFields` (Task 7), `prisma`.
- Produces:
  - `getBabaByOwner(ownerId: string): Promise<Baba | null>` em `babas.ts`.
  - `saveBabaProfile(_prev, formData): Promise<{ error?: string; ok?: boolean }>` — valida, faz `upsert` por `ownerId`, gera slug único na criação, deriva `location = "Cidade/UF"`, mantém `photo` (placeholder `'/baba-placeholder.svg'` se vazio).

- [ ] **Step 1: Adicionar `getBabaByOwner` em `src/lib/queries/babas.ts`**

```ts
export async function getBabaByOwner(ownerId: string) {
  return prisma.baba.findFirst({ where: { ownerId } })
}
```

- [ ] **Step 2: Implementar a Server Action**

```ts
// src/app/painel/perfil-baba/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { babaProfileSchema } from '@/lib/validators'
import { slugify, uniqueSlug } from '@/lib/slug'

export type BabaProfileState = { error?: string; ok?: boolean }

const PLACEHOLDER_PHOTO = '/baba-placeholder.svg'

export async function saveBabaProfile(
  _prev: BabaProfileState,
  formData: FormData,
): Promise<BabaProfileState> {
  const user = await requireUser()
  if (user.role !== 'BABA') return { error: 'Apenas babás podem editar este perfil.' }

  const parsed = babaProfileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    bio: formData.get('bio'),
    animalsCared: formData.get('animalsCared'),
    cep: formData.get('cep'),
    logradouro: formData.get('logradouro'),
    numero: formData.get('numero'),
    complemento: formData.get('complemento') ?? '',
    bairro: formData.get('bairro'),
    cidade: formData.get('cidade'),
    estado: formData.get('estado'),
    photo: formData.get('photo') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data
  const location = `${d.cidade}/${d.estado}`
  const photo = d.photo && d.photo.length > 0 ? d.photo : PLACEHOLDER_PHOTO

  const existing = await prisma.baba.findFirst({ where: { ownerId: user.id } })

  if (existing) {
    await prisma.baba.update({
      where: { id: existing.id },
      data: {
        name: d.name, phone: d.phone, email: d.email, bio: d.bio,
        animalsCared: d.animalsCared, cep: d.cep, logradouro: d.logradouro,
        numero: d.numero, complemento: d.complemento, bairro: d.bairro,
        cidade: d.cidade, estado: d.estado, location, photo,
      },
    })
  } else {
    const slug = await uniqueSlug(d.name, async (s) => {
      const hit = await prisma.baba.findUnique({ where: { slug: s } })
      return hit !== null
    })
    await prisma.baba.create({
      data: {
        slug, ownerId: user.id,
        name: d.name, phone: d.phone, email: d.email, bio: d.bio,
        animalsCared: d.animalsCared, cep: d.cep, logradouro: d.logradouro,
        numero: d.numero, complemento: d.complemento, bairro: d.bairro,
        cidade: d.cidade, estado: d.estado, location, photo,
      },
    })
  }

  revalidatePath('/babas')
  return { ok: true }
}
```

- [ ] **Step 3: Implementar o formulário (client)**

```tsx
// src/app/painel/perfil-baba/BabaProfileForm.tsx
'use client'

import { useActionState } from 'react'
import type { Baba } from '@prisma/client'
import { saveBabaProfile, type BabaProfileState } from './actions'
import { CepAddressFields } from '@/components/CepAddressFields'

export function BabaProfileForm({ baba }: { baba: Baba | null }) {
  const [state, formAction, pending] = useActionState<BabaProfileState, FormData>(saveBabaProfile, {})

  return (
    <form className="auth-form" action={formAction}>
      <input type="hidden" name="photo" defaultValue={baba?.photo ?? ''} />

      <label className="auth-label">
        Nome
        <input type="text" name="name" className="auth-input" defaultValue={baba?.name ?? ''} required />
      </label>
      <label className="auth-label">
        Telefone
        <input type="tel" name="phone" className="auth-input" defaultValue={baba?.phone ?? ''} required />
      </label>
      <label className="auth-label">
        E-mail
        <input type="email" name="email" className="auth-input" defaultValue={baba?.email ?? ''} required />
      </label>

      <CepAddressFields
        defaultValues={baba ? {
          cep: baba.cep, logradouro: baba.logradouro, numero: baba.numero,
          complemento: baba.complemento, bairro: baba.bairro, cidade: baba.cidade, estado: baba.estado,
        } : undefined}
      />

      <label className="auth-label">
        Breve descrição
        <textarea name="bio" className="auth-input" rows={4} defaultValue={baba?.bio ?? ''} required />
      </label>
      <label className="auth-label">
        Quais animais você cuida
        <textarea name="animalsCared" className="auth-input" rows={4} defaultValue={baba?.animalsCared ?? ''} required />
      </label>

      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state.ok && <p className="painel__ok" role="status">Perfil salvo! Já aparece em /babas.</p>}
      <button type="submit" className="btn btn-green auth-submit" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar perfil'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Implementar a página (server)**

```tsx
// src/app/painel/perfil-baba/page.tsx
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getBabaByOwner } from '@/lib/queries/babas'
import { BabaProfileForm } from './BabaProfileForm'
import '../painel.css'
import './perfil-baba.css'

export default async function PerfilBabaPage() {
  const user = await requireUser()
  if (user.role !== 'BABA') redirect('/painel')

  const baba = await getBabaByOwner(user.id)

  return (
    <main className="page painel">
      <h1 className="painel__title">Meu perfil de babá</h1>
      <p className="painel__lead">Preencha seus dados. Eles aparecem na página de babás.</p>
      <BabaProfileForm baba={baba} />
    </main>
  )
}
```

```css
/* src/app/painel/perfil-baba/perfil-baba.css */
.cep-fields { display: flex; flex-direction: column; gap: 0.75rem; }
.cep-fields__row { display: flex; gap: 0.5rem; }
.cep-fields__row .auth-input { flex: 1; }
.painel__ok { color: #16a34a; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.9rem; }
```

- [ ] **Step 5: Criar o placeholder de foto**

```bash
cat > public/baba-placeholder.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e5e7eb"/><text x="100" y="108" font-family="sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle">Sem foto</text></svg>
SVG
```

- [ ] **Step 6: Verificar tipos + manual**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

Manual: `npm run dev`, logar como babá, abrir `/painel/perfil-baba`, preencher (usar "Buscar CEP"), salvar. Conferir que aparece em `/babas` com nome e cidade/UF.

- [ ] **Step 7: Commit**

```bash
git add src/app/painel/perfil-baba src/lib/queries/babas.ts public/baba-placeholder.svg
git commit -m "feat(baba): editor de perfil no painel com upsert vinculado ao usuário"
```

---

### Task 9: Exibir animais cuidados e endereço no perfil público

**Files:**
- Modify: `src/app/babas/[id]/page.tsx:42-45` (após a seção "Sobre")

**Interfaces:**
- Consumes: `baba.animalsCared`, `baba.cidade`, `baba.estado` (Task 1).

- [ ] **Step 1: Adicionar a seção "Animais que cuida"**

Após a seção `<section className="baba-profile__section">…Sobre…</section>` (linha 42-45), inserir:

```tsx
      {baba.animalsCared && (
        <section className="baba-profile__section">
          <h2 className="baba-profile__section-title">Animais que cuida</h2>
          <p className="baba-profile__bio">{baba.animalsCared}</p>
        </section>
      )}
```

- [ ] **Step 2: Verificar tipos + manual**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

Manual: abrir o perfil de uma babá criada na Task 8 e ver a seção "Animais que cuida".

- [ ] **Step 3: Commit**

```bash
git add src/app/babas/[id]/page.tsx
git commit -m "feat(baba): exibir animais cuidados no perfil público"
```

---

### Task 10: Upload de foto via Vercel Blob

> **Pré-requisito (ação do usuário):** conectar o store `pet-stop-fotos` ao projeto `pet-stop` no dashboard do Vercel (Storage → pet-stop-fotos → Connect Project). Isso cria `BLOB_READ_WRITE_TOKEN`. Depois rodar `vercel env pull .env.local` para ter o token em dev.

**Files:**
- Create: `src/app/api/upload/route.ts`
- Create: `src/components/PhotoUpload.tsx`
- Modify: `src/app/painel/perfil-baba/BabaProfileForm.tsx` (trocar o input hidden de foto pelo `<PhotoUpload>`)

**Interfaces:**
- Consumes: `@vercel/blob` (`put`), `BLOB_READ_WRITE_TOKEN`.
- Produces:
  - `POST /api/upload` recebe `multipart/form-data` campo `file`, salva no Blob, retorna `{ url }`.
  - `<PhotoUpload name="photo" defaultUrl?={string} />` — faz upload e grava a URL num input hidden `name="photo"`.

- [ ] **Step 1: Instalar o SDK**

Run: `npm install @vercel/blob`
Expected: adiciona `@vercel/blob` às dependências.

- [ ] **Step 2: Implementar o route handler**

```ts
// src/app/api/upload/route.ts
import { put } from '@vercel/blob'
import { requireUser } from '@/lib/session'

export async function POST(request: Request): Promise<Response> {
  await requireUser()
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Arquivo ausente' }, { status: 400 })
  }
  const ext = file.name.split('.').pop() || 'jpg'
  const blob = await put(`fotos/${crypto.randomUUID()}.${ext}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return Response.json({ url: blob.url })
}
```

- [ ] **Step 3: Implementar o componente de upload**

```tsx
// src/components/PhotoUpload.tsx
'use client'

import { useState } from 'react'

export function PhotoUpload({ name, defaultUrl = '' }: { name: string; defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setErro('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      if (!res.ok) throw new Error('falha')
      const data = (await res.json()) as { url: string }
      setUrl(data.url)
    } catch {
      setErro('Não foi possível enviar a foto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="photo-upload">
      <input type="hidden" name={name} value={url} readOnly />
      {url && <img src={url} alt="" className="photo-upload__preview" width={96} height={96} />}
      <label className="auth-label">
        Foto
        <input type="file" accept="image/*" className="auth-input" onChange={onChange} />
      </label>
      {loading && <p className="painel__hint">Enviando…</p>}
      {erro && <p className="auth-error" role="alert">{erro}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Usar o `<PhotoUpload>` no formulário da babá**

Em `src/app/painel/perfil-baba/BabaProfileForm.tsx`, trocar:

```tsx
      <input type="hidden" name="photo" defaultValue={baba?.photo ?? ''} />
```

por:

```tsx
      <PhotoUpload name="photo" defaultUrl={baba?.photo ?? ''} />
```

E adicionar o import no topo:

```tsx
import { PhotoUpload } from '@/components/PhotoUpload'
```

- [ ] **Step 5: Verificar tipos + manual**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

Manual (após conectar o store e `vercel env pull`): `npm run dev`, no editor da babá enviar uma foto → preview aparece → salvar → a foto aparece em `/babas`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app/api/upload/route.ts src/components/PhotoUpload.tsx src/app/painel/perfil-baba/BabaProfileForm.tsx
git commit -m "feat(baba): upload de foto via Vercel Blob"
```

---

## Self-Review

**Cobertura do spec (Fase 2):**
- Endereço estruturado + `animalsCared` → Task 1. ✓
- ViaCEP (busca + autopreenchimento) + UFs em select → Tasks 2, 7. ✓
- Área logada protegida por papel → Task 5. ✓
- Redirecionar babá ao painel após cadastro → Task 6. ✓
- Editor da babá com foto, nome, contato, endereço, descrição, animais → Tasks 7, 8, 10. ✓
- Upsert vinculado ao `ownerId` + slug único + publicação imediata (`revalidatePath`) → Task 8. ✓
- Aparecer em `/babas` (lista já lê `Baba`) + perfil exibindo animais → Tasks 8, 9. ✓
- Foto via Vercel Blob → Task 10 (com pré-requisito de conectar o store). ✓
- Falhas graciosas: CEP inválido (Task 2/7), upload falha (Task 10). ✓

**Placeholders:** nenhum "TBD/TODO"; todo passo de código traz o código completo.

**Consistência de tipos:** `lookupCep`/`parseViaCep`/`normalizeCep` (Task 2) usados igual em Task 7; `slugify`/`uniqueSlug` (Task 3) usados em Task 8; `babaProfileSchema` (Task 4) usado em Task 8; `requireUser` (Task 5) usado em Tasks 8, 10; campo hidden `name="photo"` consistente entre Task 8 e Task 10; `getBabaByOwner` definido (Task 8) e usado na página (Task 8).

**Fora deste plano:** perfil de estabelecimento e `types[]` (Fase 3); /emergencia (plano próprio).
