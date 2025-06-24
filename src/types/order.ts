import {ContactInfo, DeliveryInfo, PaymentInfo} from "@/types/checkout";
import { BasketItem } from "@/types/basket";

export type OrderSummary ={
    orderId: string,
    orderNumber?: string,
     checkoutSummary: {
      contactInfo?: ContactInfo;
      deliveryInfo?: DeliveryInfo;
      paymentInfo?: PaymentInfo;
      isFreeDelivery: boolean;
    }
    status: string;
    items: BasketItem[];
    total: number;
  }