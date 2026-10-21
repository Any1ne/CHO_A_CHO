// Wholesale prices + free delivery switch on once the basket total counted
// at WHOLESALE prices reaches this amount (UAH). Counting at wholesale (not
// retail) guarantees the order is never below the threshold after the switch.
export const WHOLESALE_THRESHOLD = 1350;

export const WHOLESALE_THRESHOLD_LABEL =
  WHOLESALE_THRESHOLD.toLocaleString("uk-UA");

export function getWholesaleTotal(
  items: { wholesale_price: number; quantity: number }[]
) {
  return items.reduce(
    (sum, item) => sum + Number(item.wholesale_price) * item.quantity,
    0
  );
}
