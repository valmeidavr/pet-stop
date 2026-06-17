# Cadastro Fase 3 — Área do estabelecimento (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao se cadastrar como "Estabelecimento", o usuário preenche na própria tela de cadastro foto, nome, CEP/endereço, horário, serviços, tipos (múltiplos) e ajusta o pino no mapa; o estabelecimento — vinculado ao usuário — aparece em `/paradas-pets`.

**Architecture:** Migração aditiva do `Establishment` (mantém `type` para as telas atuais e adiciona `types[]` para multi-seleção/filtro). Geocoding via Nominatim (server-side com fallback) + `MapPicker` com pino arrastável. Campos do estabelecimento na `/cadastro` (mesmo padrão da babá) e editor no painel, reutilizando um componente de campos. Foto sobe pro Blob no servidor.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, react-leaflet 5 / leaflet, Prisma 6 (Neon), Zod v4, next-auth v5, `@vercel/blob`, vitest. Gerenciador: **npm**.

## Global Constraints

- Todo texto de UI em **português (PT-BR)**.
- Testes com **vitest**; rodar com `npm run test`.
- Enum `EstablishmentType`: `loja`, `clinica`, `farmacia`, `hospital`, `banho_tosa`.
- Migração **aditiva**: manter o campo `type` existente; adicionar `types[]`. `types` contém todos os tipos selecionados; `type` = tipo primário (`types[0]`) para compatibilidade com as telas atuais.
- `/paradas-pets` filtra por `types` (um lugar aparece em todos os seus tipos). Telas de exibição (popup, página do estabelecimento) continuam usando `type` (primário).
- Publicação imediata.
- Foto e imagens: upload no servidor via Vercel Blob (`BLOB_READ_WRITE_TOKEN` já configurado).
- Coordenadas: geocode do endereço (Nominatim) no servidor; se o usuário mexer no pino, as coords do pino prevalecem.

## File Structure

- `prisma/schema.prisma` — `Establishment`: `types[]`, endereço, `openingHours`, `services[]` (Task 1).
- `prisma/seed.ts` — preencher `types: [e.type]` (Task 2).
- `src/components/PetMap.tsx` — filtro por `types` (Task 2).
- `src/lib/address/geocode.ts` (+ teste) — geocoding Nominatim (Task 3).
- `src/lib/validators.ts` — `establishmentProfileSchema` (Task 4).
- `src/components/MapPicker.tsx`, `MapPickerInner.tsx` — pino arrastável (Task 5).
- `src/components/EstablishmentFields.tsx` — campos compartilhados (Task 6).
- `src/app/cadastro/page.tsx`, `actions.ts` — estabelecimento inline (Task 7).
- `src/app/painel/perfil-estabelecimento/page.tsx`, `actions.ts`, `EstabProfileForm.tsx` — editor (Task 8); `src/app/painel/page.tsx` link.
- `src/lib/queries/establishments.ts` — `getEstablishmentByOwner` (Task 8).

---

### Task 1: Migração do `Establishment` (types[] + endereço + horário + serviços)

**Files:**
- Modify: `prisma/schema.prisma` (model `Establishment`)

**Interfaces:**
- Produces: novos campos `types EstablishmentType[] @default([])`, `cep/logradouro/numero/complemento/bairro/cidade/estado String @default("")`, `openingHours String @default("")`, `services String[] @default([])`. Mantém `type EstablishmentType`.

- [ ] **Step 1: Editar o model `Establishment`**

Após a linha `type EstablishmentType` adicionar `types EstablishmentType[] @default([])`. Após `about String` adicionar:

```prisma
  types        EstablishmentType[] @default([])
  cep          String  @default("")
  logradouro   String  @default("")
  numero       String  @default("")
  complemento  String  @default("")
  bairro       String  @default("")
  cidade       String  @default("")
  estado       String  @default("")
  openingHours String  @default("")
  services     String[] @default([])
```

(coloque `types` junto dos outros campos do model; a posição exata não importa para o Prisma.)

- [ ] **Step 2: Gerar a migração sem aplicar (para editar o SQL de backfill)**

Run: `set -a; . ./.env.local; set +a; npx prisma migrate dev --create-only --name establishment_multitype_address`
Expected: cria a pasta de migração com `migration.sql` (não aplicada ainda).

- [ ] **Step 3: Acrescentar o backfill no `migration.sql`**

No fim do arquivo `prisma/migrations/<timestamp>_establishment_multitype_address/migration.sql`, adicionar:

```sql
-- Backfill: tipos múltiplos começam com o tipo único atual
UPDATE "Establishment" SET "types" = ARRAY["type"]::"EstablishmentType"[] WHERE cardinality("types") = 0;
```

- [ ] **Step 4: Aplicar a migração**

Run: `set -a; . ./.env.local; set +a; npx prisma migrate dev`
Expected: aplica a migração e regenera o client; "Your database is now in sync".

- [ ] **Step 5: Verificar backfill + tipos**

Run: `set -a; . ./.env.local; set +a; npx tsc --noEmit -p tsconfig.json`
Expected: exit 0 (o tipo `Establishment` agora tem `types`).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(estabelecimento): types[], endereço, horário e serviços no schema"
```

---

### Task 2: `/paradas-pets` e seed usando `types`

**Files:**
- Modify: `src/components/PetMap.tsx` (linhas 87, 91, 228, 233, 248)
- Modify: `prisma/seed.ts` (create e update do establishment)

**Interfaces:**
- Consumes: `Establishment.types` (Task 1).
- Produces: filtro/seleção do mapa por `types`; seed grava `types`.

- [ ] **Step 1: Trocar os usos de filtro em `PetMap.tsx`**

Linha 87 (`initialFilter`): trocar
```ts
      establishments.some((e) => e.type === t),
```
por
```ts
      establishments.some((e) => e.types.includes(t)),
```

Linha 91: trocar
```ts
  return new Set(establishments.map((e) => e.type));
```
por
```ts
  return new Set(establishments.flatMap((e) => e.types));
```

Bloco `filterableTypes` (≈228): trocar
```ts
    for (const e of establishments) present.add(e.type);
```
por
```ts
    for (const e of establishments) for (const t of e.types) present.add(t);
```

`visible` (≈233): trocar
```ts
    () => establishments.filter((e) => filter.has(e.type)),
```
por
```ts
    () => establishments.filter((e) => e.types.some((t) => filter.has(t))),
```

`nearestEmergency` (≈248): trocar
```ts
      (e) => e.type === "clinica" || e.type === "hospital",
```
por
```ts
      (e) => e.types.includes("clinica") || e.types.includes("hospital"),
```

(As linhas `selected.type === ...` de exibição NÃO mudam — usam o tipo primário.)

- [ ] **Step 2: Seed grava `types`**

Em `prisma/seed.ts`, no objeto `create` do establishment, após `type: e.type,` adicionar `types: [e.type],`. No objeto `update`, após `type: e.type,` adicionar `types: [e.type],`.

- [ ] **Step 3: Verificar tipos + mapa**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

Manual: `npm run dev`, abrir `/paradas-pets`; os filtros e marcadores aparecem como antes (agora baseados em `types`).

- [ ] **Step 4: Commit**

```bash
git add src/components/PetMap.tsx prisma/seed.ts
git commit -m "feat(paradas-pets): filtrar por types[] (multi-tipo)"
```

---

### Task 3: Helper de geocoding (Nominatim)

**Files:**
- Create: `src/lib/address/geocode.ts`
- Test: `src/lib/address/geocode.test.ts`

**Interfaces:**
- Produces:
  - `type GeoPoint = { lat: number; lng: number }`
  - `function parseNominatim(json: unknown): GeoPoint | null` — pega o primeiro resultado `{ lat, lon }`; `null` se vazio/inesperado.
  - `function buildAddressQuery(a: { logradouro: string; numero: string; cidade: string; estado: string }): string`
  - `async function geocodeAddress(query: string): Promise<GeoPoint | null>` — chama Nominatim; `null` em erro.

- [ ] **Step 1: Escrever os testes que falham**

```ts
// src/lib/address/geocode.test.ts
import { describe, expect, it } from 'vitest'
import { parseNominatim, buildAddressQuery } from './geocode'

describe('parseNominatim', () => {
  it('mapeia o primeiro resultado', () => {
    expect(parseNominatim([{ lat: '-22.41', lon: '-44.12' }])).toEqual({ lat: -22.41, lng: -44.12 })
  })
  it('retorna null para lista vazia', () => {
    expect(parseNominatim([])).toBeNull()
  })
  it('retorna null para formato inesperado', () => {
    expect(parseNominatim({})).toBeNull()
  })
})

describe('buildAddressQuery', () => {
  it('monta a query com endereço e país', () => {
    expect(buildAddressQuery({ logradouro: 'Rua A', numero: '10', cidade: 'Barra Mansa', estado: 'RJ' }))
      .toBe('Rua A, 10, Barra Mansa, RJ, Brasil')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- src/lib/address/geocode.test.ts`
Expected: FAIL ("Cannot find module './geocode'").

- [ ] **Step 3: Implementar**

```ts
// src/lib/address/geocode.ts
export type GeoPoint = { lat: number; lng: number }

export function parseNominatim(json: unknown): GeoPoint | null {
  if (!Array.isArray(json) || json.length === 0) return null
  const first = json[0] as Record<string, unknown>
  const lat = Number(first.lat)
  const lng = Number(first.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

export function buildAddressQuery(a: {
  logradouro: string
  numero: string
  cidade: string
  estado: string
}): string {
  return `${a.logradouro}, ${a.numero}, ${a.cidade}, ${a.estado}, Brasil`
}

export async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'pet-stop/1.0' } })
    if (!res.ok) return null
    return parseNominatim(await res.json())
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- src/lib/address/geocode.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/address/geocode.ts src/lib/address/geocode.test.ts
git commit -m "feat(endereco): helper de geocoding Nominatim"
```

---

### Task 4: Schema Zod do perfil de estabelecimento

**Files:**
- Modify: `src/lib/validators.ts`
- Test: `src/lib/validators.test.ts`

**Interfaces:**
- Produces:
  - `const establishmentTypeValues = ['loja','clinica','farmacia','hospital','banho_tosa'] as const`
  - `establishmentProfileSchema` exige `name`, `phone`, `email`, `openingHours`, endereço (cep/logradouro/numero/bairro/cidade/estado; `complemento` opcional), `types` (array com ≥1 de `establishmentTypeValues`), `services` (array de string, pode vazio), `lat`/`lng` (number opcionais), `photo` opcional.
  - `type EstablishmentProfileInput = z.infer<typeof establishmentProfileSchema>`

- [ ] **Step 1: Escrever os testes que falham**

```ts
// adicionar em src/lib/validators.test.ts
import { establishmentProfileSchema } from './validators'

describe('establishmentProfileSchema', () => {
  const base = {
    name: 'Clínica X', phone: '2433330000', email: 'c@x.com',
    openingHours: 'Seg a Sex 8h-18h',
    cep: '27330000', logradouro: 'Av B', numero: '50', complemento: '',
    bairro: 'Centro', cidade: 'Barra Mansa', estado: 'RJ',
    types: ['clinica', 'loja'], services: ['Vacinação', 'Banho'],
    lat: -22.5, lng: -44.1, photo: '',
  }
  it('aceita perfil válido', () => {
    expect(establishmentProfileSchema.safeParse(base).success).toBe(true)
  })
  it('rejeita sem nenhum tipo', () => {
    expect(establishmentProfileSchema.safeParse({ ...base, types: [] }).success).toBe(false)
  })
  it('rejeita tipo inválido', () => {
    expect(establishmentProfileSchema.safeParse({ ...base, types: ['xpto'] }).success).toBe(false)
  })
  it('aceita services vazio', () => {
    expect(establishmentProfileSchema.safeParse({ ...base, services: [] }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: FAIL (`establishmentProfileSchema` indefinido).

- [ ] **Step 3: Implementar (adicionar em `src/lib/validators.ts`)**

```ts
export const establishmentTypeValues = ['loja', 'clinica', 'farmacia', 'hospital', 'banho_tosa'] as const

export const establishmentProfileSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  phone: z.string().min(8, 'Telefone obrigatório'),
  email: z.email('Email inválido'),
  openingHours: z.string().min(1, 'Horário obrigatório').max(500),
  cep: z.string().min(1, 'CEP obrigatório'),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional().default(''),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z.string().min(2, 'Estado obrigatório').max(2),
  types: z.array(z.enum(establishmentTypeValues)).min(1, 'Selecione ao menos um tipo'),
  services: z.array(z.string()).default([]),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  photo: z.string().optional().default(''),
})

export type EstablishmentProfileInput = z.infer<typeof establishmentProfileSchema>
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm run test -- src/lib/validators.test.ts`
Expected: PASS (todos, incluindo os 4 novos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators.ts src/lib/validators.test.ts
git commit -m "feat(estabelecimento): schema de validação do perfil"
```

---

### Task 5: Componente MapPicker (pino arrastável)

**Files:**
- Create: `src/components/MapPickerInner.tsx`
- Create: `src/components/MapPicker.tsx`

**Interfaces:**
- Produces: `<MapPicker latName="lat" lngName="lng" defaultCenter={[-22.41,-44.12]} />` — mapa com marcador arrastável; grava as coords em inputs hidden `latName`/`lngName`. Sem coords iniciais, o marcador fica no centro padrão e os hidden ficam vazios até o usuário arrastar.

- [ ] **Step 1: Implementar o mapa interno (leaflet)**

```tsx
// src/components/MapPickerInner.tsx
'use client'

import { useState } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

function toIconUrl(img: string | { src: string }): string {
  return typeof img === 'string' ? img : img.src
}

const icon = L.icon({
  iconUrl: toIconUrl(markerIcon),
  iconRetinaUrl: toIconUrl(markerIcon2x),
  shadowUrl: toIconUrl(markerShadow),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export function MapPickerInner({
  latName,
  lngName,
  defaultCenter,
}: {
  latName: string
  lngName: string
  defaultCenter: [number, number]
}) {
  const [pos, setPos] = useState<[number, number] | null>(null)
  const center = pos ?? defaultCenter

  return (
    <div className="map-picker">
      <p className="map-picker__hint">Arraste o pino para a localização exata do estabelecimento.</p>
      <input type="hidden" name={latName} value={pos ? pos[0] : ''} readOnly />
      <input type="hidden" name={lngName} value={pos ? pos[1] : ''} readOnly />
      <MapContainer center={center} zoom={13} className="map-picker__map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={center}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const m = e.target as L.Marker
              const ll = m.getLatLng()
              setPos([ll.lat, ll.lng])
            },
          }}
        />
      </MapContainer>
    </div>
  )
}
```

- [ ] **Step 2: Wrapper client-only**

```tsx
// src/components/MapPicker.tsx
'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./MapPickerInner').then((m) => m.MapPickerInner), {
  ssr: false,
  loading: () => <div className="map-picker__loading">Carregando mapa…</div>,
})

export function MapPicker({
  latName = 'lat',
  lngName = 'lng',
  defaultCenter = [-22.41, -44.12],
}: {
  latName?: string
  lngName?: string
  defaultCenter?: [number, number]
}) {
  return <Inner latName={latName} lngName={lngName} defaultCenter={defaultCenter} />
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/MapPicker.tsx src/components/MapPickerInner.tsx
git commit -m "feat(mapa): MapPicker com pino arrastável"
```

---

### Task 6: Componente de campos do estabelecimento (compartilhado)

**Files:**
- Create: `src/components/EstablishmentFields.tsx`

**Interfaces:**
- Consumes: `CepAddressFields`, `MapPicker`, `establishmentTypeValues`.
- Produces: `<EstablishmentFields defaults?={Partial<EstablishmentFieldValues>} />` — campos `name? (via prop showName), phone, cep..., openingHours, services (textarea, uma por linha → enviado como linhas), types (checkboxes name="types"), foto (file name="photo"), MapPicker (lat/lng)`.
  - `type EstablishmentFieldValues = { phone: string; cep: string; logradouro: string; numero: string; complemento: string; bairro: string; cidade: string; estado: string; openingHours: string; services: string[]; types: string[] }`
  - Prop `showName?: boolean` (no cadastro o nome vem do campo "Nome" da conta, então `showName=false`; no painel `showName=true`).

- [ ] **Step 1: Implementar**

```tsx
// src/components/EstablishmentFields.tsx
'use client'

import { CepAddressFields } from '@/components/CepAddressFields'
import { MapPicker } from '@/components/MapPicker'
import { establishmentTypeValues } from '@/lib/validators'

export type EstablishmentFieldValues = {
  name: string
  phone: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  openingHours: string
  services: string[]
  types: string[]
}

const TYPE_LABELS: Record<string, string> = {
  clinica: 'Clínica',
  loja: 'Loja / Pet Shop',
  farmacia: 'Farmácia',
  hospital: 'Hospital',
  banho_tosa: 'Banho e tosa',
}

export function EstablishmentFields({
  defaults,
  showName = false,
}: {
  defaults?: Partial<EstablishmentFieldValues>
  showName?: boolean
}) {
  return (
    <fieldset className="auth-profile">
      <legend className="auth-card__lead">Dados do estabelecimento</legend>

      {showName && (
        <label className="auth-label">
          Nome da empresa
          <input type="text" name="name" className="auth-input" defaultValue={defaults?.name ?? ''} required />
        </label>
      )}

      <label className="auth-label">
        Foto / logo
        <input type="file" name="photo" accept="image/*" className="auth-input" />
      </label>
      <label className="auth-label">
        Telefone
        <input type="tel" name="phone" className="auth-input" defaultValue={defaults?.phone ?? ''} placeholder="(24) 3333-0000" required />
      </label>

      <CepAddressFields
        defaultValues={{
          cep: defaults?.cep ?? '', logradouro: defaults?.logradouro ?? '', numero: defaults?.numero ?? '',
          complemento: defaults?.complemento ?? '', bairro: defaults?.bairro ?? '', cidade: defaults?.cidade ?? '', estado: defaults?.estado ?? '',
        }}
      />

      <label className="auth-label">
        Horário de funcionamento
        <textarea name="openingHours" className="auth-input" rows={3} defaultValue={defaults?.openingHours ?? ''} placeholder="Seg a Sex 8h-18h, Sáb 8h-12h" required />
      </label>
      <label className="auth-label">
        Serviços oferecidos (um por linha)
        <textarea name="services" className="auth-input" rows={4} defaultValue={(defaults?.services ?? []).join('\n')} placeholder="Banho&#10;Vacinação&#10;Consulta" />
      </label>

      <fieldset className="auth-types">
        <legend className="auth-label">Tipos (pode marcar mais de um)</legend>
        {establishmentTypeValues.map((t) => (
          <label key={t} className="auth-role">
            <input type="checkbox" name="types" value={t} defaultChecked={defaults?.types?.includes(t) ?? false} />
            <span>{TYPE_LABELS[t]}</span>
          </label>
        ))}
      </fieldset>

      <MapPicker latName="lat" lngName="lng" />
    </fieldset>
  )
}
```

- [ ] **Step 2: Estilos do mapa e tipos (anexar em `src/app/cadastro/auth.css`)**

```css
.auth-types { display: flex; flex-direction: column; gap: 0.4rem; border: 0; padding: 0; margin: 0; }
.map-picker { display: flex; flex-direction: column; gap: 0.4rem; }
.map-picker__hint { font-size: 0.8rem; color: #6b7280; }
.map-picker__map, .map-picker__loading { height: 260px; width: 100%; border-radius: 10px; }
.map-picker__loading { display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #6b7280; }
```

- [ ] **Step 3: Verificar tipos**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/components/EstablishmentFields.tsx src/app/cadastro/auth.css
git commit -m "feat(estabelecimento): componente de campos compartilhado"
```

---

### Task 7: Estabelecimento inline na /cadastro

**Files:**
- Modify: `src/app/cadastro/page.tsx` (mostrar `EstablishmentFields` quando role = ESTABLISHMENT_OWNER)
- Modify: `src/app/cadastro/actions.ts` (criar Establishment)

**Interfaces:**
- Consumes: `establishmentProfileSchema`, `EstablishmentFields`, `geocodeAddress`/`buildAddressQuery`, `uniqueSlug`, `put`.
- Produces: cadastro de estabelecimento cria o `Establishment` vinculado ao usuário.

- [ ] **Step 1: Mostrar os campos na página**

Em `src/app/cadastro/page.tsx`, adicionar o import:
```tsx
import { EstablishmentFields } from '@/components/EstablishmentFields'
```
Adicionar `const isEstab = role === 'ESTABLISHMENT_OWNER'` junto dos outros derivados. Após o bloco `{isBaba && (...)}`, inserir:
```tsx
          {isEstab && <EstablishmentFields showName={false} />}
```
(O nome da empresa usa o campo "Nome" da conta — por isso `showName={false}`.)

- [ ] **Step 2: Criar o estabelecimento na action**

Em `src/app/cadastro/actions.ts`, adicionar os imports:
```ts
import { establishmentProfileSchema } from '@/lib/validators'
import { geocodeAddress, buildAddressQuery } from '@/lib/address/geocode'
```
Adicionar a constante:
```ts
const PLACEHOLDER_ESTAB = '/estab-placeholder.svg'
```
Após o bloco de validação da babá (antes de `const existing = ...`), adicionar a validação do estabelecimento:
```ts
  let estabData: import('@/lib/validators').EstablishmentProfileInput | null = null
  if (role === 'ESTABLISHMENT_OWNER') {
    const ep = establishmentProfileSchema.safeParse({
      name,
      email,
      phone: formData.get('phone'),
      openingHours: formData.get('openingHours'),
      cep: formData.get('cep'),
      logradouro: formData.get('logradouro'),
      numero: formData.get('numero'),
      complemento: formData.get('complemento') ?? '',
      bairro: formData.get('bairro'),
      cidade: formData.get('cidade'),
      estado: formData.get('estado'),
      types: formData.getAll('types'),
      services: String(formData.get('services') ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
      lat: formData.get('lat') || undefined,
      lng: formData.get('lng') || undefined,
      photo: '',
    })
    if (!ep.success) {
      return { error: ep.error.issues[0]?.message ?? 'Dados do estabelecimento inválidos' }
    }
    estabData = ep.data
  }
```
Após criar o `user` (e o bloco da babá), adicionar a criação do estabelecimento:
```ts
  if (role === 'ESTABLISHMENT_OWNER' && estabData) {
    const photo = await uploadPhoto(formData.get('photo'))
    let lat = estabData.lat
    let lng = estabData.lng
    if (lat === undefined || lng === undefined) {
      const geo = await geocodeAddress(buildAddressQuery(estabData))
      lat = geo?.lat ?? -22.41
      lng = geo?.lng ?? -44.12
    }
    const slug = await uniqueSlug(estabData.name, async (s) => {
      const hit = await prisma.establishment.findUnique({ where: { slug: s } })
      return hit !== null
    })
    const address = `${estabData.logradouro}, ${estabData.numero}${estabData.complemento ? ' - ' + estabData.complemento : ''}, ${estabData.bairro}, ${estabData.cidade}/${estabData.estado}`
    await prisma.establishment.create({
      data: {
        slug, ownerId: user.id,
        type: estabData.types[0], types: estabData.types,
        name: estabData.name, phone: estabData.phone, email: estabData.email,
        lat, lng, address,
        cep: estabData.cep, logradouro: estabData.logradouro, numero: estabData.numero,
        complemento: estabData.complemento, bairro: estabData.bairro, cidade: estabData.cidade, estado: estabData.estado,
        openingHours: estabData.openingHours, services: estabData.services,
        bannerImage: photo, logoImage: photo, about: '',
      },
    })
  }
```

- [ ] **Step 3: Placeholder de imagem do estabelecimento**

```bash
cat > public/estab-placeholder.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#e5e7eb"/><text x="100" y="108" font-family="sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle">Sem imagem</text></svg>
SVG
```

- [ ] **Step 4: Verificar tipos + manual**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

Manual: `/cadastro` → escolher "Estabelecimento" → aparecem os campos + mapa. Criar conta → conferir em `/paradas-pets` que o marcador aparece.

- [ ] **Step 5: Commit**

```bash
git add src/app/cadastro/page.tsx src/app/cadastro/actions.ts public/estab-placeholder.svg
git commit -m "feat(cadastro): campos de estabelecimento inline + criação vinculada"
```

---

### Task 8: Editor de estabelecimento no painel

**Files:**
- Create: `src/app/painel/perfil-estabelecimento/page.tsx`, `actions.ts`, `EstabProfileForm.tsx`
- Modify: `src/app/painel/page.tsx` (link para ESTABLISHMENT_OWNER)
- Modify: `src/lib/queries/establishments.ts` (`getEstablishmentByOwner`)

**Interfaces:**
- Consumes: `requireUser`, `establishmentProfileSchema`, `EstablishmentFields`, `geocodeAddress`/`buildAddressQuery`, `uniqueSlug`, `put`.
- Produces: `getEstablishmentByOwner(ownerId)`; `saveEstablishmentProfile(_prev, formData)` (upsert por ownerId).

- [ ] **Step 1: `getEstablishmentByOwner` em `establishments.ts`**

```ts
export async function getEstablishmentByOwner(ownerId: string) {
  return prisma.establishment.findFirst({ where: { ownerId } })
}
```

- [ ] **Step 2: Action de salvar**

```ts
// src/app/painel/perfil-estabelecimento/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { establishmentProfileSchema } from '@/lib/validators'
import { uniqueSlug } from '@/lib/slug'
import { geocodeAddress, buildAddressQuery } from '@/lib/address/geocode'

export type EstabProfileState = { error?: string; ok?: boolean }

const PLACEHOLDER = '/estab-placeholder.svg'

export async function saveEstablishmentProfile(
  _prev: EstabProfileState,
  formData: FormData,
): Promise<EstabProfileState> {
  const user = await requireUser()
  if (user.role !== 'ESTABLISHMENT_OWNER') return { error: 'Apenas estabelecimentos podem editar este perfil.' }

  const parsed = establishmentProfileSchema.safeParse({
    name: formData.get('name'),
    email: user.name ? formData.get('email') : formData.get('email'),
    phone: formData.get('phone'),
    openingHours: formData.get('openingHours'),
    cep: formData.get('cep'),
    logradouro: formData.get('logradouro'),
    numero: formData.get('numero'),
    complemento: formData.get('complemento') ?? '',
    bairro: formData.get('bairro'),
    cidade: formData.get('cidade'),
    estado: formData.get('estado'),
    types: formData.getAll('types'),
    services: String(formData.get('services') ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
    lat: formData.get('lat') || undefined,
    lng: formData.get('lng') || undefined,
    photo: '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  const d = parsed.data

  let lat = d.lat
  let lng = d.lng
  if (lat === undefined || lng === undefined) {
    const geo = await geocodeAddress(buildAddressQuery(d))
    lat = geo?.lat ?? -22.41
    lng = geo?.lng ?? -44.12
  }
  const address = `${d.logradouro}, ${d.numero}${d.complemento ? ' - ' + d.complemento : ''}, ${d.bairro}, ${d.cidade}/${d.estado}`

  const file = formData.get('photo')
  let photo = PLACEHOLDER
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop() || 'jpg'
    const blob = await put(`fotos/${crypto.randomUUID()}.${ext}`, file, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN })
    photo = blob.url
  }

  const existing = await prisma.establishment.findFirst({ where: { ownerId: user.id } })
  const common = {
    type: d.types[0], types: d.types, name: d.name, phone: d.phone, email: d.email,
    lat, lng, address, cep: d.cep, logradouro: d.logradouro, numero: d.numero,
    complemento: d.complemento, bairro: d.bairro, cidade: d.cidade, estado: d.estado,
    openingHours: d.openingHours, services: d.services,
  }

  if (existing) {
    const data = file instanceof File && file.size > 0
      ? { ...common, bannerImage: photo, logoImage: photo }
      : common
    await prisma.establishment.update({ where: { id: existing.id }, data })
  } else {
    const slug = await uniqueSlug(d.name, async (s) => {
      const hit = await prisma.establishment.findUnique({ where: { slug: s } })
      return hit !== null
    })
    await prisma.establishment.create({
      data: { slug, ownerId: user.id, ...common, bannerImage: photo, logoImage: photo, about: '' },
    })
  }

  revalidatePath('/paradas-pets')
  return { ok: true }
}
```

- [ ] **Step 3: Formulário client**

```tsx
// src/app/painel/perfil-estabelecimento/EstabProfileForm.tsx
'use client'

import { useActionState } from 'react'
import type { Establishment } from '@prisma/client'
import { saveEstablishmentProfile, type EstabProfileState } from './actions'
import { EstablishmentFields } from '@/components/EstablishmentFields'

export function EstabProfileForm({ estab }: { estab: Establishment | null }) {
  const [state, formAction, pending] = useActionState<EstabProfileState, FormData>(saveEstablishmentProfile, {})

  return (
    <form className="auth-form" action={formAction} encType="multipart/form-data">
      <label className="auth-label">
        E-mail de contato
        <input type="email" name="email" className="auth-input" defaultValue={estab?.email ?? ''} required />
      </label>
      <EstablishmentFields
        showName
        defaults={estab ? {
          name: estab.name, phone: estab.phone, cep: estab.cep, logradouro: estab.logradouro,
          numero: estab.numero, complemento: estab.complemento, bairro: estab.bairro,
          cidade: estab.cidade, estado: estab.estado, openingHours: estab.openingHours,
          services: estab.services, types: estab.types,
        } : undefined}
      />
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state.ok && <p className="painel__ok" role="status">Perfil salvo! Já aparece em /paradas-pets.</p>}
      <button type="submit" className="btn btn-green auth-submit" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar perfil'}
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Página do editor**

```tsx
// src/app/painel/perfil-estabelecimento/page.tsx
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getEstablishmentByOwner } from '@/lib/queries/establishments'
import { EstabProfileForm } from './EstabProfileForm'
import '../../cadastro/auth.css'
import '../painel.css'

export default async function PerfilEstabPage() {
  const user = await requireUser()
  if (user.role !== 'ESTABLISHMENT_OWNER') redirect('/painel')

  const estab = await getEstablishmentByOwner(user.id)

  return (
    <main className="page painel">
      <h1 className="painel__title">Meu estabelecimento</h1>
      <p className="painel__lead">Preencha os dados. Eles aparecem no mapa de paradas pet.</p>
      <EstabProfileForm estab={estab} />
    </main>
  )
}
```

- [ ] **Step 5: Link no painel**

Em `src/app/painel/page.tsx`, trocar o bloco
```tsx
      {user.role === 'ESTABLISHMENT_OWNER' && (
        <p className="painel__hint">A edição do perfil de estabelecimento chega em breve.</p>
      )}
```
por
```tsx
      {user.role === 'ESTABLISHMENT_OWNER' && (
        <Link href="/painel/perfil-estabelecimento" className="btn btn-green">
          Editar meu estabelecimento
        </Link>
      )}
```

- [ ] **Step 6: Verificar tipos + manual**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

Manual: logar como estabelecimento, `/painel` → "Editar meu estabelecimento" → salvar → conferir em `/paradas-pets`.

- [ ] **Step 7: Commit**

```bash
git add src/app/painel/perfil-estabelecimento src/app/painel/page.tsx src/lib/queries/establishments.ts
git commit -m "feat(estabelecimento): editor no painel com upsert vinculado"
```

---

## Self-Review

**Cobertura do spec (Fase 3) + pedido tudo-na-cadastro:**
- `types[]` multi-seleção + migração aditiva preservando `type` → Tasks 1, 2. ✓
- Endereço estruturado, `openingHours`, `services` → Task 1. ✓
- `/paradas-pets` filtra por `types` → Task 2. ✓
- Geocoding + pino ajustável → Tasks 3, 5; coords do pino prevalecem, senão geocode no servidor → Tasks 7, 8. ✓
- Campos do estabelecimento na própria `/cadastro` → Tasks 6, 7. ✓
- Foto via Blob (server-side, sem depender de auth na cadastro) → Tasks 7, 8. ✓
- Criação vinculada ao `ownerId` + slug único + publicação imediata → Tasks 7, 8. ✓
- Editor no painel para edição posterior → Task 8. ✓

**Placeholders:** nenhum; todo passo traz código completo.

**Consistência de tipos:** `establishmentProfileSchema`/`establishmentTypeValues` (Task 4) usados em 6, 7, 8; `geocodeAddress`/`buildAddressQuery` (Task 3) em 7, 8; `MapPicker` grava `lat`/`lng` (Task 5) lidos em 7, 8; `EstablishmentFields` (Task 6) usado em 7, 8; `type`/`types` consistentes (primário = `types[0]`).

**Observação (Task 8, Step 2):** a linha do `email` foi simplificada para `email: formData.get('email')` — o ternário no rascunho é redundante; usar diretamente `formData.get('email')`.

**Fora deste plano:** /emergencia (plano próprio); exibir múltiplos tipos/serviços/horário na página pública do estabelecimento (melhoria futura — a página atual já funciona com o tipo primário).
