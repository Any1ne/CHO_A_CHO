"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { handleOrderConfirmation } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConfirmPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    const confirm = async () => {
      await handleOrderConfirmation(orderId, dispatch, router);
      setLoading(false);
    };

    confirm();
  }, [orderId, dispatch, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-4 mt-[6rem] md:mt-[8rem] space-y-4">
      {loading ? (
        <>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </>
      ) : (
        <p>Замовлення підтверджено</p>
      )}
    </div>
  );
}
