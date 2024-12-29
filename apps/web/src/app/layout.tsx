import { OpenPanelComponent } from "@openpanel/nextjs";
import type { Metadata } from "next";
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
  title: "Languine",
  description: "Translate your application with Languine CLI powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OpenPanelComponent
          clientId={process.env.NEXT_PUBLIC_OPEN_PANEL_CLIENT_ID!}
          clientSecret={process.env.OPEN_PANEL_CLIENT_SECRET!}
          trackScreenViews={true}
          disabled={process.env.NODE_ENV !== "production"}
        />
        {children}

        <div className="fixed bottom-4 right-4 flex items-center gap-2">
          <a
            href="https://dub.sh/lng"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
            >
              <g clipPath="url(#a)">
                <path
                  fill="#F60"
                  d="M0 0v16h16V0H0Zm8.7 9.225v3.925H7.275V9.225L3.775 2.3h1.65L8 7.525 10.65 2.3h1.55L8.7 9.225Z"
                />
              </g>
              <defs>
                <clipPath id="a">
                  <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
              </defs>
            </svg>
            <span>Live on Hacker News</span>
          </a>
        </div>
      </body>
    </html>
  );
}
