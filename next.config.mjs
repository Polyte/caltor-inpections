// next.config.js
/** @type {import('next').NextConfig} */
export default {
    swcMinify: true,
    compiler: {
        legacyDecorators: true,
    },
    webpack: (config) => {
        config.module.exprContextCritical = false; // suppress dynamic require warnings
        return config;
    },
};

