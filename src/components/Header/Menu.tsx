import Link from "next/link";
export default function Menu() {
  return (
    <nav className="flex box px-4 items-center justify-self-stretch  row-start-2">
      <ul className="flex space-x-4 ">
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
  );
}
