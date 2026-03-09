const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// 浏览器实例（建议复用，避免每次启动）
let browser;
(async () => {
  browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  console.log('Browser launched');
})();

app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing url');

  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    // 监听响应（如果需要 API 数据）
    let responseData = null;
    page.on('response', async (response) => {
      if (response.url() === targetUrl && response.ok()) {
        responseData = await response.text();
      }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForTimeout(5000); // 等待验证完成

    if (!responseData) {
      responseData = await page.content();
    }

    res.send(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Proxy error');
  } finally {
    if (page) await page.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
