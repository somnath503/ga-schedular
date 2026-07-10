// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react' // <-- Notice the name change here
// import tailwindcss from '@tailwindcss/vite'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//   ],
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- You were missing this import!
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'GA Scheduler Pro',
        short_name: 'GA Scheduler',
        theme_color: '#ffffff',
        icons: [
          { src: '/pwa/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
})