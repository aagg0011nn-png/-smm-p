# SMM Panel — منصة خدمات سوشيال ميديا

مشروع Full-Stack (Next.js + PostgreSQL + Prisma) لبناء لوحة SMM: تسجيل مستخدمين، محفظة، طلبات مربوطة بمزودي API خارجيين، لوحة إدارة كاملة، تذاكر دعم، ودعم RTL/عربي مع dark mode.

## ⚠️ حالة المشروع — اقرأ هذا أولًا

هذا المشروع **مكتوب بالكامل لكن غير مُختبر بالتشغيل الفعلي** — تمت كتابته في بيئة بدون اتصال إنترنت فما قدرنا نُشغّل `npm install` أو نتحقق من أن كل شيء يعمل بدون أخطاء. تأكد من:

1. تشغيل `npm install` ومراجعة أي أخطاء تثبيت (نسخ الحزم مبنية على المتوفر وقت الكتابة، قد تحتاج تحديث بعضها)
2. تشغيل `npx prisma migrate dev` وحل أي مشاكل schema
3. اختبار كل تدفق (تسجيل → طلب → دفع → مزامنة) يدويًا قبل أي استخدام فعلي/إنتاجي
4. **عدم النشر على نطاق حقيقي بأموال حقيقية قبل مراجعة أمنية كاملة من طرفك أو خبير أمن**

## ما الذي تم بناؤه

- ✅ Database schema كاملة (Prisma): مستخدمون، خدمات، فئات، مزودون، طلبات، معاملات، مدفوعات، تذاكر، إشعارات، مدونة، سجلات نشاط
- ✅ مصادقة (NextAuth + bcrypt)، حماية مسارات بـ middleware، أدوار (USER/SUPPORT/ADMIN/OWNER)
- ✅ نظام مزودين قابل للتوسع (يدعم معيار SMM API الشائع: services/add/status/balance/refill/cancel) + تشفير مفاتيح API
- ✅ محرك طلبات: حساب سعر، تحقق رصيد، خصم آمن (DB transaction)، إرسال للمزود، استرجاع تلقائي عند الفشل، مزامنة حالة
- ✅ محفظة: طلب شحن يدوي + موافقة إدارة
- ✅ لوحة مستخدم: dashboard، تصفح وطلب خدمات، سجل طلبات، رصيد، تذاكر دعم
- ✅ لوحة إدارة: dashboard، مزودون (إضافة + استيراد خدمات)، مستخدمون (تعليق/تفعيل/صلاحيات)، طلبات (متابعة + مزامنة)، مدفوعات (اعتماد/رفض)
- ✅ عربي RTL كامل، Dark/Light/System mode، رؤوس أمان HTTP، rate limiting أساسي

## ما لم يُبنَ بعد (تحتاج إكماله)

- ❌ نسيان كلمة المرور (Forgot password) — الجدول موجود (`PasswordReset`) لكن الـ API/الصفحات غير مكتوبة
- ❌ صفحة تفاصيل الطلب الفردية، إلغاء/طلب إعادة تعبئة من واجهة المستخدم (المنطق موجود جزئيًا في adapter لكن غير مربوط بزر في الواجهة)
- ❌ Mass order (طلبات جماعية)، API documentation page للمستخدمين، صفحة تدير الـ API key الخاص بالمستخدم
- ❌ المدونة (Blog) — الجدول موجود فقط، بدون CRUD أو صفحات عرض
- ❌ صفحة الرد على تذاكر الدعم من طرف الأدمن (الموجود الآن: فتح تذكرة فقط)
- ❌ ملفات اختبار (tests)
- ❌ صفحة Sitemap/robots.txt الفعلية

## البنية التقنية (Stack)

- **Next.js 14** (App Router) — Frontend + Backend API routes في مشروع واحد
- **PostgreSQL + Prisma** — قاعدة بيانات ونماذج
- **NextAuth** — مصادقة (JWT sessions)
- **Tailwind CSS** — تصميم
- **Zod** — validation لكل مدخلات الـ API
- **Decimal.js** — حسابات مالية دقيقة (لا تستخدم float للأموال)

## التشغيل محليًا

```bash
# 1. تثبيت الحزم
npm install

# 2. إعداد المتغيرات البيئية
cp .env.example .env
# عدّل DATABASE_URL, NEXTAUTH_SECRET, APP_ENCRYPTION_KEY (استخدم: openssl rand -base64 32)

# 3. تشغيل PostgreSQL (مثال عبر Docker)
docker run --name smm-postgres -e POSTGRES_PASSWORD=smm_password -e POSTGRES_USER=smm_user -e POSTGRES_DB=smm_panel -p 5432:5432 -d postgres:16

# 4. تطبيق الـ migrations
npx prisma migrate dev --name init

# 5. زرع بيانات أولية (حساب أدمن)
npm run prisma:seed

# 6. تشغيل المشروع
npm run dev
```

افتح `http://localhost:3000`، وسجّل دخول كأدمن بالبيانات التي طبعها seed script (تحقق من التيرمينال).

## ربط أول مزود SMM حقيقي

1. سجّل دخول كأدمن → `/admin/providers`
2. أدخل اسم المزود، رابط الـ API، ومفتاح الـ API — النظام سيختبر الاتصال تلقائيًا (يستدعي `balance`)
3. اضغط "استيراد الخدمات" لسحب قائمة خدمات المزود (تُحفظ مؤقتًا، لا تُنشئ خدمات داخلية تلقائيًا)
4. استخدم `POST /api/admin/services` (أو ابنِ صفحة UI فوقها) لإنشاء خدمة داخلية وربطها بخدمة المزود مع تحديد سعر البيع (`rate`) وسعر التكلفة (`costRate`) — النظام يمنع هامش ربح سالب أو صفري

> **ملاحظة على شكل الـ API**: الـ adapter الحالي (`src/lib/providers/generic-smm-adapter.ts`) يفترض معيار SMM API الشائع (action=services/add/status/balance/refill/cancel، POST بصيغة form-urlencoded). أغلب مزودي SMM (JAP وأمثالها) يتبعون هذا المعيار. إذا كان مزودك يستخدم شكل مختلف (REST/JSON مثلًا)، أنشئ adapter جديد يطبّق `ProviderAdapter` interface في `src/lib/providers/types.ts` واستخدمه بدل `GenericSmmAdapter` في `src/lib/providers/registry.ts`.

## مزامنة حالة الطلبات تلقائيًا (Cron)

أضف `CRON_SECRET` في `.env`، ثم اجدول استدعاء دوري (كل 3-5 دقائق) عبر crontab على VPS:

```bash
*/5 * * * * curl -s -X POST https://yourdomain.com/api/admin/orders/sync-all -H "x-cron-secret: YOUR_SECRET"
```

## النشر على VPS

```bash
npm run build
npm run prisma:deploy   # يطبّق migrations على قاعدة بيانات الإنتاج بدون توليد migration جديد
npm run start            # يشغل على PORT 3000 افتراضيًا
```

يُفضّل تشغيله خلف Nginx كـ reverse proxy مع شهادة SSL (Let's Encrypt / certbot)، وإدارة العملية عبر `pm2` أو `systemd` حتى يعيد التشغيل تلقائيًا عند الأعطال.

مثال إعداد `pm2`:
```bash
npm install -g pm2
pm2 start npm --name smm-panel -- start
pm2 save
pm2 startup
```

## الأمان — نقاط يجب مراجعتها قبل الإطلاق الفعلي

- غيّر `NEXTAUTH_SECRET` و`APP_ENCRYPTION_KEY` و`CRON_SECRET` لقيم عشوائية فريدة (لا تستخدم القيم الافتراضية أبدًا)
- فعّل HTTPS إجباريًا (HSTS) على مستوى Nginx
- راجع rate limiting في `src/lib/rate-limit.ts` — التطبيق الحالي in-memory ويعمل فقط لسيرفر واحد؛ استبدله بـ Redis/Upstash عند التوسع لأكثر من instance
- فعّل نسخ احتياطي دوري لقاعدة البيانات (pg_dump مجدول)
- راجع صلاحيات كل route عبر `requireAdmin`/`requireUser` قبل إضافة أي endpoint جديد
- لا تُخزّن أبدًا أي secret داخل الكود أو Git — استخدم `.env` فقط (وهو مستثنى في `.gitignore`)

## هيكلة المجلدات

```
src/
  app/
    (dashboard)/        # صفحات المستخدم المسجّل (محمية بـ middleware)
    admin/               # صفحات الإدارة (محمية بدور ADMIN/OWNER)
    api/                 # كل الـ backend endpoints
    login/ signup/       # صفحات عامة
  components/            # مكونات React قابلة لإعادة الاستخدام
  lib/
    order-engine.ts       # منطق الطلبات الأساسي
    providers/             # طبقة تجريد مزودي الـ API
    auth.ts crypto.ts session.ts validation.ts rate-limit.ts
prisma/
  schema.prisma            # كل نماذج قاعدة البيانات
  seed.ts                    # بيانات أولية
```

