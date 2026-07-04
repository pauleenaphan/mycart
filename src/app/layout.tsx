import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { APPEARANCE_STORAGE_KEY } from "~/types/appearance";

export const metadata: Metadata = {
  title: "MyCart",
  description: "Your smart grocery shopping list",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const appearanceScript = `(function(){try{var s=localStorage.getItem("${APPEARANCE_STORAGE_KEY}");var d=s==="true"||(s===null&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.appearance=d?"dark":"light";}catch(e){document.documentElement.dataset.appearance="light";}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="pink" data-appearance="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
