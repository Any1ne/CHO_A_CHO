"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { handleOrderConfirmation } from "@/lib/api";

export default function ConfirmPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const orderId = searchParams.get("orderId");

  const hasRun = useRef(false);

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    handleOrderConfirmation(orderId, dispatch, router);
  }, [orderId, dispatch, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 mt-[6rem] md:mt-[8rem]">
      <p>Підтвердження замовлення...</p>
    </div>
  );
}
