export default function Footer() {
  return (
    <footer className="w-full border-t bg-white text-gray-700 py-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
        {/* Contact Us */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
          <p>Email: info@choacho.com</p>
          <p>Phone: +38 (050) 123-4567</p>
          <p>Address: Kyiv, Ukraine</p>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Social</h3>
          <ul className="space-y-1">
            <li>
              <a href="#" className="hover:underline">
                Instagram
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Facebook
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                TikTok
              </a>
            </li>
          </ul>
        </div>

        {/* Pages */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Pages</h3>
          <ul className="space-y-1">
            <li>
              <a href="/store" className="hover:underline">
                Store
              </a>
            </li>
            <li>
              <a href="/branded" className="hover:underline">
                Branded Offer
              </a>
            </li>
            <li>
              <a href="/about" className="hover:underline">
                About Us
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        &copy; 2025 CHO A CHO. All rights reserved.
      </div>
    </footer>
  );
}
