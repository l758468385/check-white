/**
 * 独立脚本 - 从 Sentry 获取 URL 并检测
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { fetchUrls } = require('../src/sources/sentry');
const { checkUrls, printSummary } = require('../src/lib/checker');

async function main() {
  const concurrency = parseInt(process.argv[2]) || 5;
  console.log(`使用 ${concurrency} 个并发\n`);

  const urls = await fetchUrls();
  console.log(`共 ${urls.length} 个 URL 待检测\n`);

  const results = await checkUrls(urls, {
    concurrency,
    onProgress: (progress, total, url) => {
      console.log(`[${progress}/${total}] ${url}`);
    }
  });

  printSummary(results);
}

main().catch(console.error);
