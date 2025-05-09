"use client";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setContactInfo,
  completeStep,
  setStep,
} from "@/store/slices/checkoutSlice";

export default function ContactInfo({ isActive }: { isActive: boolean }) {
  const dispatch = useAppDispatch();
  const defaultValues = useAppSelector((s) => s.checkout.contactInfo);

  type ContactFormData = {
    firstName: string;
    lastName: string;
    middleName: string;
    phone: string;
    email: string;
  };

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ContactFormData>({ defaultValues });

  const isCompleted = !!defaultValues?.email;

  const onSubmit = async (data: any) => {
    const valid = await trigger();
    if (!valid) return;
    dispatch(setContactInfo(data));
    dispatch(completeStep("contact"));
    dispatch(setStep("delivery"));
  };

  console.log(`Contact info ${isActive}`);

  if (!isActive && isCompleted) {
    return (
      <div className="border p-4 rounded-xl bg-muted">
        <h3 className="font-semibold">1. Контактні дані</h3>
        <p>
          {defaultValues.lastName} {defaultValues.firstName}{" "}
          {defaultValues.middleName}
        </p>
        <p>
          {defaultValues.phone} | {defaultValues.email}
        </p>
        <Button variant="outline" onClick={() => dispatch(setStep("contact"))}>
          Змінити
        </Button>
      </div>
    );
  }

  if (!isActive && !isCompleted) {
    return (
      <div className="border p-4 rounded-xl cursor-pointer">
        {" "}
        <h3 className="text-lg font-semibold text-gray-500">
          1. Контактні дані
        </h3>
      </div>
    );
  }

  if (isActive) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 border p-4 rounded-xl"
      >
        <h3 className="font-semibold">1. Контактні дані</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder="Прізвище"
            {...register("lastName", { required: "Обов'язкове поле" })}
          />
          {errors.lastName && (
            <p className="text-red-500">{errors.lastName.message}</p>
          )}

          <Input
            placeholder="Ім'я"
            {...register("firstName", { required: "Обов'язкове поле" })}
          />

          <Input
            placeholder="По-батькові"
            {...register("middleName", { required: "Обов'язкове поле" })}
          />
        </div>
        <Input
          placeholder="Телефон"
          {...register("phone", {
            required: "Обов'язкове поле",
            pattern: {
              value: /^\+?[0-9]{10,15}$/,
              message: "Невірний формат телефону",
            },
          })}
        />

        <Input
          placeholder="Email"
          {...register("email", {
            required: "Обов'язкове поле",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Невірний формат email",
            },
          })}
        />
        <Button type="submit">Далі</Button>
      </form>
    );
  }
}
