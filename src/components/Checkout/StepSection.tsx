import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StepSectionProps {
  title: string;
  isOpen: boolean;
  children: ReactNode;
  summary?: ReactNode;
}

export default function StepSection({
  title,
  isOpen,
  children,
  summary,
}: StepSectionProps) {
  return (
    <div className="border border-black p-4 rounded-2xl bg-white text-black shadow-sm">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        ) : (
          summary && <div className="text-sm text-gray-600">{summary}</div>
        )}
      </AnimatePresence>
    </div>
  );
}
