/**
 * 白屏检测核心模块
 * 接收 URL 数组，返回检测结果
 */
const puppeteer = require('puppeteer');

const DEFAULT_CONFIG = {
  timeout: 30000,
  waitAfterLoad: 3000,
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
      error: null 
    };
  } catch (e) {
    return { url, isWhiteScreen: true, divCount: 0, visibleCount: 0, error: e.message };
  }
}

/**
 * 批量检测 URL 列表
 * @param {string[]} urls - URL 数组
 * @param {object} config - 配置项
 * @returns {Promise<object[]>} - 检测结果数组
 */
async function checkUrls(urls, config = {}) {
  if (!urls || urls.length === 0) {
    console.log('没有 URL 需要检测');
    return [];
  }

  console.log(`\n共 ${urls.length} 个 URL 待检测:\n`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] 检测: ${url}`);
    
    const result = await checkSingleUrl(page, url, config);
    results.push(result);
    
    const status = result.error 
      ? `❌ 错误: ${result.error}` 
      : (result.isWhiteScreen ? '⚪ 白屏' : '✅ 正常');
    console.log(`         ${status}\n`);
  }

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
