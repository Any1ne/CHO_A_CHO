import { redis } from "@/db/redis/client";

const CACHE_TTL = 60 * 60;

const fetchNovaPoshta = async (
  modelName: string,
  method: string,
  methodProperties: object = {}
) => {
  console.log(`[Nova Poshta] Запит: ${modelName}.${method}`);
  console.log(`[Nova Poshta] Параметри:`, methodProperties);

  const response = await fetch("https://api.novaposhta.ua/v2.0/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: process.env.NOVA_POSHTA_API_KEY,
      modelName,
      calledMethod: method,
      methodProperties,
    }),
  });

  const data = await response.json();
  console.log(`[Nova Poshta] Отримано дані:`, data);
  return data.data;
};

export async function getCities() {
  const cacheKey = "nova_poshta:cities";
  console.log(`[Nova Poshta] Перевірка кешу: ${cacheKey}`);
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log(`[Nova Poshta] Дані з кешу: ${cacheKey}`);
    return JSON.parse(cached);
  }

  console.log(`[Nova Poshta] Кеш порожній. Виконуємо запит...`);
  const data = await fetchNovaPoshta("Address", "getCities");
  await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
  console.log(`[Nova Poshta] Кеш оновлено: ${cacheKey}`);
  return data;
}

export async function getWarehouses(cityRef: string) {
  const cacheKey = `nova_poshta:warehouses:${cityRef}`;
  console.log(`[Nova Poshta] Перевірка кешу: ${cacheKey}`);
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log(`[Nova Poshta] Дані з кешу: ${cacheKey}`);
    return JSON.parse(cached);
  }

  console.log(`[Nova Poshta] Кеш порожній. Виконуємо запит...`);
  const data = await fetchNovaPoshta("AddressGeneral", "getWarehouses", {
    CityRef: cityRef,
  });
  await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
  console.log(`[Nova Poshta] Кеш оновлено: ${cacheKey}`);
  return data;
}

export async function getStreets(cityRef: string) {
  const cacheKey = `nova_poshta:streets:${cityRef}`;
  console.log(`[Nova Poshta] Перевірка кешу: ${cacheKey}`);
  const cached = await redis.get(cacheKey);

  if (cached) {
    console.log(`[Nova Poshta] Дані з кешу: ${cacheKey}`);
    return JSON.parse(cached);
  }

  console.log(`[Nova Poshta] Кеш порожній. Виконуємо запит...`);
  const data = await fetchNovaPoshta("Address", "getStreet", {
    CityRef: cityRef,
  });
  await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
  console.log(`[Nova Poshta] Кеш оновлено: ${cacheKey}`);
  return data;
}
