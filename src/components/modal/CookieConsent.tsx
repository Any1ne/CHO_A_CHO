"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setIsVisible(true);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie_consent", "all");
    setIsVisible(false);
  };

  const handleOnlyNecessary = () => {
    localStorage.setItem("cookie_consent", "necessary");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[94%] sm:w-[580px]"
        >
          <Card className="rounded-3xl shadow-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] dark:bg-[var(--color-card)] transition-colors">
            <CardContent className="px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 text-sm leading-snug">
                <div className="flex items-center justify-center w-20 h-10 rounded-full bg-[var(--primary)]/30 text-[var(--primary)]">
                  <Cookie className="w-5 h-5" />
                </div>
                <p className="max-w-[360px]">
                  Ми використовуємо cookies, щоб зробити ваш досвід ще солодшим.{" "}
                  <a
                    href="/policy"
                    className="text-[var(--color-link)] font-medium underline underline-offset-2 hover:no-underline"
                  >
                    Детальніше
                  </a>
                </p>
              </div>

              <div className="flex justify-end gap-2 sm:ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-primary-light)]/40"
                  onClick={handleOnlyNecessary}
                >
                  Лише необхідні
                </Button>
                <Button
                  size="sm"
                  className="rounded-full bg-[var(--primary)] hover:brightness-110 text-white font-medium shadow-md"
                  onClick={handleAcceptAll}
                >
                  Прийняти всі
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
