import Link from "next/link";

export default function Header() {
  return (
    <header className="p-4 bg-gray-800 text-white">
      <nav>
        <ul className="flex space-x-4">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/store">Store</Link>
          </li>
          <li>
            <Link href="/request">Request</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
