import RequestForm from "./RequestForm";
import RequestHeader from "./RequestHeader";
import RequestOverlay from "./RequestOverlay";

type Props = {
  onClose: () => void;
};

export default function RequestModal({ onClose }: Props) {
  return (
    <>
      <RequestOverlay onClose={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-40 text-black">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
          <RequestHeader onClose={onClose} />
          <RequestForm onClose={onClose}/>
        </div>
      </div>
    </>
  );
}
