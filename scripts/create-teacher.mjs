import { passwordHash } from '../server/schema.mjs';
import { createStore } from '../server/store.mjs';
import { resolve } from 'node:path';
try{process.loadEnvFile('.env');}catch{}
const name=process.env.TEACHER_NAME?.trim();const email=process.env.TEACHER_EMAIL?.trim().toLowerCase();const password=process.env.TEACHER_PASSWORD;
if(!name||!email||!password||password.length<12||!email.includes('@')){console.error('.env fayliga TEACHER_NAME, TEACHER_EMAIL va kamida 12 belgili TEACHER_PASSWORD kiriting.');process.exit(1);}
const store=createStore({dbPath:resolve('data/voicetomental.sqlite'),databaseUrl:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
try{if(await store.get('SELECT id FROM users WHERE email=?',email))throw new Error('Bu email allaqachon mavjud.');await store.run("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'teacher')",name,email,passwordHash(password));console.log('O‘qituvchi hisobi yaratildi. .env faylidagi TEACHER_PASSWORD qiymatini o‘chirishingiz mumkin.');}catch(e){console.error('Hisob yaratilmadi:',e.code||e.message);process.exitCode=1;}finally{store.db.close();}
