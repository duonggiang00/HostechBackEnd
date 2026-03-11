import type { ReactNode } from "react";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./QueryClient";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * App-level providers — thứ tự quan trọng:
 * 1. BrowserRouter (router context)
 * 2. QueryClientProvider (server state)
 */
export const Providers = ({ children }: ProvidersProps) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};
