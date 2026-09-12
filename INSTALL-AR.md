# تشغيل موقع ETI على جهازك

بعد التثبيت على حاسوبك يصبح الرابط **ثابتاً ولا يتغيّر**:

- رابط العميل: `http://localhost:3000`
- رابطك للإدارة (لا ترسله للعميل): `http://localhost:3000/admin`
- كلمة المرور: `eti2026` (غيّرها لاحقاً من الإدارة)

العميل لا يرى زر الإدارة.

---

## الطريقة الأسهل: Docker Desktop

1. ثبّت [Docker Desktop](https://www.docker.com/products/docker-desktop/) ثم أعد تشغيل الجهاز.
2. ضع مجلد المشروع على سطح المكتب (مثلاً `ETI`).
3. افتح PowerShell داخل المجلد ونفّذ:

```bat
docker compose up --build
```

4. افتح المتصفح: `http://localhost:3000`

لإيقافه: أغلق النافذة أو `docker compose down`.  
البيانات (الأصناف، الصور، الطلبات) تبقى محفوظة.

---

## طريقة بدون Docker: Node.js + PostgreSQL (ويندوز)

### 1) البرامج المطلوبة

- [Node.js LTS](https://nodejs.org) (عند التثبيت فعّل خيار Add to PATH)
- [PostgreSQL](https://www.postgresql.org/download/windows/)
  - كلمة مرور المستخدم `postgres`: اختر `postgres` (أو اكتبها في ملف `.env`)
  - المنفذ: `5432`

### 2) إنشاء قاعدة البيانات

افتح SQL Shell أو pgAdmin ونفّذ:

```sql
CREATE DATABASE app_db;
```

### 3) تشغيل الموقع

انقل مجلد المشروع إلى سطح المكتب، ثم **اضغط مرتين** على الملف:

`start.bat`

أو من PowerShell داخل المجلد:

```bat
npm install
npx drizzle-kit push
npm run build
npm start
```

ثم افتح `http://localhost:3000`

---

## بعد التشغيل (عملك اليومي)

1. ادخل `http://localhost:3000/admin`
2. ارفع ملف Excel
3. اكتب الكمية لكل صنف من الخانة الخضراء
4. أرفق صورة كل صنف مرة واحدة
5. اضبط رقم الواتساب

رابط العميل على **نفس الجهاز**: `http://localhost:3000`

إذا أردت أن يفتحه الجوال على نفس شبكة الواي فاي:

1. من PowerShell: `ipconfig`
2. خذ IPv4 مثل `192.168.1.15`
3. من الجوال افتح: `http://192.168.1.15:3000`

الحاسوب يجب أن يبقى مفتوحاً والموقع شغّالاً.

---

## ملاحظة مهمة

`localhost` يعمل على جهازك فقط.  
حتى يفتح العملاء الرابط من أي مكان في الإنترنت لاحقاً، ننشره على استضافة (رابط واحد دائم مثل `eti-orders.vercel.app`).
