# 产品成本核算工具 · 官网

导入 STEP，把一件货的钱拆成 14 行算出厂价。甲方内部核价的 Windows 桌面工具。

- 官网：https://drgonw1021-lgtm.github.io/product-cost-calculator/
- 免费网页版（只算塑料件材料费，免安装）：https://drgonw1021-lgtm.github.io/product-cost-calculator/web/
- 桌面版下载（30 天试用）：见 Releases

## 结构

| 路径 | 说明 |
|---|---|
| `index.html` `styles.css` `app.js` | 落地页（`app.js` 依赖 `vendor/` 里的 GSAP / ScrollTrigger / Lenis） |
| `i18n.js` | 中英双语词表，用中文原文当 key；切换记在 `localStorage.pc_lang`，也支持 `?lang=en` |
| `assets/` `assets/en/` | 软件截图中英两套 |
| `web/` | 免费网页版（OCCT WASM，全部本地计算，不上传模型） |
| `vendor/` | 滚动动效库（GSAP / ScrollTrigger / Lenis） |

## 部署

推 `main` 即自动发布（GitHub Pages，legacy 构建，源 = `main` 根目录）。
桌面版 zip 不进仓库，放在 Release 里，页面用 `releases/latest/download/...` 直链。

## 许可

`web/vendor/` 里的 occt-import-js 为 LGPL-2.1，随附 `license.occt-import-js.txt` 与 `license.occt.txt`。
