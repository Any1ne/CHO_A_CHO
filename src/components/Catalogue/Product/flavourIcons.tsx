import {
  Candy,
  Citrus,
  Flag,
  Cloud,
  Sun,
  Snowflake,
  Flame,
  Smile,
  Milk,
  Shield,
  Grape,
  // Star,
} from "lucide-react";
import { ReactNode } from "react";

const flavourIcons: Record<string, ReactNode> = {
  ПРАПОР: <Flag className="w-4 h-4 mr-2 text-red-600" />,
  ОРЕО: <Cloud className="w-4 h-4 mr-2 text-gray-500" />,
  КОКОС: <Sun className="w-4 h-4 mr-2 text-yellow-400" />,
  ВАНІЛЬ: <Snowflake className="w-4 h-4 mr-2 text-blue-400" />,
  "МАТЧА-МАЛИНА": <Flame className="w-4 h-4 mr-2 text-pink-500" />,
  ПОЛУНИЦЯ: <Candy className="w-4 h-4 mr-2 text-rose-500" />,
  АПЕЛЬСИН: <Citrus className="w-4 h-4 mr-2 text-orange-500" />,
  ЛАЙМ: <Citrus className="w-4 h-4 mr-2 text-lime-500" />,
  ЯГОДА: <Grape className="w-4 h-4 mr-2 text-purple-600" />,
  ЧОРНА: <Shield className="w-4 h-4 mr-2 text-black" />,
  МОЛОЧНА: <Milk className="w-4 h-4 mr-2 text-neutral-400" />,
  ТОФІ: <Smile className="w-4 h-4 mr-2 text-yellow-600" />,
};

export default flavourIcons;
