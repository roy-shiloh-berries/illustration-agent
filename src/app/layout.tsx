import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Illustration Agent",
  description: "AI-powered illustration agent with style memory and feedback loops",
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
