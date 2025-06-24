"use client";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks";
import {
  setPaymentInfo,
  completeStep,
  setStep,
} from "@/store/slices/checkoutSlice";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import clsx from "clsx";
import { CircleAlertIcon } from "lucide-react";


export default function PaymentInfo({ isActive }: { isActive: boolean }) {
  const dispatch = useAppDispatch();
  const defaultValues = useAppSelector((s) => s.checkout.checkoutSummary?.paymentInfo);
  const isCompleted = !!defaultValues?.paymentMethod;

  type PaymentFormData = {
    paymentMethod: "cod" | "monobank";
  };

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<PaymentFormData>({ defaultValues });

  const onSubmit = async (data: any) => {
    const valid = await trigger();
    if (!valid) return;
    dispatch(setPaymentInfo(data));
    dispatch(completeStep("payment"));
    dispatch(setStep("checkout"));
  };

  //console.log(`Payment Info ${isActive}`);
  if (!isActive && isCompleted) {
    return (
      <div className="border p-4 rounded-xl bg-muted">
        <h3 className="font-semibold">3. Оплата</h3>
        <p>
          {defaultValues.paymentMethod === "cod"
            ? "Оплата при отриманні"
            : "Оплата через Monobank"}
        </p>
        <Button variant="outline" onClick={() => dispatch(setStep("payment"))}>
          Змінити
        </Button>
      </div>
    );
  }

  if (!isActive && !isCompleted) {
    return (
      <div className="border p-4 rounded-xl cursor-pointer">
        <h3 className="font-semibold">3. Оплата</h3>
      </div>
    );
  }
  if (isActive) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={clsx(
          "space-y-4 p-4 rounded-xl transition-shadow duration-300",
          isActive
            ? "border border-primary shadow-primary"
            : "border"
        )}
      >
        <h3 className="font-semibold">3. Оплата</h3>
        <RadioGroup
          {...register("paymentMethod")}
          className="grid md:grid-cols-2 gap-4"
        >
          <label
            htmlFor="cod"
            className="border rounded-lg p-4 cursor-pointer flex items-start gap-2 bg-white shadow-sm"
          >
            <input
              type="radio"
              value="cod"
              id="cod"
              {...register("paymentMethod", {
                required: "Оберіть метод оплати",
              })}
            />
            <div>
              <p className="font-semibold">Оплата при отриманні</p>
              <p className="text-sm text-muted-foreground">
                Готівкою або карткою при доставці
              </p>
            </div>
          </label>

          <label
            htmlFor="monobank"
            className="border rounded-lg p-4 cursor-pointer flex items-start gap-2 bg-white shadow-sm"
          >
            <input
              type="radio"
              value="monobank"
              id="monobank"
              {...register("paymentMethod", {
                required: "Оберіть метод оплати",
              })}
            />
            
            <div>
              <p className="font-semibold">Monobank</p>
              <p className="text-sm text-muted-foreground">
                Оплата онлайн через Monobank
              </p>
            </div>
            
          </label>
          
        </RadioGroup>
        
        {Object.keys(errors).length > 0 && (
  <div className="flex items-center gap-2 text-red-600 text-sm font-medium mt-1 select-none bg-red-50 rounded-md p-2">
    <CircleAlertIcon className="w-5 h-5" />
    <span>Оберіть метод оплати</span>
  </div>
)}

        <Button type="submit">Підтвердити</Button>
      </form>
    );
  }
}
