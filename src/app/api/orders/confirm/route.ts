import { NextRequest, NextResponse } from "next/server";
import { getRedisOrder } from "@/lib/redisOrder";
import { fetchOrderStatus, submitOrder, checkInvoiceStatus } from "@/lib/api";
import { OrderSummary } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("orderId");

    if (!orderId) {
      console.warn("[CONFIRM ORDER] ❌ Missing orderId in query");
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    console.log(`[CONFIRM ORDER] ▶️ Початок підтвердження замовлення: ${orderId}`);

    // 1. Перевірка: чи існує замовлення в базі
    const dbResult = await fetchOrderStatus(orderId);
    console.log("[CONFIRM ORDER] 🔍 Результат fetchOrderStatus:", dbResult);

    if (dbResult?.orderData) {
      console.log("[CONFIRM ORDER] ✅ Замовлення вже існує в базі");
      return NextResponse.json({ alreadyExists: true, orderId }, { status: 200 });
    }

    // 2. Отримуємо замовлення з Redis
    const redisOrderData = await getRedisOrder(orderId);
    console.log("[CONFIRM ORDER] 📦 Дані з Redis:", redisOrderData);

    if (!redisOrderData) {
      console.warn("[CONFIRM ORDER] ❌ Замовлення не знайдено в Redis");
      return NextResponse.json({ error: "Order not found in Redis" }, { status: 404 });
    }

    const { checkoutSummary, items, total } = redisOrderData;

    // 3. Обробка Monobank-оплати
    if (checkoutSummary?.paymentInfo?.paymentMethod === "monobank") {
      const invoiceId = checkoutSummary.paymentInfo.invoiceId;
      if (!invoiceId) {
        console.warn("[CONFIRM ORDER] ❌ Відсутній invoiceId для Monobank");
        return NextResponse.json({ error: "Missing invoiceId for Monobank" }, { status: 400 });
      }

      const invoiceStatus = await checkInvoiceStatus(invoiceId);
      console.log("[CONFIRM ORDER] 🏦 Статус інвойсу Monobank:", invoiceStatus);

      if (invoiceStatus.status !== "success") {
        console.warn("[CONFIRM ORDER] ❌ Інвойс не оплачено");
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
          : "нове",
    };
    console.log("[CONFIRM ORDER] 📝 Готове замовлення до збереження:", finalOrder);

    // 5. Збереження замовлення в базі даних 
    const dbInsertResult = await submitOrder(finalOrder);
    console.log("[CONFIRM ORDER] 💾 Результат збереження в базу:", dbInsertResult);

    if (!dbInsertResult?.OrderNumber) {
      console.error("[CONFIRM ORDER] ❌ Помилка збереження замовлення в базу");
      return NextResponse.json({ error: "Failed to save order in DB" }, { status: 500 });
    }

    console.log(`[CONFIRM ORDER] ✅ Успішно збережено замовлення: ${orderId}`);
    return NextResponse.json({ success: true, orderId }, { status: 200 });

  } catch (err) {
    console.error("[CONFIRM ORDER] ❗ Внутрішня помилка сервера:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
