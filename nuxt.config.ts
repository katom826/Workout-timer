// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  srcDir: '.',
  css: ['@/assets/css/reset.css', '@/assets/css/theme.css'],
  app: {
    baseURL: '/Workout-timer/'
  },
  vite: {
    optimizeDeps: {
      noDiscovery: true,
      include: []
    },
    server: {
      warmup: false
    }
  }
})
