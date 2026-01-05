/**
 * 白屏检测核心模块
 * 接收 URL 数组，返回检测结果
 */
const puppeteer = require('puppeteer');

const DEFAULT_CONFIG = {
  timeout: 30000,
  waitAfterLoad: 2000,
};

/**
 * 检测单个 URL 是否白屏
 */
async function checkSingleUrl(page, url, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: cfg.timeout });
    await new Promise(r => setTimeout(r, cfg.waitAfterLoad));
    
    const result = await page.evaluate(() => {
      const divs = document.body.querySelectorAll('div');
      let visible = 0;
      for (let d of divs) if (d.clientHeight > 0) visible++;
      return { divCount: divs.length, visibleCount: visible };
    });

    return {
      url,
      isWhiteScreen: result.visibleCount === 0,
      divCount: result.divCount,
      visibleCount: result.visibleCount,
      error: null,
    };
  } catch (e) {
    return { url, isWhiteScreen: true, divCount: 0, visibleCount: 0, error: e.message };
  }
}

/**
 * 批量检测 URL 列表（并行）
 */
async function checkUrls(urls, options = {}) {
  const { concurrency = 5, onProgress, shouldStopRef } = options;

  if (!urls || urls.length === 0) {
    return [];
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pages = [];
  for (let i = 0; i < concurrency; i++) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    pages.push(page);
  }

  const results = [];
  let currentIndex = 0;

  async function processNext(page) {
    while (currentIndex < urls.length) {
      // 检查是否需要中断
      if (shouldStopRef && shouldStopRef.value) {
        break;
      }

      const idx = currentIndex++;
      const url = urls[idx];

      const result = await checkSingleUrl(page, url);
      results.push(result);

      if (onProgress) {
        onProgress(results.length, urls.length, url);
      }
    }
  }

  await Promise.all(pages.map(page => processNext(page)));
  await browser.close();

  return results;
}

/**
 * 打印检测结果摘要
 */
function printSummary(results) {
  console.log('\n========== 检测结果 ==========\n');

  const whiteScreens = results.filter(r => r.isWhiteScreen);
  const errors = results.filter(r => r.error);
  const normal = results.filter(r => !r.isWhiteScreen && !r.error);

  console.log(`总计: ${results.length} | 正常: ${normal.length} | 白屏: ${whiteScreens.length} | 错误: ${errors.length}\n`);

  if (whiteScreens.length > 0) {
    console.log('白屏 URL:');
    whiteScreens.forEach(r => console.log(`  - ${r.url}${r.error ? ` (${r.error})` : ''}`));
  }
}

module.exports = { checkUrls, checkSingleUrl, printSummary };
