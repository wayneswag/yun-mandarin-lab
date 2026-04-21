# Yun Mandarin Lab · GitHub Pages 版本

这是一个可以直接部署到 GitHub Pages 的 React + Vite 项目。

## 你要做的事

### 1. 新建 GitHub 仓库
建议仓库名：`yun-mandarin-lab`

### 2. 把这个压缩包里的全部文件上传到仓库根目录
也就是让 `package.json`、`vite.config.js`、`src`、`.github` 都在最外层。

### 3. 打开 GitHub Pages
GitHub 仓库里：
- `Settings`
- `Pages`
- `Build and deployment`
- `Source` 选 `GitHub Actions`

### 4. 等待 Actions 自动部署
上传后，GitHub 会自动跑 workflow。
部署成功后，你会得到一个 Pages 链接。

## 本地试用（可选）
电脑装了 Node.js 之后，在项目目录运行：

```bash
npm install
npm run dev
```

## 现在这版的限制
- 进度只保存在同一设备、同一浏览器
- 没有账号系统
- 没有跨设备同步
- 语音使用浏览器自带 TTS，所以不同设备声音会不一样
