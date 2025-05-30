import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProjectsProvider } from "@/hooks/use-projects";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Colosseum Projects Dashboard",
  description: "Explore and analyze projects from Colosseum hackathons with advanced search, filtering, and analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
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
