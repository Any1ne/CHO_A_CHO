"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // 🧩 додано
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/types";
import { checkOrderStatus } from "@/store/slices/checkoutSlice";
import { OrderSummary } from "@/types";

export default function SuccessPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }

    const fetchOrder = async () => {
      const resultAction = await dispatch(checkOrderStatus(orderId));

      if (
        checkOrderStatus.fulfilled.match(resultAction) &&
        resultAction.payload.orderData
      ) {
        setOrder(resultAction.payload.orderData);
      }

      setLoading(false);
    };

    fetchOrder();
  }, [orderId, dispatch, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 mt-[6rem] md:mt-[8rem] space-y-6 w-full max-w-md mx-auto">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-48 w-full rounded-md" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (!order) return null;

  // console.log("--ORDER SUMMARY CITY", order.checkoutSummary.deliveryInfo?.city)
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 mt-[6rem] md:mt-[8rem]">
      <h1 className="text-3xl font-bold mb-4">Дякуємо за замовлення!</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Ваше замовлення успішно оформлено. Очікуйте підтвердження на email або
        телефон.
      </p>

      <div className="bg-muted p-4 rounded-md text-left w-full max-w-md mb-6 shadow">
        <h2 className="text-xl font-semibold mb-2">Чек замовлення</h2>
        <p>
          <strong>Номер замовлення:</strong> {order.orderNumber}
        </p>
        <p>
          <strong>ПІБ:</strong> {order.checkoutSummary.contactInfo?.firstName}
        </p>
        <p>
          <strong>Телефон:</strong> {order.checkoutSummary.contactInfo?.phone}
        </p>
        <p>
          <strong>Email:</strong> {order.checkoutSummary.contactInfo?.email}
        </p>
        <p>
          <strong>Місто:</strong>{" "}
          {order.checkoutSummary.deliveryInfo?.city.Description}
        </p>
        <p>
          <strong>Доставка:</strong>{" "}
          {order.checkoutSummary.deliveryInfo?.deliveryMethod === "branch"
            ? `У відділення №${order.checkoutSummary.deliveryInfo?.branchNumber}`
            : `На адресу: ${order.checkoutSummary.deliveryInfo?.address}`}
        </p>
        <p>
          <strong>Безкоштовна доставка:</strong>{" "}
          {order.checkoutSummary.isWholesale ? "Так" : "Ні"}
        </p>
        <p>
          <strong>Оплата:</strong>{" "}
          {order.checkoutSummary.paymentInfo?.paymentMethod === "cod"
            ? "При отриманні"
            : "Monobank Pay"}
        </p>
        <p className="mt-2 font-bold text-lg">
          До сплати: ₴{order.total.toFixed(2)}
        </p>
      </div>

      <Button onClick={() => router.push("/")}>Повернутись на головну</Button>
    </div>
  );
}
