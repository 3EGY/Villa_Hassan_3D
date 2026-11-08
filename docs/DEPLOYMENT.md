# تشغيل ونشر شاشة فيلا حسن

[العودة إلى التعريف بالمشروع](../README.md)

## تحديث صفحة التعريف والصور

هذا التحديث يضيف وصف المشروع والصور والمعاينة المتحركة، ويحتفظ بكود شاشة التحكم كما هو في الإصدار الثاني.

1. فك ضغط حزمة `Villa_Hassan_Smart_Home.zip`.
2. افتح [المستودع](https://github.com/3EGY/Villa_Hassan_3D) ثم **Add file → Upload files**.
3. اسحب `README.md` ومجلد `docs` كاملًا إلى جذر المستودع. حافظ على المسار `docs/media/` حتى تظهر الصور والمعاينة المتحركة.
4. احفظ التعديل بـ **Commit changes**. سيظهر التعريف الجديد في الصفحة الرئيسية للمستودع.

لا تحتاج إلى استبدال `index.html` إذا كنت رفعت تحديث الإضاءة الثاني بالفعل، ولا تحتاج إلى إعادة إعداد GitHub Pages.

إذا كان لديك checkout محلي، بعد نسخ الملفات إلى مكانها:

```powershell
git add README.md docs
git commit -m "Present Villa Hassan smart home control prototype"
git push origin main
```

## محتويات التوثيق

| الملف | الغرض |
| --- | --- |
| `README.md` | تعريف مرئي بالمشروع، تجربة مباشرة، صور، وأوضاع التحكم وخطة التطوير |
| `docs/media/hero.png` | غلاف بصري يتضمن لقطة فعلية من المخطط |
| `docs/media/lighting-demo.gif` | معاينة متحركة للأوضاع من شاشة المحاكاة |
| `docs/media/villa-overview.png` | المخطط الكامل |
| `docs/media/room-light-control.png` | التحكم في شدة إضاءة الصالة |
| `docs/media/lighting-scenes.png` | قائمة أوضاع الإضاءة |
| `docs/media/mobile-controls.png` | واجهة التحكم على الهاتف |

## الملفات

| الملف | وظيفته |
| --- | --- |
| `index.html` | الصفحة الرئيسية والمجسم والمكتبات والأيقونات المضمنة |
| `assets/favicon.svg` | أيقونة الصفحة وهوية شاشة الترحيب |
| `assets/apple-touch-icon.png` | أيقونة الاختصار على أجهزة Apple |
| `assets/social-card.png` | صورة معاينة الرابط، بمقاس 1200×630 |
| `404.html` | صفحة للرابط غير الموجود مع زر العودة للجولة |
| `.nojekyll` | تقديم ملفات الموقع الثابتة مباشرة |
| `.gitignore` | استبعاد الملفات المحلية المؤقتة |
| `THIRD_PARTY_NOTICES.md` | إشعارات وتراخيص المكتبات المضمنة |

لا تحتاج الحزمة إلى npm أو build أو مفاتيح API. يمكن فتح `index.html` محليًا بعد فك الضغط؛ أبقِ مجلد `assets` بجواره. ملفات التشغيل كلها محلية، وبيانات المشاركة تشير إلى رابط النشر النهائي.

## أول رفع من Windows PowerShell

يُفترض أن Git مثبت، وأن ملف `Villa_Hassan_Smart_Home.zip` موجود في المجلد الحالي، وأن مجلدًا باسم `Villa_Hassan_3D` غير موجود فيه.

```powershell
git clone https://github.com/3EGY/Villa_Hassan_3D.git
Set-Location .\Villa_Hassan_3D
Expand-Archive -LiteralPath ..\Villa_Hassan_Smart_Home.zip -DestinationPath . -Force
git add index.html assets docs 404.html .nojekyll .gitignore README.md THIRD_PARTY_NOTICES.md
git commit -m "Publish Villa Hassan interactive 3D presentation"
git branch -M main
git push -u origin main
```

نفّذ الأوامر بالترتيب؛ إذا ظهر خطأ، عالجه قبل الانتقال للأمر التالي. لا تستخدم `--force` للرفع. إذا طلب Git تسجيل الدخول، استخدم حسابًا له صلاحية الكتابة في `3EGY/Villa_Hassan_3D`.

إذا طلب Git تعريف اسم صاحب التعديل والبريد، اضبطهما داخل مجلد المشروع باستخدام بيانات حسابك الفعلية، ثم أعد أمر `git commit`:

```powershell
git config user.name "YOUR_GITHUB_NAME"
git config user.email "YOUR_VERIFIED_OR_NOREPLY_EMAIL"
```

## تفعيل GitHub Pages عند النشر لأول مرة فقط

بعد نجاح الرفع، افتح:
https://github.com/3EGY/Villa_Hassan_3D/settings/pages

اختر القيم التالية ثم اضغط **Save**:

| الإعداد | القيمة |
| --- | --- |
| Source | Deploy from a branch |
| Branch | main |
| Folder | / (root) |

لا تحتاج إلى إنشاء workflow مخصص أو اختيار GitHub Actions كمصدر النشر لهذه الحزمة. يتولى GitHub تشغيل عملية النشر اللازمة عند رفع التغييرات إلى الفرع المحدد.

تابع نتيجة النشر من:
https://github.com/3EGY/Villa_Hassan_3D/actions

بعد نجاح النشر، افتح رابط العرض بنفسك مرة واحدة على الكمبيوتر والموبايل، ثم أرسله للعميل:
https://3egy.github.io/Villa_Hassan_3D/

قد يستغرق ظهور التحديثات حتى 10 دقائق وفقًا لتوثيق GitHub. إعدادات Pages تتطلب صلاحية admin أو maintainer للمستودع.

## التحديثات التالية

من داخل مجلد المشروع، اجلب آخر نسخة قبل بدء التعديلات:

```powershell
git pull --ff-only origin main
```

بعد تعديل الملفات وحفظها:

```powershell
git add index.html assets docs 404.html README.md THIRD_PARTY_NOTICES.md .nojekyll .gitignore
git commit -m "Update Villa Hassan presentation"
git push origin main
```

إذا عندك تغييرات محلية غير محفوظة ويعترض `git pull`، احفظها في commit أولًا ثم اجلب التحديثات. لا تتجاوز تعارضات Git باستخدام force push.

## معالجة المشاكل الشائعة

| المشكلة | ما الذي تراجعه؟ |
| --- | --- |
| `git` غير معروف | تثبيت Git for Windows ثم فتح PowerShell من جديد |
| خطأ 403 أثناء الرفع | الحساب المستخدم وصلاحية الكتابة في المستودع |
| رابط الموقع يعطي 404 | وجود `index.html` في جذر `main` وإعداد Pages على `main / (root)` ونجاح عملية النشر |
| الصفحة تعرض نسخة قديمة | اكتمال النشر ثم تحديث المتصفح بـ `Ctrl + F5` |
| صورة المشاركة لم تتغير | اكتمال نشر `assets/social-card.png`؛ بعض تطبيقات المشاركة تحتفظ بمعاينة قديمة مؤقتًا |
| المجسم لا يعمل | استخدام متصفح حديث يدعم WebGL وتسريع الرسوميات |

## حدود العرض

هذه الحزمة تُجهّز النموذج الحالي للعرض والنشر. لا تمثل اعتمادًا أو مراجعة هندسية لأبعاد المجسم أو مطابقته للمخطط الأصلي. تصدير OBJ الحالي يصدر الهندسة فقط، من دون ملفات خامات MTL.

## المراجع

- [إعداد مصدر النشر على GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [إنشاء موقع GitHub Pages ومكان index.html](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [مدة ظهور التحديثات](https://docs.github.com/en/pages/quickstart)
