# 🍫 CHO A CHO STORE

![CHO A CHO Logo](https://www.choacho.com.ua/og-image.jpg)

Delicious handmade chocolate from Ukraine – explore our exclusive CHO A CHO collections.
This is the official online store for the CHO A CHO chocolate brand, built for both everyday customers and businesses such as cafes, restaurants, and more.

---

## 🚀 Live Demo

🌐 [www.choacho.com.ua](https://www.choacho.com.ua)

---

## 📸 Screenshots

> ![Screenshot](https://www.choacho.com.ua/_next/image?url=https%3A%2F%2F9qy6ktzgsu2nlgvi.public.blob.vercel-storage.com%2Fwebbanner%2F0.webp&w=1920&q=75)

---

## 🧰 Tech Stack

### Core Technologies:

- **Next.js**, **React.js**, **TypeScript**, **JavaScript**
- **Tailwind CSS**, **ShadCN**, **Lucide**, **Embla Carousel**, **Headless UI**
- **React Query**, **Redux**, **React Hook Form**
- **Node.js**, **Express.js**
- **Axios**, **Jest**

### Database & Infrastructure:

- **PostgreSQL**, **Supabase**, **Redis**, **Redis Cloud**, **Blob Storage**
- **Vercel**, **Cloudflare**

### APIs & Third-Party Services:

- **Nova Poshta API**
- **MonoPay API** (Google Pay, Apple Pay, Visa, Mastercard)
- **Resend (email API)**

---

## 📦 Features

### ✅ Implemented

#### v1.4.5 (Latest)
- 🔗 **Dynamic Product Pages**: Server-side rendered product pages with individual URLs (`/store/[productId]`)
- 🔍 **Advanced SEO**: Comprehensive metadata generation including Open Graph, canonical URLs, and JSON-LD schema for each product
- 🎨 **Modal System Integration**: Seamless modal-to-page navigation with proper routing
- 🎯 **Enhanced Analytics**: Fixed tracking for `begin_checkout` and `purchase` events
- 📊 **Google Shopping Feed**: Static XML feed for Google Merchant Center integration
- 🎭 **Skeleton Loading**: Improved loading states throughout the application
- 🛠️ **Bug Fixes**: Card overlay improvements, padding adjustments in basket modal, and ESLint error fixes

#### v1.3.0
- 🏠 **Local Development Mode**: Full local environment support with `.env` configuration
- 🐳 **Makefile Support**: Automated development workflows via Makefile and npm scripts
- 🗄️ **Database Initialization**: Relevant `dump.sql` for quick database setup
- 📧 **Local Email Testing**: Email functionality for local development
- 💳 **Local Payment Testing**: Payment integration testing in local environment
- 🔐 **Redis Integration**: Order state management with Redis for improved performance

#### v1.2.1
- 📊 **Analytics Middleware**: Advanced tracking for dataLayer.push() events (GTM / GA4 / Google Ads)
- 🔄 **Redux Integration**: Analytics events properly integrated with Redux store
- 🛒 **Wholesale Toggle Tracking**: Enhanced tracking for B2B functionality

#### v1.2.0
- 🔒 **Privacy Policy & Cookies Page**: Dedicated legal compliance pages
- 🍪 **Cookie Consent Banner**: GDPR-compliant cookie consent functionality

#### v1.1.0 + v1.1.1
- 📦 **Special Category**: Curated special collections section
- 🛒 **Wholesale Logic**: B2B functionality for bulk orders
- 📝 **Content Updates**: Minor text changes and improvements

#### v1.0.0 – MVP
- 📦 **Product Catalog**: Full-featured product browsing
- 🛒 **Shopping Cart**: Interactive cart with real-time updates
- 📝 **Order Checkout**: Complete checkout flow
- 💳 **Payment Integration**: MonoPay API (Google Pay, Apple Pay, Visa, Mastercard)
- 📧 **Email Confirmations**: Automated order confirmation emails
- 📱 **Responsive Design**: Mobile-first design for all devices

### 🔜 Upcoming Features:

- 🔐 User and admin authentication
- 🛠️ Admin panel for managing products, orders, banners
- 🌍 English version of the website
- 📝 User reviews and ratings
- 🔎 Site-wide search functionality
- 📸 Company information banners
- 📱 Email/SMS notifications for order updates

> **All functionality is custom-built** — no CMS or templates were used.

---

## 📂 Project Structure

> _(Will be added later)_

---

## 🛠️ Local Development

### Requirements:

- Node.js ≥ 18.x
- PostgreSQL
- Redis

### Quick Start with Makefile:

```bash
# Initialize database
make init-db

# Start development server
make dev

# Run tests
make test
```

### Environment Variables (excerpt from `.env.example`):

```env
REDIS_URL=
POSTGRES_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NOVA_POSHTA_API_KEY=
RESEND_API_KEY=
MONOBANK_API_TOKEN=
DOMAIN=
SEND_EMAIL=
ADMIN_EMAIL=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

---

## 📌 Version

**Current Version:** `1.4.5`

### Version History:

**v1.4.5** - Latest Release
- Dynamic product pages with SEO optimization
- Enhanced analytics and tracking
- Google Shopping feed integration
- UI/UX improvements and bug fixes

**v1.3.0** - Local Development
- Local mode implementation with full environment support
- Makefile automation
- Database initialization scripts

**v1.2.1** - Analytics
- Advanced analytics middleware integration

**v1.2.0** - Compliance
- Privacy policy and cookie consent

**v1.1.0** - Business Features
- Special category and wholesale logic

**v1.0.0** - MVP
- Initial product launch with core e-commerce functionality

> `CHANGELOG.md` not available yet.

---

## 👨‍💻 Author

**Arthur Dombrovskiy**
- GitHub: [@Any1ne](https://github.com/Any1ne)
- LinkedIn: [Arthur Dombrovskiy](https://www.linkedin.com/in/arthur-dombrovskiy-b688ba331)
- Email: [anytguy@gmail.com](mailto:anytguy@gmail.com)
- Telegram: [@anytguy](https://t.me/anytguy)

---

## 📄 License

All rights reserved.  
This project is proprietary software developed for the CHO A CHO chocolate brand.  
You may not use, copy, modify, distribute, or publish any part of this codebase without explicit permission.

---

## 📌 Note

- There is currently no public roadmap or pull request support.
- If you'd like to propose improvements, feel free to reach out directly.