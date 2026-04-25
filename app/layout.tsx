import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Nav from "@/components/Nav";

const pixelFont = Press_Start_2P({ 
  weight: "400", 
  subsets: ["latin"], 
  variable: "--font-pixel" 
});

export const metadata: Metadata = {
  title: "STUDY SANCTUM",
  description: "Select your mission",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable} antialiased`}>
        <AppProvider>
          <Nav />
          <main className="min-h-screen pt-24 pb-10 px-4 max-w-6xl mx-auto">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
