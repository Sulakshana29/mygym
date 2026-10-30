import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyGym — Personal Workout Tracker & Winter Arc Split",
  description:
    "Evidence-based workout tracker featuring double-progression badges, AI split recommendations, and 80+ exercise library.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyGym",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center antialiased selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
