/**
 * Web服务器 - 白屏检测管理面板
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { fetchUrls } = require('./sentry-source');
const { checkUrls } = require('./checker');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'results.json');

// 检测状态
let checkingStatus = {
  isRunning: false,
  progress: 0,
  total: 0,
  current: '',
  startTime: null,
};

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 读取结果
function readResults() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

// 保存结果
function saveResults(results) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(results, null, 2));
}

// API: 获取结果列表
app.get('/api/results', (req, res) => {
  const results = readResults();
  res.json(results);
});

// API: 获取检测状态
app.get('/api/status', (req, res) => {
  res.json(checkingStatus);
});

// API: 触发检测
app.post('/api/check', async (req, res) => {
  if (checkingStatus.isRunning) {
    return res.status(400).json({ error: '检测正在进行中' });
  }

  res.json({ message: '检测已启动' });

  // 异步执行检测
  runCheck();
});

// 执行检测
async function runCheck() {
  checkingStatus = {
    isRunning: true,
    progress: 0,
    total: 0,
    current: '正在获取URL...',
    startTime: new Date().toISOString(),
  };

  try {
    // 获取URL
    const urls = await fetchUrls();
    checkingStatus.total = urls.length;

    if (urls.length === 0) {
      checkingStatus.current = '没有找到白屏错误';
      checkingStatus.isRunning = false;
      return;
    }

    // 逐个检测
    const results = [];
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    for (let i = 0; i < urls.length; i++) {
      checkingStatus.progress = i + 1;
      checkingStatus.current = urls[i];

      try {
        await page.goto(urls[i], { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        const result = await page.evaluate(() => {
          const divs = document.body.querySelectorAll('div');
          let visible = 0;
          for (let d of divs) if (d.clientHeight > 0) visible++;
          return { divCount: divs.length, visibleCount: visible };
        });

        results.push({
          url: urls[i],
          isWhiteScreen: result.visibleCount === 0,
          divCount: result.divCount,
          visibleCount: result.visibleCount,
          error: null,
        });
      } catch (e) {
        results.push({
          url: urls[i],
          isWhiteScreen: true,
          error: e.message,
        });
      }
    }

    await browser.close();

    // 保存结果
    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      total: results.length,
      whiteScreenCount: results.filter(r => r.isWhiteScreen).length,
      results,
    };

    const allResults = readResults();
    allResults.unshift(record);
    saveResults(allResults.slice(0, 50)); // 只保留最近50条

  } catch (e) {
    console.error('检测出错:', e);
    checkingStatus.current = `错误: ${e.message}`;
  } finally {
    checkingStatus.isRunning = false;
  }
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
