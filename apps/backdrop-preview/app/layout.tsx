import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../../web/app/globals.css";
import "./preview.css";

export const metadata: Metadata = {
  title: "Backdrop Sandbox | YUPPIE",
  description: "Private Preview สำหรับทดลองถอด HMR และไม้โครง Backdrop"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
