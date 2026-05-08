# Adoção, Campanhas e BuscaPet — Design

## Contexto

As três rotas `/adocao`, `/campanhas` e `/buscapet` foram criadas durante a migração Vite → Next.js como placeholders renderizando `<EmBreve title="…" />`. O usuário pediu pra remover o estado "em breve" e deixar essas telas com conteúdo real, no mesmo padrão demo já estabelecido para `/babas` e `/estabelecimento` (dados via seed, sem admin/form de submissão por ora).

**Escopo MVP:** apenas leitura. Conteúdo entra via `prisma db seed`. Sem tela admin, sem submissão pública, sem busca avançada. O objetivo é parar de exibir `EmBreve` e ter um catálogo navegável que casa visualmente com o restante do site.

## Decisões

- **Modelos isolados, não polimórficos.** `Adoptable`, `Campaign`, `BuscaPetPost` são tabelas separadas. Cada uma tem semântica e campos próprios; tentar abstrair em uma tabela "Listing" genérica adiciona complexidade sem ganho real (são só 3 entidades).
- **Slug como chave pública** (mesmo padrão de `Baba` e `Establishment`). URLs limpas (`/adocao/luna-2-anos`) e estáveis se o id interno mudar.
- **Sem reviews/avaliações.** Adoptable e Campaign não têm reviews. BuscaPetPost também não — não faz sentido pra mural de perdidos/encontrados.
- **Contato por WhatsApp + email.** Mesmo padrão recém-aplicado em `/babas/[id]`. Helper `whatsappLink()` extraído pra `src/lib/whatsapp.ts` (compartilhado com a baba).
- **Server Components + Client Components apenas onde precisa interatividade.** As listas são Server Components com `await getAll()`. Em BuscaPet, o filtro Perdido/Encontrado é via Client Component minimal (mesmo padrão de `BabasList`).
- **Status como nullable timestamp em vez de enum.** Pra Adoptable e BuscaPetPost, "adotado" e "resolvido" viram `adoptedAt: DateTime?` e `resolvedAt: DateTime?` (em vez de enum status). Pra Campaign, mantenho enum `CampaignStatus` porque "ativa/encerrada" não tem timestamp natural.

## Schema Prisma

Adicionar ao final de `prisma/schema.prisma`:

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
  id                  String         @id @default(cuid())
  slug                String         @unique
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
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  @@index([type])
  @@index([resolvedAt])
}
```

Reutilizo `AdoptableSpecies` em `BuscaPetPost` — mesmo dicionário de espécies, sem duplicar enum.

## Estrutura de arquivos

```
prisma/
  schema.prisma                   # +3 models, +5 enums
  seed-data-extras.ts             # NOVO: dados demo de adoção/campanhas/buscapet
  seed.ts                         # +3 blocos de upsert chamando seed-data-extras
src/
  lib/
    whatsapp.ts                   # NOVO: helper whatsappLink(phone)
    queries/
      adocao.ts                   # NOVO: getAllAdoptables, getAdoptableBySlug
      campanhas.ts                # NOVO: getAllCampaigns, getCampaignBySlug
      buscapet.ts                 # NOVO: getAllBuscaPetPosts, getBuscaPetPostBySlug
  app/
    adocao/
      page.tsx                    # SUBSTITUIR EmBreve por lista (Server Component)
      adocao.css                  # NOVO
      [slug]/
        page.tsx                  # NOVO: perfil do pet adotável
        profile.css               # NOVO
    campanhas/
      page.tsx                    # SUBSTITUIR EmBreve por lista
      campanhas.css               # NOVO
      [slug]/
        page.tsx                  # NOVO: detalhe da campanha
        profile.css               # NOVO
    buscapet/
      page.tsx                    # SUBSTITUIR EmBreve por lista (Server) + filtro (Client)
      BuscaPetList.tsx            # NOVO: client component com toggle perdido/encontrado
      buscapet.css                # NOVO
      [slug]/
        page.tsx                  # NOVO: detalhe do post
        profile.css               # NOVO
  app/babas/[id]/page.tsx         # ajuste mínimo: usar src/lib/whatsapp.ts
```

## Padrões de UI

**Lista (todas as 3):**
- Hero curto: título + subtítulo (1-2 linhas) — mesmo estilo de `babas-hero`
- Grid de cards: foto à esquerda ou no topo, título, metadados, botão "Ver detalhes"
- Cada card é `<Link>` pro detalhe (slug)

**Detalhe (todas as 3):**
- Hero com foto/banner grande
- Título + metadados (espécie, idade, local, datas)
- Sobre / descrição
- CTA: WhatsApp + email (Adoção e BuscaPet) ou botão externo "Mais informações" (Campanhas, se `infoUrl`)
- Link de volta pra lista

**BuscaPet específico:**
- Filtro toggle "Perdidos" / "Encontrados" / "Todos" no topo da lista
- Badge no card indicando tipo (cor: vermelho pra perdido, verde pra encontrado)
- Sinalização "Resolvido" se `resolvedAt` setado (card cinza/desfocado)

## Comportamento de filtragem

- **Adoção:** ordem `createdAt desc`, **excluir** itens com `adoptedAt != null` da lista pública (manter no banco pra histórico, não exibir).
- **Campanhas:** ordem composta — primeiro `status` (`ativa` antes de `encerrada`), depois `startsAt desc`. Encerradas aparecem no fim da lista com badge "Encerrada" e card esmaecido.
- **BuscaPet:** ordem `createdAt desc`, mostrar todas; itens com `resolvedAt != null` ficam visíveis mas com estilo "esmaecido" + badge "Reconectado". Filtro toggle de 3 estados ("Todos" / "Perdidos" / "Encontrados"), default "Todos".

## Helper compartilhado: `src/lib/whatsapp.ts`

```ts
export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
}
```

`/babas/[id]/page.tsx` que hoje tem essa função inline passa a importar daqui.

## Seed (dados demo)

`prisma/seed-data-extras.ts` exporta 3 arrays. Conteúdo fictício em estilo Vale do Paraíba (mesma vibe dos establishments):

- **6 Adoptables**: 3 cães + 2 gatos + 1 "outro" (coelho). Cidades: Barra Mansa, Volta Redonda, Quatis, Pinheiral.
- **4 Campaigns**: 3 ativas (vacinação gratuita, castração, doação de ração) + 1 encerrada.
- **5 BuscaPetPosts**: 3 perdidos (sendo 1 com `resolvedAt`) + 2 encontrados.

Todas as fotos via `images.unsplash.com` (já configurado em `next.config.ts`).

`prisma/seed.ts` adiciona 3 blocos de upsert depois dos blocos atuais (establishments, babas, admin):

```ts
import { adoptables, campaigns, buscaPetPosts } from './seed-data-extras'

// ... após blocos atuais

for (const a of adoptables) {
  await prisma.adoptable.upsert({
    where: { slug: a.slug },
    create: a,
    update: { ...a },
  })
}
// idem para campaigns e buscaPetPosts
```

## Erro / not found

`notFound()` do `next/navigation` em todas as detail pages quando `findUnique` retorna null (mesmo padrão de `/babas/[id]`).

## Trade-offs aceitos / fora de escopo

- **Sem tela admin**: cadastrar conteúdo novo requer rodar seed ou abrir Prisma Studio. Quando o usuário decidir adicionar moderação/CRUD, vira um spec separado (escopo grande, envolve role-based access).
- **Sem submissão pública** (ex: dono postar pet perdido). O modelo de dados está pronto pra receber via form quando vier.
- **Sem busca textual nem filtros avançados** (espécie, porte, raça, cidade). O `BuscaPet` ganha só toggle de tipo pra ter algo interativo. Outros filtros ficam pra depois.
- **Sem detalhes ricos**: galeria, vídeos, mapa do local de visualização, perfil do organizador da campanha. Fora de escopo.
- **Reaproveitamento de CSS**: usar classes globais (`.btn`, `.btn-green`, `.btn-orange`) e replicar variantes locais (`adocao-card`, `campaign-card`, `buscapet-card`) sem extrair componentes. Vale extrair quando aparecer a 3ª variante muito similar.

## Critérios de sucesso

- [ ] Migration aplicada no Neon, gera 3 tabelas + 5 enums.
- [ ] `npx prisma db seed` cria 6 adoptables + 4 campaigns + 5 buscapet posts.
- [ ] `/adocao` lista 6 cards com foto + nome + espécie + idade + local + botão.
- [ ] `/adocao/<slug>` mostra detalhe com hero + descrição + CTAs WhatsApp/email.
- [ ] `/campanhas` lista 4 cards (3 ativas em destaque, 1 encerrada esmaecida).
- [ ] `/campanhas/<slug>` mostra detalhe com banner + descrição + datas + botão "Mais informações" se `infoUrl`.
- [ ] `/buscapet` lista 5 cards com badges Perdido/Encontrado, filtro toggle muda a lista.
- [ ] `/buscapet/<slug>` mostra detalhe com foto + tipo + último local + descrição + CTAs.
- [ ] Helper `whatsappLink()` em `src/lib/whatsapp.ts` e `/babas/[id]` usa esse helper.
- [ ] `npm test` passa (não adiciona testes novos — escopo é UI fetcher, não lógica testável).
- [ ] `npm run build` passa.
- [ ] Deploy production no Vercel: as 3 rotas + 3 detail routes respondem 200.
- [ ] Nenhuma rota usa `EmBreve` mais (`grep -r "EmBreve" src/app` retorna vazio em /adocao, /campanhas, /buscapet).
