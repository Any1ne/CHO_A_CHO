import { redis } from "@/db/redis/client";

// Отримати всі продукти
export async function getAllProducts() {
  const ids = await redis.lrange("products:all", 0, -1);
  const products = await Promise.all(
    ids.map((id) => redis.get(`product:${id}`))
  );
  return products.map((p) => p && JSON.parse(p));
}

// Отримати продукт за ID
export async function getProductById(id: string) {
  const data = await redis.get(`product:${id}`);
  return data ? JSON.parse(data) : null;
}

// ⬇️ НОВА ФУНКЦІЯ: Отримати продукти за категорією
export async function getProductsByCategory(category: string) {
  const ids = await redis.lrange("products:all", 0, -1);
  const products = await Promise.all(
    ids.map((id) => redis.get(`product:${id}`))
  );

  const filtered = [];

  for (let i = 0; i < products.length; i++) {
    const raw = products[i];
    const id = ids[i];
    if (!raw) continue;
    const product = JSON.parse(raw);
    if (product.category === category) {
      filtered.push({ ...product, id });
    }
  }

  console.log("🟢 Redis getProductsByCategory result:", filtered);
  return filtered;
}

// Використання в getFlavoursByCategory
export async function getFlavoursByCategory(category: string) {
  const products = await getProductsByCategory(category);

  console.log(products);

  const flavours: { id: string; flavour: string }[] = [];
  const seen = new Set<string>();

  for (const product of products) {
    const flavour = product.flavour;
    if (flavour && !seen.has(flavour)) {
      seen.add(flavour);
      flavours.push({ id: product.id, flavour });
    }
  }

  console.log("🟢 Redis getFlavoursByCategory result:", flavours);
  return flavours;
}
