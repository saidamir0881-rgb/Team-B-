import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient } from '@libsql/client';
import { openDatabase } from './database.mjs';

export function createStore({dbPath,databaseUrl,authToken}={}){
 const remote=Boolean(databaseUrl);
 if(process.env.VERCEL&&!remote)throw new Error('Vercel uchun TURSO_DATABASE_URL va TURSO_AUTH_TOKEN sozlanishi kerak.');
 if(remote&&!databaseUrl.startsWith('file:')&&!authToken)throw new Error('TURSO_AUTH_TOKEN kiritilmagan.');
 const db=remote?createClient({url:databaseUrl,authToken}):openDatabase(dbPath);
 const scope=new AsyncLocalStorage();
 let queue=Promise.resolve();
 async function lock(fn){const previous=queue;let release;queue=new Promise(resolve=>{release=resolve;});await previous;try{return await fn();}finally{release();}}
 async function query(kind,sql,args){const tx=scope.getStore();if(remote){const result=await (tx||db).execute({sql,args});if(kind==='get')return result.rows[0];if(kind==='all')return result.rows;return {changes:result.rowsAffected,lastInsertRowid:result.lastInsertRowid};}const execute=()=>db.prepare(sql)[kind](...args);return tx?execute():lock(execute);}
 const get=(sql,...args)=>query('get',sql,args);
 const all=(sql,...args)=>query('all',sql,args);
 const run=(sql,...args)=>query('run',sql,args);
 async function transaction(fn){if(scope.getStore())return fn();if(remote){const tx=await db.transaction('write');try{const result=await scope.run(tx,fn);await tx.commit();return result;}catch(error){await tx.rollback();throw error;}finally{tx.close();}}return lock(async()=>{db.exec('BEGIN IMMEDIATE');try{const result=await scope.run(true,fn);db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}});}
 return {db,get,all,run,transaction,kind:remote?'turso':'sqlite'};
}
