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

### ۳. اجرای بکند پروکسی (برای ارسال درخواست‌ها)

در یک ترمینال جدید:

```bash
cd proxy-api
dotnet run
```

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
├── proxy-api/         # بکند .NET
└── package.json
```

---

## رفع مشکل نصب

اگر در نصب مشکل داشتی:

```bash
npm cache clean --force
npm install
```

یا با VPN نصب کن.
