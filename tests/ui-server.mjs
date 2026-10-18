import { createApp } from '../server/index.mjs';
const app=createApp({dbPath:':memory:',aiKey:'',aiModel:''});
app.server.listen(3101,'127.0.0.1',()=>console.log('UI test server ready'));
