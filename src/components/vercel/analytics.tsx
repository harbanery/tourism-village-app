"use client";

import { Analytics } from "@vercel/analytics/next";

export default function CustomAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        if (event.url.includes("/admin")) return null;
        return event;
      }}
    />
  );
}
