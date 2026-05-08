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
