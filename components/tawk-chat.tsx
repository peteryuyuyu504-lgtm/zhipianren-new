"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type TawkApi = {
  hideWidget?: () => void;
  showWidget?: () => void;
};

declare global {
  interface Window {
    Tawk_API?: TawkApi;
  }
}

const TAWK_SCRIPT = `
var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();
(function () {
  var s1 = document.createElement("script"),
    s0 = document.getElementsByTagName("script")[0];
  s1.async = true;
  s1.src = "https://embed.tawk.to/6a50923cf813ca1d4b272007/1jt5bmg2b";
  s1.charset = "UTF-8";
  s1.setAttribute("crossorigin", "*");
  s0.parentNode.insertBefore(s1, s0);
})();
`;

function isAdminPath(pathname: string | null) {
  return pathname === "/admin" || pathname?.startsWith("/admin/") === true;
}

function syncTawkVisibility() {
  if (typeof window === "undefined") return;

  if (isAdminPath(window.location.pathname)) {
    window.Tawk_API?.hideWidget?.();
  } else {
    window.Tawk_API?.showWidget?.();
  }
}

export function TawkChat() {
  const pathname = usePathname();
  const isAdmin = isAdminPath(pathname);

  useEffect(() => {
    syncTawkVisibility();
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <Script
      id="tawk-to"
      strategy="afterInteractive"
      onLoad={syncTawkVisibility}
    >
      {TAWK_SCRIPT}
    </Script>
  );
}
