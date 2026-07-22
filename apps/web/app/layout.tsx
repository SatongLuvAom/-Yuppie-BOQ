import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "พื้นที่มาตรฐาน | YUPPIE",
    template: "%s | YUPPIE"
  },
  description: "พื้นที่จัดการมาตรฐานงานผลิตบูธของ YUPPIE"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
