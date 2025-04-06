import BasketItem from "./BasketItem";

const dummyItems = [
  { id: 1, name: "Dark Chocolate", price: 14.99 },
  { id: 2, name: "Milk Chocolate", price: 12.99 },
];

export default function BasketItemsList() {
  return (
    <ul className="flex-grow overflow-auto">
      {dummyItems.map((item) => (
        <BasketItem key={item.id} item={item} />
      ))}
    </ul>
  );
}
