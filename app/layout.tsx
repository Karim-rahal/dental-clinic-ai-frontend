
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

import { Josefin_Sans } from "next/font/google";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-josefin",
});
export const metadata = {
  title: "DentAI — Bright Smile Dental Clinic",
  description: "AI-Powered Dental Clinic Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
    <body className={`${josefin.variable} antialiased`} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}