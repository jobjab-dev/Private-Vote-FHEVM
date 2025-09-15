import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Providers } from '../components/Providers';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PrivateVote - Confidential Voting with FHEVM',
  description: 'Private voting dApp using Zama FHEVM. Vote confidentially, reveal publicly.',
  keywords: ['FHEVM', 'Zama', 'Private Voting', 'Blockchain', 'FHE'],
  icons: {
    icon: [
      { url: '/images/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/logo.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: { url: '/images/logo.png', sizes: '180x180', type: 'image/png' },
    other: [
      { rel: 'mask-icon', url: '/images/logo.png', color: '#FFD700' }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'PrivateVote - Confidential Voting',
    description: 'Private voting system using Zama FHEVM',
    images: ['/images/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'PrivateVote - Confidential Voting', 
    description: 'Private voting system using Zama FHEVM',
    images: ['/images/logo.png'],
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#FFD700" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/android-chrome-192x192.png" />
        
        <script 
          src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs" 
          type="text/javascript"
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <Providers>
          {/* Warning Banner - Testnet/Unaudited */}
          <div className="bg-yellow-600 text-black py-3 px-4 text-center text-sm font-bold">
            ⚠️ TESTNET / UNAUDITED – FOR DEMO ONLY
          </div>
          
          {/* Responsive Navigation */}
          <nav className="border-b border-gray-800 bg-black bg-opacity-90 backdrop-blur sticky top-0 z-40">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4">
              <div className="flex justify-between items-center">
                {/* Logo - Always Visible */}
                <div className="flex items-center gap-4 lg:gap-8">
                  <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <img 
                      src="/images/logo.png" 
                      alt="PrivateVote Logo" 
                      className="w-8 h-8 lg:w-10 lg:h-10 object-contain"
                    />
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                      <span className="text-yellow-400">Private</span>
                      <span className="text-white">Vote</span>
                    </span>
                  </Link>
                </div>
                
                {/* Connect Button - Always Visible */}
                <div className="flex-shrink-0">
                  <ConnectButton 
                    showBalance={{
                      smallScreen: false,
                      largeScreen: true,
                    }}
                    chainStatus={{
                      smallScreen: 'icon',
                      largeScreen: 'full',
                    }}
                  />
                </div>
              </div>
            </div>
          </nav>

          {/* Responsive Main Content */}
          <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 min-h-screen">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-800 bg-gray-900 py-6">
            <div className="container mx-auto px-4 text-center text-gray-400">
              <div className="flex flex-col items-center gap-4">
                {/* Social Links */}
                <div className="flex items-center gap-6">
                  <a 
                    href="https://github.com/jobjab-dev/Private-Vote-FHEVM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://x.com/jobjab_eth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                </div>
                
                {/* Footer Text */}
                <p>Built with ❤️ using Zama FHEVM • Testnet Demo Only</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
