-- Fractional (kopeck) wholesale prices + new price list (2026-10-21).
--
-- Wholesale prices are now like 19.50 UAH, but categories.price,
-- products.price, orders.total and the RPC return types were all integer.
-- Retail price stays a whole number: ceil(wholesale * (1 + markup%)).
--
-- Run in Supabase SQL Editor as one script. It is a single transaction:
-- any error rolls everything back. Afterwards flush the Redis catalog cache
-- (key `products:all`, TTL 1h) so the site picks up the new prices.

BEGIN;

-- 1. Column types --------------------------------------------------------

-- Prod-only analytics views depend on orders.total; Postgres refuses the
-- type change while they exist. Dropped here, recreated unchanged below.
DROP VIEW IF EXISTS public.wholesale_vs_retail;
DROP VIEW IF EXISTS public.checks_stats;
DROP VIEW IF EXISTS public.cod_vs_monobank;
DROP VIEW IF EXISTS public.revenue_by_month;

-- retail_price is GENERATED from price, so it must be dropped and re-added
-- around the type change.
ALTER TABLE public.categories DROP COLUMN retail_price;
ALTER TABLE public.categories ALTER COLUMN price TYPE numeric(10,2);
ALTER TABLE public.categories ADD COLUMN retail_price numeric
  GENERATED ALWAYS AS (ceil(price + price * markup_percent / 100)) STORED;

ALTER TABLE public.products ALTER COLUMN price TYPE numeric(10,2);
ALTER TABLE public.orders ALTER COLUMN total TYPE numeric(10,2);

CREATE VIEW public.wholesale_vs_retail AS
WITH
  stats AS (
    SELECT
      orders.is_wholesale,
      count(*)::numeric AS orders_count,
      sum(orders.total)::numeric AS turnover
    FROM orders
    GROUP BY orders.is_wholesale
  ),
  totals AS (
    SELECT
      sum(stats.orders_count) AS total_orders,
      sum(stats.turnover) AS total_turnover
    FROM stats
  )
SELECT
  CASE
    WHEN s.is_wholesale THEN 'Wholesale'::text
    ELSE 'Retail'::text
  END AS label,
  s.orders_count,
  round(s.orders_count / t.total_orders * 100::numeric, 2) AS orders_percent,
  s.turnover,
  round(
    s.turnover / NULLIF(t.total_turnover, 0::numeric) * 100::numeric,
    2
  ) AS turnover_percent
FROM stats s
CROSS JOIN totals t
ORDER BY s.orders_count DESC;

CREATE VIEW public.checks_stats AS
SELECT 'Мінімальний чек'::text AS label, min(orders.total)::numeric AS value FROM orders
UNION ALL
SELECT 'Середній чек'::text AS label, round(avg(orders.total), 2) AS value FROM orders
UNION ALL
SELECT 'Максимальний чек'::text AS label, max(orders.total)::numeric AS value FROM orders
UNION ALL
SELECT 'Кількість замовлень'::text AS label, count(*)::numeric AS value FROM orders
UNION ALL
SELECT 'Загальна виручка'::text AS label, sum(orders.total)::numeric AS value FROM orders
ORDER BY 2 DESC;

CREATE VIEW public.cod_vs_monobank AS
WITH
  stats AS (
    SELECT
      orders.payment_method,
      count(*)::numeric AS orders_count,
      sum(orders.total)::numeric AS turnover
    FROM orders
    WHERE orders.payment_method = ANY (ARRAY['cod'::text, 'monobank'::text])
    GROUP BY orders.payment_method
  ),
  totals AS (
    SELECT
      sum(stats.orders_count) AS total_orders,
      sum(stats.turnover) AS total_turnover
    FROM stats
  )
SELECT
  CASE
    WHEN s.payment_method = 'cod'::text THEN 'Cash on Delivery'::text
    WHEN s.payment_method = 'monobank'::text THEN 'Monobank'::text
    ELSE NULL::text
  END AS label,
  s.orders_count,
  round(s.orders_count / t.total_orders * 100::numeric, 2) AS orders_percent,
  s.turnover,
  round(
    s.turnover / NULLIF(t.total_turnover, 0::numeric) * 100::numeric,
    2
  ) AS turnover_percent
FROM stats s
CROSS JOIN totals t
ORDER BY s.orders_count DESC;

CREATE VIEW public.revenue_by_month AS
SELECT
  to_char(date, 'YYYY-MM'::text) AS label,
  count(*) AS orders_count,
  sum(total)::numeric AS total_revenue,
  avg(total)::numeric(10, 2) AS avg_order,
  sum(CASE WHEN is_wholesale = true THEN total ELSE 0 END)::numeric AS wholesale_revenue,
  sum(CASE WHEN is_wholesale = false THEN total ELSE 0 END)::numeric AS retail_revenue,
  sum(CASE WHEN payment_method = 'cod'::text THEN total ELSE 0 END)::numeric AS cod_revenue,
  sum(CASE WHEN payment_method = 'monobank'::text THEN total ELSE 0 END)::numeric AS monobank_revenue
FROM orders
GROUP BY (to_char(date, 'YYYY-MM'::text))
ORDER BY (to_char(date, 'YYYY-MM'::text)) DESC;

-- 2. get_all_products: wholesale_price integer -> numeric ------------------

-- Return type change requires DROP + CREATE (CREATE OR REPLACE refuses).
DROP FUNCTION public.get_all_products();

CREATE FUNCTION public.get_all_products()
RETURNS TABLE(
  id text,
  title text,
  description text,
  wholesale_price numeric,
  price integer,
  category text,
  weight integer,
  flavour text,
  preview text
)
LANGUAGE plpgsql
AS $$
begin
  return query
  select
    p.id::text as id,
    p.title::text as title,
    p.description::text as description,
    COALESCE(p.price, c.price)::numeric as wholesale_price,
    CASE
      WHEN p.price IS NOT NULL THEN
        CEIL(p.price + (p.price * c.markup_percent / 100))::integer
      ELSE
        c.retail_price::integer
    END as price,
    c.name::text as category,
    COALESCE(p.weight, c.weight)::integer as weight,
    f.name::text as flavour,
    p.preview_image::text as preview
  from products p
  join categories c on p.category_id = c.id
  left join flavours f on p.flavour_id = f.id
  where p.is_active = true
  order by p.id asc;
end;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_products() TO anon, authenticated, service_role;

-- 3. create_order: total cast integer -> numeric -------------------------

-- Patch the live definition in place instead of pasting a copy, so any
-- prod-only differences in the function body are preserved.
DO $$
DECLARE
  def text;
  patched text;
BEGIN
  def := pg_get_functiondef('public.create_order(jsonb)'::regprocedure);
  -- Prod already casts to numeric; nothing to patch there.
  IF position('(order_data->>''total'')::numeric' IN def) > 0 THEN
    RETURN;
  END IF;
  patched := replace(def, '(order_data->>''total'')::integer', '(order_data->>''total'')::numeric');
  IF patched = def THEN
    RAISE EXCEPTION 'create_order: total ::integer cast not found, patch manually';
  END IF;
  EXECUTE patched;
END $$;

-- 4. New wholesale prices -------------------------------------------------

UPDATE public.categories SET price = CASE name
    WHEN 'Mini'       THEN 19.50
    WHEN 'Popular'    THEN 30.50
    WHEN 'Nutty'      THEN 35.50
    WHEN 'Sugar Free' THEN 54.00
    WHEN 'Big'        THEN 115.00
    WHEN 'Heart'      THEN 15.50
    WHEN 'Kiss'       THEN 15.50
  END
WHERE name IN ('Mini', 'Popular', 'Nutty', 'Sugar Free', 'Big', 'Heart', 'Kiss');

-- "Чорна" / "Молочна" variants had their own price override; they now
-- follow the category price.
UPDATE public.products SET price = NULL
WHERE category_id IN (
  SELECT id FROM public.categories
  WHERE name IN ('Mini', 'Popular', 'Nutty', 'Sugar Free', 'Big', 'Heart', 'Kiss')
);

-- Sanity check: every listed category must have been updated.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.categories
      WHERE name IN ('Mini', 'Popular', 'Nutty', 'Sugar Free', 'Big', 'Heart', 'Kiss')) <> 7 THEN
    RAISE EXCEPTION 'Expected 7 categories by name — names differ in this DB';
  END IF;
END $$;

COMMIT;

-- Check result:
-- SELECT name, price AS wholesale, retail_price FROM public.categories ORDER BY id;
