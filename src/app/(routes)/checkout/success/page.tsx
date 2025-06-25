import SuccessPageClient from "@/components/Checkout/SuccessPageClient";
import { Suspense } from 'react'

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
  <SuccessPageClient />
    </Suspense>
  );
}
