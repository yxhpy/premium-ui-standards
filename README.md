# premium-ui-standards

一个 Claude Code skill：大厂级 UI/UX 质感规范。写界面、审界面、给 AI 写界面提示词时，用它来守住工艺细节，包括层次、字体、间距、圆角、阴影、动效、状态、无障碍，以及 AI 对话界面的专项标准。

它管的是「质量底线」，不管「长什么样」，可以和任何品牌风格或设计 skill 搭配使用。

## 内容

| 文件 | 内容 |
|---|---|
| `SKILL.md` | 使用方式 + 十条速览 |
| `references/foundations.md` | 颜色层次、文字对比度、字体、间距、圆角、阴影、状态 |
| `references/motion.md` | 时长、缓动、按性格选弹簧参数、常用模式、降级 |
| `references/ai-chat.md` | 流式输出、思考折叠、输入框（含中文输入法）、复制反馈、自动滚动 |
| `references/checklist.md` | 可逐条打勾的审查清单（A~G 七组） |
| `assets/tokens.css` | 起步 token：只改 `--hue` 就能换出整套带品牌色调的灰阶，对比度已经验算 |

## 安装

```bash
git clone https://github.com/yxhpy/premium-ui-standards ~/.claude/skills/premium-ui-standards
```

## 来源

- 抖音 @Ludi《扒了大厂AI客户端源码，质感全靠这5招！》中的五个细节：微明度分层、暗色字重减细、流式晕染、等宽数字与网格展开、动效分性格
- Vercel Streamdown 的流式渲染实现
- MDN browser-compat-data（2026-11）中的浏览器支持数据
- WCAG 2 对比度要求

视频里的具体数值（比如「粗 10%~15%」）找不到出处的，都已标注为经验值。
