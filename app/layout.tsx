import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LeadMagnet — Free Google Maps Business Lead Scraper",
  description: "Scrape business leads from Google Maps for free. Names, phones, emails, addresses, ratings — no API keys needed. Runs on Apify.",
  icons: [
    { rel: "icon", url: "/leadmagnet-logo.jpg", type: "image/jpeg" },
    { rel: "apple-touch-icon", url: "/leadmagnet-logo.jpg" },
  ],
  openGraph: {
    title: "LeadMagnet — Free Google Maps Business Lead Scraper",
    description: "Scrape business leads from Google Maps for free. Names, phones, emails, addresses, ratings — no API keys needed. Runs on Apify.",
    images: [{ url: "/leadmagnet-logo.jpg", width: 1254, height: 1254 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
