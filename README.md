# premium-ui-standards

供 Claude Code、Codex 等 AI 编码助手实现和审查 Web UI 的质量规范。采用可执行默认值、状态合同与是/否清单；品牌方向由项目决定。适用边界见 [入口](SKILL.md#覆盖范围)，不覆盖原生平台、图表、品牌视觉、完整国际化/RTL。

## 目录与按需阅读

| 文件 | 内容 |
|---|---|
| [SKILL.md](SKILL.md) | 简短入口、三种流程与十条速览 |
| [references/sop.md](references/sop.md) | 需求判断 SOP：需求类型到页面骨架、交互判断表、状态矩阵与方案单 |
| [references/coherence.md](references/coherence.md) | 整页一致性与像素级验收：全局合同、层级落差、像素规则、普查与整页评审 |
| [references/landing.md](references/landing.md) | 落地页专题：骨架、首屏、素材合同、展示型动效、图形性能与验收 |
| [assets/page-census.js](assets/page-census.js) | 整页普查脚本：在真实页面里执行，量出节奏、对齐线、字号、圆角、像素对齐等是否一致 |
| [references/foundations.md](references/foundations.md) | 颜色层次、排版、形状、视觉状态 |
| [references/layout.md](references/layout.md) | 栅格、响应式、极端内容、滚动与历史 |
| [references/motion.md](references/motion.md) | 弹簧性格、缓动、可中断运动与降级 |
| [references/patterns.md](references/patterns.md) | 反馈选择、保存、表单与并发校验 |
| [references/async-feedback.md](references/async-feedback.md) | 加载延迟、乐观回滚、通知与取消的代码骨架 |
| [references/content.md](references/content.md) | 文案、数字日期与脱敏 |
| [references/accessibility.md](references/accessibility.md) | 键盘、焦点、复合控件、读屏与偏好 |
| [references/performance.md](references/performance.md) | 性能预算、首屏、字体及长内容测量 |
| [references/complex-components.md](references/complex-components.md) | 表格、查询、固定列与批量结果 |
| [references/complex-workflows.md](references/complex-workflows.md) | 上传状态与命令面板结构 |
| [references/token-engineering.md](references/token-engineering.md) | 三层 token、单位、主题及层级合同 |
| [references/ai-chat.md](references/ai-chat.md) | 流式、引用附件、分支、长会话及工具恢复 |
| [references/checklist.md](references/checklist.md) | 所有任务的最终是/否验收 |
| [references/sources.md](references/sources.md) | 按主题追溯公开出处与来源边界 |
| [assets/tokens.css](assets/tokens.css) | 基础/语义/组件三层，rem 字号、状态色与层级 |
| [examples/ai-client.html](examples/ai-client.html) | 独立内嵌 token 的既有交互快照，回复为模拟数据 |
| [assets/audit.py](assets/audit.py) | 无依赖静态验收脚本，不替代浏览器验收 |

## Claude Code 中使用

手动将整个 premium-ui-standards 目录放入目标项目的 `.claude/skills/premium-ui-standards/`，保留 SKILL.md、references、assets 的相对结构。启动目标项目会话后明确请求使用 premium-ui-standards；若未发现技能，直接要求读取项目中的 SKILL.md，再按索引加载参考。也可不复制，直接在任务中引用本目录入口的绝对路径。

## Codex 中使用

无需安装即可在任务里明确要求：“先读取 /Users/yxhpy/Desktop/ui拆解/premium-ui-standards/SKILL.md，按对应参考实现，最后过 checklist。”也可将整个目录复制到目标仓库的文档目录，在该项目 AGENTS.md 中写入读取入口、按需加载参考、最后过清单的要求。相对路径以目标项目实际位置为准；这是项目引用方式，不承诺自动技能发现。本次仅提供说明，未执行安装或修改个人配置。

## 来源与默认值

[需求判断 SOP](references/sop.md) 把现有规则按需求重新组织成分流表，属于建议默认，不新增出处，也不计入 128 条；与专题文件冲突时以专题文件为准。

公开出处按 15 个主题集中在 [sources.md](references/sources.md)，研究条目来自既有 research 调研，本轮未联网重新核实；浏览器验收补充单列，不计入 128 条。正文不逐条附来源，区分标准阈值、系统约定和建议默认；不同设计系统数值保留适用语境。

保留既有视频工艺：微明度分层与双环聚焦、暗色字重减细、水墨式流式输出、等宽数字与网格展开、分性格动效。默认值需在实际字体、主题背景和目标设备上验收。示例字号已经用 rem；其品牌色、圆角、字号角色和交互保持原样，未强行与新起步配方同步。

运行 `python3 assets/audit.py` 检查链接、入口、CSS、引用和行数；真实 UI 的键盘、读屏、性能与主题验收按 checklist 执行。
