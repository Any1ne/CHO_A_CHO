import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email/email";
import { createClient } from "@/db/supabase/server";
import dotenv from "dotenv";
import { OrderSummary } from "@/types";
import { generateOrderEmailHtml } from "@/lib/email/generateEmailHtml";

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

    console.log("--ORDER SUMMARY CITY", row.city)
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
          city: { Description: row.city ?? "", Ref: ""},
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
    const { orderId, checkoutSummary, items, } = body; //total 

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

const orderNumber = data?.[0]?.order_number?.toString().padStart(6, "0");

    if (error) {
      console.error("🔴 RPC помилка створення:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

const adminEmailHtml = generateOrderEmailHtml(
  {...body, orderNumber},
  false // для адміністратора
);

await sendOrderConfirmation({
  to: process.env.ADMIN_EMAIL!,
  subject: `Нове замовлення №${orderNumber}`,
  html: adminEmailHtml,
});


// const userEmailHtml = generateOrderEmailHtml(
//   {...body,orderNumber},
//   true // для користувача
// );
// 
// await sendOrderConfirmation({
//   to: contact.email,
//   subject: `Підтвердження замовлення №${orderNumber}`,
//   html: userEmailHtml,
// });

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