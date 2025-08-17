export type CategoryNode = {
  title: string;
  slug: string;
  children?: CategoryNode[];
};

export const categories: CategoryNode[] = [
  {
    title: "Электроника",
    slug: "electronics",
    children: [
      { title: "Аудио", slug: "audio", children: [
        { title: "Наушники", slug: "headphones" },
        { title: "Колонки", slug: "speakers" }
      ]},
      { title: "Умный дом", slug: "smart-home", children: [
        { title: "Освещение", slug: "lighting" }
      ] }
    ]
  },
  {
    title: "Одежда",
    slug: "apparel",
    children: [
      { title: "Верхняя одежда", slug: "outerwear", children: [
        { title: "Куртки", slug: "jackets" }
      ]},
      { title: "Обувь", slug: "shoes", children: [
        { title: "Кроссовки", slug: "sneakers" }
      ]}
    ]
  },
  {
    title: "Дом",
    slug: "home",
    children: [
      { title: "Освещение", slug: "lighting", children: [
        { title: "Настольные лампы", slug: "desk-lamps" }
      ]}
    ]
  },
  {
    title: "Спорт",
    slug: "sport",
    children: [
      { title: "Носимая электроника", slug: "wearables", children: [
        { title: "Браслеты", slug: "bands" }
      ]}
    ]
  }
];
