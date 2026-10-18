import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
export default defineConfig({testDir:'./tests',timeout:45000,workers:1,use:{baseURL:'http://127.0.0.1:3101',headless:true,viewport:{width:1440,height:1000},launchOptions:existsSync(chrome)?{executablePath:chrome}:{},trace:'retain-on-failure'},webServer:{command:'node tests/ui-server.mjs',url:'http://127.0.0.1:3101/api/health',reuseExistingServer:false},reporter:'list'});
