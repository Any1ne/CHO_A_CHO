import Link from "next/link";
import links from "../../constants/Links/links";

export default function Menu() {
  return (
    <nav className="flex flex-col gap-2 mt-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-lg text-gray-800 hover:text-blue-600"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
