import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email/email";
import { createClient } from "@/db/supabase/server";
import pool from "@/db/postgres/client";
import dotenv from "dotenv";
import { OrderSummary, BasketItem } from "@/types";
import { generateOrderEmailHtml } from "@/lib/email/generateEmailHtml";

dotenv.config();
const LOCAL_MODE = process.env.LOCAL_MODE === "true";

function padNumber(n?: number | string) {
  if (n == null) return undefined;
  const num = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(num)) return undefined;
  return String(num).padStart(6, "0");
}

// ---------- GET ----------
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");

  if (!orderId && !orderNumber) {
    return NextResponse.json(
      { success: false, error: "Необхідно вказати orderId або orderNumber." },
      { status: 400 }
    );
  }

  try {
    if (LOCAL_MODE) {
      // Local Postgres path (matches dump.sql)
      const identifier = orderId ?? orderNumber;
      let q: string;
      let params: any[];

      if (orderId) {
        q = `
          SELECT 
            o.id AS order_id,
            o.number AS order_number,
            o.payment_method,
            o.delivery_method,
            o.status,
            o.is_wholesale,
            o.total,
            c.name AS customer_name,
            c.phone AS customer_phone,
            c.email AS customer_email,
            d.branch_number,
            d.full_address,
            d.city
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          LEFT JOIN order_delivery_details d ON d.order_number = o.number
          WHERE o.id = $1
          LIMIT 1
        `;
        params = [identifier];
      } else {
        q = `
          SELECT 
            o.id AS order_id,
            o.number AS order_number,
            o.payment_method,
            o.delivery_method,
            o.status,
            o.is_wholesale,
            o.total,
            c.name AS customer_name,
            c.phone AS customer_phone,
            c.email AS customer_email,
            d.branch_number,
            d.full_address,
            d.city
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          LEFT JOIN order_delivery_details d ON d.order_number = o.number
          WHERE o.number = $1
          LIMIT 1
        `;
        params = [Number(identifier)];
      }

      const res = await pool.query(q, params);

      if (!res.rows.length) {
        return NextResponse.json({ success: true, order: null }, { status: 200 });
      }

      const row = res.rows[0];

      // Load items with product details (fulfills BasketItem type)
      const itemsRes = await pool.query(
        `SELECT 
           oi.product_id AS id,
           oi.quantity,
           p.title,
           COALESCE(p.price, c.price) AS wholesale_price,
           CASE
             WHEN p.price IS NOT NULL THEN CEIL(p.price + (p.price * c.markup_percent / 100))
             ELSE c.retail_price
           END AS price,
           p.preview_image AS preview
         FROM orderitems oi
         LEFT JOIN products p ON p.id = oi.product_id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE oi.order_id = $1
         ORDER BY oi.id ASC`,
        [row.order_id]
      );

      const items: BasketItem[] = itemsRes.rows.map((it: any) => ({
        id: String(it.id),
        title: it.title ?? "",
        price: Number(it.price ?? 0),
        wholesale_price: Number(it.wholesale_price ?? 0),
        quantity: Number(it.quantity ?? 0),
        preview: it.preview ?? "",
      }));

      const order: OrderSummary = {
        orderId: row.order_id,
        orderNumber: padNumber(row.order_number),
        checkoutSummary: {
          isWholesale: !!row.is_wholesale,
          contactInfo: {
            // in create_order RPC we stored full name as "last first middle"
            firstName: row.customer_name ?? "",
            lastName: "",
            middleName: "",
            phone: row.customer_phone ?? "",
            email: row.customer_email ?? "",
          },
          deliveryInfo: {
            deliveryMethod: row.delivery_method === "address" ? "address" : "branch",
            branchNumber: row.branch_number ?? undefined,
            address: row.full_address ?? undefined,
            city: { Description: row.city ?? "", Ref: "" },
          },
          paymentInfo: {
            paymentMethod: row.payment_method ?? undefined,
            invoiceId: undefined,
          },
        },
        status: row.status,
        total: Number(row.total ?? 0),
        items,
      };

      return NextResponse.json({ success: true, order }, { status: 200 });
    } else {
      // Supabase RPC path
      if (!process.env.SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("⚠️ SUPABASE credentials missing — cannot use Supabase GET");
        return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
      }

      const supabase = await createClient();
      const identifier = orderId ?? orderNumber;

      const { data, error } = await supabase.rpc("get_order_summary", { identifier });

      if (error) {
        console.error("🔴 RPC помилка:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        return NextResponse.json({ success: true, order: null }, { status: 200 });
      }

      const row = data[0];

      const order: OrderSummary = {
        orderId: row.order_id,
        // support both possible field names returned by RPC
        orderNumber: padNumber(row.order_number ?? row.number),
        checkoutSummary: {
          isWholesale: row.is_wholesale,
          contactInfo: {
            firstName: row.customer_name,
            lastName: "",
            middleName: "",
            phone: row.customer_phone,
            email: row.customer_email,
          },
          deliveryInfo: {
            deliveryMethod: row.delivery_method === "address" ? "address" : "branch",
            branchNumber: row.branch_number ?? undefined,
            address: row.full_address ?? undefined,
            city: { Description: row.city ?? "", Ref: "" },
          },
          paymentInfo: {
            paymentMethod:
              (row.payment_method === "monobank" ? "monobank" : row.payment_method === "cod" ? "cod" : row.payment_method) ??
              undefined,
            invoiceId: row.invoice_id ?? undefined,
          },
        },
        status: row.status ?? row.order_status,
        total: Number(row.total ?? 0),
        items: [], // extend RPC to return items if needed
      };

      return NextResponse.json({ success: true, order }, { status: 200 });
    }
  } catch (error) {
    console.error("🔴 Помилка обробки GET-запиту:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ---------- POST ----------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrderSummary;
    const { orderId, checkoutSummary, items, total } = body;

    if (!checkoutSummary || !items || !orderId) {
      return NextResponse.json(
        { success: false, error: "Некоректна структура замовлення." },
        { status: 400 }
      );
    }

    if (LOCAL_MODE) {
      // Local Postgres insertion following dump.sql
      try {
        await pool.query("BEGIN");

        const fullName = [
          checkoutSummary.contactInfo?.lastName ?? "",
          checkoutSummary.contactInfo?.firstName ?? "",
          checkoutSummary.contactInfo?.middleName ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim() || (checkoutSummary.contactInfo?.firstName ?? "Клієнт");

        // upsert customer by email
        const custRes = await pool.query(
          `INSERT INTO customers (name, phone, email)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO UPDATE
             SET name = EXCLUDED.name,
                 phone = EXCLUDED.phone
           RETURNING id`,
          [fullName, checkoutSummary.contactInfo?.phone ?? null, checkoutSummary.contactInfo?.email ?? null]
        );

        const customerId = custRes.rows?.[0]?.id ?? null;

        // insert into orders (id is orderId string)
        const orderInsertRes = await pool.query(
          `INSERT INTO orders
            (id, customer_id, payment_method, delivery_method, is_wholesale, total, invoice_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING number`,
          [
            orderId,
            customerId,
            checkoutSummary.paymentInfo?.paymentMethod ?? null,
            checkoutSummary.deliveryInfo?.deliveryMethod ?? null,
            !!checkoutSummary.isWholesale,
            total ? Number(total) : 0,
            checkoutSummary.paymentInfo?.invoiceId ?? null,
            body.status ?? "нове",
          ]
        );

        const insertedOrderNumber = orderInsertRes.rows?.[0]?.number;

        // insert delivery details
        await pool.query(
          `INSERT INTO order_delivery_details
            (order_number, delivery_service, delivery_type, branch_number, full_address, city)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            insertedOrderNumber,
            "Nova Poshta",
            checkoutSummary.deliveryInfo?.deliveryMethod === "branch" ? "Branch" : "Address",
            checkoutSummary.deliveryInfo?.branchNumber ?? null,
            checkoutSummary.deliveryInfo?.address ?? null,
            (checkoutSummary.deliveryInfo?.city?.Description as string) ?? null,
          ]
        );

        // insert orderitems (order_id references orders.id)
        if (Array.isArray(items) && items.length > 0) {
          // bulk insert using prepared values
          const values: string[] = [];
          const params: any[] = [];
          let idx = 1;
          for (const it of items) {
            values.push(`($${idx++}, $${idx++}, $${idx++})`);
            params.push(orderId, it.id, it.quantity);
          }
          const insertSql = `INSERT INTO orderitems (order_id, product_id, quantity) VALUES ${values.join(", ")}`;
          await pool.query(insertSql, params);
        }

        await pool.query("COMMIT");

        const orderNumber = insertedOrderNumber ? padNumber(insertedOrderNumber) : undefined;

        // send emails
        const adminEmailHtml = generateOrderEmailHtml({ ...body, orderNumber }, false);
        await sendOrderConfirmation({
          to: process.env.ADMIN_EMAIL || "",
          subject: `Нове замовлення №${orderNumber ?? orderId}`,
          html: adminEmailHtml,
        });

        const userEmailHtml = generateOrderEmailHtml({ ...body, orderNumber }, true);
        await sendOrderConfirmation({
          to: checkoutSummary.contactInfo?.email || "",
          subject: `Підтвердження замовлення №${orderNumber ?? orderId}`,
          html: userEmailHtml,
        });

        return NextResponse.json({ success: true, OrderNumber: orderNumber });
      } catch (err) {
        await pool.query("ROLLBACK").catch(() => {});
        console.error("🔴 LOCAL: Помилка створення замовлення в Postgres:", err);
        return NextResponse.json(
          { success: false, error: err instanceof Error ? err.message : "DB error" },
          { status: 500 }
        );
      }
    } else {
      // Supabase RPC path (existing)
      if (!process.env.SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("⚠️ SUPABASE credentials missing — cannot create order via Supabase");
        return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
      }

      const supabase = await createClient();

      const { data, error } = await supabase.rpc("create_order", {
        order_data: body,
      });

      if (error) {
        console.error("🔴 RPC помилка створення:", error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const orderNumber = padNumber(data?.[0]?.order_number ?? data?.[0]?.number);

      // send emails
      const adminEmailHtml = generateOrderEmailHtml({ ...body, orderNumber }, false);
      await sendOrderConfirmation({
        to: process.env.ADMIN_EMAIL || "",
        subject: `Нове замовлення №${orderNumber}`,
        html: adminEmailHtml,
      });

      const userEmailHtml = generateOrderEmailHtml({ ...body, orderNumber }, true);
      await sendOrderConfirmation({
        to: checkoutSummary.contactInfo?.email || "",
        subject: `Підтвердження замовлення №${orderNumber}`,
        html: userEmailHtml,
      });

      return NextResponse.json({ success: true, OrderNumber: orderNumber });
    }
  } catch (error) {
    console.error("🔴 Помилка створення замовлення:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
