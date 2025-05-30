import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProjectsProvider } from "@/hooks/use-projects";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Colosseum Projects Dashboard | Hakata Finance",
  description: "Advanced analytics dashboard for exploring Colosseum hackathon projects. Built by Hakata Finance - a leading DeFi protocol on Solana.",
  keywords: [
    "Colosseum",
    "Hackathon",
    "Projects",
    "Dashboard",
    "Analytics",
    "Hakata Finance",
    "DeFi",
    "Solana",
    "Blockchain",
    "Cryptocurrency"
  ],
  authors: [
    {
      name: "Hakata Finance Team",
      url: "https://hakata.finance"
    }
  ],
  creator: "Hakata Finance",
  publisher: "Hakata Finance",
  metadataBase: new URL('https://colosseum-dashboard.hakata.finance'),
  openGraph: {
    title: "Colosseum Projects Dashboard | Hakata Finance",
    description: "Advanced analytics dashboard for exploring Colosseum hackathon projects. Built by Hakata Finance.",
    url: "https://colosseum-dashboard.hakata.finance",
    siteName: "Hakata Finance",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Hakata Finance - Colosseum Dashboard"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Colosseum Projects Dashboard | Hakata Finance",
    description: "Advanced analytics dashboard for exploring Colosseum hackathon projects. Built by Hakata Finance.",
    creator: "@HakataFinance",
    images: ["/logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script defer data-domain="dashboard-breakout.hakata.fi" src="https://plausible.io/js/script.file-downloads.outbound-links.pageview-props.tagged-events.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`
        }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ProjectsProvider>
          <div className="relative flex min-h-screen flex-col bg-background">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </ProjectsProvider>
      </body>
    </html>
  );
}
