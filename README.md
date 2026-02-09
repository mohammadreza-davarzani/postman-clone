# Postman Clone

کلاینت API شبیه Postman با اپ دسکتاپ **Electron** و فرانت **React + Vite**.

---

## نصب و اجرا

### ۱. نصب وابستگی‌ها

```bash
npm install
```

### ۲. اجرای اپ دسکتاپ

```bash
npm run electron:dev
```

### ۳. اجرای بکند API (ریپو جدا: postman-api)

در یک ترمینال جدید، از ریپو postman-api:

```bash
cd postman-api
dotnet run
```

API: http://localhost:5107

---

## اسکریپت‌ها

| دستور | کار |
|--------|-----|
| `npm run dev` | فقط فرانت (مرورگر) |
| `npm run electron:dev` | اپ دسکتاپ Electron |
| `npm run build` | بیلد فرانت |
| `npm run electron:build` | بیلد اپ دسکتاپ |

---

## ساختار پروژه

```
postman-clone/
├── electron/          # فایل‌های Electron
│   ├── main.js
│   └── preload.js
├── src/               # سورس React
│   ├── components/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

---

## ویژگی‌های اضافی

### Export به k6 Script

می‌تونی collection‌های خودت رو به فرمت **k6 load testing script** export کنی:

1. روی collection مورد نظر hover کن
2. روی آیکون بنفش (⚡) کلیک کن
3. فایل `.js` دانلود میشه

برای اجرای تست k6:

```bash
# نصب k6
brew install k6  # macOS
# یا
choco install k6  # Windows

# اجرای تست
k6 run your_collection_k6.js
```

### Export به Postman Collection

همچنین می‌تونی collection رو به فرمت Postman JSON export کنی:

1. روی collection hover کن
2. روی آیکون آبی (📥) کلیک کن
3. فایل `.postman_collection.json` دانلود میشه

### قابلیت cURL

برای هر request می‌تونی:

1. روی تب **"Code"** کلیک کنی
2. دستور cURL رو ببینی
3. با دکمه **Copy** کپی کنی
4. در ترمینال اجرا کنی

---

## Docker

**فرانت (این ریپو):**
```bash
docker compose up -d --build
```
فرانت: http://localhost:3000

**بک‌اند (ریپو postman-api):** باید جداگانه اجرا بشه:
```bash
cd postman-api
docker compose up -d --build
```
API: http://localhost:5107

---

## رفع مشکل نصب

اگر در نصب مشکل داشتی:

```bash
npm cache clean --force
npm install
```

یا با VPN نصب کن.
