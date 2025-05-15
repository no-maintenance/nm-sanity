import React, { useEffect, useState } from "react";

type ClientOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

/**
 * Client-only renders children only on the client-side, not during SSR
 * Useful for components that rely on browser APIs or cause hydration issues
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
} 