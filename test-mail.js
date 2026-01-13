/**
 * 测试白屏检测邮件发送
 */
require('dotenv').config();
const { sendWhiteScreenReport } = require('./src/utils/mailer');

async function test() {
  console.log('开始测试邮件发送...');
  console.log('发件人:', process.env.MAIL_USER);
  console.log('收件人:', process.env.MAIL_TO);
  
  if (!process.env.MAIL_USER || !process.env.MAIL_AUTH_CODE) {
    console.error('错误: 请先在 .env 文件中配置 MAIL_USER 和 MAIL_AUTH_CODE');
    process.exit(1);
  }
  
  if (!process.env.MAIL_TO) {
    console.error('错误: 请先在 .env 文件中配置 MAIL_TO (收件人邮箱)');
    process.exit(1);
  }

  // 模拟白屏检测结果
  const mockRecord = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    total: 5,
    whiteScreenCount: 2,
    concurrency: 5,
    results: [
      { url: 'https://example.com/page1', isWhiteScreen: false },
      { url: 'https://example.com/page2', isWhiteScreen: true, error: '页面元素为空' },
      { url: 'https://example.com/page3', isWhiteScreen: false },
      { url: 'https://example.com/page4', isWhiteScreen: true, error: 'JS加载失败' },
      { url: 'https://example.com/page5', isWhiteScreen: false },
    ]
  };

  const result = await sendWhiteScreenReport({
    to: process.env.MAIL_TO,
    record: mockRecord
  });

  if (result.success) {
    console.log('✅ 测试邮件发送成功！请检查收件箱。');
  } else {
    console.log('❌ 测试邮件发送失败:', result.error);
  }
}

test();
