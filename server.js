const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();

// إعدادات المجلدات والبيانات
app.use(express.json());
// إخبار السيرفر بأن الملفات الواجهة موجودة في مجلد public
app.use(express.static(path.join(__dirname, 'public')));

/**
 * دالة سحب بيانات منتج سلة من الرابط العام
 * لا تحتاج توكن، تعتمد على بيانات المتجر العامة
 */
app.post('/api/update-config', async (req, res) => {
    const { productUrl, mainColor, btnColor } = req.body;

    if (!productUrl) {
        return res.status(400).send({ error: 'يرجى تزويد رابط المنتج' });
    }

    try {
        // 1. جلب محتوى صفحة المنتج من سلة
        const response = await axios.get(productUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = response.data;

        // 2. استخراج معرف المنتج (Product ID) من الـ HTML باستخدام Regex
        const idMatch = html.match(/"product_id":(\d+)/) || html.match(/id="product_id" value="(\d+)"/);
        
        if (!idMatch) {
            return res.status(400).send({ error: 'لم نتمكن من العثور على بيانات المنتج في هذا الرابط' });
        }

        const productId = idMatch[1];

        // 3. جلب البيانات التفصيلية من API سلة العام لضمان دقة البيانات
        const sallaRes = await axios.get(`https://salla.sa/api/v1/product/${productId}/details`);
        const productData = sallaRes.data.data;

        // 4. تجهيز كائن الإعدادات الجديد
        const finalConfig = {
            pid: productId,
            name: productData.name,
            price: productData.price.amount,
            currency: productData.price.currency,
            image: productData.main_image,
            description: productData.description,
            url: productUrl,
            mainColor: mainColor || '#c5a059',
            btnColor: btnColor || '#c5a059',
            lastUpdate: new Date().toISOString()
        };

        // 5. حفظ البيانات في ملف JSON داخل مجلد public
        // ملاحظة: الاستضافات السحابية قد تمسح الملف عند إعادة التشغيل، 
        // لذا يفضل مستقبلاً ربطها بقاعدة بيانات بسيطة.
        fs.writeFileSync(path.join(__dirname, 'public', 'config.json'), JSON.stringify(finalConfig, null, 2));

        res.send({ status: 'success', data: finalConfig });

    } catch (error) {
        console.error("Error fetching Salla product:", error.message);
        res.status(500).send({ error: 'فشل في سحب بيانات المنتج. تأكد من صحة الرابط.' });
    }
});

/**
 * تشغيل السيرفر
 * ملاحظة: process.env.PORT ضرورية لعمل السيرفر على الاستضافات العالمية
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 السيرفر يعمل بنجاح!`);
    console.log(`📍 الرابط المحلي: http://localhost:${PORT}`);
    console.log(`🛠️ لوحة التحكم: http://localhost:${PORT}/admin.html`);
    console.log(`-------------------------------------------`);
});
