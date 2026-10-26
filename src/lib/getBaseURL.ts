export const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Клієнт
    return "";
  }

  // Сервер
  // Strip trailing slashes so `${base}/api/...` never becomes `//api`.
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
};
