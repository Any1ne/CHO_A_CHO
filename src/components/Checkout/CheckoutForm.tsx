"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { toast } from "sonner";
import { clearBasket } from "@/store/slices/basketSlice";
import { submitOrder } from "@/lib/api";
import { FormData } from "@/types/products";

export default function CheckoutForm() {
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ mode: "onChange" });
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.basket.items);

  const [step, setStep] = useState<"personal" | "delivery" | "payment">(
    "personal"
  );
  const router = useRouter();
  const deliveryMethod = watch("deliveryMethod");
  const city = watch("city");

  const total = useSelector((state: RootState) =>
    state.basket.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  const onSubmit = async (data: FormData) => {
    await submitOrder({
      total,
      items,
      data,
      clearBasket: () => dispatch(clearBasket()),
      toast,
      router,
    });
  };

  const handleNext = async (section: "personal" | "delivery") => {
    const valid = await trigger(
      section === "personal"
        ? ["fullName", "phone", "email"]
        : [
            "city",
            "deliveryMethod",
            deliveryMethod === "branch" ? "branchNumber" : "address",
          ]
    );
    if (valid) {
      setStep(section === "personal" ? "delivery" : "payment");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Accordion
        type="single"
        collapsible
        value={step}
        onValueChange={(val) => setStep(val as typeof step)}
      >
        <AccordionItem value="personal">
          <AccordionTrigger>1. Особисті дані</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <label>ПІБ</label>
                <Input {...register("fullName", { required: true })} />
                {errors.fullName && (
                  <span className="text-red-500">Обов'язково</span>
                )}
              </div>
              <div>
                <label>Телефон</label>
                <Input {...register("phone", { required: true })} />
                {errors.phone && (
                  <span className="text-red-500">Обов'язково</span>
                )}
              </div>
              <div>
                <label>Email</label>
                <Input {...register("email", { required: true })} />
                {errors.email && (
                  <span className="text-red-500">Обов'язково</span>
                )}
              </div>
              <Button type="button" onClick={() => handleNext("personal")}>
                Далі
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="delivery">
          <AccordionTrigger>2. Дані доставки</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
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
              <Button type="button" onClick={() => handleNext("delivery")}>
                Далі
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="payment">
          <AccordionTrigger>3. Оплата</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
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
              <div className="pt-4 border-t mt-6">
                <div className="font-semibold text-lg mb-2">
                  До сплати: ₴{total.toFixed(2)}
                </div>
                <Button className="w-full" type="submit">
                  Підтвердити замовлення
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>
  );
}
