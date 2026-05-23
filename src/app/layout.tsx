import type { Metadata } from "next";
import { Athiti, Kanit } from "next/font/google";
import "./globals.css";

const athiti = Athiti({
  variable: "--font-body-modern",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const kanit = Kanit({
  variable: "--font-accent-modern",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Arkkarawin",
    template: "%s | Arkkarawin",
  },
  description: "ระบบจองห้องพักและจัดการที่พัก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={[athiti.variable, kanit.variable, "h-full antialiased"].join(" ")}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
