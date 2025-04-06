type Props = {
  item: {
    id: number;
    name: string;
    price: number;
  };
};

export default function BasketItem({ item }: Props) {
  return (
    <li className="flex justify-between items-center py-2 border-b">
      <span>{item.name}</span>
      <span>${item.price.toFixed(2)}</span>
    </li>
  );
}
