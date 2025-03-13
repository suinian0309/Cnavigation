# Cnavigation

一个简约而功能丰富的个人导航起始页

![Cnavigation](https://s2.loli.net/2022/07/15/FE6U2BJCynHDep8.jpg)

## 功能特点

- [x] 简洁美观的界面设计
- [x] 时间及天气显示
- [x] 快捷方式自定义
- [x] 网站背景自定义
- [x] 数据本地持久化存储
- [x] 移动端响应式适配
- [x] 多搜索引擎支持
- [x] 深色/浅色主题切换
- [x] 一言功能
- [ ] 书签管理
- [ ] 备忘录功能

## 技术栈

- [Vue 3](https://cn.vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.cn/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/zh/) - Vue 状态管理库
- [Naive UI](https://www.naiveui.com/) - Vue 3 组件库
- [Sass](https://sass-lang.com/) - CSS 预处理器
- [PWA](https://web.dev/progressive-web-apps/) - 渐进式 Web 应用

## 快速开始

### 安装依赖

```bash
# 安装前端依赖
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 代码质量

```bash
# 代码格式化
npm run format

# 代码校验
npm run lint
```

## 项目配置

项目的环境变量配置在根目录的 `.env` 文件中，你可以根据需要修改以下配置：

```
# 站点信息
VITE_SITE_TITLE=Cnavigation
VITE_SITE_AUTHOR=Your Name
VITE_SITE_KEYWORDS=导航,起始页,简约
VITE_SITE_DES=一个简约的导航起始页
VITE_SITE_LOGO=/favicon.svg
VITE_SITE_APPLE_LOGO=/apple-touch-icon.png

# API 配置
VITE_WEATHER_API=https://api.example.com/weather
VITE_HITOKOTO_API=https://v1.hitokoto.cn
```

## 部署

构建完成后，静态资源会在 **`dist` 目录** 中生成，你可以将这些文件部署到任何静态网站托管服务上：

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

## 浏览器支持

- Chrome
- Firefox
- Safari
- Edge
- 其他现代浏览器

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

本项目基于 [MIT 许可证](LICENSE)。

## 鸣谢

- [iconfont](https://www.iconfont.cn/) - 图标资源
- [Hitokoto](https://hitokoto.cn/) - 一言 API
- 所有开源贡献者

<a title="SSL" target="_blank" href="https://myssl.com/seal/detail?domain=blog.imsyy.top"><img src="https://img.shields.io/badge/MySSL-安全认证-brightgreen"></a>&nbsp;<a title="CDN" target="_blank" href="https://cdnjs.com/"><img src="https://img.shields.io/badge/CDN-Cloudflare-blue"></a>&nbsp;<a title="Copyright" target="_blank" href="https://imsyy.top/"><img src="https://img.shields.io/badge/Copyright%20%C2%A9%202020--2023-%E7%84%A1%E5%90%8D-red"></a>
