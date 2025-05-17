import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      contact,
      delivery,
      payment,
      total,
      items,
      isFreeDelivery,
    }: {
      contact: {
        firstName: string;
        lastName: string;
        middleName?: string;
        phone: string;
        email: string;
      };
      delivery: {
        city: string;
        deliveryMethod: "branch" | "address";
        branchNumber?: string;
        address?: string;
      };
      payment: {
        paymentMethod: "cod" | "monobank";
      };
      total: number;
      items: { id: string; title: string; price: number; quantity: number }[];
      isFreeDelivery: boolean;
    } = body;

    const fullName = `${contact.lastName} ${contact.firstName}${
      contact.middleName ? " " + contact.middleName : ""
    }`;
    const deliveryType =
      delivery.deliveryMethod === "branch" ? "Branch" : "Address";

    const client = await pool.connect();
    await client.query("BEGIN");

    // ✅ 1. Вставити або оновити покупця
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
      `INSERT INTO Orders (customer_id, payment_method, delivery_method, is_free_delivery)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [customerId, payment.paymentMethod, delivery.deliveryMethod, isFreeDelivery]
    );
    const orderId = orderResult.rows[0].id;

    // 3. Додати деталі доставки
    await client.query(
      `INSERT INTO Order_Delivery_Details
        (order_id, delivery_service, delivery_type, branch_number, full_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        orderId,
        "Nova Poshta",
        deliveryType,
        deliveryType === "Branch" ? delivery.branchNumber : null,
        deliveryType === "Address" ? delivery.address : null,
      ]
    );

    // 4. Додати позиції замовлення
    for (const item of items) {
      await client.query(
        `INSERT INTO OrderItems (order_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [orderId, item.id, item.quantity]
      );
    }

    await client.query("COMMIT");
    client.release();

    const orderInfoHtml = `
  <h2>Дякуємо за замовлення, ${contact.firstName}!</h2>
  <p>Ваше замовлення №${orderId} було прийнято.</p>
  <p>Сума: <strong>${total} грн</strong></p>
  <ul>
    ${items.map(item => `<li>${item.title} – ${item.quantity} x ${item.price} грн</li>`).join('')}
  </ul>
  <p>Доставка: ${deliveryType === 'Branch' ? `відділення №${delivery.branchNumber}` : delivery.address}</p>
  <p>Оплата: ${payment.paymentMethod === 'cod' ? "Готівка" : "Monobank"}</p>
`;

// await sendOrderConfirmation({
//   to: contact.email,
//   subject: "Ваше замовлення прийнято!",
//   html: orderInfoHtml,
// });

await sendOrderConfirmation({
  to: `${process.env.ADMIN_EMAIL}`,
  subject: `Нове замовлення №${orderId}`,
  html: `
    <h2>Нове замовлення від ${fullName}</h2>
    <p>Email: ${contact.email}</p>
    <p>Телефон: ${contact.phone}</p>
    ${orderInfoHtml}
  `,
});

    return NextResponse.json({ success: true, orderId });
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
