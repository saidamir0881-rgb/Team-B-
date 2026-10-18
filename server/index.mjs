import { readJson, checkOrigin, publicAI } from './ai.mjs';
import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { passwordHash, today } from './schema.mjs';
import { createStore } from './store.mjs';
import { service, workspaceId } from './identity.mjs';
import { readAIConfig } from './ai-config.mjs';
try {
  process.loadEnvFile('.env');
} catch {}
const roles = ['student', 'parent', 'teacher'];
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const fail = (status, msg) => {
  throw new ApiError(status, msg);
};
const text = (value, min = 1, max = 5000) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(400, `Matn ${min}–${max} belgidan iborat bo‘lishi kerak.`);
  return value.trim();
};
const integer = (value, min, max) => {
  if (!Number.isInteger(value) || value < min || value > max) fail(400, 'Son qiymati noto‘g‘ri.');
  return value;
};
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) fail(400, 'Sana noto‘g‘ri.');
  return value;
};
const safeUser = u => {
  if (!u) return null;
  const {
    password,
    ...rest
  } = u;
  return rest;
};
const body=readJson;
export function createApp({
  dbPath = resolve('data/voicetomental.sqlite'),
  aiBase = process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  aiKey = process.env.AI_API_KEY || '',
  aiModel = process.env.AI_MODEL || '',
  demo = process.env.DEMO_MODE !== 'false',
  reloadAIConfig = false,
  databaseUrl = process.env.TURSO_DATABASE_URL,
  authToken = process.env.TURSO_AUTH_TOKEN
} = {}) {
  const storage = createStore({
    dbPath,
    databaseUrl: dbPath === resolve('data/voicetomental.sqlite') ? databaseUrl : undefined,
    authToken
  });
  const {
    db,
    get,
    all,
    run,
    transaction
  } = storage;
  const aiBusy = new Set();
  const attempts = new Map();
  const requireRole = (user, ...allowed) => {
    if (!allowed.includes(user.role)) fail(403, 'Bu amal uchun ruxsatingiz yo‘q.');
  };
  const studentsFor = async user => user.role === 'teacher' ? await all("SELECT id,name,class_name,tokens FROM users WHERE role='student'") : user.role === 'parent' ? await all('SELECT u.id,u.name,u.class_name,u.tokens FROM users u JOIN parent_links p ON u.id=p.student_id WHERE p.parent_id=?', user.id) : [safeUser(user)];
  async function details(user, studentId) {
    const students = await studentsFor(user);
    const id = studentId || students[0]?.id;
    if (!id) return {
      students,
      student: null,
      attendance: [],
      assignments: [],
      submissions: [],
      ledger: [],
      orders: []
    };
    const student = students.find(s => s.id === Number(id));
    if (!student) fail(403, 'Bu o‘quvchi ma’lumotlarini ko‘ra olmaysiz.');
    return {
      students,
      student,
      attendance: await all('SELECT * FROM attendance WHERE student_id=? ORDER BY day DESC,subject', student.id),
      assignments: await all('SELECT a.*,u.name teacher_name FROM assignments a JOIN users u ON u.id=a.teacher_id WHERE a.class_name=? ORDER BY a.id DESC', student.class_name),
      submissions: await all('SELECT * FROM submissions WHERE student_id=? ORDER BY id DESC', student.id),
      ledger: await all('SELECT * FROM ledger WHERE user_id=? ORDER BY id DESC', student.id),
      orders: await all('SELECT o.*,r.name,r.icon FROM orders o JOIN rewards r ON r.id=o.reward_id WHERE student_id=? ORDER BY o.id DESC', student.id)
    };
  }
  const handler = async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    const json = (status, data) => {
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      res.end(JSON.stringify(data));
    };
    try {
      if (reloadAIConfig) {
        const config = readAIConfig();
        aiBase = config.base;
        aiKey = config.key;
        aiModel = config.model;
      }
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      const method = req.method;
      checkOrigin(req);
      if(path === '/api/ai')return json(200,await publicAI(req));
      if (path === '/api/health') return json(200, {
        ok: true,
        service,
        workspaceId,
        devPort: process.env.VTM_DEV_PORT ? Number(process.env.VTM_DEV_PORT) : null,
        database: storage.kind,
        databaseConfigured: true,
        aiConfigured: Boolean(aiKey && aiModel),
        model: aiModel || null,
        demo,
        today: today()
      });
      const sid = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('vtm_session='))?.slice(12);
      const user = sid ? await get('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.id=? AND s.expires>?', sid, Date.now()) : null;
      if (path === '/api/me' && method === 'GET') return json(200, {
        user: safeUser(user),
        demo
      });
      if ((path === '/api/login' || path === '/api/register') && method === 'POST') {
        const data = await body(req);
        const email = text(data.email, 3, 150).toLowerCase();
        const password = text(data.password, 8, 200);
        const key = req.socket.remoteAddress;
        const count = attempts.get(key) || {
          count: 0,
          time: Date.now()
        };
        if (Date.now() - count.time > 600000) {
          count.count = 0;
          count.time = Date.now();
        }
        if (count.count >= 30) fail(429, 'Ko‘p urinish. 10 daqiqadan keyin qayta urinib ko‘ring.');
        count.count++;
        attempts.set(key, count);
        let account;
        if (path === '/api/register') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Email manzili noto‘g‘ri.');
          if (!['student', 'parent'].includes(data.role)) fail(400, 'Rol noto‘g‘ri.');
          if (await get('SELECT id FROM users WHERE email=?', email)) fail(409, 'Bu email ro‘yxatdan o‘tgan.');
          const result = await run('INSERT INTO users(name,email,password,role,link_code) VALUES(?,?,?,?,?)', text(data.name, 2, 80), email, passwordHash(password), data.role, data.role === 'student' ? randomBytes(6).toString('hex').toUpperCase() : null);
          account = await get('SELECT * FROM users WHERE id=?', Number(result.lastInsertRowid));
        } else {
          account = await get('SELECT * FROM users WHERE email=?', email);
          const [salt, hash] = (account?.password || passwordHash('invalid-pass')).split(':');
          if (!account || !timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'))) fail(401, 'Email yoki parol noto‘g‘ri.');
          if (!demo && email.endsWith('@demo.local')) fail(403, 'Namuna hisoblari o‘chirilgan.');
        }
        attempts.delete(key);
        const session = randomBytes(32).toString('hex');
        await run('DELETE FROM sessions WHERE expires<?', Date.now());
        await run('INSERT INTO sessions VALUES(?,?,?)', session, account.id, Date.now() + 7 * 86400000);
        res.setHeader('Set-Cookie', `vtm_session=${session}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${(process.env.COOKIE_SECURE === 'true'||Boolean(process.env.VERCEL)) ? '; Secure' : ''}`);
        return json(200, {
          user: safeUser(account)
        });
      }
      if (path.startsWith('/api/') && !user) fail(401, 'Avval hisobingizga kiring.');
      if (path === '/api/logout' && method === 'POST') {
        await run('DELETE FROM sessions WHERE id=?', sid);
        res.setHeader('Set-Cookie', 'vtm_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
        return json(200, {
          ok: true
        });
      }
      if (path === '/api/overview' && method === 'GET') return json(200, {
        ...(await details(user, url.searchParams.get('student'))),
        user: safeUser(user),
        today: today()
      });
      if (path === '/api/parent/link' && method === 'POST') {
        requireRole(user, 'parent');
        const data = await body(req);
        const student = await get("SELECT id FROM users WHERE link_code=? AND role='student'", text(data.code, 4, 30));
        if (!student) fail(404, 'Bog‘lash kodi topilmadi.');
        await run('INSERT OR IGNORE INTO parent_links VALUES(?,?)', user.id, student.id);
        return json(200, {
          ok: true
        });
      }
      if (path === '/api/teacher' && method === 'GET') {
        requireRole(user, 'teacher');
        return json(200, {
          students: await studentsFor(user),
          assignments: await all('SELECT * FROM assignments WHERE teacher_id=? ORDER BY id DESC', user.id),
          submissions: await all('SELECT s.*,u.name student_name,a.title,a.reward,a.subject FROM submissions s JOIN users u ON u.id=s.student_id JOIN assignments a ON a.id=s.assignment_id WHERE a.teacher_id=? ORDER BY s.id DESC', user.id),
          attendance: await all('SELECT a.*,u.name student_name FROM attendance a JOIN users u ON u.id=a.student_id ORDER BY a.day DESC'),
          orders: await all('SELECT o.*,u.name student_name,r.name FROM orders o JOIN users u ON u.id=o.student_id JOIN rewards r ON r.id=o.reward_id ORDER BY o.id DESC')
        });
      }
      if (path === '/api/assignments' && method === 'POST') {
        requireRole(user, 'teacher');
        const d = await body(req);
        if (!['homework', 'classwork', 'activity'].includes(d.kind)) fail(400, 'Vazifa turi noto‘g‘ri.');
        const id = (await run('INSERT INTO assignments(teacher_id,title,subject,kind,body,due,reward,class_name,created) VALUES(?,?,?,?,?,?,?,?,?)', user.id, text(d.title, 3, 120), text(d.subject, 2, 60), d.kind, text(d.body, 5, 5000), validDate(d.due), integer(d.reward, 0, 1000), text(d.class_name, 1, 20), new Date().toISOString())).lastInsertRowid;
        return json(201, {
          id: Number(id)
        });
      }
      const submitMatch = path.match(/^\/api\/assignments\/(\d+)\/submit$/);
      if (submitMatch && method === 'POST') {
        requireRole(user, 'student');
        const a = await get('SELECT * FROM assignments WHERE id=?', Number(submitMatch[1]));
        if (!a || a.class_name !== user.class_name) fail(404, 'Vazifa topilmadi.');
        const d = await body(req);
        const answer = text(d.answer, 3, 10000);
        const previous = await get('SELECT * FROM submissions WHERE assignment_id=? AND student_id=?', a.id, user.id);
        if (previous?.grade !== null && previous) fail(409, 'Baholangan javobni o‘zgartirib bo‘lmaydi.');
        await run('INSERT INTO submissions(assignment_id,student_id,answer,created) VALUES(?,?,?,?) ON CONFLICT(assignment_id,student_id) DO UPDATE SET answer=excluded.answer,created=excluded.created', a.id, user.id, answer, new Date().toISOString());
        return json(200, {
          ok: true
        });
      }
      const gradeMatch = path.match(/^\/api\/submissions\/(\d+)\/grade$/);
      if (gradeMatch && method === 'POST') {
        requireRole(user, 'teacher');
        const d = await body(req);
        const grade = integer(d.grade, 0, 100);
        const feedback = typeof d.feedback === 'string' ? d.feedback.trim().slice(0, 2000) : '';
        await transaction(async () => {
          const s = await get('SELECT s.*,a.teacher_id,a.reward,a.title FROM submissions s JOIN assignments a ON a.id=s.assignment_id WHERE s.id=?', Number(gradeMatch[1]));
          if (!s || s.teacher_id !== user.id) fail(404, 'Javob topilmadi.');
          if (s.grade !== null) fail(409, 'Javob allaqachon baholangan.');
          const award = Math.round(s.reward * grade / 100);
          await run('UPDATE submissions SET grade=?,feedback=? WHERE id=?', grade, feedback, s.id);
          await run('UPDATE users SET tokens=tokens+? WHERE id=?', award, s.student_id);
          await run('INSERT INTO ledger(user_id,amount,reason,created) VALUES(?,?,?,?)', s.student_id, award, `${s.title}: ${grade} ball`, new Date().toISOString());
        });
        return json(200, {
          ok: true
        });
      }
      if (path === '/api/attendance' && method === 'POST') {
        requireRole(user, 'teacher');
        const d = await body(req);
        const student = await get("SELECT id FROM users WHERE id=? AND role='student'", integer(d.student_id, 1, 1e9));
        if (!student) fail(404, 'O‘quvchi topilmadi.');
        if (!['present', 'absent', 'late', 'excused'].includes(d.status)) fail(400, 'Davomat holati noto‘g‘ri.');
        await run('INSERT INTO attendance(student_id,day,subject,status,note) VALUES(?,?,?,?,?) ON CONFLICT(student_id,day,subject) DO UPDATE SET status=excluded.status,note=excluded.note', student.id, validDate(d.day), text(d.subject, 2, 60), d.status, typeof d.note === 'string' ? d.note.slice(0, 500) : '');
        return json(200, {
          ok: true
        });
      }
      if (path === '/api/rewards' && method === 'GET') return json(200, {
        rewards: await all('SELECT * FROM rewards ORDER BY cost'),
        balance: user.tokens,
        orders: await all('SELECT o.*,r.name,r.icon FROM orders o JOIN rewards r ON r.id=o.reward_id WHERE o.student_id=? ORDER BY o.id DESC', user.id)
      });
      if (path === '/api/orders' && method === 'POST') {
        requireRole(user, 'student');
        const d = await body(req);
        const order = await transaction(async () => {
          const reward = await get('SELECT * FROM rewards WHERE id=?', integer(d.reward_id, 1, 1e9));
          if (!reward || reward.stock < 1) fail(409, 'Sovrin hozir mavjud emas.');
          const balance = (await get('SELECT tokens FROM users WHERE id=?', user.id)).tokens;
          if (balance < reward.cost) fail(409, 'Tokenlaringiz yetarli emas.');
          await run('UPDATE users SET tokens=tokens-? WHERE id=?', reward.cost, user.id);
          await run('UPDATE rewards SET stock=stock-1 WHERE id=?', reward.id);
          const order = await run('INSERT INTO orders(student_id,reward_id,cost,created) VALUES(?,?,?,?)', user.id, reward.id, reward.cost, new Date().toISOString());
          await run('INSERT INTO ledger(user_id,amount,reason,created) VALUES(?,?,?,?)', user.id, -reward.cost, `Sovrin so‘rovi: ${reward.name}`, new Date().toISOString());
          return Number(order.lastInsertRowid);
        });
        return json(201, {
          id: order
        });
      }
      const cancel = path.match(/^\/api\/orders\/(\d+)\/cancel$/);
      if (cancel && method === 'POST') {
        requireRole(user, 'student');
        await transaction(async () => {
          const o = await get('SELECT * FROM orders WHERE id=? AND student_id=?', Number(cancel[1]), user.id);
          if (!o) fail(404, 'So‘rov topilmadi.');
          if (o.status !== 'pending') fail(409, 'Bu so‘rovni bekor qilib bo‘lmaydi.');
          await run("UPDATE orders SET status='cancelled' WHERE id=?", o.id);
          await run('UPDATE users SET tokens=tokens+? WHERE id=?', o.cost, user.id);
          await run('UPDATE rewards SET stock=stock+1 WHERE id=?', o.reward_id);
          await run('INSERT INTO ledger(user_id,amount,reason,created) VALUES(?,?,?,?)', user.id, o.cost, `Bekor qilingan so‘rov #${o.id}`, new Date().toISOString());
        });
        return json(200, {
          ok: true
        });
      }
      const approve = path.match(/^\/api\/orders\/(\d+)\/approve$/);
      if (approve && method === 'POST') {
        requireRole(user, 'teacher');
        const result = await run("UPDATE orders SET status='approved' WHERE id=? AND status='pending'", Number(approve[1]));
        if (!result.changes) fail(409, 'Kutilayotgan so‘rov topilmadi.');
        return json(200, {
          ok: true
        });
      }
      if (path === '/api/chat' && method === 'GET') return json(200, {
        messages: await all('SELECT * FROM (SELECT * FROM chat WHERE user_id=? ORDER BY id DESC LIMIT 100) ORDER BY id', user.id),
        configured: Boolean(aiKey && aiModel),
        model: aiModel || null
      });
      if (path === '/api/chat' && method === 'DELETE') {
        if (aiBusy.has(user.id)) fail(409, 'Avval javob tugashini kuting.');
        await run('DELETE FROM chat WHERE user_id=?', user.id);
        return json(200, {
          ok: true
        });
      }
      if (path === '/api/chat' && method === 'POST') {
        const d = await body(req);
        const message = text(d.message, 1, 12000);
        if (!aiKey || !aiModel) fail(503, 'AI hali sozlanmagan. Serverdagi .env fayliga AI_API_KEY va AI_MODEL kiriting.');
        if (aiBusy.has(user.id)) fail(409, 'Joriy javob tugashini kuting.');
        aiBusy.add(user.id);
        try {
          const history = await all('SELECT role,content FROM (SELECT * FROM chat WHERE user_id=? ORDER BY id DESC LIMIT 20) ORDER BY id', user.id);
          const upstream = await fetch(`${aiBase.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${aiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: aiModel,
              messages: [{
                role: 'system',
                content: 'Siz VoiceToMental o‘zbekcha ta’lim yordamchisisiz. Sodda o‘zbek tilida aniq, foydali tushuntiring, misollar va Sokratik savollar bering. Bilmagan narsangizni ochiq ayting. O‘quvchining xato sababini bitta javobdan qat’iy aniqlamang. Sizda davomat yoki baholar bazasiga kirish huquqi yo‘q; bunday ma’lumot to‘qimang.'
              }, ...history, {
                role: 'user',
                content: message
              }]
            }),
            signal: AbortSignal.timeout(90000)
          });
          if (!upstream.ok) {
            if (upstream.status === 429) fail(429, 'AI provayderi limiti yoki balans cheklovi. Birozdan so‘ng qayta urinib ko‘ring.');
            if (upstream.status === 401 || upstream.status === 403) fail(502, 'AI provayderi kalitni qabul qilmadi. Server sozlamalarini tekshiring.');
            fail(502, `AI provayderi javob bermadi (${upstream.status}).`);
          }
          const payload = await upstream.json();
          const answer = payload.choices?.[0]?.message?.content;
          if (typeof answer !== 'string' || !answer.trim()) fail(502, 'AI bo‘sh javob berdi. Qayta urinib ko‘ring.');
          await transaction(async () => {
            const now = new Date().toISOString();
            await run('INSERT INTO chat(user_id,role,content,created) VALUES(?,?,?,?)', user.id, 'user', message, now);
            await run('INSERT INTO chat(user_id,role,content,created) VALUES(?,?,?,?)', user.id, 'assistant', answer, now);
          });
          return json(200, {
            answer
          });
        } finally {
          aiBusy.delete(user.id);
        }
      }
      if (path.startsWith('/api/')) fail(404, 'API yo‘li topilmadi.');
      const root = resolve('dist');
      let file = resolve(root, '.' + decodeURIComponent(path));
      if (file !== root && !file.startsWith(root + sep)) fail(403, 'Ruxsat yo‘q.');
      if (!existsSync(file) || !statSync(file).isFile()) file = resolve(root, 'index.html');
      if (!existsSync(file)) fail(404, 'Avval npm run build buyrug‘ini bajaring.');
      const mime = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png'
      };
      res.writeHead(200, {
        'Content-Type': mime[extname(file)] || 'application/octet-stream',
        'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      res.end(readFileSync(file));
    } catch (e) {
      if (res.headersSent) return res.end();
      json(e.status || (e.name === 'TimeoutError' ? 504 : 500), {
        error: e.status ? e.message : e.name === 'TimeoutError' ? 'AI javob vaqti tugadi. Qayta urinib ko‘ring.' : 'Serverda xatolik. Qayta urinib ko‘ring.'
      });
      if (!e.status) console.error('Request error:', e.name);
    }
  };
  const server = http.createServer(handler);
  return {
    server,
    db,
    handler
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const {
    server,
    db
  } = createApp({
    reloadAIConfig: true
  });
  const port = Number(process.env.PORT || 3001);
  server.once('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `${port} porti band. Lokal ishga tushirish uchun npm run dev dan foydalaning; u mavjud serverni aniqlaydi yoki bo‘sh port tanlaydi.` : `Server ishga tushmadi: ${error.message}`);
    db.close();
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => console.log(`VoiceToMental server: http://localhost:${port}`));
}
