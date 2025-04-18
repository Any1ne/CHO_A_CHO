"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  deliveryMethod: "branch" | "address";
  branchNumber?: string;
  address?: string;
  paymentMethod: "cod" | "monobank";
};

export default function CheckoutForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const router = useRouter();
  const deliveryMethod = watch("deliveryMethod");
  const city = watch("city");
  const total = useSelector((state: RootState) =>
    state.basket.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  const onSubmit = (data: FormData) => {
    console.log("Order Data:", data);
    alert("Замовлення оформлено! Деталі у консолі.");
    // redirect або виклик API
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 1. Особисті дані */}
      <div>
        <label>ПІБ</label>
        <Input {...register("fullName", { required: true })} />
        {errors.fullName && <span className="text-red-500">Обов'язково</span>}
      </div>

      <div>
        <label>Телефон</label>
        <Input {...register("phone", { required: true })} />
        {errors.phone && <span className="text-red-500">Обов'язково</span>}
      </div>

      <div>
        <label>Email</label>
        <Input {...register("email", { required: true })} />
        {errors.email && <span className="text-red-500">Обов'язково</span>}
      </div>

      {/* 2. Доставка */}
      <div>
        <label>Місто</label>
        <Input {...register("city", { required: true })} />
      </div>

      <div>
        <label>Спосіб доставки</label>
        <div className="space-x-4">
          <label>
            <input
              type="radio"
              value="branch"
              {...register("deliveryMethod", { required: true })}
            />{" "}
            У відділення
          </label>
          {city?.toLowerCase() === "київ" && (
            <label>
              <input
                type="radio"
                value="address"
                {...register("deliveryMethod", { required: true })}
              />{" "}
              Доставка по адресі
            </label>
          )}
        </div>
      </div>

      {deliveryMethod === "branch" && (
        <div>
          <label>Номер відділення</label>
          <Input {...register("branchNumber", { required: true })} />
        </div>
      )}

      {deliveryMethod === "address" && (
        <div>
          <label>Адреса доставки</label>
          <Input {...register("address", { required: true })} />
        </div>
      )}

      {/* 3. Оплата */}
      <div>
        <label>Оплата</label>
        <div className="space-x-4">
          <label>
            <input
              type="radio"
              value="cod"
              {...register("paymentMethod", { required: true })}
            />{" "}
            При отриманні
          </label>
          <label>
            <input
              type="radio"
              value="monobank"
              {...register("paymentMethod", { required: true })}
            />{" "}
            Monobank Pay
          </label>
        </div>
      </div>

      {/* 4. Підтвердження */}
      <div className="pt-4 border-t mt-6">
        <div className="font-semibold text-lg mb-2">
          До сплати: ${total.toFixed(2)}
        </div>
        <Button className="w-full" type="submit">
          Підтвердити замовлення
        </Button>
      </div>
    </form>
  );
}
