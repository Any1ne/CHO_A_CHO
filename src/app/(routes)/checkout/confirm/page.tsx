import ConfirmPageClient from "@/components/Checkout/ConfirmPageClient";
import { Suspense } from 'react'

export default function CheckoutConfirmPage() {
  return (
    <Suspense>
  <ConfirmPageClient />
    </Suspense>
  );
}
