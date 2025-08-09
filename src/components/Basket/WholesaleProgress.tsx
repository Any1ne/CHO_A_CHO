"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/types";
import { useEffect } from "react";
import { updateWholesale } from "@/store/slices/checkoutSlice";
import { motion, AnimatePresence } from "framer-motion";

export default function WholesaleProgress() {
  const dispatch = useDispatch();
  const total = useSelector((state: RootState) =>
    state.basket.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  const freeLimit = 1350;
  const progress = Math.min((total / freeLimit) * 100, 100);
  const isWholesale = total >= freeLimit;

  useEffect(() => {
    dispatch(updateWholesale(total));
  }, [total, dispatch]);

  return (
    <div className="bg-muted p-4 rounded-lg space-y-2 mt-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={isWholesale ? "free" : "not-free"}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.3 }}
              className="space-y-1"
            >
              <p className="text-sm font-medium">
                {isWholesale
                  ? "Оптова ціна та безкоштовна доставка"
                  : "Безкоштовна доставка"}
              </p>
              <p className="text-xs text-muted-foreground h-[2rem]">
                {isWholesale ? (
                  <>
                    Ви отримали <b>оптову ціну</b> та <b>безкоштовну доставку</b> 🎉
                  </>
                ) : (
                  <>
                    Замовляй на суму від {freeLimit}₴, щоб отримати{" "}
                    <b>оптову ціну</b> та <b>безкоштовну доставку</b>
                  </>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ✅ Анімація CheckCircle */}
        <AnimatePresence>
          {isWholesale && (
            <motion.div
              key="check-icon"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CheckCircle className="text-green-500" size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
