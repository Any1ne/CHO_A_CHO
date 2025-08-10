import { redis } from "@/db/redis/client";

const CACHE_TTL = 60 * 60;

type NovaPoshtaCity = {
  Description: string;
  SettlementTypeDescription: string;
  Ref: string;
};

type NovaPoshtaWarehouse = {
  Description: string;
  Ref: string;
  TypeOfWarehouse: string;
};

type NovaPoshtaStreet = {
  Description: string;
  StreetsType: string;
  Ref: string;
};

const transformCities = (data: NovaPoshtaCity[]): NovaPoshtaCity[] =>
  data.map((city) => ({
    Description: city.Description,
    SettlementTypeDescription: city.SettlementTypeDescription,
    Ref: city.Ref,
  }));

const transformWarehouses = (data: NovaPoshtaWarehouse[]): NovaPoshtaWarehouse[] =>
  data.map((wh) => ({
    Description: wh.Description,
    Ref: wh.Ref,
    TypeOfWarehouse: wh.TypeOfWarehouse,
  }));

const transformStreets = (data: NovaPoshtaStreet[]): NovaPoshtaStreet[] =>
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
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const fullData = await fetchNovaPoshta("Address", "getCities");
  const transformed = transformCities(fullData);
  await redis.set(cacheKey, JSON.stringify(transformed), "EX", CACHE_TTL);
  return transformed;
}

export async function getWarehouses(cityRef: string) {
  const cacheKey = `nova-poshta:warehouses:${cityRef}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // TypeOfWarehouseRef для Відділення і Поштоматів
  const TYPE_BRANCH = "841339c7-591a-42e2-8233-7a0a00f0ed6f";   // Відділення
  // const TYPE_POSTOMAT = "f9316480-5f2d-425d-bc2c-ac7cd29decf0"; // Поштомати

  // Перший запит — Відділення
  const branchesData = await fetchNovaPoshta("AddressGeneral", "getWarehouses", {
    CityRef: cityRef,
    TypeOfWarehouseRef: TYPE_BRANCH,
  });

  // Другий запит — Поштомати
  // const postomatsData = await fetchNovaPoshta("AddressGeneral", "getWarehouses", {
  //   CityRef: cityRef,
  //   TypeOfWarehouseRef: TYPE_POSTOMAT,
  // });

  // Трансформація даних
  const transformedBranches = transformWarehouses(branchesData);
  // const transformedPostomats = transformWarehouses(postomatsData);

  // Об'єднання даних у правильному порядку: Відділення -> Поштомати
  const fullTransformed = [...transformedBranches, ];//...transformedPostomats

  // Кешування
  await redis.set(cacheKey, JSON.stringify(fullTransformed), "EX", CACHE_TTL);

  return fullTransformed;
}

export async function getStreets(cityRef: string) {
  const cacheKey = `nova-poshta:streets:${cityRef}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const limit = 500;
  let page = 1;
  let allStreets: NovaPoshtaStreet[] = [];


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
  return transformed;
}
