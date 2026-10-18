import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { selectPort, validPort } from './ports.mjs';
async function occupy(t,identity){const server=http.createServer((_req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(identity));});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));return server.address().port;}
test('Band portdagi boshqa dasturga tegmay bo‘sh port tanlaydi',async t=>{const port=await occupy(t,{service:'another-app'});const result=await selectPort(port,{identityPath:'/api/health',matches:data=>data?.service==='voicetomental'});assert.equal(result.reuse,false);assert.ok(result.port>port);});
test('Shu loyihaning mavjud serverini qayta ishlatadi',async t=>{const port=await occupy(t,{service:'voicetomental',workspaceId:'same'});const result=await selectPort(port,{identityPath:'/api/health',matches:data=>data?.service==='voicetomental'&&data.workspaceId==='same'});assert.deepEqual(result,{port,reuse:true});});
test('Boshqa papkadagi bir xil nomli loyihani o‘zlashtirmaydi',async t=>{const port=await occupy(t,{service:'voicetomental',workspaceId:'different'});const result=await selectPort(port,{identityPath:'/api/health',matches:data=>data?.service==='voicetomental'&&data.workspaceId==='same'});assert.equal(result.reuse,false);assert.notEqual(result.port,port);});
test('Frontend va backendga bir xil port tanlamaydi',async t=>{const port=await occupy(t,{});const result=await selectPort(port+1,{exclude:[port+1]});assert.ok(result.port>port+1);});
test('Noto‘g‘ri portni tushunarli xato bilan rad etadi',()=>{for(const value of ['abc',0,-1,65536,3001.5])assert.throws(()=>validPort(value),/Port/);assert.equal(validPort('3001'),3001);});
