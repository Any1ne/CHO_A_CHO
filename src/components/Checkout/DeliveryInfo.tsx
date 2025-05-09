// components/DeliveryInfo.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks";
import {
  setDeliveryInfo,
  completeStep,
  setStep,
} from "@/store/slices/checkoutSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CitySelect } from "./CitySelect";
import { fetchCities, fetchWarehouses, fetchStreets } from "@/lib/api";
import clsx from "clsx";

type DeliveryFormData = {
  city: string;
  deliveryMethod: "branch" | "address";
  branchNumber?: string;
  address?: string;
};

export default function DeliveryInfo({ isActive }: { isActive: boolean }) {
  const dispatch = useAppDispatch();
  const defaultValues = useAppSelector((s) => s.checkout.deliveryInfo);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    defaultValues,
  });

  const deliveryMethod = watch("deliveryMethod");
  const selectedCity = watch("city");
  const isCompleted = !!defaultValues?.city;

  const [cities, setCities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);

  useEffect(() => {
    fetchCities()
      .then((data) => setCities(data))
      .catch((e) => console.error("Failed to load cities", e));
  }, []);

  useEffect(() => {
    if (selectedCity) {
      const cityRef = cities.find((c) => c.Description === selectedCity)?.Ref;
      if (cityRef) {
        fetchWarehouses(cityRef)
          .then((data) => setWarehouses(data))
          .catch((e) => console.error("Failed to load warehouses", e));
        fetchStreets(cityRef)
          .then((data) => setStreets(data))
          .catch((e) => console.error("Failed to load streets", e));
      }
    }
  }, [selectedCity, cities]);

  const onSubmit = async (data: DeliveryFormData) => {
    const valid = await trigger();
    if (!valid) return;

    dispatch(setDeliveryInfo(data));
    dispatch(completeStep("delivery"));
    dispatch(setStep("payment"));
  };

  if (!isActive && isCompleted) {
    return (
      <div className="border p-4 rounded-xl bg-muted">
        <h3 className="font-semibold">2. Доставка</h3>
        <p>
          {defaultValues.city} —{" "}
          {defaultValues.deliveryMethod === "branch"
            ? `Відділення ${defaultValues.branchNumber}`
            : defaultValues.address}
        </p>
        <Button variant="outline" onClick={() => dispatch(setStep("delivery"))}>
          Змінити
        </Button>
      </div>
    );
  }

  if (!isActive && !isCompleted) {
    return (
      <div className="border p-4 rounded-xl cursor-pointer">
        <h3 className="font-semibold">2. Доставка</h3>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 border p-4 rounded-xl"
    >
      <h3 className="font-semibold">2. Доставка</h3>

      {/* Місто */}
      <label className="block">
        <span className="text-sm">Місто</span>
        <CitySelect
          cities={cities}
          selectedCity={selectedCity}
          onSelect={(city) => setValue("city", city)}
        />
        {errors.city && (
          <p className="text-red-500 text-sm">{errors.city.message}</p>
        )}
      </label>

      {/* Спосіб доставки — Картки */}
      <div className="grid md:grid-cols-2 gap-4">
        <label
          htmlFor="branch"
          className={clsx(
            "border rounded-lg p-4 cursor-pointer flex items-start gap-2 bg-white shadow-sm",
            {
              "ring-2 ring-primary": deliveryMethod === "branch",
            }
          )}
        >
          <input
            type="radio"
            value="branch"
            id="branch"
            {...register("deliveryMethod", {
              required: "Оберіть спосіб доставки",
            })}
            className="mt-1"
          />
          <div>
            <p className="font-semibold">До відділення</p>
            <p className="text-sm text-muted-foreground">
              Самостійно забрати замовлення у відділенні Нової Пошти
            </p>
          </div>
        </label>

        <label
          htmlFor="address"
          className={clsx(
            "border rounded-lg p-4 cursor-pointer flex items-start gap-2 bg-white shadow-sm",
            {
              "ring-2 ring-primary": deliveryMethod === "address",
            }
          )}
        >
          <input
            type="radio"
            value="address"
            id="address"
            {...register("deliveryMethod", {
              required: "Оберіть спосіб доставки",
            })}
            className="mt-1"
          />
          <div>
            <p className="font-semibold">Кур'єром</p>
            <p className="text-sm text-muted-foreground">
              Доставка кур'єром на адресу
            </p>
          </div>
        </label>
      </div>

      {/* Відділення */}
      {deliveryMethod === "branch" && (
        <label className="block">
          <span className="text-sm">Оберіть відділення</span>
          <select
            {...register("branchNumber", {
              required: "Вкажіть номер відділення",
            })}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Оберіть відділення</option>
            {warehouses.map((w) => (
              <option key={w.Ref} value={w.Number}>
                {w.Description}
              </option>
            ))}
          </select>
          {errors.branchNumber && (
            <p className="text-red-500 text-sm">
              {errors.branchNumber.message}
            </p>
          )}
        </label>
      )}

      {/* Адреса */}
      {deliveryMethod === "address" && (
        <Input
          placeholder="Адреса"
          {...register("address", {
            required: "Вкажіть адресу доставки",
          })}
        />
      )}

      <Button type="submit">Далі</Button>
    </form>
  );
}
