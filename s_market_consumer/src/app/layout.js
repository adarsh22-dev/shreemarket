import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Providers from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const viewport = {
  themeColor: '#ffffff',
};

export const metadata = {
  title: {
    default: 'SreeMarket - Your Online Marketplace',
    template: '%s | SreeMarket',
  },
  description: 'SreeMarket — a multi-vendor e-commerce platform supporting artisans and local vendors.',
  icons: {
    icon: '/logo.png',
    apple: '/pwa-icons/apple-touch-icon-180x180.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'SreeMarket',
    title: 'SreeMarket - Your Online Marketplace',
    description: 'Authentic Indian handmade products from verified artisans.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
