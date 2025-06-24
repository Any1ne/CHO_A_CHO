export type ContactInfo = {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  email: string;
};

export type City = {
  Ref: string;
  Description: string;
};

export type DeliveryInfo = {
  city: City;
  deliveryMethod: "branch" | "address";
  branchNumber?: string;
  address?: string;
};

export type PaymentInfo = {
  paymentMethod: "cod" | "monobank";
  invoiceId?: string;
};

export type Step = "contact" | "delivery" | "payment" | "checkout";

export type CheckoutSummary = {
  contactInfo?: ContactInfo;
  deliveryInfo?: DeliveryInfo;
  paymentInfo?: PaymentInfo;
  isFreeDelivery: boolean;
};