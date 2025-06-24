type OverlayProps = {
  onClose: () => void;
};

export default function RequestOverlay({ onClose }: OverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-dark bg-opacity-50 z-40"
      onClick={onClose}
    />
  );
}
