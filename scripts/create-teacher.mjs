import { openDatabase, passwordHash } from '../server/database.mjs';
import { resolve } from 'node:path';
try{process.loadEnvFile('.env');}catch{}
const name=process.env.TEACHER_NAME?.trim();const email=process.env.TEACHER_EMAIL?.trim().toLowerCase();const password=process.env.TEACHER_PASSWORD;
if(!name||!email||!password||password.length<12||!email.includes('@')){console.error('.env fayliga TEACHER_NAME, TEACHER_EMAIL va kamida 12 belgili TEACHER_PASSWORD kiriting.');process.exit(1);}
const db=openDatabase(resolve('data/voicetomental.sqlite'));
try{if(db.prepare('SELECT id FROM users WHERE email=?').get(email))throw new Error('Bu email allaqachon mavjud.');db.prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'teacher')").run(name,email,passwordHash(password));console.log('O‘qituvchi hisobi yaratildi. .env faylidagi TEACHER_PASSWORD qiymatini o‘chirishingiz mumkin.');}catch(e){console.error(e.message);process.exitCode=1;}finally{db.close();}
