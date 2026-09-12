# نشر موقع ETI على رابط ثابت (من المتصفح فقط)

لا Docker ولا PowerShell بعد هذه الخطوات.

## الفكرة

- **GitHub** = خزانة الملفات على الإنترنت
- **Vercel** = يشغّل الموقع 24 ساعة ويعطيك الرابط الدائم
- **Neon** = قاعدة البيانات (حسابك الذي فتحته)

العميل يفتح رابط Vercel فقط. أنت تفتح نفس الرابط + `/admin`.

---

## أ) GitHub

1. افتح https://github.com واضغط Sign up (حساب Google مقبول)
2. بعد الدخول: **New repository**
3. الاسم: `ETI`
4. اتركه Public أو Private
5. Create repository
6. **Add file → Upload files**
7. اسحب كل محتويات مجلد `ETI` من سطح المكتب **ما عدا** مجلد `node_modules` إن وُجد
8. Commit changes

## ب) جداول Neon (مرة واحدة)

1. https://console.neon.tech → مشروعك
2. من اليسار: **SQL Editor**
3. الصق محتوى ملف `neon-setup.sql` → Run

## ج) Vercel

1. https://vercel.com → Continue with GitHub
2. Add New → Project → اختر مستودع `ETI`
3. قبل Deploy افتح **Environment Variables** وأضف:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | رابط Neon الكامل (Connect) |
| `ADMIN_PASSWORD` | كلمة سر الإدارة |

4. Deploy
5. بعد النجاح يظهر رابط مثل `https://eti-xxxx.vercel.app`

هذا رابط العميل الدائم.

الإدارة: `https://eti-xxxx.vercel.app/admin`
