import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Undertone — Find your next favourite",
  description:
    "Tell us the feeling. Discover real songs, hear a preview and find your next favourite.",
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
