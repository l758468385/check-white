/**
 * 主入口 - 从本地文件获取 URL 并检测
 */
const { fetchUrls } = require('./file-source');
const { checkUrls, printSummary } = require('./checker');

async function main() {
  const urls = fetchUrls('./urls.txt');
  const results = await checkUrls(urls);
  printSummary(results);
}

main().catch(console.error);
