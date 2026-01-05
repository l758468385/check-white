/**
 * Web服务器 - 白屏检测管理面板
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');
const { fetchUrls } = require('../sources/sentry');
const { checkUrls } = require('../lib/checker');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, '../../data/results.json');

// 检测状态
let checkingStatus = {
  isRunning: false,
  progress: 0,
  total: 0,
  current: '',
  startTime: null,
  concurrency: 5,
};

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

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

// API: 清空结果列表
app.delete('/api/results', (req, res) => {
  saveResults([]);
  res.json({ message: '历史记录已清空' });
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

  const concurrency = Math.min(Math.max(req.body.concurrency || 5, 1), 50);
  res.json({ message: '检测已启动', concurrency });

  runCheck(concurrency);
});

// 执行检测
async function runCheck(concurrency = 5) {
  checkingStatus = {
    isRunning: true,
    progress: 0,
    total: 0,
    current: '正在获取URL...',
    startTime: new Date().toISOString(),
    concurrency,
  };

  try {
    const urls = await fetchUrls();
    checkingStatus.total = urls.length;

    if (urls.length === 0) {
      checkingStatus.current = '没有找到白屏错误';
      checkingStatus.isRunning = false;
      return;
    }

    checkingStatus.current = `并行检测中 (${concurrency} 个并发)`;

    const results = await checkUrls(urls, {
      concurrency,
      onProgress: (progress, total, url) => {
        checkingStatus.progress = progress;
        checkingStatus.current = `[${progress}/${total}] ${url.substring(0, 60)}...`;
      }
    });

    // 保存结果
    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      total: results.length,
      whiteScreenCount: results.filter(r => r.isWhiteScreen).length,
      concurrency,
      results,
    };

    const allResults = readResults();
    allResults.unshift(record);
    saveResults(allResults.slice(0, 50));

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
