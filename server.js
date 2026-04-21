const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/update-config', (req, res) => {
    const { name, price, image, productUrl, btnColor } = req.body;

    const finalConfig = {
        name,
        price,
        image,
        url: productUrl,
        btnColor: btnColor || '#c5a059',
        currency: 'ر.س',
        pid: Date.now() // معرف وهمي
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
