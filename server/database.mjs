import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { schema, seedStatements } from './schema.mjs';
export { passwordHash, today } from './schema.mjs';
export function openDatabase(path){
 if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
 const db=new DatabaseSync(path);
 db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 db.exec(schema);
 if(!db.prepare('SELECT id FROM users LIMIT 1').get()){
  db.exec('BEGIN IMMEDIATE');
  try{for(const statement of seedStatements())db.prepare(statement.sql).run(...statement.args);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');db.close();throw error;}
 }
 return db;
}
