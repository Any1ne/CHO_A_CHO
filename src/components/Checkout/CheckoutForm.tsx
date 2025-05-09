"use client";

import ContactInfo from "./ContactInfo";
import DeliveryInfo from "./DeliveryInfo";
import PaymentInfo from "./PaymentInfo";
import { useAppSelector } from "@/lib/hooks/hooks";

export default function CheckoutForm() {
  const currentStep = useAppSelector((state) => state.checkout.currentStep);

  return (
    <div className="space-y-6">
      <ContactInfo isActive={currentStep === "contact"} />
      <DeliveryInfo isActive={currentStep === "delivery"} />
      <PaymentInfo isActive={currentStep === "payment"} />
    </div>
  );
}
