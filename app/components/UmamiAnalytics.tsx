"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function UmamiAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    const trackPageView = () => {
      if (window.umami) {
        let trackedPath = pathname;

        // Check if the path starts with /game/
        if (pathname.startsWith("/game/")) {
          trackedPath = "/game/[id]";
        }

        window.umami.track((props: any) => {
          const newProps = { ...props, url: trackedPath };
          return newProps;
        });
      }
    };

    if (window.umami) {
      trackPageView();
    } else {
      const interval = setInterval(() => {
        if (window.umami) {
          clearInterval(interval);
          trackPageView();
        }
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [pathname]);

  return null;
}
