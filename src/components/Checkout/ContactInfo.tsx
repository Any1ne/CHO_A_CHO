"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setContactInfo,
  completeStep,
  setStep,
} from "@/store/slices/checkoutSlice";
import clsx from "clsx";
import { CircleAlertIcon } from "lucide-react";


type ContactFormData = {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  email: string;
};

export default function ContactInfo({ isActive }: { isActive: boolean }) {
  const dispatch = useAppDispatch();
  const defaultValues = useAppSelector(
    (s) => s.checkout.checkoutSummary?.contactInfo
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    defaultValues,
  });

  const isCompleted = !!defaultValues?.email;

  useEffect(() => {
    const saved = sessionStorage.getItem("orderData");
    if (saved) {
      const parsed: ContactFormData = JSON.parse(saved);
      reset(parsed);
      dispatch(setContactInfo(parsed));
    }
  }, [dispatch, reset]);

  const onSubmit = (data: ContactFormData) => {
    dispatch(setContactInfo(data));
    dispatch(completeStep("contact"));
    dispatch(setStep("delivery"));
  };

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
        <h3 className="text-lg font-semibold text-gray-500">
          1. Контактні дані
        </h3>
      </div>
    );
  }

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
    <h3 className="font-semibold">1. Контактні дані</h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Input
        placeholder="Прізвище"
        {...register("lastName", { required: "Обов'язкове поле" })}
        className={clsx(
          "transition-all duration-300",
          errors.lastName && "border-red-500"
        )}
      />

      <Input
        placeholder="Ім'я"
        {...register("firstName", { required: "Обов'язкове поле" })}
        className={clsx(
          "transition-all duration-300",
          errors.firstName && "border-red-500"
        )}
      />

      <Input
        placeholder="По-батькові"
        {...register("middleName", { required: "Обов'язкове поле" })}
        className={clsx(
          "transition-all duration-300",
          errors.middleName && "border-red-500"
        )}
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
      className={clsx(
        "transition-all duration-300",
        errors.phone && "border-red-500"
      )}
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
      className={clsx(
        "transition-all duration-300",
        errors.email && "border-red-500"
      )}
    />

    {Object.keys(errors).length > 0 && (
  <div className="flex items-center gap-2 text-red-600 text-sm font-medium mt-1 select-none bg-red-50 rounded-md p-2">
    <CircleAlertIcon className="w-5 h-5" />
    <span>Заповніть правильно всі необхідні поля</span>
  </div>
)}


    <Button type="submit">Далі</Button>
  </form>
);
}
