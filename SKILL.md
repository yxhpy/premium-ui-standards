---
name: premium-ui-standards
description: 大厂级 UI/UX 规范：视觉质感（层次、字体、间距、圆角、阴影、动效）、交互模式（反馈、加载、保存、表单、空状态、错误降级、渐进披露）、文案与数据格式、布局与响应式、无障碍（WCAG 2.2 AA），性能观感、复杂组件、token 工程，以及 AI 对话高级场景专项；并含一份从需求判断该用什么界面与交互的标准流程（SOP）、整页一致性与像素级验收（全局合同加普查脚本）和落地页专题。在新建或修改前端界面、给界面「提质感」、审查 UI 代码或截图、为 AI 写界面提示词时使用。它管的是质量底线和工艺细节，不替代品牌或视觉风格的决策。
---

# 大厂 UI/UX 规范

界面「廉价」，通常不是风格选错了，而是很多细节同时没做到位：到处画线分区、字在暗色下发胖、数字一跳整行就晃、加载一闪而过、错误提示 3 秒就消失、拖拽不能用键盘完成。这份规范把 Ant Design、GitHub Primer、WCAG 2.2，以及大厂 AI 客户端源码里的做法，整理成可以检查的标准。

## 怎么用

- **先判断再动手**：新建或修改界面前，先按 [需求判断 SOP](references/sop.md) 确认事实、判定需求类型、逐项选定交互，写出方案单给用户看，再实现。一句话需求也走一遍，每步一行即可。
- **先全局后局部**：动手前按 [整页一致性](references/coherence.md) 写全局合同（对齐线、区块节奏、字号角色、圆角与控件档位），区块只引用合同里的值；交付前在真实浏览器里跑 [普查脚本](assets/page-census.js)。局部合格但整页不一致，不算完成。
- **新建界面**：先明确 Web 任务、品牌方向与目标浏览器；走完 SOP 后读 [基础](references/foundations.md)、[布局](references/layout.md)、[token 工程](references/token-engineering.md)，再以 [token](assets/tokens.css) 起步，按功能加载下表；交付前必须过 [checklist](references/checklist.md)。
- **修改界面**：先读现有组件与 token，按 SOP 判断改动涉及的交互，加载 [token 工程](references/token-engineering.md) 和改动主题对应参考；保留现有品牌及交互合同，补齐相关状态；最后必须过完整 checklist，注明不适用项。
- **审查界面**：先读 [checklist](references/checklist.md) 与对应主题参考，再检查代码、截图或真实交互；按条目给出是/否、文件:行号（截图给位置）、证据与建议。未测行为明确写未核实，不从截图推断通过；最后复核完整 checklist。
- **写提示词**：引用入口与相关参考路径，写明采用的默认值、例外和验收方式；让实现助手读取细节，勿只粘贴口号。

| 参考文件 | 何时加载 |
|---|---|
| [sop.md](references/sop.md) | 接到需求时最先读：需求类型到页面骨架、交互判断表、状态矩阵与方案单 |
| [coherence.md](references/coherence.md) | 新建或大改界面必读：全局合同、层级落差、像素级规则、整页普查与评审 |
| [landing.md](references/landing.md) | 落地页、发布页、品牌叙事页：骨架、首屏、素材合同、展示型动效与验收 |
| [foundations.md](references/foundations.md) | 颜色层次、排版、形状、视觉状态 |
| [layout.md](references/layout.md) | 栅格、响应式、极端内容、滚动与历史 |
| [motion.md](references/motion.md) | 弹簧性格、缓动、可中断运动与降级 |
| [patterns.md](references/patterns.md) | 反馈选择、保存与表单；异步实现转到下项 |
| [async-feedback.md](references/async-feedback.md) | 延迟加载、按钮忙碌、乐观回滚、通知与取消的实现骨架 |
| [content.md](references/content.md) | 文案、数字日期与脱敏 |
| [accessibility.md](references/accessibility.md) | 键盘、焦点、复合控件、读屏与偏好 |
| [performance.md](references/performance.md) | 首屏资源、骨架占位、字体度量和长内容的代码与测量 |
| [complex-components.md](references/complex-components.md) | 排序/固定列、三态选择与批量结果骨架 |
| [complex-workflows.md](references/complex-workflows.md) | 上传状态和命令面板结构 |
| [token-engineering.md](references/token-engineering.md) | 三层 CSS、交换格式、rem、首帧主题与层级合同 |
| [ai-chat.md](references/ai-chat.md) | 流式、引用附件、分支、长会话及工具恢复 |
| [checklist.md](references/checklist.md) | 所有任务的最终是/否验收 |
| [sources.md](references/sources.md) | 按主题追溯公开出处与来源边界 |

[AI 客户端示例](examples/ai-client.html) 是独立内嵌 token 的演示快照，非实时 API；需要具体写法时查阅。其品牌取值与起步 token 可不同，不直接批量替换。

## 十条速览

1. **层次靠明度，不靠线。** 相邻层的背景只差一小步明度；默认用间距分区，必要边界按基础规范处理。
2. **焦点永远可见，键盘能走完全流程。** 焦点环对比度 ≥ 3:1，不能被吸顶元素挡住；拖拽须键盘可用，并提供点击 / 轻触的非拖动替代。
3. **对比度达标，不只靠颜色。** 正文 ≥ 4.5:1，控件和图标 ≥ 3:1；状态同时用颜色和图标表达。
4. **暗色字重默认降一档，数字等宽。** 非可变字体或可变字体减细后笔画难辨时，可保留原字重并记录可读性证据。会跳动的数字一律用 `tabular-nums`。
5. **反馈的打扰程度和重要性匹配。** 简单操作不额外提示，成功用轻提示，重要失败不能只用 3 秒的 Toast，危险操作优先做成可撤销。
6. **等待要有交代。** 默认 300ms 内不显示加载指示，但立即回应按下，超过 2 秒加说明文字，再长给进度和取消；骨架屏的形状接近真实内容。
7. **不丢用户的输入。** 失败时保留输入内容，离开前提醒未保存的修改；同一个表单不混用自动保存和手动保存。
8. **文案以用户为主体，按钮写动词。** 错误要说清哪里错了、怎么改；数据格式统一。
9. **高度和位置变化要平滑、不跳动。** 折叠展开用网格 `0fr ↔ 1fr`，同步折叠内容的 inert、隐藏和焦点状态，加 `scrollbar-gutter: stable`，图片标注尺寸。
10. **动效分性格，并且可以关闭。** 直接操作用咬合型弹簧，反馈类动作带轻微回弹；所有非必要动画都要有 `prefers-reduced-motion` 降级。

## 覆盖范围

**覆盖**：Web 端（含移动端 Web）产品界面，包括中后台、工具、内容站和 AI 客户端。

**不覆盖**（需要时另找专门规范）：
- iOS / Android 原生控件和平台交互：分别以 Apple HIG、Material 3 为准
- 数据可视化的图表选型与配色：可以用 `dataviz` 类 skill
- 品牌、插画和营销的视觉风格决策（落地页的页面逻辑、素材合同与验收已覆盖，见 landing.md）
- 游戏和沉浸式 3D
- 各行业的合规文案（金融、医疗等）
- 完整的国际化（RTL 布局、多语言排版）：这里只提了 `Intl` 格式化

## 边界

- 这份规范给的是方法和默认值。具体色值、圆角大小、品牌动效，以品牌规范或用户要求为准。
- 规则之间有冲突时，优先级为：无障碍 > 可用性 > 一致性 > 质感。
- 参考中的浏览器版本为既有快照。按项目目标浏览器验证较新特性，并提供回退方案；不将快照当作当前全平台承诺。
