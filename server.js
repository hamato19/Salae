const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/update-config', async (req, res) => {
    const { productUrl, mainColor, btnColor } = req.body;

    if (!productUrl) return res.status(400).send({ error: 'يرجى تزويد رابط المنتج' });

    try {
        // تحديث الهيدرز لتبدو كأنها قادمة من متصفح كروم حقيقي تماماً
        const response = await axios.get(productUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://salla.sa/'
            },
            timeout: 10000 // مهلة 10 ثوانٍ
        });

        const html = response.data;
        // البحث عن ID المنتج في الكود المصدري
        const idMatch = html.match(/"product_id":(\d+)/) || html.match(/id="product_id" value="(\d+)"/) || html.match(/data-id="(\d+)"/);
        
        if (!idMatch) {
            return res.status(400).send({ error: 'لم نتمكن من استخراج بيانات المنتج، تأكد أن الرابط لمنتج عام' });
        }

        const productId = idMatch[1];
        
        // جلب البيانات من الـ API العام لسلة
        const sallaRes = await axios.get(`https://salla.sa/api/v1/product/${productId}/details`);
        const productData = sallaRes.data.data;

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

        fs.writeFileSync(path.join(__dirname, 'public', 'config.json'), JSON.stringify(finalConfig, null, 2));
        res.send({ status: 'success', data: finalConfig });

    } catch (error) {
        console.error("Fetch Error:", error.message);
        res.status(500).send({ error: 'سلة تمنع السيرفر من الوصول. جرب رابطاً آخر أو انتظر قليلاً.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
