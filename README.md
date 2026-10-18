# VoiceToMental — ishlaydigan ta’lim portali

React + Vite + Tailwind CSS + Framer Motion. Node.js HTTP backend, SQLite ma’lumotlar bazasi, HttpOnly cookie sessiyalari, scrypt parol xeshlash. Barcha asosiy interfeys matnlari o‘zbek tilida. Birinchi tashrifda och rejim; keyingi tanlov localStorage’da saqlanadi.

## Git Bash: birinchi ishga tushirish

Node.js **24 yoki yangi** versiyasi kerak (`node:sqlite` ishlatiladi). Kompyuteringizda Node 26 bor.

Quyidagi buyruqlarni Git Bash’da qator-qator bajaring:

```bash
cd /c/Users/User/Desktop/foooo
node --version
npm --version
npm install
cp -n .env.example .env
notepad .env
npm run dev
```

`cp -n` mavjud `.env` faylini almashtirmaydi. Notepad’da kerakli sozlamalarni kiriting, saqlang va yoping.

- Portal: **http://127.0.0.1:5180/**
- Backend: **http://localhost:3001/api/health**
- `npm run dev` ikkala serverni birga ishga tushiradi.
- 5173 portidagi boshqa loyihaga tegilmaydi.
- Bir xil serverni ikki marta ishga tushirmang. Oldingi terminalda `Ctrl+C` bilan to‘xtating.

## OpenAI-mos haqiqiy AI

Kalitni chatga, frontend kodiga yoki Git’ga yozmang. Faqat `.env` faylini sozlang:

```dotenv
PORT=3001
APP_ORIGIN=http://localhost:5180
DEMO_MODE=true
COOKIE_SECURE=false
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=PROVAYDER_KALITINGIZ
AI_MODEL=HISOBINGIZDA_MAVJUD_MODEL_ID
```

Boshqa OpenAI-mos provayderda `AI_BASE_URL` ni uning `/v1` bazaviy manziliga almashtiring. Server unga `/chat/completions` qo‘shadi. Kalit va modelni saqlagach, serverni qayta ishga tushiring:

```bash
npm run dev
```

Agar server allaqachon ishlayotgan bo‘lsa, oldin `Ctrl+C` bosing. AI sahifasida provayder sozlanganligi ko‘rinadi. `Provayder sozlangan` hali kalit/balans tekshirilganini anglatmaydi; birinchi haqiqiy so‘rovda ulanish natijasi chiqadi. Kalit yo‘q paytda soxta AI javobi berilmaydi.

**Ilovada kunlik/oylik AI so‘rov kvotasi yo‘q.** Provayderning balans, tezlik va kontekst limitlarini ilova bekor qila olmaydi. Barqarorlik uchun har so‘rov 90 soniyagacha kutiladi, bir hisobda bir vaqtda bitta generatsiya bajariladi. Davomiy so‘rovlar soni cheklanmaydi. Oxirgi 20 ta xabar AI kontekstiga yuboriladi, UI oxirgi 100 ta xabarni ko‘rsatadi, to‘liq tarix bazada qoladi. Bu cheksiz kontekst yoki bepul xizmat va’dasi emas.

AI xabarlari hisob bo‘yicha ajratilgan; server bazasida saqlanadi va faqat sozlangan provayderga yuboriladi. API kaliti brauzerga qaytarilmaydi. AI yordamchi ta’lim savollariga javob beradi; davomat yoki baholarni o‘zi o‘zgartira olmaydi. Ovozdan matnga kiritish brauzer SpeechRecognition xizmatiga bog‘liq va uchinchi tomon qayta ishlashi mumkin.

Rasmiy API shartnomasi: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create

## Namuna hisoblari

Kirish sahifasidagi uchta tugma bilan darhol sinab ko‘rish mumkin. Ular nomlangan namuna hisoblari; ma’lumotlar haqiqiy odamlar haqidagi da’vo emas.

| Rol | Email | Parol |
| --- | --- | --- |
| O‘quvchi | student@demo.local | Demo2026! |
| Ota-ona | parent@demo.local | Demo2026! |
| O‘qituvchi | teacher@demo.local | Demo2026! |

Namuna ota-onaga Azizbek hisobi bog‘langan. Namuna o‘quvchining ota-onaga beradigan kodi: `AZIZ-2026`. Boshlang‘ich 1250 token va davomat qaydlari namuna ekanligi interfeysda yozilgan.

Yangi o‘quvchi yoki ota-ona kirish sahifasida ro‘yxatdan o‘tadi. Yangi o‘quvchi **0 token** bilan boshlaydi. Yangi ota-ona o‘quvchi bergan maxsus kodni kiritmaguncha uning ma’lumotlarini ko‘ra olmaydi. Kod o‘quvchining Sozlamalar sahifasida turadi. Kodni faqat tegishli ota-onaga bering.

## Sahifalar va ishlaydigan jarayonlar

1. **Bosh sahifa** — serverdan olingan vazifalar, davomat, tekshirilgan ishlar va token balansi. Soxta o‘sish foizlari yoki zanjir ko‘rsatkichlari yo‘q.
2. **O‘quvchi kabineti** — matematika, fizika, tarix va dasturlash bo‘yicha alohida qisqa dars/mashqlar. Uy vazifasi, sinf ishi va dars faoliyatiga yozma javob yuborish. Baholanmagan javobni tahrirlash. Ball, ustoz izohi va olingan tokenlarni ko‘rish.
3. **Ota-ona kabineti** — bog‘langan farzandlar o‘rtasida almashish, oylik davomat filtri, har dars holati va izohi, vazifa topshirilganligi, baholar, o‘qituvchi izohlari va tokenlar tarixi. CSV hisobot yuklash.
4. **O‘qituvchi kabineti** — topshiriq yaratish, javoblarni tekshirish, ball va izoh berish, har o‘quvchiga sana/fan bo‘yicha davomat qo‘yish yoki yangilash, ichki sovrin so‘rovini tasdiqlash.
5. **AI yordamchi** — OpenAI-mos backend ulanishi, shaxsiy suhbat tarixi, taklif savollari, ovozdan matn kiritish qo‘llab-quvvatlangan brauzerlarda, tarixni tozalash va tushunarli xato holatlari.
6. **Token Shop** — smartfon, noutbuk, sichqoncha, kitob, to‘p, futbol formasi, pul mukofoti, quloqchin, daftar va mantiqiy kubik. Qidirish, kategoriya filtri, zaxira, yetarli balans tekshiruvi, tasdiqlash oynasi va so‘rovlar tarixi.
7. **Sozlamalar** — profil, ota-ona kodi, och/to‘q rejim va server/AI holati.

Har bir navigatsiya alohida URL hash va alohida sahifa komponentiga olib boradi. Begona rol sahifasi shaxsiy ma’lumotni ko‘rsatmaydi va tegishli hisobga kirishni taklif qiladi. Ruxsatlar frontenddan tashqari backendda ham tekshiriladi.

## Token qoidalari

- O‘qituvchi har vazifaga 0–1000 gacha maksimal token belgilaydi.
- Beriladigan token: `round(maksimal_token × ball / 100)`.
- Har javob **bir marta** baholanadi; qayta baholash orqali qo‘shimcha token chiqarib bo‘lmaydi.
- Mustaqil mashqni cheksiz takrorlash bepul token bermaydi.
- Sovrin so‘rovida balans va zaxira bitta SQLite tranzaksiyasida yangilanadi.
- Kutilayotgan so‘rovni bekor qilish token va zaxirani bir marta qaytaradi.
- Tasdiqlangan yoki bekor qilingan so‘rovni qayta bekor qilib token olish mumkin emas.
- Tokenlar ichki rag‘bat birligi. Ular real pul emas.
- Katalog namuna. Haqiqiy mahsulot yetkazib berish, hamkor inventari va pul to‘lash ulanmagan. O‘qituvchi tasdig‘i faqat ichki qayddir.

## Git Bash: tekshiruvlar

```bash
npm test
npm run build
npm run test:ui
```

`npm test` vaqtinchalik SQLite va mahalliy test AI provayderida 20 ta tekshiruvni bajaradi. Sizning asosiy bazangizga tegmaydi. AI provayder transporti, 429 xatosi, saqlash, rollar, davomat, baholash va token tranzaksiyalari tekshiriladi.

Brauzer testlari Windows’da o‘rnatilgan Chrome’dan foydalanadi. Chrome topilmagan boshqa muhitda bir marta:

```bash
npx playwright install chromium
npm run test:ui
```

UI testlari alohida xotiradagi baza va 3101 portidagi serverda ishlaydi. Desktopda vazifa → baholash → ota-ona kuzatuvi, do‘kon so‘rovi/bekor qilish, dark mode saqlanishi; 390px mobil ekranda menyu, mashq, kategoriya filtri va gorizontal sig‘ish tekshiriladi. Skrinshotlar `artifacts/` ichiga yoziladi. `npm run build` UI testlaridan oldin bajarilgan bo‘lishi kerak.

## Git Bash: tayyor buildni serverda ishlatish

Vite kerak bo‘lmagan usul. Avval dev serverni `Ctrl+C` bilan to‘xtating:

```bash
npm run build
npm start
```

Bu usulda frontend va API bir serverdan ishlaydi: **http://localhost:3001/**. `npm run preview` faqat statik oldindan ko‘rish bo‘lib, to‘liq portal uchun `npm start` dan foydalaning.

## Haqiqiy o‘qituvchi hisobini yaratish

Ochiq ro‘yxatdan o‘tishda o‘qituvchi rolini olish mumkin emas. Administrator serverga kirib `.env` fayliga vaqtincha quyidagilarni kiritadi:

```dotenv
TEACHER_NAME=Ustoz Ismi
TEACHER_EMAIL=ustoz@example.com
TEACHER_PASSWORD=Kamida12BelgiliMaxfiyParol
```

Bu manzil misol uchun; o‘z emailingiz va o‘zingiz tanlagan kuchli parolni kiriting. Keyin:

```bash
npm run create-teacher
```

Hisob yaratilgach `.env` ichidan `TEACHER_PASSWORD` ni olib tashlang. Namuna hisoblari bilan kirishni o‘chirish uchun `DEMO_MODE=false` belgilang va serverni qayta ishga tushiring. Namuna ma’lumotlari bazadan avtomatik o‘chirilmaydi. Hozirgi loyiha bitta maktab/sinf doirasidagi lokal hackathon portali; ko‘p maktabli izolyatsiya yoki rasmiy shaxsni tasdiqlash xizmati qo‘shilmagan.

## Ma’lumotlar va hosting

- SQLite: `data/voicetomental.sqlite`; server qayta ishga tushsa ham saqlanadi.
- Parollar scrypt bilan xeshlanadi. Sessiyalar HttpOnly/SameSite=Lax cookie orqali yuradi.
- Parametrli SQL, server tarafdagi rol va bog‘langan farzand tekshiruvlari, JSON tana cheklovi va Origin tekshiruvi qo‘shilgan.
- Noto‘g‘ri kirish uchun vaqtinchalik urinish cheklovi mavjud; bu AI so‘rovlari kvotasi emas.
- `data/`, `.env`, test artefaktlari Git’dan chiqarilgan.
- Ommaviy hostingdan oldin HTTPS reverse proxy, `APP_ORIGIN=https://sizning-domeningiz`, `COOKIE_SECURE=true`, `DEMO_MODE=false`, zaxira nusxalar va maktab ruxsat jarayonini sozlang.
- Backend faqat loopbackda tinglaydi. Uni boshqariladigan HTTPS reverse proxy ortida ishga tushiring.
- Rasmiy ota-ona tasdiqlashi, email tasdiqlash/parol tiklash, real sovrin yetkazish va monitoring hali qo‘shilmagan. Bu funksiyalar ishlayotgandek ko‘rsatilmaydi.

## Tuzilma

```text
server/
  database.mjs          # SQLite sxemasi va belgilangan namuna ma’lumotlar
  index.mjs             # API, autentifikatsiya, AI proksi, statik hosting
  server.test.mjs       # API integratsiya testlari
scripts/
  dev.mjs               # Frontend + backend jarayonlari
  create-teacher.mjs    # Server administratori uchun hisob yaratish
src/
  App.jsx               # Layout, hash navigatsiya, autentifikatsiya, tema
  pages/
    LoginPage.jsx
    DashboardPage.jsx
    StudentPage.jsx
    ParentPage.jsx
    TeacherPage.jsx
    AIPage.jsx
    ShopPage.jsx
    SettingsPage.jsx
  components/PortalUI.jsx
  lib/
    api.js
    useData.js
    useDialogAccessibility.js
  index.css
  main.jsx
tests/
  portal.spec.js
  ui-server.mjs
.env.example
playwright.config.js
```

Avvalgi BILIM AI va birinchi VoiceToMental prototipi manbalari saqlangan, ammo joriy ilovaga ulanmagan. Yangi portal `src/App.jsx` va `src/pages/` dan boshlanadi.

## Groq ulanishi

Groq uchun serverdagi `.env` faylida `AI_BASE_URL=https://api.groq.com/openai/v1`, `AI_MODEL=openai/gpt-oss-20b` va `AI_API_KEY` ni sozlang. `VITE_GROQ_API_KEY` ishlatmang: VITE_ bilan boshlangan qiymatlar brauzerga chiqishi mumkin. `.env` dagi AI sozlamalari yangi so?rovda qayta o?qiladi; faqat AI kaliti yoki modeli yangilanganda serverni qayta yoqish shart emas. AI sahifasini yangilang.

Integratsiya manbasi: https://console.groq.com/docs/openai
