import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const themeInitScript = `try {
  const savedTheme = localStorage.getItem("nexo-theme");
  const useDarkTheme = savedTheme
    ? savedTheme === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", useDarkTheme);
} catch {}`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXO — Ahorro inteligente para parejas",
  description: "Plataforma de ahorro compartido. Establezcan metas, registren aportes y alcancen sus objetivos juntos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}