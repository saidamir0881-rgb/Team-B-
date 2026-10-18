import { deviceApi } from './device-api';
let deviceMode=false;
async function networkApi(path,options={}){let response;try{response=await fetch(`/api${path}`,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...options.headers},body:options.body===undefined?undefined:JSON.stringify(options.body)});}catch{throw new Error('Serverga ulanib bo‘lmadi. Backend ishlayotganini tekshiring.');}let data;try{data=await response.json();}catch{throw new Error('Server noto‘g‘ri javob qaytardi. Backendni tekshiring.');}if(!response.ok){const error=new Error(data.error||'So‘rov bajarilmadi.');error.status=response.status;throw error;}return data;}
export const dateLabel=value=>{const date=new Date(value);if(Number.isNaN(date.getTime()))return '—';const months=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];return `${date.getUTCDate()}-${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;};
export const number=value=>new Intl.NumberFormat('uz-UZ').format(value||0);
export const kinds={homework:'Uy vazifasi',classwork:'Sinf ishi',activity:'Dars faoliyati'};
export const statuses={present:'Qatnashdi',absent:'Qatnashmadi',late:'Kechikdi',excused:'Sababli'};
export const orderStatuses={pending:'Kutilmoqda',approved:'Tasdiqlangan',cancelled:'Bekor qilingan'};


export async function api(path,options={}){
 if(path==='/health'){const data=await networkApi(path,options);deviceMode=data.databaseConfigured===false;return {...data,accountMode:deviceMode?'device':'server'};}
 if(!deviceMode||path==='/ai')return networkApi(path,options);
 if(path==='/chat'){
  if(options.method==='POST'){const previous=await deviceApi('/chat');const text=options.body?.message;const result=await networkApi('/ai',{method:'POST',body:{message:text,history:previous.messages.slice(-20).map(m=>({role:m.role,content:m.content}))}});await deviceApi('/chat/save',{method:'POST',body:{messages:[{role:'user',content:text},{role:'assistant',content:result.answer}]}});return result;}
  if(!options.method||options.method==='GET'){const [history,status]=await Promise.all([deviceApi('/chat'),networkApi('/ai')]);return {...history,configured:status.configured,model:status.model};}
 }
 return deviceApi(path,options);
}
