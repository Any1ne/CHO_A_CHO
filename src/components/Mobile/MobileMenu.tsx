import Link from "next/link";
import links from "../../constants/Links/links";

type Props = {
  onClose: () => void;
};

export default function Menu({ onClose }: Props) {
  return (
    <nav className="flex flex-col gap-2 mt-4 p-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-lg text-gray-800 hover:text-blue-600"
          onClick={onClose}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
