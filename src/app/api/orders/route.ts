import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { createClient } from "@/db/supabase/server";
import dotenv from "dotenv";
import { OrderSummary } from "@/types";

dotenv.config();

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");

  if (!orderId && !orderNumber) {
    return NextResponse.json(
      { success: false, error: "Необхідно вказати orderId або orderNumber." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    const identifier = orderId || orderNumber;

    const { data, error } = await supabase.rpc("get_order_summary", {
      identifier,
    });

    if (error) {
      console.error("🔴 RPC помилка:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, order: null }, { status: 200 });
    }

    const row = data[0];

    const order: OrderSummary = {
      orderId: row.order_id,
      orderNumber: row.order_number?.toString().padStart(6, "0") ?? undefined,
      checkoutSummary: {
        isFreeDelivery: row.is_free_delivery,
        contactInfo: {
          firstName: row.customer_name,
          lastName: "", // Не повертається з RPC, заповнюється вручну
          middleName: "",
          phone: row.customer_phone,
          email: row.customer_email,
        },
        deliveryInfo: {
          deliveryMethod: row.delivery_method === "address" ? "address" : "branch",
          branchNumber: row.branch_number ?? undefined,
          address: row.full_address ?? undefined,
          city: row.city ?? "",
        },
        paymentInfo: {
          paymentMethod: row.payment_method === "monobank" ? "monobank" : "cod",
        },
      },
      status: row.order_status,
      total: row.total ?? 0,
      items: [], // можеш додати окремий запит на items, якщо потрібно
    };

    return NextResponse.json({ success: true, order }, { status: 200 });
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OrderSummary;
    const { orderId, checkoutSummary, items, total } = body;

    const {
      contactInfo: contact,
      deliveryInfo: delivery,
      paymentInfo: payment,
      // isFreeDelivery,
    } = checkoutSummary;

    // Мінімальна валідація перед викликом RPC
    if (!contact || !delivery || !payment || !items || !orderId) {
      return NextResponse.json(
        { success: false, error: "Некоректна структура замовлення." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_order", {
  order_data: body,
});

const orderNumber = data?.[0]?.order_number;

    if (error) {
      console.error("🔴 RPC помилка створення:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Додатковий HTML для email-повідомлення
    const fullName = `${contact.lastName} ${contact.firstName}${
      contact.middleName ? " " + contact.middleName : ""
    }`;

    const deliveryType =
      delivery.deliveryMethod === "branch" ? "Branch" : "Address";

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