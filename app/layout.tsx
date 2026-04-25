import type { Metadata } from "next";
import { Press_Start_2P, Bangers } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "@/components/AmplifyProvider";
import AuthGate from "@/components/AuthGate";
import { AppProvider } from "@/context/AppContext";
import Nav from "@/components/Nav";

const pixelFont = Press_Start_2P({ 
  weight: "400", 
  subsets: ["latin"], 
  variable: "--font-pixel" 
});

const bangersFont = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bangers",
});

export const metadata: Metadata = {
  title: "HISTORIA",
  description: "Select your mission",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable} ${bangersFont.variable} antialiased`}>
        <AmplifyProvider>
          <AuthGate>
            <AppProvider>
              <Nav />
              <main className="min-h-screen pt-24 pb-10 px-4 max-w-6xl mx-auto">
                {children}
              </main>
            </AppProvider>
          </AuthGate>
        </AmplifyProvider>
      </body>
    </html>
  );
}
