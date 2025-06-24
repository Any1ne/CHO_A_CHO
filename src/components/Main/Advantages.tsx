import { Heart, Leaf, Sparkles, Clock } from "lucide-react";
import clsx from "clsx";

const advantages = [
  { icon: Heart, text: "Створено з любов'ю" },
  { icon: Leaf, text: "Натуральні продукти" },
  { icon: Sparkles, text: "Магія кожного дня" },
  { icon: Clock, text: "Швидка доставка" },
];

export default function Advantages() {
  return (
    <div
      className="
        grid grid-cols-2 md:grid-cols-4 
        border-b border-gray-200
      "
    >
      {advantages.map(({ icon: Icon, text }, i) => {
        const isLastColMobile = i % 2 === 1;
        const isLastRowMobile = i >= 2;
        const isLastColDesktop = i % 4 === 3;

        return (
          <div
            key={i}
            className={clsx(
              "flex flex-col items-center justify-center gap-2 h-[5rem] px-4 py-4 text-center border-gray-200",
              // Borders for mobile
              !isLastColMobile && "border-r",
              i < 2 && "border-b", // top row on mobile

              // Borders for md+
              "md:border-b", // all have bottom border
              !isLastColDesktop && "md:border-r"
            )}
          >
            <Icon className="w-6 h-6 text-primary" />
            <p className="text-sm font-medium">{text}</p>
          </div>
        );
      })}
    </div>
  );
}
