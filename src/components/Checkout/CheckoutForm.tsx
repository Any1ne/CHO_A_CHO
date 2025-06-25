"use client";

import ContactInfoBlock from "./ContactInfoBlock";
import DeliveryInfoBlock from "./DeliveryInfoBlock";
import PaymentInfoBlock from "./PaymentInfoBlock";
import { useAppSelector } from "@/lib/hooks/hooks";

export default function CheckoutForm() {
  const currentStep = useAppSelector((state) => state.checkout.currentStep);

  return (
    <div className="space-y-6">
      <ContactInfoBlock isActive={currentStep === "contact"} />
      <DeliveryInfoBlock isActive={currentStep === "delivery"} />
      <PaymentInfoBlock isActive={currentStep === "payment"} />
    </div>
  );
}
