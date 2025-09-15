/** @type {import('next').NextConfig} */
const nextConfig = {
  
  webpack: (config) => {
    // Handle node modules that might not be compatible with webpack
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Ignore warnings for node modules  
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Can't resolve 'pino-pretty'/,
    ];
    
    // Fix pino-pretty resolution issue in production
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
    };
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
