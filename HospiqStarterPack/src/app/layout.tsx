import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hospiq Starter Pack",
  description: "AI hotel assistant starter pack for LINE-first hospitality teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
