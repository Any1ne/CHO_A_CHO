import Link from "next/link";

export default function Gateway() {
  return (
    <div className="flex justify-center space-x-4 p-4">
      <Link href="/store">
        <button className="p-2 bg-green-500 text-white">Go to Store</button>
      </Link>
      <Link href="/request">
        <button className="p-2 bg-blue-500 text-white">Leave Request</button>
      </Link>
    </div>
  );
}
