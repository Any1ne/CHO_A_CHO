import Image from "next/image";

const paymentIcons = [
  { src: "/payments/monobank.svg", alt: "Monobank" },
  { src: "/payments/google_pay.svg", alt: "Google Pay" },
  { src: "/payments/apple_pay.svg", alt: "Apple Pay" },
  { src: "/payments/mc.svg", alt: "MasterCard" },
  { src: "/payments/visa.svg", alt: "Visa" },
  { src: "/payments/novaposhta.png", alt: "Nova Poshta" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/cho_a_cho?igsh=YzZtbW5lMXEzNmx3",
    icon: "/icons/instagram.svg",
    alt: "Instagram",
  },
  {
    href: "https://www.facebook.com/choachooo/",
    icon: "/icons/facebook.svg",
    alt: "Facebook",
  },
  {
    href: "https://www.tiktok.com/@cho_a_cho",
    icon: "/icons/tiktok.svg",
    alt: "TikTok",
  },
];

export default function Footer() {
  return (
    <footer className="w-full border-t bg-dark text-white pt-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 px-2 md:px-10 lg:px-30 gap-6 text-center md:text-left">
        {/* Pages */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Сторінки</h3>
          <ul className="space-y-1">
            <li>
              <a href="/store" className="hover:underline">
                Каталог
              </a>
            </li>
            <li>
              <a href="/branded" className="hover:underline">
                Брендоване пакування
              </a>
            </li>
            <li>
              <a href="/about" className="hover:underline">
                Про нас
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Контакти</h3>
          <p>Email: info@choacho.com</p>
          <p>Телефон: +38 (067) 138-5282</p>
          <p>Адреса: Kyiv, Ovanesa Tumanyana St, 15</p>
        </div>

        {/* Social Media Icons */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Соцмережі</h3>
          <div className="flex flex-col gap-4">
            <div className="flex justify-center md:justify-start gap-4 mt-2">
              {socialLinks.map(({ href, icon, alt }) => (
                <a
                  key={alt}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image src={icon} alt={alt} width={24} height={24} />
                </a>
              ))}
            </div>
            <div>
              <p>Графік: Пн-Нд 08:00 - 19:00</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="mt-8 text-center bg-black text-sm text-gray-500 px-2 flex flex-col md:flex-row justify-stretch items-center gap-2 border-t">
        <div className="grid grid-cols-2 md:flex md:justify-evenly items-center align-center gap-10 py-4 grow">
          {paymentIcons.map((icon) => (
            <Image
              key={icon.alt}
              src={icon.src}
              alt={icon.alt}
              width={90}
              height={50}
              className="w-auto h-[1.5rem]"
            />
          ))}
          <span>&copy; 2025 CHO A CHO</span>
        </div>
      </div>
    </footer>
  );
}
