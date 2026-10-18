import { createClient } from '@libsql/client';
import { schema,seedStatements } from '../server/schema.mjs';
try{process.loadEnvFile('.env');}catch{}
if(!process.env.TURSO_DATABASE_URL){console.error('TURSO_DATABASE_URL kiritilmagan. .env faylini sozlang.');process.exit(1);}
const client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
try{
 await client.executeMultiple(schema);
 const tx=await client.transaction('write');
 try{const exists=await tx.execute('SELECT id FROM users LIMIT 1');if(!exists.rows.length){const seed=seedStatements();const statements=process.env.DEMO_MODE==='false'?seed.filter(s=>s.sql.startsWith('INSERT INTO rewards')):seed;const catalog=await tx.execute('SELECT id FROM rewards LIMIT 1');await tx.batch(statements.filter(statement=>!(catalog.rows.length&&statement.sql.startsWith('INSERT INTO rewards'))));}await tx.commit();}catch(error){await tx.rollback();throw error;}finally{tx.close();}
 console.log('Turso bazasi tayyor. Mavjud ma’lumotlar saqlandi.');
}catch(error){console.error('Baza tayyorlanmadi:',error.code||error.name);process.exitCode=1;}finally{client.close();}
