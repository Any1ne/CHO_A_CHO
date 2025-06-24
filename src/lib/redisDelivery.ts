import { redis } from "@/db/redis/client";

const CACHE_TTL = 60 * 60;

const transformCities = (data: any[]) =>
  data.map((city) => ({
    Description: city.Description,
    SettlementTypeDescription: city.SettlementTypeDescription,
    Ref: city.Ref,
  }));

const transformWarehouses = (data: any[]) =>
  data.map((wh) => ({
    Description: wh.Description,
    CityRef: wh.CityRef,
    Ref: wh.Ref,
  }));

const transformStreets = (data: any[]) =>
  data.map((street) => ({
    Description: street.Description,
    StreetsType: street.StreetsType,
    Ref: street.Ref,
  }));

const fetchNovaPoshta = async (
  modelName: string,
  method: string,
  methodProperties: object = {}
) => {
  //console.log(`[Nova Poshta] Запит: ${modelName}.${method}`);
  //console.log(`[Nova Poshta] Параметри:`, methodProperties);

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
  return data.data;
};

export async function getCities() {
  const cacheKey = "nova-poshta:cities";
  //console.log(`[Nova Poshta] Перевірка кешу: ${cacheKey}`);
  const cached = await redis.get(cacheKey);

  if (cached) {
    //console.log(`[Nova Poshta] Дані з кешу: ${cacheKey}`);
    return JSON.parse(cached);
  }

  //console.log(`[Nova Poshta] Кеш порожній. Виконуємо запит...`);
  const fullData = await fetchNovaPoshta("Address", "getCities");
  const transformed = transformCities(fullData);
  await redis.set(cacheKey, JSON.stringify(transformed), "EX", CACHE_TTL);
  //console.log(`[Nova Poshta] Кеш оновлено: ${cacheKey}`);
  return transformed;
}

export async function getWarehouses(cityRef: string) {
  const cacheKey = `nova-poshta:warehouses:${cityRef}`;
  //console.log(`[Nova Poshta] Перевірка кешу: ${cacheKey}`);
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  //console.log(`[Nova Poshta] Кеш порожній. Виконуємо запит...`);
  const fullData = await fetchNovaPoshta("AddressGeneral", "getWarehouses", {
    CityRef: cityRef,
  });
  const transformed = transformWarehouses(fullData);
  await redis.set(cacheKey, JSON.stringify(transformed), "EX", CACHE_TTL);
  return transformed;
}

export async function getStreets(cityRef: string) {
  const cacheKey = `nova-poshta:streets:${cityRef}`;
  //console.log(`[Nova Poshta] Перевірка кешу: ${cacheKey}`);
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  //console.log(`[Nova Poshta] Кеш порожній. Починаємо пагінацію...`);
  const limit = 500;
  let page = 1;
  let allStreets: any[] = [];

  while (true) {
    const pageData = await fetchNovaPoshta("Address", "getStreet", {
      CityRef: cityRef,
      Page: page.toString(),
      Limit: limit.toString(),
    });

    if (!pageData || pageData.length === 0) {
      break;
    }

    allStreets = allStreets.concat(pageData);
    if (pageData.length < limit) {
      break;
    }

    page++;
  }

  const transformed = transformStreets(allStreets);
  await redis.set(cacheKey, JSON.stringify(transformed), "EX", CACHE_TTL);
  //console.log(`[Nova Poshta] Отримано всі сторінки (${page}). Кеш оновлено.`);

  return transformed;
}
