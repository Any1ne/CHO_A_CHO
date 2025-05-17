"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OrderSummary = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  deliveryMethod: string;
  branchNumber?: string;
  address?: string;
  paymentMethod: string;
  total: number;
  orderNumber: string;
  isFreeDelivery: boolean;
};

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("orderData");
    if (data) {
      setOrder(JSON.parse(data));
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-3xl font-bold mb-4">Дякуємо за замовлення!</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Ваше замовлення успішно оформлено. Очікуйте підтвердження на email або
        телефон.
      </p>

      {order && (
        <div className="bg-muted p-4 rounded-md text-left w-full max-w-md mb-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Чек замовлення</h2>
          <p>
            <strong>Номер замовлення:</strong> {order.orderNumber}
          </p>
          <p>
            <strong>ПІБ:</strong> {order.fullName}
          </p>
          <p>
            <strong>Телефон:</strong> {order.phone}
          </p>
          <p>
            <strong>Email:</strong> {order.email}
          </p>
          <p>
            <strong>Місто:</strong> {order.city}
          </p>
          <p>
  <strong>Доставка:</strong>{" "}
  {order.deliveryMethod === "branch"
    ? `У відділення №${order.branchNumber}`
    : `На адресу: ${order.address}`}
</p>
<p>
  <strong>Безкоштовна доставка:</strong>{" "}
  {order.isFreeDelivery ? "Так" : "Ні"}
</p>
          <p>
            <strong>Оплата:</strong>{" "}
            {order.paymentMethod === "cod" ? "При отриманні" : "Monobank Pay"}
          </p>
          <p className="mt-2 font-bold text-lg">
            До сплати: ₴{order.total.toFixed(2)}
          </p>
          
        </div>
      )}

      <Button onClick={() => router.push("/")}>Повернутись на головну</Button>
    </div>
  );
}
