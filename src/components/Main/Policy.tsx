"use client";

import { motion } from "framer-motion";

export default function Policy() {
  return (
    <motion.section
      className="max-w-3xl mx-auto px-4 md:px-6 font-sans text-[15px] leading-relaxed text-foreground"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Заголовок */}
      <h1 className="text-4xl md:text-5xl font-semibold text-black mb-3 text-center">
        Політика конфіденційності та Cookies
      </h1>
      <p className="text-center text-muted-foreground text-sm mb-10">
        Останнє оновлення: <span className="font-medium">13.10.2025</span>
      </p>

      {/* Вступ */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">1. Вступ</h2>
      <p>
        Ця Політика конфіденційності пояснює, які персональні дані ми збираємо
        на сайті <strong>www.choacho.com.ua</strong>, як ми їх використовуємо, з ким можемо
        їх ділитися і які у вас є права щодо цих даних. Використовуючи сайт або
        замовляючи товари, ви погоджуєтесь із цією Політикою.
      </p>

      {/* Контакти */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">2. Відповідальна особа</h2>
      <ul className="list-disc list-inside space-y-1">
        <li><strong>Назва:</strong> CHO A CHO</li>
        <li><strong>Адреса:</strong> Kyiv, Ovanesa Tumanyana St, 15</li>
        <li><strong>Email:</strong> info@choacho.com</li>
        {/* <li><strong>Телефон:</strong> +38 (067) 138-5282</li> */}
        <li><strong>ЄДРПОУ / ІПН:</strong> 44948226 / 449482226537</li>
      </ul>

      {/* Цілі збору */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">3. Для чого ми збираємо дані</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>обробка замовлень (оплата, доставка);</li>
        <li>виконання юридичних та бухгалтерських зобов’язань;</li>
        <li>покращення роботи сайту (аналітика) та показ реклами (за вашою згодою);</li>
        <li>комунікація з клієнтами (підтвердження, відповіді).</li>
      </ul>
      <p className="italic text-muted-foreground mt-2">
        Простіше кажучи: ми збираємо лише те, що потрібно, щоб ви могли замовити та отримати шоколад 🍫
      </p>

      {/* Типи даних */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">4. Які дані ми збираємо</h2>
      <p>
        <strong>Дані замовлення:</strong> ім’я, прізвище, email, телефон, адреса доставки.  
        Платіжні дані обробляє платіжний провайдер — ми їх не зберігаємо.
      </p>
      <p>
        <strong>Автоматичні дані:</strong> IP-адреса, дані пристрою, cookie, сторінки, які ви переглядаєте.
      </p>
      <p>
        <strong>Маркетингові дані:</strong> email для розсилок, згоди на рекламу (за бажанням).
      </p>

      {/* Правові підстави */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">5. Правові підстави обробки</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>виконання договору купівлі-продажу;</li>
        <li>виконання юридичних обов’язків;</li>
        <li>законний інтерес (аналітика, покращення сервісу);</li>
        <li>згода користувача (GDPR, cookies, реклама).</li>
      </ul>

      {/* Платежі та сервіси */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">6. Платіжні сервіси та партнери</h2>
      <p>
        Ми використовуємо <strong>Plata by Mono</strong> та оплату при отриманні (COD).  
        Також на сайті можуть бути підключені сервіси: Google Analytics (GA4), Google Ads, Vercel, Resend, Supabase.
      </p>

      {/* Cookies */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">7. Cookies простими словами</h2>
      <p>
        Cookie — це маленькі файли, які сайт зберігає у вашому браузері, щоб пам’ятати ваші налаштування чи кошик.
      </p>
      <p className="italic text-muted-foreground">
        Простіше: cookie — це як міні-нотатка для сайту, щоб зробити покупки зручнішими 😄
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>Необхідні (функціональні)</li>
        <li>Аналітичні — Google Analytics</li>
        <li>Маркетингові — Google Ads (за згодою)</li>
      </ul>

      {/* GDPR */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">8. Згода на cookie (GDPR)</h2>
      <p>
        Ми не активуємо аналітичні чи маркетингові cookie без вашої згоди.  
        За замовчуванням працюють лише необхідні файли cookie.
      </p>

      {/* Треті сторони */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">9. Передача даних третім сторонам</h2>
      <p>
        Дані можуть передаватися лише нашим партнерам для платежів, доставки або аналітики — з дотриманням вимог GDPR.
      </p>

      {/* Зберігання */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">10. Зберігання даних</h2>
      <p>
        Замовлення зберігаються мінімальний строк, передбачений законом.  
        Дані для розсилок — до відкликання вашої згоди.
      </p>

      {/* Права */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">11. Ваші права</h2>
      <ul className="list-disc list-inside space-y-1">
        <li>доступ до своїх даних;</li>
        <li>виправлення неточностей;</li>
        <li>видалення або обмеження обробки;</li>
        <li>відкликання згоди;</li>
        <li>скарга до контролюючого органу.</li>
      </ul>
      <p className="mt-2">
        Щоб скористатися цими правами — напишіть нам:{" "}
        <a href="mailto:info@choacho.com" className="text-link hover:underline">
          info@choacho.com
        </a>
      </p>

      {/* Завершення */}
      <h2 className="text-2xl font-semibold text-black mt-10 mb-3">12. Набрання чинності та зміни</h2>
      <p>
        Ця Політика набирає чинності з <strong>13.10.2025</strong>.  
        Ми можемо оновлювати її у разі змін у законодавстві чи технологіях.  
        Продовжуючи користуватись сайтом, ви погоджуєтесь із оновленими умовами.
      </p>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground mt-12 border-t border-border pt-6">
        © {new Date().getFullYear()} <strong>CHO A CHO</strong> — Всі права захищені.
      </p>
    </motion.section>
  );
}
