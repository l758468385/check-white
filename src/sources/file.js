/**
 * 本地文件数据源模块
 */
const fs = require('fs');
const path = require('path');

/**
 * 从本地文件读取 URL 列表
 */
function fetchUrls(filePath = './urls.txt') {
  const absolutePath = path.resolve(filePath);
  
  if (!fs.existsSync(absolutePath)) {
    console.error(`文件不存在: ${absolutePath}`);
    return [];
  }

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const urls = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  console.log(`从 ${filePath} 读取到 ${urls.length} 个 URL\n`);
  return urls;
}

module.exports = { fetchUrls };
