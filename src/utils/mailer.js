/**
 * 邮件发送工具
 * 使用 163 邮箱 SMTP 发送白屏检测报告
 */
const nodemailer = require('nodemailer');

// 创建邮件发送器
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_AUTH_CODE
    }
  });
}

/**
 * 发送白屏检测报告邮件
 * @param {Object} options 邮件选项
 * @param {string} options.to 收件人邮箱
 * @param {Object} options.record 检测记录，包含：
 *   - total: 总检测数
 *   - whiteScreenCount: 白屏数量
 *   - concurrency: 并发数
 *   - timestamp: 检测时间
 *   - results: 详细结果数组
 */
async function sendWhiteScreenReport({ to, record }) {
  const transporter = createTransporter();
  
  const hasWhiteScreen = record.whiteScreenCount > 0;
  const statusEmoji = hasWhiteScreen ? '⚠️' : '✅';
  const statusText = hasWhiteScreen ? '发现白屏' : '全部正常';
  
  // 筛选白屏URL
  const whiteScreenUrls = record.results
    ? record.results.filter(r => r.isWhiteScreen)
    : [];

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h1 style="color: ${hasWhiteScreen ? '#f59e0b' : '#22c55e'};">
        ${statusEmoji} 白屏检测报告 - ${statusText}
      </h1>
      
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>检测时间:</strong> ${new Date(record.timestamp).toLocaleString('zh-CN')}</p>
        <p><strong>检测总数:</strong> ${record.total}</p>
        <p><strong>白屏数量:</strong> <span style="color: ${hasWhiteScreen ? '#ef4444' : '#22c55e'}; font-weight: bold;">${record.whiteScreenCount}</span></p>
        <p><strong>正常数量:</strong> ${record.total - record.whiteScreenCount}</p>
        <p><strong>并发数:</strong> ${record.concurrency}</p>
      </div>

      ${hasWhiteScreen ? `
        <h2 style="color: #ef4444;">🚨 白屏URL列表</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #1e1e1e; color: #fff;">
              <th style="padding: 10px; text-align: left; border: 1px solid #333;">#</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #333;">URL</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #333;">错误信息</th>
            </tr>
          </thead>
          <tbody>
            ${whiteScreenUrls.map((r, i) => `
              <tr style="background: ${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
                <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd; word-break: break-all;">
                  <a href="${r.url}" target="_blank">${r.url}</a>
                </td>
                <td style="padding: 8px; border: 1px solid #ddd; color: #ef4444;">
                  ${r.error || '检测为白屏'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="color: #166534; font-size: 18px; margin: 0;">
            ✅ 所有页面检测正常，未发现白屏问题
          </p>
        </div>
      `}

      <p style="color: #888; font-size: 12px; margin-top: 30px;">
        此邮件由自动化白屏检测系统发送
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"白屏检测系统" <${process.env.MAIL_USER}>`,
    to,
    subject: `${statusEmoji} 白屏检测报告 - ${statusText} (${record.whiteScreenCount}/${record.total})`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendWhiteScreenReport
};
