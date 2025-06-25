import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { Pool } from "pg";
import dotenv from "dotenv";
import { OrderSummary } from "@/types";

dotenv.config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
});

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");

  if (!orderId && !orderNumber) {
    return NextResponse.json(
      { success: false, error: "Необхідно вказати orderId або orderNumber." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    const baseQuery = `
      SELECT 
        o.id AS order_id,
        o.number AS order_number,
        o.payment_method,
        o.delivery_method,
        o.status AS order_status,
        o.is_free_delivery,
        o.total AS total,
        c.name AS customer_name,
        c.phone AS customer_phone,
        c.email AS customer_email,
        d.branch_number,
        d.full_address,
        d.city AS city,
        oi.product_id,
        oi.quantity
      FROM Orders o
      JOIN Customers c ON o.customer_id = c.id
      LEFT JOIN Order_Delivery_Details d ON d.order_number = o.number
      LEFT JOIN OrderItems oi ON oi.order_number = o.number
      WHERE `;

    const value = orderId || orderNumber;
    const whereClause = orderId ? `o.id = $1` : `o.number = $1`;

    const result = await client.query(baseQuery + whereClause, [value]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, order: null }, { status: 200 });
    }

    const firstRow = result.rows[0];

    const order: OrderSummary = {
      orderId: firstRow.order_id,
      orderNumber: firstRow.order_number.toString().padStart(6, "0") ?? undefined,
      checkoutSummary: {
        isFreeDelivery: firstRow.is_free_delivery,
        contactInfo: {
          firstName: firstRow.customer_name,
          lastName: "",
          middleName: "",
          phone: firstRow.customer_phone,
          email: firstRow.customer_email,
        },
        deliveryInfo: {
          deliveryMethod: firstRow.delivery_method === "address" ? "address" : "branch",
          branchNumber: firstRow.branch_number ?? undefined,
          address: firstRow.full_address ?? undefined,
          city: firstRow.city ?? "",
        },
        paymentInfo: {
          paymentMethod: firstRow.payment_method === "monobank" ? "monobank" : "cod",
        },
      },
      status: firstRow.order_status,
      total: firstRow.total ?? 0,
      items: [], // TODO: Map from rows
    };

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error) {
    console.error("🔴 Помилка отримання замовлення:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrderSummary;
    const {orderId, checkoutSummary, items, total } = body;

    //console.log("--API ORDER POST --", orderId);

    const {
      contactInfo: contact,
      deliveryInfo: delivery,
      paymentInfo: payment,
      isFreeDelivery,
    } = checkoutSummary;

    if (!contact || !delivery || !payment) {
      return NextResponse.json(
        { success: false, error: "Некоректна структура замовлення." },
        { status: 400 }
      );
    }

    const fullName = `${contact.lastName} ${contact.firstName}${
      contact.middleName ? " " + contact.middleName : ""
    }`;
    const deliveryType =
      delivery.deliveryMethod === "branch" ? "Branch" : "Address";

    const client = await pool.connect();
    await client.query("BEGIN");

    // 1. Вставити або оновити покупця
    const customerResult = await client.query(
      `INSERT INTO Customers (name, phone, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, phone = EXCLUDED.phone
       RETURNING id`,
      [fullName, contact.phone || null, contact.email || null]
    );
    const customerId = customerResult.rows[0].id;

    // 2. Створити замовлення
    const orderResult = await client.query(
      `INSERT INTO Orders (id, customer_id, payment_method, delivery_method, is_free_delivery, total, invoice_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING number`,
      [orderId, customerId, payment.paymentMethod, delivery.deliveryMethod, isFreeDelivery, total, payment.invoiceId]
    );
    const orderNumber = orderResult.rows[0].number;

    // 3. Додати деталі доставки
    await client.query(
      `INSERT INTO Order_Delivery_Details
        (order_number, delivery_service, delivery_type, branch_number, full_address, city)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        orderNumber,
        "Nova Poshta",
        deliveryType,
        deliveryType === "Branch" ? delivery.branchNumber : null,
        deliveryType === "Address" ? delivery.address : null,
        delivery.city.Description
      ]
    );

    // 4. Додати позиції замовлення
    for (const item of items) {
      await client.query(
        `INSERT INTO OrderItems (order_number, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [orderNumber, item.id, item.quantity]
      );
    }

    await client.query("COMMIT");
    client.release();

    const orderInfoHtml = `
      <h2>Дякуємо за замовлення, ${contact.firstName}!</h2>
      <p>Ваше замовлення №${orderNumber} було прийнято.</p>
      <p>Сума: <strong>${total} грн</strong></p>
      <ul>
        ${items
          .map(
            (item) =>
              `<li>${item.title} – ${item.quantity} x ${item.price} грн</li>`
          )
          .join("")}
      </ul>
      <p>Доставка: ${
        deliveryType === "Branch"
          ? `відділення №${delivery.branchNumber}`
          : delivery.address
      }</p>
      <p>Оплата: ${payment.paymentMethod === "cod" ? "Готівка" : "Monobank"}</p>
    `;

    await sendOrderConfirmation({
      to: `${process.env.ADMIN_EMAIL}`,
      subject: `Нове замовлення №${orderNumber}`,
      html: `
        <h2>Нове замовлення від ${fullName}</h2>
        <p>Email: ${contact.email}</p>
        <p>Телефон: ${contact.phone}</p>
        ${orderInfoHtml}
      `,
    });

    return NextResponse.json({ success: true, OrderNumber: orderNumber });
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


