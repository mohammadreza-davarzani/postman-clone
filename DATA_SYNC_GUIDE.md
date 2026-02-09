# راهنمای Data Sync با Backend

تمام داده‌های کاربر (Collections و Environments) حالا در بک‌اند ذخیره میشن و با user لاگین شده مرتبطن.

## تغییرات انجام شده

### ✅ بک‌اند (.NET)

**Models جدید:**
1. `Collection` - ذخیره collection ها
2. `Environment` - ذخیره environment ها
3. DTOs برای create/update

**Database:**
- In-Memory EntityFramework
- Foreign Key به User
- Cascade delete (وقتی user حذف بشه، داده‌هاش هم حذف میشن)

**API Endpoints:**

#### Collections
- `GET /api/collections` - لیست collection های user
- `POST /api/collections` - ساخت collection جدید
- `PUT /api/collections/{id}` - آپدیت collection
- `DELETE /api/collections/{id}` - حذف collection

#### Environments
- `GET /api/environments` - لیست environment های user
- `POST /api/environments` - ساخت environment جدید
- `PUT /api/environments/{id}` - آپدیت environment
- `DELETE /api/environments/{id}` - حذف environment

### ✅ فرانت (React)

**فایل‌های جدید:**
- `src/services/apiService.ts` - سرویس API برای تمام عملیات

**تغییرات:**
- `Sidebar.tsx` - حذف localStorage، استفاده از API
- `Client.tsx` - حذف localStorage management

## نحوه کار

### 1. Login
وقتی کاربر لاگین می‌کنه، Sidebar به صورت خودکار:
- Collections رو از API می‌گیره
- Environments رو از API می‌گیره

### 2. Operations
تمام عملیات به صورت real-time با backend sync میشن:

**Collections:**
- ✅ Import Postman collection → ذخیره در DB
- ✅ Create folder → آپدیت در DB
- ✅ Delete folder → آپدیت در DB
- ✅ Delete collection → حذف از DB
- ✅ Move request → آپدیت در DB

**Environments:**
- ✅ Create environment → ذخیره در DB
- ✅ Rename environment → آپدیت در DB
- ✅ Add/Edit/Delete variables → آپدیت در DB (با onBlur)
- ✅ Delete environment → حذف از DB

### 3. Multi-Device Sync
چون داده‌ها روی سرور ذخیره میشن:
- می‌تونی از چند دستگاه مختلف لاگین کنی
- همه داده‌هات در همه جا sync میشه
- هر تغییری که بدی، در بک‌اند ذخیره میشه

## مزایا

### 🔒 Security
- داده‌ها با user مرتبطن
- هر user فقط collection و environment های خودش رو می‌بینه
- JWT authentication برای همه endpoints

### 💾 Persistence
- دیگه داده‌ها در localStorage گم نمیشن
- با پاک کردن browser cache، داده‌ها از دست نمیرن
- Backup از داده‌ها روی سرور

### 🔄 Sync
- تمام devices sync هستن
- تغییرات به صورت real-time اعمال میشن
- نیازی به manual export/import نیست

## استفاده

### راه‌اندازی

1. **بک‌اند رو restart کن:**
```bash
cd proxy-api
dotnet run
```

2. **فرانت در حال اجراست:**
```bash
npm run electron:dev
# یا
npm run dev
```

### تست

1. **لاگین کن** (یا register)

2. **Import یک collection:**
   - Import → انتخاب فایل Postman JSON
   - Collection در DB ذخیره میشه

3. **Create Environment:**
   - Environments tab → Create environment
   - Variables رو اضافه کن
   - با onBlur، همه چیز save میشه

4. **Logout و Login دوباره:**
   - تمام داده‌هات هنوز هستن
   - همه چیز از سرور load شده

5. **Test Multi-Device:**
   - از browser دیگه یا دستگاه دیگه login کن
   - همه داده‌هات رو می‌بینی

## نکات فنی

### Performance
- Collection و Environment items به صورت JSON string ذخیره میشن
- Debounce برای environment variable changes (onBlur)
- Loading states برای UX بهتر

### Error Handling
- همه API calls با try/catch wrap شدن
- Error modal برای نمایش خطاها
- Console log برای debugging

### Data Format
Backend JSON رو parse می‌کنه و به object تبدیل می‌کنه، بنابراین فرانت می‌تونه مستقیم باهاش کار کنه.

## Limitations (فعلی)

### In-Memory Database
- داده‌ها با restart بک‌اند پاک میشن
- برای production باید به database واقعی متصل بشه

### No Real-time Updates
- اگر از دو device همزمان استفاده کنی، باید refresh کنی
- برای real-time sync باید SignalR یا WebSocket اضافه بشه

## توسعه آینده

می‌تونی این feature ها رو اضافه کنی:

- [ ] Real database (PostgreSQL, SQL Server)
- [ ] Real-time sync با SignalR
- [ ] Export collection از backend
- [ ] Share collections با users دیگه
- [ ] Collection versioning و history
- [ ] Backup و restore
- [ ] Import from URL
- [ ] Favorite collections
- [ ] Search in collections
- [ ] Collection templates

## Migration از localStorage

کاربرانی که قبلاً از localStorage استفاده می‌کردن:
1. داده‌های قدیمی در localStorage باقی میمونن
2. می‌تونن export کنن و import کنن به backend
3. یا manually دوباره بسازن

## نتیجه

حالا یک سیستم کامل data sync داری که:
- ✅ Secure (JWT authentication)
- ✅ Persistent (server-side storage)
- ✅ Multi-device support
- ✅ Real-time updates در همون device
- ✅ User-specific data

بک‌اند و فرانت آماده‌ست! فقط بک‌اند رو restart کن و test کن! 🚀
