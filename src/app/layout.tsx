import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "DataBencana — Sistem Analisis Data Bencana Nasional",
  description:
    "Platform analisis dan manajemen data bencana nasional. Pra-bencana, saat-bencana, dan pasca-bencana dalam satu ekosistem data.",
  keywords: ["bencana", "BNPB", "BPBD", "geospasial", "analisis bencana", "peta bencana Indonesia"],
  icons: {
    icon: [
      { url: "/logo/logofavicon.png", type: "image/png" },
    ],
    shortcut: ["/logo/logofavicon.png"],
    apple: [
      { url: "/logo/logofavicon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <head>
        <link rel="icon" href="/logo/logofavicon.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/logo/logofavicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/logofavicon.png" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
