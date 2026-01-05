/**
 * 独立脚本 - 从本地文件获取 URL 并检测
 */
const path = require('path');
const { fetchUrls } = require('../src/sources/file');
const { checkUrls, printSummary } = require('../src/lib/checker');

async function main() {
  const urlsFile = process.argv[2] || path.resolve(__dirname, '../urls.txt');
  const concurrency = parseInt(process.argv[3]) || 5;

  console.log(`使用 ${concurrency} 个并发\n`);

  const urls = fetchUrls(urlsFile);

  const results = await checkUrls(urls, {
    concurrency,
    onProgress: (progress, total, url) => {
      console.log(`[${progress}/${total}] ${url}`);
    }
  });

  printSummary(results);
}

main().catch(console.error);
