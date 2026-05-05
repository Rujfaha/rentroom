import type { Metadata } from "next";
import { Trirong, Athiti, IBM_Plex_Sans_Thai, Niramit } from "next/font/google";
import "./globals.css";

const trirong = Trirong({
  variable: "--font-serif",
  subsets: ["latin", "thai"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const athiti = Athiti({
  variable: "--font-heading",
  subsets: ["latin", "thai"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const niramit = Niramit({
  variable: "--font-accent",
  subsets: ["latin", "thai"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valley Retreat — Luxury Mountain Resort",
  description: "สัมผัสประสบการณ์การพักผ่อนท่ามกลางหุบเขาอันเงียบสงบ พร้อมห้องพักหรูหราและบริการระดับพรีเมียม",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={[trirong.variable, athiti.variable, plexThai.variable, niramit.variable, "h-full antialiased"].join(" ")}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
