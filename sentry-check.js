/**
 * 主入口 - 从 Sentry 获取 URL 并检测
 */
const { fetchUrls } = require('./sentry-source');
const { checkUrls, printSummary } = require('./checker');

async function main() {
  const urls = await fetchUrls();
  const results = await checkUrls(urls);
  printSummary(results);
}

main().catch(console.error);
