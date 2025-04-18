import Link from "next/link";
import links from "../../constants/Links/links";

export default function Menu() {
  return (
    <nav className="flex items-center justify-start row-start-2 box-border">
      <ul className="flex space-x-4">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-lg text-gray-800 hover:text-blue-600"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
