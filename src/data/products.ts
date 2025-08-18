export type Product = {
  id: string;
  slug: string;
  title: string;
  category: "Косметология" | "Витамины"; // 1-й уровень
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
    slug: "multivitamins-sport",
    title: "Sports Research, Phytoceramides Mini-Gels, 350 mg, 30 Softgels",
    category: "Витамины",
    sub: "Мультивитамины",
    leaf: "Sport",
    price: 23.71,
    rating: 4.5,
    short: "Комплекс витаминов для поддержания здоровья.",
    description: "350 mg Per Serving Supports Skin Hydration CeratiQ® Dietary Supplement Quality Matters: Igen Non-GMO Tested Gluten Free Third Party Tested cGMP Compliant SR® Phytoceramides with Lipowheat® is rich in glycosylceramides, phytoceramides and glycolipids, which may help support skin hydration when taken directed.",
    imageUrl: "https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/sre/sre00412/v/55.jpg"
  },
  {
    id: "p-2",
    slug: "multivitamins-sport",
    title: "Sports Research, Phytoceramides Mini-Gels, 350 mg, 30 Softgels",
    category: "Витамины",
    sub: "Мультивитамины",
    leaf: "Sport",
    price: 23.71,
    rating: 4.5,
    short: "Комплекс витаминов для поддержания здоровья.",
    description: "350 mg Per Serving Supports Skin Hydration CeratiQ® Dietary Supplement Quality Matters: Igen Non-GMO Tested Gluten Free Third Party Tested cGMP Compliant SR® Phytoceramides with Lipowheat® is rich in glycosylceramides, phytoceramides and glycolipids, which may help support skin hydration when taken directed.",
    imageUrl: "https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/sre/sre00412/v/55.jpg"
  },
  {
    id: "p-3",
    slug: "multivitamins",
    title: "Sports Research, Phytoceramides Mini-Gels, 350 mg, 30 Softgels",
    category: "Витамины",
    sub: "Мультивитамины",
    leaf: "Sport",
    price: 23.71,
    rating: 4.5,
    short: "Комплекс витаминов для поддержания здоровья.",
    description: "350 mg Per Serving Supports Skin Hydration CeratiQ® Dietary Supplement Quality Matters: Igen Non-GMO Tested Gluten Free Third Party Tested cGMP Compliant SR® Phytoceramides with Lipowheat® is rich in glycosylceramides, phytoceramides and glycolipids, which may help support skin hydration when taken directed.",
    imageUrl: "https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/sre/sre00412/v/55.jpg"
  },
  {
    id: "p-4",
    slug: "multivitamins",
    title: "Sports Research, Phytoceramides Mini-Gels, 350 mg, 30 Softgels",
    category: "Витамины",
    sub: "Мультивитамины",
    leaf: "Sport",
    price: 23.71,
    rating: 4.5,
    short: "Комплекс витаминов для поддержания здоровья.",
    description: "350 mg Per Serving Supports Skin Hydration CeratiQ® Dietary Supplement Quality Matters: Igen Non-GMO Tested Gluten Free Third Party Tested cGMP Compliant SR® Phytoceramides with Lipowheat® is rich in glycosylceramides, phytoceramides and glycolipids, which may help support skin hydration when taken directed.",
    imageUrl: "https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/sre/sre00412/v/55.jpg"
  },
  {
    id: "p-5",
    slug: "multivitamins",
    title: "Sports Research, Phytoceramides Mini-Gels, 350 mg, 30 Softgels",
    category: "Витамины",
    sub: "Мультивитамины",
    leaf: "Sport",
    price: 23.71,
    rating: 4.5,
    short: "Комплекс витаминов для поддержания здоровья.",
    description: "350 mg Per Serving Supports Skin Hydration CeratiQ® Dietary Supplement Quality Matters: Igen Non-GMO Tested Gluten Free Third Party Tested cGMP Compliant SR® Phytoceramides with Lipowheat® is rich in glycosylceramides, phytoceramides and glycolipids, which may help support skin hydration when taken directed.",
    imageUrl: "https://cloudinary.images-iherb.com/image/upload/f_auto,q_auto:eco/images/sre/sre00412/v/55.jpg"
  }
];
