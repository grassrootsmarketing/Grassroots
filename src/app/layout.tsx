import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grassroots Marketing — Dashboard",
  description: "AI-Powered Business Intelligence Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
