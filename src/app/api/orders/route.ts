import { NextRequest, NextResponse } from "next/server";
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
      fullName,
      phone,
      email,
      items,
      paymentMethod,
      deliveryMethod,
      deliveryService,
      deliveryType,
      branchNumber,
      fullAddress,
    }: {
      fullName: string;
      phone?: string;
      email?: string;
      items: { id: string; quantity: number; price: number }[];
      paymentMethod: string;
      deliveryMethod: string;
      deliveryService: string;
      deliveryType: "Branch" | "Address";
      branchNumber?: string;
      fullAddress?: string;
    } = body;

    const client = await pool.connect();
    await client.query("BEGIN");

    // 1. Створити покупця
    const customerResult = await client.query(
      `INSERT INTO Customers (name, phone, email)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [fullName, phone || null, email || null]
    );
    const customerId = customerResult.rows[0].id;

    // 2. Створити замовлення
    const orderResult = await client.query(
      `INSERT INTO Orders (customer_id, payment_method, delivery_method)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [customerId, paymentMethod, deliveryMethod]
    );
    const orderId = orderResult.rows[0].id;

    // 3. Додати деталі доставки
    await client.query(
      `INSERT INTO Order_Delivery_Details
        (order_id, delivery_service, delivery_type, branch_number, full_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        orderId,
        deliveryService,
        deliveryType,
        deliveryType === "Branch" ? branchNumber : null,
        deliveryType === "Address" ? fullAddress : null,
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
