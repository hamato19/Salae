const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/update-config', (req, res) => {
    const { name, price, image, targetUrl, btnColor } = req.body;

    const finalConfig = {
        name: name || "اسم المنتج",
        price: price || "",
        image: image || "", // يقبل أي رابط صورة مباشر
        url: targetUrl || "#", // يقبل واتساب، سلة، زد، أو أي موقع
        btnColor: btnColor || '#c5a059',
        currency: price ? 'ر.س' : '', // تظهر العملة فقط إذا وجد سعر
        pid: Date.now()
    };

    try {
        fs.writeFileSync(path.join(__dirname, 'public', 'config.json'), JSON.stringify(finalConfig, null, 2));
        res.send({ status: 'success' });
    } catch (error) {
        res.status(500).send({ error: 'فشل في حفظ البيانات' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
