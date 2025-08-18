export type CategoryNode = {
  title: string;
  slug: string;
  children?: CategoryNode[];
};

export const categories: CategoryNode[] = [
  {
    title: "Косметология",
    slug: "cosmetology",
    children: [
      {
        title: "Уход за лицом",
        slug: "face-care",
        children: [
          { title: "Кремы", slug: "creams" },
          { title: "Маски", slug: "masks" }
        ]
      },
      {
        title: "Уход за волосами",
        slug: "hair-care",
        children: [
          { title: "Шампуни", slug: "shampoos" },
          { title: "Бальзамы", slug: "balms" }
        ]
      },
      {
        title: "Уход за телом",
        slug: "body-care",
        children: [
          { title: "Лосьоны", slug: "lotions" },
          { title: "Скрабы", slug: "scrubs" }
        ]
      }
    ]
  },
  {
    title: "Витамины",
    slug: "vitamins",
    children: [
      { title: "Витамин C", slug: "vitamin-c" },
      { title: "Витамин D", slug: "vitamin-d" },
      {
        title: "Мультивитамины", slug: "multivitamins",
        children: [
          { title: "Sport", slug: "multivitamins-sport" },
        ]
      }
    ]
  }
];
