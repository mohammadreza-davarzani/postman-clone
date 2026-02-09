# راهنمای Authentication

سیستم لاگین کامل با JWT Authentication پیاده‌سازی شده است.

## معماری

### بک‌اند (.NET)
- ✅ JWT Authentication با Bearer Token
- ✅ In-Memory Database (EntityFramework)
- ✅ Password Hashing با SHA256
- ✅ 3 endpoint: Register, Login, Get Current User

### فرانت (React)
- ✅ AuthContext برای مدیریت state
- ✅ صفحه Login/Register زیبا
- ✅ Protected Routes
- ✅ نمایش اطلاعات کاربر در Header
- ✅ دکمه Logout

## نحوه استفاده

### 1. راه‌اندازی بک‌اند

بک‌اند رو از نو اجرا کن (در ترمینال جدید):

```bash
cd proxy-api
dotnet run
```

یا اگر قبلاً در حال اجراست، Ctrl+C بزن و دوباره `dotnet run` کن.

بک‌اند روی **http://localhost:5107** اجرا میشه.

### 2. راه‌اندازی فرانت

اگر Electron در حال اجراست، تغییرات به صورت خودکار اعمال میشه.

اگر نه، اجرا کن:

```bash
npm run electron:dev
```

یا برای مرورگر:

```bash
npm run dev
```

### 3. تست Authentication

1. اپلیکیشن رو باز کن
2. صفحه Login/Register نمایش داده میشه
3. روی تب **Register** کلیک کن
4. اطلاعات رو پر کن:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
5. روی **Create Account** کلیک کن
6. بعد از ثبت‌نام موفق، به صفحه اصلی هدایت میشی
7. در Header، نام کاربر و عکس پروفایل نمایش داده میشه
8. برای خروج، روی نام کاربر کلیک کن و **Logout** رو بزن

## API Endpoints

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response:
{
  "token": "eyJhbGc...",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "email": "user@example.com",
  "name": "John Doe",
  "userId": "1"
}
```

## ویژگی‌ها

### Security
- ✅ Password hashing (SHA256)
- ✅ JWT tokens با expiration (7 روز)
- ✅ Protected routes
- ✅ Token validation در هر request

### UX
- ✅ Persistent login (token در localStorage)
- ✅ Auto redirect به login اگر token نامعتبر باشه
- ✅ Loading states
- ✅ Error handling و نمایش پیام‌های خطا
- ✅ Form validation

### UI
- ✅ صفحه Login/Register مدرن و زیبا
- ✅ User menu در Header با عکس پروفایل
- ✅ Logout functionality
- ✅ Responsive design

## نکات مهم

1. **Database**: از In-Memory database استفاده میشه، یعنی بعد از restart بک‌اند، کاربرها پاک میشن.

2. **Security**: برای production باید:
   - از bcrypt یا Argon2 برای password hashing استفاده کنی
   - JWT secret رو در configuration بذاری
   - HTTPS رو فعال کنی
   - از database واقعی (PostgreSQL, SQL Server) استفاده کنی

3. **Token Expiration**: Token‌ها 7 روز اعتبار دارن. می‌تونی در `AuthService.cs` تغییرش بدی.

## فایل‌های مهم

### Backend
- `proxy-api/Models/User.cs` - User model
- `proxy-api/Models/AuthDtos.cs` - DTOs برای register/login
- `proxy-api/Data/AppDbContext.cs` - Database context
- `proxy-api/Services/AuthService.cs` - Authentication logic
- `proxy-api/Program.cs` - Configuration و endpoints

### Frontend
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/pages/Auth.tsx` - صفحه Login/Register
- `src/components/Header.tsx` - User menu و logout
- `src/App.tsx` - Protected routes

## توسعه بیشتر

می‌تونی این قابلیت‌ها رو اضافه کنی:

- [ ] Forgot password
- [ ] Email verification
- [ ] Refresh tokens
- [ ] Social login (Google, GitHub)
- [ ] User profile page
- [ ] Change password
- [ ] Two-factor authentication (2FA)
- [ ] User roles و permissions
