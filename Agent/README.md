# Agent Daily Brief

一个部署在 `zhoutianwen.com/Agent` 的轻量情报站，聚合三类内容：

- NBA 最新新闻
- 未来 5 天天气预报
- 最新 AI 论文进展

## 本地预览

```bash
npm run serve
```

然后打开 `http://localhost:4173`。

## 生成数据

```bash
npm run generate:data
```

默认配置：

- 天气位置：上海
- NBA 新闻源：ESPN NBA RSS
- AI 论文源：arXiv API

也可以通过环境变量覆盖：

```bash
WEATHER_LABEL=Los Angeles
WEATHER_LATITUDE=34.0522
WEATHER_LONGITUDE=-118.2437
NBA_RSS_URL=https://www.espn.com/espn/rss/nba/news
ARXIV_QUERY=cat:cs.AI+OR+cat:cs.LG
```

## 挂到现有站点的 `/Agent`

这个项目是纯静态站点，最适合挂在你现有网站的子目录里。

### 方案 A：直接放到站点目录

如果你的站点目录类似这样：

```text
/var/www/zhoutianwen.com/
  index.html
  css/
  js/
```

那就把当前项目整个放进：

```text
/var/www/zhoutianwen.com/Agent/
```

最终保证这些文件存在：

- `/var/www/zhoutianwen.com/Agent/index.html`
- `/var/www/zhoutianwen.com/Agent/app.js`
- `/var/www/zhoutianwen.com/Agent/styles.css`
- `/var/www/zhoutianwen.com/Agent/data/daily-brief.json`

因为页面里使用的是相对路径，所以只要目录叫 `Agent`，就可以直接通过 `https://zhoutianwen.com/Agent/` 访问。

### 方案 B：Nginx 子路径挂载

如果你的网站由 Nginx 托管，可以加一个 `/Agent/` 路由：

```nginx
location /Agent/ {
    alias /var/www/zhoutianwen.com/Agent/;
    index index.html;
    try_files $uri $uri/ /Agent/index.html;
}
```

改完后执行：

```bash
nginx -t
sudo systemctl reload nginx
```

### 方案 C：宝塔面板

如果你现在的网站是宝塔在管：

1. 打开站点 `zhoutianwen.com`
2. 进入网站根目录
3. 新建一个 `Agent` 文件夹
4. 把本项目文件上传进去
5. 访问 `https://zhoutianwen.com/Agent/`

## 每 4 小时自动刷新

仓库里的 GitHub Actions 已经改成每 4 小时执行一次，见 `.github/workflows/update-brief.yml`。

当前 cron 是：

```text
5 */4 * * *
```

表示在每天的 `00:05`、`04:05`、`08:05`、`12:05`、`16:05`、`20:05` UTC 运行。

如果你的站点内容是从 GitHub 自动部署的，这就够了。

如果你的网站是你自己的服务器直接托管，也可以在服务器上加一个定时任务：

```bash
0 */4 * * * cd /path/to/Agent && /usr/bin/node scripts/generate-data.mjs
```

## 网络授权说明

我前面说的“网络授权”，指的是这次 Codex CLI 会话的沙箱限制，不是你的域名权限有问题。

它的含义是：

- 我在当前受限环境里不能直接联网抓 ESPN、Open-Meteo、arXiv
- 所以我能把网站和抓取脚本写好，但不能替你在这个会话里直接把线上数据抓回来
- 只要你在你自己的电脑或服务器上运行 `npm run generate:data`，通常就可以正常联网生成真实数据

如果你还想让我在这个会话里直接帮你拉真实数据，你需要在我发起联网命令时点允许授权。

## 数据来源

- NBA：ESPN NBA RSS
- 天气：Open-Meteo Forecast API
- 论文：arXiv API
