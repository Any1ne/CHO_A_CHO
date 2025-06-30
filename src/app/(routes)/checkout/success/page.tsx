import SuccessPageClient from "@/components/Checkout/SuccessPageClient";
import { Suspense } from 'react'

export default function CheckoutSuccessPage() {
  return (
  <div className="min-h-[85vh]">
    <Suspense>
  <SuccessPageClient />
    </Suspense>
    </div>
  );
}
