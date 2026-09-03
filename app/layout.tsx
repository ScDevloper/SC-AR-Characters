import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SC Printing Robot Collection | Twelve Interactive 3D Characters",
  description: "Explore twelve interactive printing and packaging characters, each ready for a dedicated QR experience.",
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
