import { readFileSync, statSync } from 'node:fs';
import { parseEnv } from 'node:util';
let stamp=null;
let cached={};
export function readAIConfig(){try{const next=statSync('.env').mtimeMs;if(next!==stamp){cached=parseEnv(readFileSync('.env','utf8'));stamp=next;}}catch{cached={};stamp=null;}return {base:(cached.AI_BASE_URL??process.env.AI_BASE_URL??'https://api.openai.com/v1').trim(),key:(cached.AI_API_KEY??process.env.AI_API_KEY??'').trim(),model:(cached.AI_MODEL??process.env.AI_MODEL??'').trim()};}
