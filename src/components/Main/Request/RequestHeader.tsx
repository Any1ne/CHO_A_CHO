import { X } from "lucide-react";

type HeaderProps = {
  onClose: () => void;
};

export default function RequestHeader({ onClose }: HeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold">Контактна форма</h2>
      <button onClick={onClose}>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
