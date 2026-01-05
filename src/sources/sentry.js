/**
 * Sentry 数据源模块
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const SENTRY_CONFIG = {
  token: process.env.SENTRY_TOKEN,
  org: process.env.SENTRY_ORG || 'ne-gp',
  projectId: process.env.SENTRY_PROJECT_ID || '4507523980656640',
  issueTitle: 'White Screen Detected',
};

/**
 * 从 Sentry 获取白屏错误的 URL 列表
 */
async function fetchUrls() {
  if (!SENTRY_CONFIG.token) {
    throw new Error('缺少 SENTRY_TOKEN 环境变量');
  }

  console.log('正在从 Sentry 获取白屏错误...\n');

  const issuesUrl = `https://sentry.io/api/0/projects/${SENTRY_CONFIG.org}/${SENTRY_CONFIG.projectId}/issues/?query=is:unresolved%20${encodeURIComponent(SENTRY_CONFIG.issueTitle)}%20environment:production&statsPeriod=24h`;
  
  const issuesRes = await fetch(issuesUrl, {
    headers: { 'Authorization': `Bearer ${SENTRY_CONFIG.token}` }
  });

  if (!issuesRes.ok) {
    const errorText = await issuesRes.text();
    console.error('API 错误:', errorText);
    throw new Error(`获取 issues 失败: ${issuesRes.status}`);
  }

  const issues = await issuesRes.json();
  console.log(`找到 ${issues.length} 个白屏 issue\n`);

  const urls = new Set();
  
  for (const issue of issues) {
    const eventsUrl = `https://sentry.io/api/0/issues/${issue.id}/events/?full=true`;
    const eventsRes = await fetch(eventsUrl, {
      headers: { 'Authorization': `Bearer ${SENTRY_CONFIG.token}` }
    });
    
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      for (const event of events) {
        const url = event.request?.url || 
                    event.tags?.find(t => t.key === 'url')?.value;
        if (url) urls.add(url);
      }
    }
  }

  return [...urls];
}

module.exports = { fetchUrls, SENTRY_CONFIG };
