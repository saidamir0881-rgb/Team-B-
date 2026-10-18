import { readFileSync, statSync } from 'node:fs';
import { parseEnv } from 'node:util';
let stamp=null;
let cached={};
const first=(...values)=>values.find(value=>typeof value==='string'&&value.trim())?.trim()||'';
export function resolveAIConfig(env){const key=first(env.AI_API_KEY,env.GROQ_API_KEY,env.VITE_GROQ_API_KEY);const groq=key.startsWith('gsk_')||Boolean(first(env.GROQ_API_KEY,env.VITE_GROQ_API_KEY));let base=first(env.AI_BASE_URL,env.GROQ_BASE_URL);if(!base||(groq&&base==='https://api.openai.com/v1'))base=groq?'https://api.groq.com/openai/v1':'https://api.openai.com/v1';const model=first(env.AI_MODEL,env.GROQ_MODEL,groq?'openai/gpt-oss-20b':'');return {base,key,model};}
export function readAIConfig(){if(process.env.VERCEL)return resolveAIConfig(process.env);try{const next=statSync('.env').mtimeMs;if(next!==stamp){cached=parseEnv(readFileSync('.env','utf8'));stamp=next;}}catch{cached={};stamp=null;}return resolveAIConfig({...process.env,...cached});}
