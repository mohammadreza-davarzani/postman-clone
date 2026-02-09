# راهنمای راه‌اندازی دیتابیس از بیخ

## دیتابیس و یوزر جدید

- **Database:** `postman_clone`
- **User:** `postman_app`
- **Password:** خودت انتخاب کن (حداقل ۸ کاراکتر، قوی باشه)

---

## مراحل راه‌اندازی

### ۱. انتخاب پسورد

یه پسورد قوی انتخاب کن و همه‌جایی که `YOUR_NEW_PASSWORD` هست رو عوض کن:
- فایل `setup-database.sql`
- فایل‌های `appsettings.json` و `appsettings.Development.json`

### ۲. اجرای اسکریپت MySQL

```bash
# لاگین با root و اجرای اسکریپت
mysql -u root -p < setup-database.sql
```

یا داخل MySQL:

```bash
mysql -u root -p
```

بعد این‌ها رو اجرا کن (رمز root رو می‌پرسه):

```sql
DROP DATABASE IF EXISTS postman_clone;
DROP USER IF EXISTS 'postman_app'@'localhost';

CREATE USER 'postman_app'@'localhost' IDENTIFIED BY 'رمز_جدید_تو';

CREATE DATABASE postman_clone 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON postman_clone.* TO 'postman_app'@'localhost';
FLUSH PRIVILEGES;
exit;
```

### ۳. آپدیت Connection String

در `proxy-api/appsettings.json` و `appsettings.Development.json` رمز رو تنظیم کن:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Port=3306;Database=postman_clone;User=postman_app;Password=رمز_تو;"
}
```

### ۴. اجرای Migration

```bash
cd proxy-api
dotnet ef database update
```

اگه migration نداری:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### ۵. اجرای بک‌اند

```bash
dotnet run
```

---

## تست اتصال

```bash
mysql -u postman_app -p postman_clone -e "SHOW TABLES;"
```

اگه جداول رو نشون داد، همه‌چیز درسته.

---

## نکات امنیتی

- رمز `YOUR_NEW_PASSWORD` رو حتماً عوض کن
- `appsettings.json` رو به git اضافه نکن (اگه رمز داری توش)
- برای production از متغیر محیطی یا Azure Key Vault استفاده کن
