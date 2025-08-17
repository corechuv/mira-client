export type Product = {
  id: string;
  slug: string;
  title: string;
  category: "Электроника" | "Одежда" | "Дом" | "Спорт" | "Косметология" | "Витамины"; // 1-й уровень
  sub?: string;   // 2-й уровень (например: "Аудио")
  leaf?: string;  // 3-й уровень (например: "Наушники")
  price: number;
  rating: number;
  short: string;
  description: string;
  imageUrl?: string;
};

export const products: Product[] = [
  {
    id: "p-1",
    slug: "neon-headphones",
    title: "Неоновые наушники",
    category: "Электроника",
    sub: "Аудио",
    leaf: "Наушники",
    price: 33,
    rating: 4.7,
    short: "Глубокий бас и розовый акцент.",
    description: "Беспроводные наушники с активным шумодавом, зарядом до 30 часов и мягкими амбушюрами."
  },
  {
    id: "p-2",
    slug: "sleek-jacket",
    title: "Куртка Sleek",
    category: "Одежда",
    sub: "Верхняя одежда",
    leaf: "Куртки",
    price: 340,
    rating: 4.8,
    short: "Минимализм: чёрный + белый.",
    description: "Ветро- и влагозащита, мягкая подкладка, карманы с молниями и аккуратный силуэт."
  },
  {
    id: "p-3",
    slug: "smart-lamp",
    title: "Лампа Smart Glow",
    category: "Дом",
    sub: "Освещение",
    leaf: "Настольные лампы",
    price: 30,
    rating: 4.6,
    short: "Тёплый свет и управление с телефона.",
    description: "Поддержка сценариев, таймеров и режимов освещения. Потребление энергии снижено на 40%."
  },
  {
    id: "p-4",
    slug: "fitness-band",
    title: "Фитнес-браслет Pulse X",
    category: "Спорт",
    sub: "Носимая электроника",
    leaf: "Браслеты",
    price: 20,
    rating: 4.5,
    short: "Пульс, сон и активность 24/7.",
    description: "Экран AMOLED, водозащита 5АТМ, уведомления и точный шагомер."
  },
  {
    id: "p-5",
    slug: "minimal-sneakers",
    title: "Кроссовки Minimal",
    category: "Одежда",
    sub: "Обувь",
    leaf: "Кроссовки",
    price: 10,
    rating: 4.4,
    short: "Лёгкие и универсальные.",
    description: "Дышащая сетка, амортизация и устойчивость. Отлично для города."
  },
  {
    id: "p-6",
    slug: "compact-speaker",
    title: "Колонка Compact Boom",
    category: "Электроника",
    sub: "Аудио",
    leaf: "Колонки",
    price: 443,
    rating: 4.2,
    short: "Громкий звук при малом размере.",
    description: "Bluetooth 5.3, защита IP67, 12 часов музыки. Зарядка USB-C."
  },
  {
    id: "p-7",
    slug: "multivitamins",
    title: "Sports Research, Phytoceramides Mini-Gels, 350 mg, 30 Softgels",
    category: "Витамины",
    price: 23.71,
    rating: 4.5,
    short: "Комплекс витаминов для поддержания здоровья.",
    description: "350 mg Per Serving Supports Skin Hydration CeratiQ® Dietary Supplement Quality Matters: Igen Non-GMO Tested Gluten Free Third Party Tested cGMP Compliant SR® Phytoceramides with Lipowheat® is rich in glycosylceramides, phytoceramides and glycolipids, which may help support skin hydration when taken directed.",
    imageUrl: "https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/sre/sre00412/v/55.jpg"
  }
];
