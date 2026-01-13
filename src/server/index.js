/**
 * Web服务器 - 白屏检测管理面板
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');
const { fetchUrls } = require('../sources/sentry');
const { checkUrls } = require('../lib/checker');
const { sendWhiteScreenReport } = require('../utils/mailer');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 33223;
const DATA_FILE = path.join(__dirname, '../../data/results.json');

// 中断标志
let shouldStop = false;

// 定时任务相关
let cronJob = null;
let cronStatus = {
  enabled: false,
  interval: 60, // 默认60分钟
  nextRun: null,
  lastRun: null
};

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

// API: 停止检测
app.post('/api/stop', (req, res) => {
  if (!checkingStatus.isRunning) {
    return res.status(400).json({ error: '没有正在进行的检测' });
  }
  shouldStop = true;
  res.json({ message: '正在停止检测...' });
});

// API: 获取定时任务状态
app.get('/api/cron', (req, res) => {
  res.json(cronStatus);
});

// API: 启动定时任务
app.post('/api/cron/start', (req, res) => {
  const interval = Math.min(Math.max(req.body.interval || 60, 1), 1440); // 1分钟到24小时
  
  // 停止已有的定时任务
  if (cronJob) {
    cronJob.stop();
  }
  
  // 创建新的定时任务
  const cronExpression = `*/${interval} * * * *`; // 每 N 分钟
  cronJob = cron.schedule(cronExpression, () => {
    console.log(`[${new Date().toLocaleString('zh-CN')}] 定时任务触发，开始检测...`);
    cronStatus.lastRun = new Date().toISOString();
    if (!checkingStatus.isRunning) {
      runCheck(5);
    } else {
      console.log('检测正在进行中，跳过本次定时任务');
    }
  });
  
  cronStatus = {
    enabled: true,
    interval,
    nextRun: new Date(Date.now() + interval * 60 * 1000).toISOString(),
    lastRun: cronStatus.lastRun
  };
  
  console.log(`定时任务已启动: 每 ${interval} 分钟执行一次`);
  res.json({ message: `定时任务已启动，每 ${interval} 分钟检测一次`, ...cronStatus });
});

// API: 停止定时任务
app.post('/api/cron/stop', (req, res) => {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
  }
  cronStatus.enabled = false;
  cronStatus.nextRun = null;
  console.log('定时任务已停止');
  res.json({ message: '定时任务已停止', ...cronStatus });
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
  // 重置中断标志
  shouldStop = false;
  
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
      shouldStopRef: { get value() { return shouldStop; } },
      onProgress: (progress, total, url) => {
        checkingStatus.progress = progress;
        checkingStatus.current = `[${progress}/${total}] ${url.substring(0, 60)}...`;
      }
    });

    // 检查是否被中断
    if (shouldStop) {
      checkingStatus.current = '检测已停止';
      checkingStatus.isRunning = false;
      return;
    }

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

    // 发送邮件通知（如果配置了收件人）
    if (process.env.MAIL_TO) {
      checkingStatus.current = '正在发送邮件通知...';
      await sendWhiteScreenReport({
        to: process.env.MAIL_TO,
        record
      });
      console.log('检测报告邮件已发送');
    }

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
