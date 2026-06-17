# Cadastro com perfis + perfis vinculados ao usuário

**Data:** 2026-06-17
**Status:** Aprovado (aguardando revisão do spec)

## Objetivo

No `/cadastro`, o usuário escolhe um perfil — **babá**, **estabelecimento** ou
**usuário comum**. Babá e estabelecimento ganham uma área logada onde preenchem
seus próprios dados. Esses perfis passam a aparecer em `/babas` (babá) e
`/paradas-pets` (estabelecimento), agora **vinculados ao usuário que os criou**.

## Estado atual (o que já existe)

- `Role` enum: `CUSTOMER`, `BABA`, `ESTABLISHMENT_OWNER`, `ADMIN`. O papel já
  viaja na sessão via JWT (`src/lib/auth.config.ts`).
- `Baba` e `Establishment` já têm `ownerId String?` → `User` (relações
  `BabaOwner` / `EstablishmentOwner`). O vínculo já existe na estrutura; os dados
  semeados estão com `ownerId` nulo.
- `/cadastro` cria apenas `CUSTOMER` (`src/app/cadastro/actions.ts`).
- `Baba.location` e `Establishment.address` são uma única string (sem endereço
  estruturado).
- `Establishment.type` é único (`EstablishmentType`).
- `/paradas-pets` plota estabelecimentos por `lat/lng`. `/babas` é uma lista (sem
  mapa).
- Não existe área logada (painel/perfil) para editar dados.

## Decisões tomadas

- **Coordenadas do estabelecimento:** geocodificar o endereço (Nominatim/OSM,
  grátis) **e** mostrar um pino arrastável no mapa para o dono corrigir.
- **Foto:** upload de arquivo via **Vercel Blob** (`@vercel/blob`,
  `BLOB_READ_WRITE_TOKEN`).
- **Papel:** **um papel por conta**, escolhido no cadastro (combina com o campo
  único `Role`).
- **Publicação:** o perfil **aparece na hora** após ser salvo (sem moderação no
  MVP).
- **Horário de funcionamento:** texto livre no MVP (estruturar por dia depois).
- **Serviços oferecidos:** lista de tags simples (`String[]`), não os campos
  granulares de exames/vacinas já existentes.

## Mudanças no schema

### `Baba` (sem coordenadas — `/babas` é lista)
- Adicionar: `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`,
  `estado` (UF).
- Adicionar: `animalsCared String` (texto longo — "quais animais cuida").
- Manter `photo`, `bio` (breve descrição), `name`. `location` continua
  preenchido automaticamente (ex.: "Cidade/UF") para exibição na lista.

### `Establishment` (com coordenadas — `/paradas-pets` é mapa)
- Adicionar os mesmos campos de endereço estruturado.
- **`type` → `types EstablishmentType[]`** (multi-seleção). Migração copia o tipo
  único atual para o array.
- Adicionar `openingHours String` e `services String[]`.
- `lat/lng` já existem — preenchidos por geocoding + pino ajustável.

> Migração de dados existente: para cada `Establishment`, `types = [type]`.
> `address`/`location` continuam preenchidos (derivados do endereço estruturado
> no save) para os popups e a lista atuais.

## Infra compartilhada (isolada e testável)

- `src/lib/address/viacep.ts` — `lookupCep(cep)` → ViaCEP, retorna
  `{ logradouro, bairro, cidade, uf }`. Parser puro e testável.
- `src/lib/address/geocode.ts` — `geocodeAddress(addr)` → Nominatim, retorna
  `{ lat, lng } | null`. Usado só no fluxo de estabelecimento.
- `src/lib/upload/blob.ts` + route handler `/api/upload` — upload via
  `@vercel/blob`. Requer `BLOB_READ_WRITE_TOKEN` (infra nova).
- Componentes client: `<CepAddressFields>` (compartilhado) e `<PhotoUpload>`.
- UF em `<select>` com as 27 unidades federativas.

## Fluxo de cadastro (`/cadastro`)

1. Adiciona escolha de perfil (3 opções: babá / estabelecimento / usuário comum).
2. `register()` cria o `User` com `role` correspondente (hoje força CUSTOMER).
3. Após cadastro + login automático: comum → `/`; babá/estabelecimento →
   redireciona para o editor de perfil correspondente.

## Área logada (painel)

- Rota `/painel` (Server Component, protegida por `auth()` + checagem de papel).
- Babá → `/painel/perfil-baba`: foto, nome, CEP+endereço, breve descrição,
  animais que cuida.
- Estabelecimento → `/painel/perfil-estabelecimento`: foto, nome da empresa,
  CEP+endereço, mapa com pino ajustável, horário, serviços, **tipos
  (checkboxes múltiplos)**.
- Salvar = Server Action que faz `upsert` de `Baba`/`Establishment` com
  `ownerId = session.user.id`, gera `slug` único a partir do nome e (estab.)
  grava `lat/lng`. Como "aparece na hora", o perfil entra nas listagens públicas
  logo após salvar.

## Impacto nas rotas públicas

- `/babas`: a query já lê de `Baba`; passa a exibir os perfis criados pelos
  usuários. Sem mudança de query.
- `/paradas-pets`: o `PetMap` migra de `e.type` → `e.types[]` em 3 pontos:
  filtro `visible`, `initialFilter` e a seleção da emergência (clinica/hospital).

## Validação, erros e testes

- Zod schemas para babá e estabelecimento em `src/lib/validators.ts`.
- Falhas graciosas: CEP inválido → mensagem; geocode falha → pino fica no centro
  para ajuste manual; upload falha → erro no campo foto.
- Testes (vitest) no que é puro: parser do ViaCEP, geração de slug único,
  montagem do endereço formatado e o mapeamento `type→types` (filtro do mapa).

## Fases de implementação

- **Fase 0 — Base:** migrations (endereço estruturado, `animalsCared`,
  `openingHours`, `services`, `types[]`), helpers ViaCEP/geocode, upload Blob.
- **Fase 1 — Cadastro com perfil:** seleção de papel + criação do User.
- **Fase 2 — Área da babá:** editor que alimenta `/babas`.
- **Fase 3 — Área do estabelecimento:** editor (multi-tipo, horário, pino) que
  alimenta `/paradas-pets`, incluindo a migração `type→types` no `PetMap`.

## Fora de escopo (MVP)

- Moderação/aprovação de perfis.
- Múltiplos perfis por conta.
- Horário estruturado por dia da semana.
- Mapa na rota `/babas`.
