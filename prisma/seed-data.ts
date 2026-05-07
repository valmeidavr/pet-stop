export type EstablishmentType =
  | "loja"
  | "clinica"
  | "farmacia"
  | "hospital"
  | "banho_tosa";

export interface Review {
  author: string;
  date: string;
  rating: number;
  text: string;
}

export interface Establishment {
  id: string;
  type: EstablishmentType;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  email: string;
  rating: number;
  bannerImage: string;
  logoImage: string;
  publicPrivate?: "publico" | "privado";
  about: string;
  plans?: string[];
  exams?: string[];
  vaccines?: string[];
  medications?: string[];
  professionals?: { name: string; specialty: string }[];
  shopServices?: string[];
  samplePrices?: { item: string; price: string }[];
  galleryImages: string[];
  testimonials: Review[];
}

export interface Baba {
  id: string;
  name: string;
  photo: string;
  rating: number;
  reviewCount: number;
  location: string;
  phone: string;
  email: string;
  bio: string;
  reviews: Review[];
}

/**
 * Estabelecimentos fictícios — Barra Mansa, Volta Redonda, Pinheiral e Quatis
 * (clínicas, pet shops, farmácias pet e salões de banho e tosa).
 */
export const establishments: Establishment[] = [
  {
    id: "clinica-vet-bm",
    type: "clinica",
    name: "Clínica Veterinária Vale do Paraíba (BM)",
    lat: -22.5442,
    lng: -44.1718,
    address: "Rua Floriano Peixoto, 412 — Centro, Barra Mansa — RJ",
    phone: "(24) 3322-1101",
    email: "contato@vetvalebm.demo",
    rating: 4.7,
    bannerImage:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
    publicPrivate: "privado",
    about:
      "Clínica fictícia para demonstração no mapa Pet Stop — consultas, vacinas e pequenas cirurgias.",
    plans: ["Particular", "Convênio demo"],
    exams: ["Hemograma", "Bioquímico", "Ultrassom"],
    vaccines: ["V10", "Antirrábica", "Gripe"],
    medications: ["Antiparasitários", "Antibióticos"],
    professionals: [
      { name: "Dra. Helena Prado", specialty: "Clínica geral" },
      { name: "Dr. Otávio Reis", specialty: "Cirurgia" },
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
    ],
    testimonials: [
      {
        author: "Cliente demo",
        date: "01/05/2026",
        rating: 5,
        text: "Exemplo de avaliação — dados não reais.",
      },
    ],
  },
  {
    id: "pet-shop-cidade-bm",
    type: "loja",
    name: "Pet Shop Cidade Industrial (BM)",
    lat: -22.5495,
    lng: -44.1662,
    address: "Av. Joaquim Leite, 880 — Cidade Industrial, Barra Mansa — RJ",
    phone: "(24) 3322-2202",
    email: "loja@cidadeindustrialpet.demo",
    rating: 4.5,
    bannerImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad2b8?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    about:
      "Pet shop fictício — rações, acessórios, banho e tosa (demonstração Pet Stop).",
    shopServices: ["Banho e tosa", "Hidratação", "Tosa na tesoura"],
    samplePrices: [
      { item: "Ração 15kg (demo)", price: "R$ 199,00" },
      { item: "Banho médio porte", price: "R$ 65,00" },
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    ],
    testimonials: [
      {
        author: "Cliente demo",
        date: "10/05/2026",
        rating: 4.5,
        text: "Exemplo — estabelecimento fictício.",
      },
    ],
  },
  {
    id: "clinica-patinhas-vr",
    type: "clinica",
    name: "Clínica Patinhas Volta Redonda",
    lat: -22.5208,
    lng: -44.0965,
    address: "Av. Sávio Cota de Almeida Gama, 350 — Aterrado, Volta Redonda — RJ",
    phone: "(24) 3344-3303",
    email: "ola@patinhasvr.demo",
    rating: 4.8,
    bannerImage:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
    about:
      "Clínica veterinária fictícia em Volta Redonda — atendimento demo no mapa.",
    exams: ["Raio-X", "Hemograma", "Ecodopplercardiograma (demo)"],
    vaccines: ["V8", "V10", "Antirrábica"],
    professionals: [
      { name: "Dr. Marcos Vieira", specialty: "Clínica geral" },
    ],
    galleryImages: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400",
    ],
    testimonials: [],
  },
  {
    id: "pet-mundo-vr",
    type: "loja",
    name: "Mundo Pet Volta Redonda",
    lat: -22.5264,
    lng: -44.1088,
    address: "Rua 7 de Setembro, 1.020 — Vila Santa Cecília, Volta Redonda — RJ",
    phone: "(24) 3344-4404",
    email: "contato@mundopetvr.demo",
    rating: 4.4,
    bannerImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad2b8?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    about: "Pet shop fictício — produtos e serviços de estética para pets (demo).",
    shopServices: ["Spa pet", "Banho medicamentoso", "Tosa higiênica"],
    samplePrices: [
      { item: "Antipulgas (demo)", price: "R$ 79,90" },
      { item: "Ração filhotes 3kg", price: "R$ 89,00" },
    ],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "clinica-centro-pinheiral",
    type: "clinica",
    name: "Centro Vet Pinheiral",
    lat: -22.5112,
    lng: -43.9978,
    address: "Rua Prefeito Tibério Barbosa, 155 — Centro, Pinheiral — RJ",
    phone: "(24) 3355-5505",
    email: "agenda@centrovetpinheiral.demo",
    rating: 4.6,
    bannerImage:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
    about: "Clínica veterinária fictícia em Pinheiral — dados apenas para demonstração.",
    exams: ["Ultrassom", "Hemograma"],
    vaccines: ["Gripe felina", "Antirrábica"],
    professionals: [
      { name: "Dra. Carla Nunes", specialty: "Felinos" },
    ],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "pet-cia-pinheiral",
    type: "loja",
    name: "Pet & Cia Pinheiral",
    lat: -22.5146,
    lng: -44.0055,
    address: "Av. Governador Portela, 2.040 — Califórnia, Pinheiral — RJ",
    phone: "(24) 3355-6606",
    email: "vendas@petciapinheiral.demo",
    rating: 4.3,
    bannerImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad2b8?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    about: "Pet shop fictício em Pinheiral — mapa Pet Stop (demo).",
    shopServices: ["Banho", "Tosa", "Hidratação"],
    samplePrices: [{ item: "Banho grande porte", price: "R$ 95,00" }],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "clinica-saude-quatis",
    type: "clinica",
    name: "Vet Saúde Quatis",
    lat: -22.2568,
    lng: -44.2515,
    address: "Rua Cel. Otávio de Miranda, 78 — Centro, Quatis — RJ",
    phone: "(24) 3366-7707",
    email: "contato@vetsaudequatis.demo",
    rating: 4.5,
    bannerImage:
      "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
    about: "Clínica veterinária fictícia em Quatis — demonstração Pet Stop.",
    exams: ["Bioquímico", "Raio-X"],
    vaccines: ["V10", "V8"],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "pet-banho-quatis",
    type: "loja",
    name: "Banho & Tosa do Vale (Quatis)",
    lat: -22.2515,
    lng: -44.2642,
    address: "Av. Dr. Avelino de Souza, 410 — Morro da Glória, Quatis — RJ",
    phone: "(24) 3366-8808",
    email: "agenda@banhovalequatis.demo",
    rating: 4.2,
    bannerImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad2b8?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    about: "Pet shop fictício em Quatis — serviços demo no mapa.",
    shopServices: ["Tosa na tesoura", "Spa", "Escovação de dentes (demo)"],
    samplePrices: [{ item: "Pacote banho+tosa", price: "R$ 120,00" }],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "farmacia-pet-bm",
    type: "farmacia",
    name: "Farmácia Pet Saúde Barra Mansa",
    lat: -22.541,
    lng: -44.1785,
    address: "Rua Osvaldo Cruz, 305 — Centro, Barra Mansa — RJ",
    phone: "(24) 3322-9900",
    email: "vendas@farmacapetbm.demo",
    rating: 4.4,
    bannerImage:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop",
    about:
      "Farmácia pet fictícia — medicamentos, antiparasitários e orientação (demonstração).",
    medications: ["Antiparasitários", "Antibióticos com receita", "Shampoos medicamentosos"],
    samplePrices: [
      { item: "Vermífugo combo (demo)", price: "R$ 42,00" },
      { item: "Colírio veterinário", price: "R$ 38,00" },
    ],
    shopServices: ["Manipulação sob encomenda (demo)", "Entrega local"],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "farmacia-vet-vr",
    type: "farmacia",
    name: "Farmácia Veterinária do Vale (VR)",
    lat: -22.5185,
    lng: -44.0912,
    address: "Av. Amaral Peixoto, 1.240 — Vila Mãe Catira, Volta Redonda — RJ",
    phone: "(24) 3344-9911",
    email: "contato@farmvalevr.demo",
    rating: 4.5,
    bannerImage:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop",
    about: "Farmácia pet fictícia em Volta Redonda — dados para mapa demo.",
    medications: ["Suplementos", "Homeopatia (demo)"],
    samplePrices: [
      { item: "Ração medicamentosa 2kg", price: "R$ 112,00" },
      { item: "Pomada dermatológica", price: "R$ 56,00" },
    ],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "spa-banhos-bm",
    type: "banho_tosa",
    name: "Spa Banhos & Tosa Barra Mansa",
    lat: -22.5468,
    lng: -44.1635,
    address: "Rua Anita Garibaldi, 92 — Vila Mury, Barra Mansa — RJ",
    phone: "(24) 3322-7788",
    email: "agenda@spabanhosbm.demo",
    rating: 4.6,
    bannerImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad2b8?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    about:
      "Salão fictício especializado em banho, tosa e estética pet (demonstração Pet Stop).",
    shopServices: [
      "Banho e tosa",
      "Tosa higiênica",
      "Spa relaxante",
      "Desembaraço",
    ],
    samplePrices: [
      { item: "Banho pequeno porte", price: "R$ 55,00" },
      { item: "Tosa completa médio", price: "R$ 85,00" },
    ],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "estilo-pet-vr",
    type: "banho_tosa",
    name: "Estilo Pet Estética (Volta Redonda)",
    lat: -22.5298,
    lng: -44.1025,
    address: "Rua Cinco, 318 — Conforto, Volta Redonda — RJ",
    phone: "(24) 3344-6677",
    email: "ola@estilopetvr.demo",
    rating: 4.7,
    bannerImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad2b8?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    about: "Estética canina e felina fictícia — banho e tosa (mapa demo).",
    shopServices: ["Banho e tosa", "Hidratação de pelos", "Tosa na tesoura"],
    samplePrices: [
      { item: "Pacote spa completo", price: "R$ 140,00" },
      { item: "Corte higiênico", price: "R$ 45,00" },
    ],
    galleryImages: [],
    testimonials: [],
  },
  {
    id: "patas-limpas-pinheiral",
    type: "banho_tosa",
    name: "Patas Limpas Banho e Tosa (Pinheiral)",
    lat: -22.5095,
    lng: -44.0028,
    address: "Rua Cel. João Dias, 45 — Centro, Pinheiral — RJ",
    phone: "(24) 3355-5544",
    email: "contato@pataslimpasp.demo",
    rating: 4.5,
    bannerImage:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad2b8?w=1200",
    logoImage:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop",
    about: "Salão de banho e tosa fictício em Pinheiral — demonstração.",
    shopServices: ["Banho e tosa", "Escovação", "Perfume pet"],
    samplePrices: [{ item: "Banho + tosa médio", price: "R$ 95,00" }],
    galleryImages: [],
    testimonials: [],
  },
];

export const babas: Baba[] = [
  {
    id: "ana-silva",
    name: "Ana Silva",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 42,
    location: "Centro, Petrópolis — RJ",
    phone: "(24) 98765-4321",
    email: "ana.silva@email.com",
    bio:
      "Sou babá pet há 8 anos, com certificação em primeiros socorros para animais. Adoro passeios longos, brincadeiras e rotinas que deixam o pet tranquilo na ausência da família. Trabalho com cães e gatos de todos os portes.",
    reviews: [
      {
        author: "Mariana O.",
        date: "15/03/2026",
        rating: 5,
        text: "A Ana cuidou da nossa golden com muito amor. Recomendo!",
      },
      {
        author: "Pedro H.",
        date: "02/03/2026",
        rating: 4.8,
        text: "Profissional e sempre manda fotos durante o dia.",
      },
    ],
  },
  {
    id: "beatriz-oliveira",
    name: "Beatriz Oliveira",
    photo:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 28,
    location: "Granja Guarani, Teresópolis — RJ",
    phone: "(24) 97654-3210",
    email: "bia.pets@email.com",
    bio:
      "Especializada em pets idosos e com necessidades especiais. Ofereço medicação no horário, passeios leves e companhia afetuosa.",
    reviews: [
      {
        author: "Cláudia R.",
        date: "10/03/2026",
        rating: 5,
        text: "Cuidou do nosso sênior com paciência infinita.",
      },
    ],
  },
  {
    id: "camila-ferreira",
    name: "Camila Ferreira",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 19,
    location: "Conselheiro Paulino, Nova Friburgo — RJ",
    phone: "(24) 96543-2109",
    email: "camila.ferreira@email.com",
    bio:
      "Amo pets exóticos e cães de porte pequeno. Incluo enriquecimento ambiental e treino básico de rotina.",
    reviews: [
      {
        author: "Lucas T.",
        date: "22/02/2026",
        rating: 4.5,
        text: "Ótima com nosso hamster e nosso pug.",
      },
    ],
  },
];

