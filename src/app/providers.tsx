"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
import { ReactNode, useState } from "react";
import { store } from "@/store";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ReduxProvider>
  );
}
