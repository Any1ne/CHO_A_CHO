import ConfirmPageClient from "@/components/Checkout/ConfirmPageClient";
import { Suspense } from 'react'

export default function CheckoutConfirmPage() {
  return (
      <div className="min-h-[85vh]">
    <Suspense>
  <ConfirmPageClient />
    </Suspense>
    </div>
  );
}
