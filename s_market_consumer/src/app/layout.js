import Inter from 'next/font/local';
import '@/styles/globals.css';
import Providers from '@/components/Providers';

const inter = Inter({
  src: '../../public/fonts/Inter-Variable.woff2',
  variable: '--font-inter',
  display: 'swap',
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

function SuppressWebVitalsError() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      const originalErrorHandler = window.onerror;
      window.onerror = function(msg, src, line, col, err) {
        if (typeof msg === 'string' && msg.includes('startTime')) return true;
        if (originalErrorHandler) return originalErrorHandler(msg, src, line, col, err);
      };
      window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.message && e.reason.message.includes('startTime')) {
          e.preventDefault();
        }
      });
    `}} />
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <SuppressWebVitalsError />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
