import { createApp } from '../server/index.mjs';
import { readAIConfig } from '../server/ai-config.mjs';
import { publicAI } from '../server/ai.mjs';
import { service } from '../server/identity.mjs';
let app;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
 const url=new URL(req.url,'http://localhost');const route=url.searchParams.get('__route');if(route!==null){url.pathname='/api/'+route.replace(/^\/+|\/+$/g,'');url.searchParams.delete('__route');req.url=url.pathname+url.search;}
 const json=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
 try{
  if(url.pathname==='/api/ai')return json(200,await publicAI(req));
  if(!process.env.TURSO_DATABASE_URL){const ai=readAIConfig();if(url.pathname==='/api/health')return json(200,{ok:true,service,databaseConfigured:false,database:null,aiConfigured:Boolean(ai.key&&ai.model),model:ai.model||null,demo:false});if(url.pathname==='/api/me')return json(200,{user:null,demo:false});return json(503,{error:'Kabinetlar uchun TURSO_DATABASE_URL va TURSO_AUTH_TOKEN kerak. AI chatdan bazasiz ham foydalanishingiz mumkin.'});}
  app??=createApp({reloadAIConfig:true});return await app.handler(req,res);
 }catch(error){if(!res.headersSent)json(error.status||503,{error:error.status?error.message:'Server sozlamalarini tekshiring. Turso bazasi uchun npm run db:setup bajarilishi kerak.'});else res.end();}
}
