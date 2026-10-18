# VoiceToMental’ni Vercel’ga joylash

## Faqat AI chat uchun — 3 ta sozlama

Vercel → loyihangiz → **Settings → Environment Variables** ichiga kiriting:

| Nomi | Qiymati |
| --- | --- |
| `AI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `AI_MODEL` | `openai/gpt-oss-20b` |
| `AI_API_KEY` | Yangi Groq API kalitingiz |

Production va kerak bo‘lsa Preview muhitini tanlang. `VITE_GROQ_API_KEY` ishlatmang. `.env` fayli hostingga yuklanmaydi — Vercel o‘zgaruvchilarini alohida kiritish zarur.

**Deployments → Redeploy** qiling. Keyin saytni oching. Turso kiritilmagan bo‘lsa, asosiy sahifada AI chat ochiladi. Alohida chat manzili: `https://SIZNING-DOMENINGIZ/#/ai`.

Bu chat login yoki Turso talab qilmaydi. Xabarlar AI provayderiga yuboriladi; suhbat faqat ochiq sahifa holatida turadi va sahifa yangilanganda o‘chadi. Saytga kirgan odamlar chatdan foydalanishi mumkin; Groq hisobingizning balansi va texnik limitlari amal qiladi.

Mahalliy tekshiruvda Vercel Function handleri orqali Groq’ga haqiqiy so‘rov yuborildi va HTTP 200 javob olindi. Vercel hisobingizga deploy ushbu ish jarayonida bajarilmagan; Vercel Environment Variables va deploy sizning hisobingizda bajariladi.

## Vercel loyiha sozlamalari

- Framework Preset: **Vite**.
- Build Command: **npm run build**.
- Output Directory: **dist**.
- Node.js Version: **24.x**.
- Root Directory: `package.json` va `vercel.json` joylashgan papka.

`vercel.json` `/api/*` yo‘llarini `api/index.mjs` server funksiyasiga yo‘naltiradi. Vite frontend va server funksiyasini Vercel bir domen ostida beradi; localhost URL’larini hosting sozlamalariga yozmang. Function uchun 120 soniya vaqt belgilangan, Groq so‘rovi 90 soniyagacha kutiladi.

## Git Bash orqali deploy

Quyidagi buyruqlarni loyiha papkasida qator-qator bajaring:

```bash
cd /c/Users/User/Desktop/foooo
npm install
npm test
npm run build
npx vercel login
npx vercel link
npx vercel env add AI_BASE_URL production
npx vercel env add AI_MODEL production
npx vercel env add AI_API_KEY production
npx vercel --prod
```

Har bir `env add` buyrug‘i so‘raganda jadvaldagi qiymatni kiriting. Kalitni buyruq satriga yoki Git’ga yozmang. Oldin oshkor qilingan kalitni Groq kabinetida yangilang.

Yoki loyihani GitHub’dan Vercel’ga import qilib, uchta muhit o‘zgaruvchisini kiritib Deploy bosing. Git repo’ga `.env`, `data/` va `node_modules/` qo‘shilmasligi kerak.

## Turso bilan barcha kabinetlar ham ishlashi uchun

AI chat uchun bu bosqich shart emas. O‘quvchi/ota-ona/o‘qituvchi hisoblari, vazifalar, tokenlar va shaxsiy chat tarixini saqlash uchun Vercel Environment Variables’ga yana qo‘shing:

```dotenv
TURSO_DATABASE_URL=libsql://SIZNING-BAZANGIZ.turso.io
TURSO_AUTH_TOKEN=BAZA_TOKENINGIZ
DEMO_MODE=true
```

Bu qiymatlarni lokal `.env` fayliga ham kiriting. Mavjud Turso bazangizda loyiha jadvallarini tayyorlang:

```bash
npm run db:setup
```

Buyruq mavjud jadvallarni o‘chirmaydi. Bo‘sh bazada `DEMO_MODE=true` bo‘lsa belgilangan namuna hisoblari va topshiriqlar qo‘shiladi. `DEMO_MODE=false` bo‘lsa faqat katalog yaratiladi; haqiqiy hisoblarni ro‘yxatdan o‘tkazing, o‘qituvchini `npm run create-teacher` orqali yarating.

So‘ng Vercel’ni qayta deploy qiling. Sessiyalar va ma’lumotlar Turso’da turadi; Vercel’ning vaqtinchalik diskiga yozilmaydi. HTTPS’da sessiya cookie’siga `Secure` avtomatik qo‘shiladi. `APP_ORIGIN` kerak bo‘lsa faqat saytingizning to‘liq HTTPS domeni bo‘lsin.

Lokal SQLite ma’lumotlari Turso’ga avtomatik ko‘chirilmaydi. Ko‘p server nusxalari token tranzaksiyalarini bazaning write transaction’i orqali boshqaradi. Kirish urinishlari hisoblagichi va shaxsiy AI suhbatining parallel so‘rov himoyasi har server nusxasi doirasida; ommaviy xizmat uchun tashqi trafik nazoratini alohida sozlash kerak.

## Tekshirish

- `/api/health` — API va AI sozlanish holati. Kalitni chiqarmaydi.
- `/#/ai` — loginsiz AI chat.
- `/api/me` — Turso sozlanmaganida ham xatosiz `user: null`.
- AI javobi kelmasa, Vercel Function Logs’dagi holatni tekshiring: 503 — sozlama yo‘q, 502 — kalit/model/provayder xatosi, 429 — provayder limiti.
- Muhit o‘zgaruvchisini Vercel’da o‘zgartirgach, qayta deploy qiling.

Manbalar: [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js), [Groq OpenAI compatibility](https://console.groq.com/docs/openai), [Turso JavaScript SDK](https://docs.turso.tech/sdk/ts/reference).
