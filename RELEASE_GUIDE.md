# راهنمای ریلیز و انتشار اپ Electron

## روش ساده: GitHub Actions (پیشنهادی)

با push کردن tag، ویندوز، مک و لینوکس خودکار بیلد و ریلیز می‌شوند:

```bash
# نسخه جدید (اگر v0.1.0 از قبل دارید)
git tag v0.1.1
git push origin v0.1.1
```

> اگر v0.1.0 قبلاً ساخته شده، از v0.1.1 استفاده کن. بعد از ریلیز، لینک دانلود ویندوز در بنر به‌روز می‌شود.

---

## ۱. بیلد محلی

```bash
npm run electron:build
```

خروجی در پوشه `release/` قرار می‌گیرد، مثلاً:

- **Windows**: `release/Postman Clone Setup 0.1.0.exe`
- **macOS**: `release/Postman Clone-0.1.0.dmg`
- **Linux**: `release/Postman Clone-0.1.0.AppImage`

> هر سیستم‌عامل فقط روی همان سیستم بیلد می‌شود (مثلاً روی Mac فقط dmg و AppImage ساخته می‌شود).

---

## ۲. گزینه‌های انتشار

### گزینه الف: GitHub Releases (پیشنهادی)

۱. پروژه را روی GitHub قرار بده
۲. یک **Release** جدید بساز:
   - مخزن → تب **Releases** → **Create a new release**
   - Tag مثلاً: `v0.1.0`
   - Title: `Release v0.1.0`
۳. فایل‌های بیلد را **Drag & Drop** کن (مثلاً `.exe`، `.dmg`، `.AppImage`)
۴. **Publish release** را بزن

بعد از آن، لینک دانلود به این شکل است:
```
https://github.com/YOUR_USERNAME/postman-clone/releases
```

---

### گزینه ب: انتشار خودکار با GitHub Actions

فایل `.github/workflows/release.yml` بساز تا با هر push روی tag، بیلد و ریلیز خودکار شود:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run electron:build

      - uses: softprops/action-gh-release@v1
        with:
          files: |
            release/*.exe
            release/*.dmg
            release/*.AppImage
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

هر بار که tag بزنی:
```bash
git tag v0.1.0
git push origin v0.1.0
```
GitHub Actions بیلد می‌گیرد و ریلیز را می‌سازد.

---

### گزینه ج: هاست دستی (مثلاً Liara)

۱. فایل‌های بیلد را در یک سرویس استاتیک (مثلاً Liara یا هر CDN) آپلود کن
۲. لینک مستقیم دانلود را در `VITE_DOWNLOAD_PAGE` قرار بده

---

## ۳. تنظیم لینک دانلود در اپ

بعد از انتشار، در `.env` یا هنگام build:

```env
VITE_DOWNLOAD_PAGE=https://github.com/YOUR_USERNAME/postman-clone/releases
```

برای Liara در `Dockerfile`:

```dockerfile
ENV VITE_DOWNLOAD_PAGE=https://github.com/YOUR_USERNAME/postman-clone/releases
```

---

## ۴. چک‌لیست سریع

- [ ] `npm run electron:build` را اجرا کردم
- [ ] مخزن روی GitHub است
- [ ] یک Release ساخته و فایل‌ها را آپلود کردم
- [ ] `VITE_DOWNLOAD_PAGE` را تنظیم کردم
- [ ] دوباره فرانت را build و deploy کردم
