# 白屏检测工具

批量检测网页是否白屏的自动化工具。

## 白屏判定逻辑

通过检查页面中的 `div` 元素是否有可见内容来判断：
- 如果页面中没有 `div` 元素 → 白屏
- 如果所有 `div` 的 `clientHeight` 都为 0 → 白屏
- 只要有一个 `div` 的 `clientHeight > 0` → 正常

## 安装

```bash
npm install
```

## 使用方法

### 1. 配置URL列表

编辑 `urls.txt` 文件，每行一个URL：

```
https://example1.com
https://example2.com/page
# 这是注释，会被忽略
```

### 2. 运行检测

```bash
# 基本用法
npm run check

# 输出JSON格式结果
npm run check:json

# 自定义参数
node index.js --timeout=60000 --wait=5000
```

### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--format=json` | 输出JSON格式到文件 | console |
| `--timeout=30000` | 页面加载超时(ms) | 30000 |
| `--wait=3000` | 加载后等待时间(ms) | 3000 |

## 输出示例

```
========== 白屏检测结果 ==========

总计检测: 3 个链接
正常页面: 2 个
白屏页面: 1 个

---------- 详细结果 ----------

1. ✅ 正常
   URL: https://example.com
   DIV总数: 45, 可见DIV: 32

2. ⚪ 白屏
   URL: https://broken-page.com
   DIV总数: 0, 可见DIV: 0
```
