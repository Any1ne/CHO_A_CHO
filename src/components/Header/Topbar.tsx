export default function Topbar() {
  return (
    <div className="relative bg-white text-dark text-sm h-[1.6rem] py-1 overflow-hidden flex justify-center">
      <div className="w-[60%] overflow-hidden">
        <div className="relative left-full animate-marquee whitespace-nowrap">
          <span className="mx-4">
            🚚 Безкоштовна доставка та оптові ціни від 1350 ₴
          </span>
          <span className="mx-4">
            ✨ Брендуй свою упаковку для бізнесу — корпоративні замовлення з логотипом
          </span>
          <span className="mx-4">
            🍫 Створи свій дизайн на шоколаді у конструкторі
          </span>
        </div>
      </div>
    </div>
  );
}
