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
import { WarehouseSelect } from "./WarehouseSelect";
import { StreetSelect } from "./StreetSelect";
import { fetchCities, fetchWarehouses, fetchStreets } from "@/lib/api";
import clsx from "clsx";
import { CircleAlertIcon, HomeIcon, StoreIcon } from "lucide-react";


type DeliveryFormData = {
  city: {
    Ref: string;
    Description: string;
  };
  deliveryMethod: "branch" | "address";
  branchNumber?: string;
  street?: string;
  house?: string;
  apartment?: string;
  address?: string;
};

export default function DeliveryInfo({ isActive }: { isActive: boolean }) {
  const dispatch = useAppDispatch();
  const defaultValues = useAppSelector(
    (s) => s.checkout.checkoutSummary?.deliveryInfo
  );

  const {
  register,
  handleSubmit,
  watch,
  setValue,
  setError,
  clearErrors,
  formState: { errors },
} = useForm<DeliveryFormData>({
  defaultValues,
  mode: "onTouched",
});

  const deliveryMethod = watch("deliveryMethod");
  const selectedCity = watch("city");
  const selectedStreet = watch("street");
  const selectedWarehouse = watch("branchNumber");
  const isCompleted = !!defaultValues?.city;
  const isCourierAvailable = selectedCity?.Description === "Київ";

  const [openPopover, setOpenPopover] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [streets, setStreets] = useState<any[]>([]);

  useEffect(() => {
    fetchCities()
      .then((data) => setCities(data))
      .catch((e) => console.error("Failed to load cities", e));
  }, []);

  useEffect(() => {
  if (deliveryMethod === "branch") {
    clearErrors(["street", "house", "apartment"]);
  } else if (deliveryMethod === "address") {
    clearErrors(["branchNumber"]);
  }
}, [deliveryMethod, clearErrors]);


  useEffect(() => {
    if (selectedCity?.Ref) {
      setValue("deliveryMethod", "branch");
      setValue("branchNumber", "");
      setValue("street", "");
      setValue("house", "");
      setValue("apartment", "");

      fetchWarehouses(selectedCity.Ref)
        .then(setWarehouses)
        .catch((e) => console.error("Failed to load warehouses", e));

      fetchStreets(selectedCity.Ref)
        .then(setStreets)
        .catch((e) => console.error("Failed to load streets", e));
    }
  }, [selectedCity, setValue]);

  const onSubmit = (data: DeliveryFormData) => {
  let hasError = false;
  
  if (data.deliveryMethod === "branch") {
    if (!data.branchNumber) {
      setError("branchNumber", { type: "manual" });
      hasError = true;
    } else {
      clearErrors("branchNumber");
    }
  }

  if (data.deliveryMethod === "address") {
    if (!data.street) {
      setError("street", { type: "manual" });
      hasError = true;
    } else {
      clearErrors("street");
    }

    if (!data.house) {
      setError("house", { type: "manual" });
      hasError = true;
    } else {
      clearErrors("house");
    }
  }

  if (hasError) return;

  let fullAddress: string | undefined = undefined;

  if (data.deliveryMethod === "address") {
    fullAddress = `вул. ${data.street}, буд. ${data.house}${
      data.apartment ? `, кв. ${data.apartment}` : ""
    }`;
  }

  const finalData: DeliveryFormData = {
    ...data,
    address: fullAddress,
  };

  dispatch(setDeliveryInfo(finalData));
  dispatch(completeStep("delivery"));
  dispatch(setStep("payment"));
};

  if (!isActive && isCompleted) {
    return (
      <div className="border p-4 rounded-xl bg-muted">
        <h3 className="font-semibold">2. Доставка</h3>
        <p>
          {defaultValues.city.Description} —{" "}
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
      className={clsx(
        "space-y-4 p-4 rounded-xl transition-shadow duration-300",
        isActive
          ? "border border-primary shadow-primary"
          : "border"
      )}
    >
      <h3 className="font-semibold">2. Доставка</h3>

      {/* Місто */}
      <div className="mb-4">
        <label htmlFor="city" className="text-sm block mb-1">
          Місто
        </label>

        <div className="flex flex-wrap gap-2 text-sm mb-2">
          {["Київ", "Львів", "Одеса", "Харків"].map((cityName) => {
            const cityObj = cities.find((c) => c.Description === cityName);
            if (!cityObj) return null;
            const isSelected = selectedCity?.Description === cityName;
            return (
              <Button
                type="button"
                key={cityName}
                variant="link"
                className={clsx(
                  "px-0 py-0 h-auto underline text-muted-foreground hover:text-secondary",
                  isSelected && "text-primary font-medium hover:text-primary"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  setValue("city", cityObj);
                }}
              >
                {cityName}
              </Button>
            );
          })}
        </div>

        <div
    className={clsx("rounded-md", {
      "border border-red-500": errors.city,
    })}
  >
    <CitySelect
      cities={cities}
      selectedCity={selectedCity}
      onSelect={(city) => {
        setValue("city", city);
        clearErrors("city");
      }}
      open={openPopover}
      setOpen={setOpenPopover}
    />
  </div>
      </div>

      {/* Метод доставки */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Відділення */}
        <label
          htmlFor="branch"
          className={clsx(
            "border rounded-lg p-4 cursor-pointer flex items-start gap-2 bg-white shadow-sm",
            {
              "ring-2 ring-primary": deliveryMethod === "branch",
              "opacity-50 cursor-not-allowed": !selectedCity,
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
            disabled={!selectedCity}
            className="mt-1"
          />
          <div className="flex flex-col">
  <div className="flex items-center gap-2">
    <StoreIcon className="w-5 h-5 text-primary" />
    <p className="font-semibold">До відділення</p>
  </div>
  <p className="text-sm text-muted-foreground">
    Самостійно забрати замовлення у відділенні Нової Пошти
  </p>
</div>

        </label>

        {/* Кур'єр */}
        <label
          htmlFor="address"
          className={clsx(
            "border rounded-lg p-4 cursor-pointer flex items-start gap-2 bg-white shadow-sm",
            {
              "ring-2 ring-primary": deliveryMethod === "address",
              "opacity-50 cursor-not-allowed": !isCourierAvailable,
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
            disabled={!isCourierAvailable}
            className="mt-1"
          />
          <div className="flex flex-col">
  <div className="flex items-center gap-2">
    <HomeIcon className="w-5 h-5 text-primary" />
    <p className="font-semibold">Кур'єром</p>
  </div>
  <p className="text-sm text-muted-foreground">
    Доставка кур'єром на адресу оператором Нової пошти
  </p>
  {!isCourierAvailable && selectedCity && (
    <p className="text-xs text-muted-foreground mt-1">
      Доставка кур'єром доступна лише в місті Київ
    </p>
  )}
</div>

        </label>
      </div>

      {/* Відділення */}
      {deliveryMethod === "branch" && (
  <div className="mt-2">
    <label className="block text-sm mb-1">Відділення</label>
    <div
      className={clsx("rounded-md", {
        "border border-red-500": errors.branchNumber,
      })}
    >
      <WarehouseSelect
  warehouses={warehouses}
  selectedWarehouse={selectedWarehouse || ""}
  onSelect={(value) => {
    setValue("branchNumber", value);
    clearErrors("branchNumber");
  }}
/>

    </div>
  </div>
)}

      {/* Адресна доставка */}
      {deliveryMethod === "address" && (
        <>
          <div className="mt-2">
  <label className="block text-sm mb-1">Вулиця</label>
  <div
    className={clsx("rounded-md", {
      "border border-red-500": errors.street,
    })}
  >
    <StreetSelect
  streets={streets}
  selectedStreet={selectedStreet || ""}
  onSelect={(value) => {
    setValue("street", value);
    clearErrors("street");
  }}
/>
  </div>

</div>

          <div>
            <label className="block text-sm mb-1">Будинок</label>
            <Input
  placeholder="№ будинку"
  {...register("house", {
    required:
      deliveryMethod === "address"
        ? "Вкажіть номер будинку"
        : false,
  })}
  className={clsx({
    "border-red-500 focus-visible:ring-red-500": errors.house,
  })}
/>
          </div>

          <div>
            <label className="block text-sm mb-1">Квартира</label>
            <Input
              placeholder="№ квартири (необов’язково)"
              {...register("apartment")}
            />
          </div>
        </>
      )}

      {/* Глобальний блок помилок, якщо є помилки */}
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
