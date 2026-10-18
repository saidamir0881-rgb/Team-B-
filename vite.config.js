import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { service, workspaceId } from './server/identity.mjs';
const backendPort=Number(process.env.VTM_API_PORT||process.env.PORT||3001);
const devPort=Number(process.env.VTM_DEV_PORT||process.env.DEV_PORT||5180);
const identityPlugin={name:'voicetomental-dev-identity',configureServer(server){server.middlewares.use('/__voicetomental_dev',(_req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({service,workspaceId,backendPort}));});}};
export default defineConfig({ plugins: [react(), tailwindcss(),identityPlugin], server:{host:'127.0.0.1',port:devPort,strictPort:true,proxy:{'/api':{target:`http://127.0.0.1:${backendPort}`,changeOrigin:true}}}, build: { rollupOptions: { output: { manualChunks(id) { if (id.includes('node_modules')) { if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'animations'; return 'vendor'; } } } } } });
