import { OrderSummary } from "@/types";

export function generateOrderEmailHtml(order: OrderSummary, isUser: boolean = true): string {
  const { checkoutSummary, items, total, orderNumber } = order;
  const { contactInfo: contact, deliveryInfo: delivery, paymentInfo: payment } = checkoutSummary;

  const fullName = `${contact?.lastName} ${contact?.firstName}${contact?.middleName ? " " + contact?.middleName : ""}`;
  const deliveryType = delivery?.deliveryMethod === "branch" ? "Branch" : "Address";

  const orderItemsHtml = items
    .map(
      (item) =>
        `<li style="margin-bottom: 4px;">${item.title} — ${item.quantity} x ${item.price} грн</li>`
    )
    .join("");

  const deliveryText =
    deliveryType === "Branch"
      ? `У відділення №${delivery?.branchNumber}`
      : `На адресу: ${delivery?.address}`;

  const paymentText =
    payment?.paymentMethod === "cod"
      ? "Готівка при отриманні"
      : "Оплачено через Monobank";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background-color: #3f3f3f; padding: 20px; color: white;">
        <h2 style="margin: 0;">${isUser ? `Дякуємо за замовлення, ${contact?.firstName}!` : `Нове замовлення від ${fullName}`}</h2>
        <p style="margin: 4px 0 0; font-size: 15px;">Замовлення <strong>№${orderNumber}</strong> ${isUser ? "було прийнято" : "надійшло на сайт"}.</p>
      </div>

      <!-- Content -->
      <div style="background-color: #f9f9f9; color: #333; padding: 20px;">
        ${!isUser ? `<p><strong>Email:</strong> ${contact?.email}<br/><strong>Телефон:</strong> ${contact?.phone}</p>` : ""}

        <h3 style="margin-top: 20px; margin-bottom: 8px;">🧾 Деталі замовлення:</h3>
        <ul style="padding-left: 20px; margin-bottom: 16px;">${orderItemsHtml}</ul>
        <p style="font-size: 16px;"><strong>Загальна сума:</strong> ${total} грн</p>

        <h3 style="margin-top: 20px; margin-bottom: 8px;">🚚 Доставка:</h3>
        <p>${deliveryText}</p>

        <h3 style="margin-top: 20px; margin-bottom: 8px;">💳 Оплата:</h3>
        <p>${paymentText}</p>
      </div>

      <!-- Footer -->
      <div style="background-color: #1f1f1f; color: white; padding: 20px; font-size: 14px;">
        ${
          isUser
            ? `
            <p style="margin: 0 0 8px;">
              З повагою, адміністрація інтернет-магазину <strong>CHO A CHO</strong>
            </p>
            <p style="margin: 0;">
              Сайт: <a href="https://choacho.com.ua" style="color: #ffd230;">choacho.com.ua</a><br/>
              Телефон: <a href="tel:+380671385282" style="color: #ffd230;">(067) 138-52-82</a><br/>
              Email: <a href="mailto:info@choacho.com" style="color: #ffd230;">info@choacho.com</a>
            </p>
          `
            : `<p style="margin: 0;">Цей лист надіслано автоматично. Відповідати не обов’язково.</p>`
        }
      </div>
    </div>
  `;
}

export function generateContactEmailHtml(name: string, email: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background-color: #3f3f3f; padding: 20px; color: white;">
        <h2 style="margin: 0;">📬 Новий запит зворотного звʼязку</h2>
        <p style="margin: 4px 0 0; font-size: 15px;">Користувач надіслав повідомлення через контактну форму.</p>
      </div>

      <!-- Content -->
      <div style="background-color: #f9f9f9; color: #333; padding: 20px;">
        <p style="margin: 0 0 10px;"><strong>Імʼя:</strong> ${name}</p>
        <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 4px;"><strong>Повідомлення:</strong></p>
        <div style="padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px; white-space: pre-wrap; line-height: 1.5;">
          ${message.replace(/\n/g, "<br>")}
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #1f1f1f; color: white; padding: 20px; font-size: 14px;">
        <p style="margin: 0 0 8px;">Цей лист сформовано автоматично. Не відповідайте на нього.</p>
        <p style="margin: 0;">
          Контактна форма на сайті <a href="https://choacho.com.ua" style="color: #ffd230;">choacho.com.ua</a>
        </p>
      </div>
    </div>
  `;
}

