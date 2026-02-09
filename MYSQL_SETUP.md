# راهنمای نصب MySQL

## تنظیم Connection String

### 1. فایل appsettings.Development.json رو ویرایش کن:

```bash
cd proxy-api
```

باز کن: `appsettings.Development.json`

Connection string رو با اطلاعات MySQL خودت تغییر بده:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=postman_clone;User=root;Password=YOUR_PASSWORD;"
  }
}
```

جایگزین کن:
- `YOUR_PASSWORD` → password MySQL خودت
- اگر port دیگه‌ای داری، `3306` رو تغییر بده
- اگر username دیگه‌ای داری، `root` رو تغییر بده

### 2. دیتابیس رو بساز (اختیاری)

می‌تونی خودت database بسازی یا بذار Migration خودکار بسازه:

#### روش دستی:
```sql
CREATE DATABASE postman_clone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### یا
Migration خودکار database رو می‌سازه.

### 3. Migration رو اجرا کن:

```bash
cd proxy-api
dotnet ef migrations add InitialCreate
dotnet ef database update
```

اگر خطا گرفتی:
- مطمئن شو MySQL در حال اجرا هست
- Password رو درست وارد کردی
- Port درسته (معمولاً 3306)
- User دسترسی داره

### 4. بک‌اند رو اجرا کن:

```bash
dotnet run
```

## بررسی MySQL

### آیا MySQL نصب و در حال اجراست؟

```bash
# macOS
brew services list | grep mysql

# یا
mysql --version
```

### اگر نصب نیست:

```bash
# macOS
brew install mysql
brew services start mysql

# اولین بار که اجرا می‌کنی:
mysql_secure_installation
```

### Password رو فراموش کردی؟

#### macOS/Linux:
```bash
# متوقف کردن MySQL
brew services stop mysql

# اجرا بدون password
mysqld_safe --skip-grant-tables &

# لاگین بدون password
mysql -u root

# تغییر password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
exit;

# restart MySQL
brew services restart mysql
```

## تست Connection

بعد از تنظیم، می‌تونی با این دستور تست کنی:

```bash
mysql -u root -p -e "SHOW DATABASES;"
```

باید `postman_clone` رو در لیست ببینی (بعد از migration).

## خطاهای رایج

### 1. Access denied
- Password اشتباهه
- User وجود نداره
- User دسترسی نداره

### 2. Can't connect
- MySQL در حال اجرا نیست
- Port اشتباهه
- Firewall مسدود کرده

### 3. Database doesn't exist
- Migration رو اجرا نکردی
- یا دستی database بساز

## اطلاعات پیش‌فرض

```
Server: localhost
Port: 3306
Database: postman_clone
User: root
Password: [باید خودت تنظیم کنی]
```

## بعد از موفقیت

وقتی MySQL به درستی تنظیم شد:
1. Migration اجرا میشه
2. Database و جداول ساخته میشن
3. بک‌اند connect میشه
4. می‌تونی register/login کنی
5. داده‌ها permanent ذخیره میشن

## نکته

اگر نمی‌خوای MySQL نصب کنی، می‌تونم به SQLite یا همون In-Memory برگردونم.

بهم بگو کدوم رو ترجیح میدی! 😊
