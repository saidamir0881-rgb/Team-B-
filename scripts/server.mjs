import { createApp } from '../server/index.mjs';
import { selectPort } from './ports.mjs';
import { service, workspaceId } from '../server/identity.mjs';

let app;
let stopping=false;
async function stop(){if(stopping||!app)return;stopping=true;app.server.closeAllConnections();await new Promise(resolve=>app.server.close(resolve));app.db.close();}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{stop().then(()=>process.exit(0));});
try{
 const requested=process.env.PORT||3001;
 const {port,reuse}=await selectPort(requested,{identityPath:'/api/health',matches:data=>data?.service===service&&data.workspaceId===workspaceId});
 if(reuse){console.log(`Backend allaqachon ishlayapti: http://127.0.0.1:${port}/api/health`);console.log('Qayta ishga tushirish shart emas. Frontend va backend uchun: npm run dev');}
 else{
  if(port!==Number(requested))console.log(`${requested} porti boshqa dastur bilan band. Bo‘sh port tanlandi: ${port}`);
  app=createApp({reloadAIConfig:true});
  await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(port,'127.0.0.1',resolve);});
  console.log(`Backend tayyor: http://127.0.0.1:${port}/api/health`);
  console.log('Frontend va backendni birga ochish: npm run dev. To‘xtatish: Ctrl+C.');
 }
}catch(error){console.error(`Backend ishga tushmadi: ${error.message}`);await stop();process.exitCode=1;}
