# Proxy API (.NET 10)

API پروکسی برای جلوگیری از CORS: کلاینت درخواست را به این بکند می‌زند و بکند همان درخواست را به API مقصد فوروارد می‌کند.

## اجرا

```bash
cd proxy-api
dotnet run
```

پیش‌فرض: `http://localhost:5107`

## فرانت‌اند

در `.env.local` می‌توانی آدرس پروکسی را عوض کنی:

```
NEXT_PUBLIC_PROXY_URL=http://localhost:5107
```

بدون این متغیر، فرانت از همان `http://localhost:5107` استفاده می‌کند.

## اندپوینت

- **POST** `/api/proxy`

بدن درخواست (JSON):

```json
{
  "method": "GET",
  "url": "https://api.example.com/...",
  "headers": { "Content-Type": "application/json" },
  "body": null
}
```

پاسخ (JSON): `{ "status": 200, "statusText": "OK", "headers": { ... }, "data": ... }`
