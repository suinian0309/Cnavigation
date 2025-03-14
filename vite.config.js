import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import path from "path";
import viteCompression from "vite-plugin-compression";
import { createHtmlPlugin } from 'vite-plugin-html';
import { fileURLToPath, URL } from 'url';
import fs from 'fs';

// 读取关键 CSS
const criticalCss = fs.readFileSync(
  path.resolve(__dirname, 'src/style/postcss/critical.pcss'),
  'utf-8'
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          ...process.env,
          criticalCss: criticalCss,
        },
      },
    }),
    // PWA
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /(.*?)\.(woff2|woff|ttf)/,
            handler: "CacheFirst",
            options: {
              cacheName: "file-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
              },
            },
          },
          {
            urlPattern: /(.*?)\.(webp|png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
              },
            },
          },
          // 添加对 API 请求的缓存策略
          {
            urlPattern: /^https:\/\/v1\.hitokoto\.cn\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "hitokoto-api-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 小时
              },
              networkTimeoutSeconds: 3,
            },
          },
          // 添加对静态资源的缓存策略
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 天
              },
            },
          },
          // 添加对其他 API 请求的缓存策略
          {
            urlPattern: /^https:\/\/api\./,
            handler: "NetworkFirst",
            options: {
              cacheName: "apis-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 10 * 60, // 10 分钟
              },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
      manifest: {
        name: "Cnavigation",
        short_name: "Cnavigation",
        description: "一个极致简约的导航页",
        display: "standalone",
        start_url: "/",
        theme_color: "#ffffff",
        background_color: "#efefef",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
    // viteCompression
    viteCompression(),
  ],
  server: {
    port: 5173,
    host: true,
    static: {
      directory: 'public',
      prefix: '/'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    },
    fs: {
      strict: false
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: '',
    sourcemap: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      external: [
        '/lib/theme-font.js',
        '/lib/iconfont.js'
      ]
    }
  },
  css: {
    devSourcemap: true
  },
  publicDir: 'public'
});
