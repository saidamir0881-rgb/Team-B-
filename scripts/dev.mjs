import { createServer } from 'vite';
import { createApp } from '../server/index.mjs';
import { service, workspaceId } from '../server/identity.mjs';
import { selectPort, readIdentity } from './ports.mjs';

let app;
let vite;
let stopping=false;
async function stop(){if(stopping)return;stopping=true;await vite?.close();if(app){app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));app.db.close();}}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{stop().then(()=>process.exit(0));});
try{
 let backend=await selectPort(process.env.PORT||3001,{identityPath:'/api/health',matches:data=>data?.service===service&&data.workspaceId===workspaceId});
 const frontend=await selectPort(process.env.DEV_PORT||5180,{exclude:[backend.port],identityPath:'/__voicetomental_dev',matches:data=>data?.service===service&&data.workspaceId===workspaceId&&data.backendPort===backend.port});
 if(backend.reuse&&!frontend.reuse){const existing=await readIdentity(backend.port,'/api/health');if(frontend.port!==(existing?.devPort||5180))backend=await selectPort(process.env.PORT||3001,{exclude:[backend.port,frontend.port]});}
 if(backend.port!==Number(process.env.PORT||3001))console.log(`Backend porti band. Bo‘sh port tanlandi: ${backend.port}`);
 if(frontend.port!==Number(process.env.DEV_PORT||5180))console.log(`Frontend porti band. Bo‘sh port tanlandi: ${frontend.port}`);
 if(!backend.reuse){process.env.VTM_DEV_PORT=String(frontend.port);app=createApp({reloadAIConfig:true});await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(backend.port,'127.0.0.1',resolve);});}
 if(!frontend.reuse){process.env.VTM_API_PORT=String(backend.port);process.env.VTM_DEV_PORT=String(frontend.port);vite=await createServer();await vite.listen();}
 console.log(`\nVoiceToMental ${backend.reuse&&frontend.reuse?'allaqachon ishlayapti':'tayyor'}.`);
 console.log(`Portal:  http://127.0.0.1:${frontend.port}/`);
 console.log(`Backend: http://127.0.0.1:${backend.port}/api/health`);
 if(backend.reuse&&frontend.reuse)console.log('Mavjud serverlardan foydalanildi. Qayta ishga tushirish kerak emas.');
 else console.log('To‘xtatish: Ctrl+C. Backend kodi yoki .env o‘zgarsa, qayta ishga tushiring.');
}catch(error){console.error(`Ishga tushirib bo‘lmadi: ${error.message}`);await stop();process.exitCode=1;}
