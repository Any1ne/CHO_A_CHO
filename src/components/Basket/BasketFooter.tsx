export default function BasketFooter() {
  return (
    <div className="mt-4">
      <div className="flex justify-between font-semibold">
        <span>Total:</span>
        <span>$27.98</span> {/* динамічно пізніше */}
      </div>
      <button className="mt-4 w-full bg-black text-white py-2 rounded">
        Checkout
      </button>
    </div>
  );
}
