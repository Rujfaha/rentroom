import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตรวจสอบการจอง",
  description: "ตรวจสอบสถานะการจองด้วยเลขอ้างอิงและอีเมล",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function CheckBookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
