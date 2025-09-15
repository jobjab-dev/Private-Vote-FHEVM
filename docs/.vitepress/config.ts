import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'PrivateVote FHEVM',
  description: 'Confidential Voting on Ethereum using Zama FHEVM',
  
  // Site metadata
  lang: 'en-US',
  base: '/',
  
  themeConfig: {
    logo: '/images/logo.png',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/getting-started' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' }
        ]
      },
      {
        text: 'Technical',
        items: [
          { text: 'Architecture', link: '/architecture' },
          { text: 'Smart Contracts', link: '/smart-contracts' },
          { text: 'Security', link: '/security' }
        ]
      },
      {
        text: 'Deployment',
        items: [
          { text: 'How to Deploy', link: '/deployment' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/jobjab-dev/Private-Vote-FHEVM' },
      { icon: 'x', link: 'https://x.com/jobjab_eth' }
    ]
  },

  head: [
    // Favicon (multiple formats for better compatibility)
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    
    // Manifest
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
    
    // Meta tags
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: 'PrivateVote FHEVM' }],
    ['meta', { name: 'og:description', content: 'Confidential Voting on Ethereum using Zama FHEVM' }],
    ['meta', { name: 'og:image', content: '/images/logo.png' }]
  ]
})
