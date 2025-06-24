export const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Клієнт
    return "";
  }

  // Сервер
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
};
