import Link from "next/link";
import links from "../../constants/Links/links";

export default function Menu() {
  return (
    <nav className="flex justify-stretch row-start-2 box-border">
      <ul className="flex space-x-10 justify-stretch">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-xl text-gray-800 hover:text-blue-600"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
