# AI 产品灵感库 - 设置指南

## 概述

AI 产品灵感库是一个多平台数据聚合系统，收集来自 Product Hunt、Twitter、Reddit 的产品信息，使用 Claude API 进行深度分析，然后通过前端 Dashboard 展示。

## API 密钥配置

本功能需要以下 API 密钥：

### 1. Product Hunt API

**费用:** 免费

**步骤:**
1. 访问 https://api.producthunt.com/v2/oauth/applications
2. 创建新应用
3. 获取 Developer Token
4. 在 GitHub repo Settings > Secrets 添加 `PRODUCTHUNT_API_KEY`

### 2. Twitter API v2

**费用:** $100/月（Basic 层级）

**步骤:**
1. 访问 https://developer.twitter.com/en/portal/dashboard
2. 创建项目并申请 Basic 层级
3. 获取 Bearer Token
4. 在 GitHub repo Settings > Secrets 添加 `TWITTER_API_KEY`

**注意:** Twitter API 有 API 调用限制。免费层级有严格的 rate limits，Basic 层级支持更多调用。

### 3. Reddit API

**费用:** 免费

**步骤:**
本实现使用 Reddit 的公开 JSON endpoint（`https://www.reddit.com/r/*/new.json`），无需 API 密钥。

### 4. Claude API (Anthropic)

**费用:** 约 $5-10/月（基于使用量）

**步骤:**
1. 访问 https://console.anthropic.com/
2. 创建 API key
3. 在 GitHub repo Settings > Secrets 添加 `CLAUDE_API_KEY`

**使用量:** 每次更新约分析 50-100 个产品，每个 Claude API 调用成本约 $0.01-0.05

## 本地开发测试

### 安装依赖

```bash
pip install -r requirements.txt
```

### 设置环境变量

创建 `.env` 文件：

```bash
# .env
PRODUCTHUNT_API_KEY=your_producthunt_key
TWITTER_API_KEY=your_twitter_key
CLAUDE_API_KEY=your_claude_key
```

或在终端设置：

```bash
export PRODUCTHUNT_API_KEY="your_key"
export TWITTER_API_KEY="your_key"
export CLAUDE_API_KEY="your_key"
```

### 运行更新脚本

```bash
# 运行产品数据更新和 AI 分析
python3 scripts/update_inspiration.py

# 输出示例：
# [2026-04-01 14:35:56.998482] Starting AI inspiration library update...
# Fetching Product Hunt data...
#   Found 0 products from Product Hunt
# Fetching Twitter data...
#   Found 0 products from Twitter
# Fetching Reddit data...
#   Found 117 products from Reddit
# Generating AI analysis...
#   Analyzing 1/87: ...
```

### 打开前端 Dashboard

```bash
# 本地开发服务器
npm run dev

# 或直接打开 HTML 文件
open index.html
```

## 文件结构

```
myoffer/
├── scripts/
│   ├── update_inspiration.py       # 主更新脚本
│   ├── product_hunt_client.py      # Product Hunt 数据获取
│   ├── twitter_client.py           # Twitter 数据获取
│   ├── reddit_client.py            # Reddit 数据获取
│   ├── claude_analyzer.py          # Claude AI 分析
│   ├── scoring_algorithm.py        # 评分算法
│   └── utils.py                    # 工具函数
├── tests/
│   ├── test_scoring_algorithm.py   # 评分算法单元测试
│   ├── test_claude_analyzer.py     # Claude 分析单元测试
│   ├── test_product_hunt.py        # Product Hunt 客户端测试
│   ├── test_utils.py               # 工具函数测试
│   └── fixtures.py                 # 测试数据
├── src/
│   ├── components/                 # React 组件
│   ├── hooks/                      # React hooks
│   └── types/                      # TypeScript 类型
├── inspiration-data.json           # 产品和分析结果缓存
├── inspiration-history.json        # 历史记录（防重复）
├── index.html                      # 前端 Dashboard
├── requirements.txt                # Python 依赖
└── .github/workflows/
    └── update-inspiration.yml      # GitHub Actions 自动更新
```

## 运行单元测试

```bash
# 运行所有测试
python3 -m pytest tests/ -v

# 运行特定测试文件
python3 -m pytest tests/test_scoring_algorithm.py -v

# 运行测试并显示覆盖率
python3 -m pytest tests/ --cov=scripts --cov-report=html
```

## GitHub Actions 自动化

项目包含 GitHub Actions 工作流，每天早上 8 点自动运行更新：

```yaml
# .github/workflows/update-inspiration.yml
name: Update AI Inspiration Library
on:
  schedule:
    - cron: '0 8 * * *'  # 每天 UTC 8:00 运行

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run update script
        env:
          PRODUCTHUNT_API_KEY: ${{ secrets.PRODUCTHUNT_API_KEY }}
          TWITTER_API_KEY: ${{ secrets.TWITTER_API_KEY }}
          CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        run: python3 scripts/update_inspiration.py
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A
          git commit -m "chore: auto-update inspiration data" || true
          git push
```

## 成本预估

| 服务 | 费用/月 | 说明 |
|------|---------|------|
| Product Hunt API | 免费 | 免费开发者 API |
| Twitter API Basic | $100 | 基础层级需付费 |
| Reddit API | 免费 | 使用公开 JSON endpoint |
| Claude API | $5-10 | 按使用量计费，建议设置 rate limit |
| **总计** | **$105-110** | 每月成本 |

## 故障排除

### 脚本无法找到依赖

```bash
# 重新安装依赖
pip install -r requirements.txt --force-reinstall
```

### 环境变量未被识别

```bash
# 验证 .env 文件存在
cat .env

# 或设置环境变量
export PRODUCTHUNT_API_KEY="key"
echo $PRODUCTHUNT_API_KEY
```

### Claude API 密钥无效

```bash
# 验证 API 密钥格式
# Claude API keys 通常以 sk- 开头
echo $CLAUDE_API_KEY | head -c 3
```

### 测试失败

```bash
# 查看详细错误
python3 -m pytest tests/ -v -s

# 查看特定测试的详细信息
python3 -m pytest tests/test_scoring_algorithm.py::test_score_product -vv
```

## 开发工作流

1. **新增功能:** 在 `scripts/` 中新增 Python 文件，在 `tests/` 中添加对应测试
2. **修改 API 客户端:** 更新 `*_client.py` 文件，确保单元测试通过
3. **前端更新:** 在 `src/` 中修改组件，运行 `npm run dev` 本地测试
4. **自动化更新:** 修改 GitHub Actions 工作流文件

## 相关链接

- 项目代码: https://github.com/saina_sidike/myoffer
- Claude API 文档: https://docs.anthropic.com/
- Twitter API 文档: https://developer.twitter.com/en/docs
- Product Hunt API: https://api.producthunt.com/v2/docs
- Reddit 文档: https://www.reddit.com/dev/api
