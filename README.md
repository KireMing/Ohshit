# JsDelivr 访问流程

## 📋 使用步骤

### 1️⃣ 访问
访问以下链接获取文件：
```
https://cdn.jsdelivr.net/gh/KireMing/Ohshit@main/Re_System.JS
```

### 2️⃣ 更新
使用 Purge 端点清除缓存：
```
https://purge.jsdelivr.net/gh/KireMing/Ohshit@main/Re_System.JS
```

### 3️⃣ 刷新缓存
访问第 2 步的链接后，会自动刷新 CDN 缓存，新内容立即生效。

---

## 💡 工作流程

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 访问文件 | 从 CDN 获取最新的 Re_System.JS |
| 2 | 更新缓存 | 请求 Purge 端点清除旧缓存 |
| 3 | 刷新生效 | 重新访问文件获取最新版本 |
