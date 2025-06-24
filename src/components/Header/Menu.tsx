import Link from "next/link";
import links from "../../constants/Links/links";

export default function Menu() {
  return (
    <nav className="flex justify-stretch justify-start justify-self-start box-border">
      <ul className="flex space-x-5 justify-stretch">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-lg font-bold text-white hover:text-dark"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
