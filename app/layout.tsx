import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SC Printing Annual Get-Together | 3D Character Collection",
  description: "Explore SC Printing's twelve interactive 3D characters for the Annual Get-Together.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
