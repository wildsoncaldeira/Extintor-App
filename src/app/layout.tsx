import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Recarga de Extintores & AVCB | Mário Luiz Gomes da Silva",
    template: "%s | Recarga de Extintores",
  },
  applicationName: "Recarga de Extintores & AVCB",
  description: "Sistema de Gestão de Ordens de Serviço, Recargas de Extintores e Execução de Projetos AVCB em Conselheiro Lafaiete e Região.",
  keywords: [
    "recarga de extintores",
    "extintores lafaiete",
    "avcb lafaiete",
    "proteção contra incêndio",
    "mário luiz gomes da silva",
    "manutenção de extintores",
    "conselheiro lafaiete",
    "projetos avcb mg"
  ],
  authors: [{ name: "Mário Luiz Gomes da Silva" }, { name: "Wildson Silva Caldeira" }],
  creator: "Mário Luiz Gomes da Silva",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Recarga de Extintores & AVCB | Mário Luiz Gomes da Silva",
    description: "Sistema de Ordens de Serviço, Recargas de Extintores e AVCB - Conselheiro Lafaiete e Região.",
    url: "https://extintor-app.vercel.app",
    siteName: "Recarga de Extintores & AVCB",
    locale: "pt_BR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Extintores App",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-zinc-100 text-zinc-900">{children}</body>
    </html>
  );
}
