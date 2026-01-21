/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Suppress url.parse() deprecation warnings from third-party dependencies
      // Your application code already uses the modern WHATWG URL API
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const msg = args[0];
        if (
          typeof msg === 'string' &&
          msg.includes('DEP0169') &&
          msg.includes('url.parse()')
        ) {
          // Suppress this specific deprecation warning from dependencies
          return;
        }
        originalWarn.apply(console, args);
      };
    }
    return config;
  },
};

export default nextConfig;
