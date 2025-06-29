import { NextRequest, NextResponse } from "next/server";
import { getRedisOrder } from "@/lib/redisOrder";
import { fetchOrderStatus, submitOrder, checkInvoiceStatus } from "@/lib/api";
import { OrderSummary } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // 1. Перевірка: чи існує замовлення в базі
    const dbResult = await fetchOrderStatus(orderId);

    if (dbResult?.orderData) {
      return NextResponse.json({ alreadyExists: true, orderId }, { status: 200 });
    }

    // 2. Отримуємо замовлення з Redis
    const redisOrderData = await getRedisOrder(orderId);

    if (!redisOrderData) {
      return NextResponse.json({ error: "Order not found in Redis" }, { status: 404 });
    }

    const { checkoutSummary, items, total } = redisOrderData;

    // 3. Обробка Monobank-оплати
    if (checkoutSummary?.paymentInfo?.paymentMethod === "monobank") {
      const invoiceId = checkoutSummary.paymentInfo.invoiceId;
      if (!invoiceId) {
        return NextResponse.json({ error: "Missing invoiceId for Monobank" }, { status: 400 });
      }

      const invoiceStatus = await checkInvoiceStatus(invoiceId);
      if (invoiceStatus.status !== "success") {
        return NextResponse.json({ error: "Invoice not paid" }, { status: 402 });
      }
    }

    // 4. Підготовка до збереження
    const finalOrder: OrderSummary = {
      orderId,
      checkoutSummary,
      items,
      total,
      status:
        checkoutSummary.paymentInfo?.paymentMethod === "monobank"
          ? "confirmed"
          : "нове", // або "не оплачено"
    };

    // 5. Збереження замовлення в базі даних 
    const dbInsertResult = await submitOrder(finalOrder);

    if (!dbInsertResult?.OrderNumber) {
      return NextResponse.json({ error: "Failed to save order in DB" }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId }, { status: 200 });
  } catch (err) {
    console.error("Order confirmation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
