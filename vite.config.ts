import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署在子路径 /EnvBoard/ 下，需设置 base 以保证资源路径正确
  base: '/EnvBoard/',
  plugins: [react()],
})
