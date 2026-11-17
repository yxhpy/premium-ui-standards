# 外部 AI 设计 skill 引用

来源是 BenjaminUIX 在 2026-11-16 发的清单「10 skills that kill AI slop」：https://x.com/BenjaminUIX/status/2122286309855338953 ，作者建议只装两三个。
这里只做引用索引：不改写、不并入本规范的规则，也不下载或安装。需要时到原仓库读原文；在项目里与本规范冲突时，仍以本规范为准。

核对层级：「原文」指 2026-11-17 打开 SKILL.md 原文核对过；「转述」指只经检索转述，未复核。

## 十个 skill

| # | 名称 | 地址 | 许可 | 核对 | 什么时候去看 |
|---|---|---|---|---|---|
| 1 | Anti UI Slop（UIZZE） | https://github.com/uizze/uizze | Apache-2.0（转述） | 转述 | 想对照真实产品屏幕做界面，或按新建、打磨、审查分流时 |
| 2 | Impeccable（Paul Bakaus） | https://github.com/pbakaus/impeccable | Apache-2.0（转述） | 转述 | 需要一套设计动词（如 quieter 让界面更安静）或无模型的 slop 检测时 |
| 3 | Taste Skill（Leonxlnx） | https://github.com/Leonxlnx/taste-skill | MIT（转述） | 转述 | 落地页按行业选配色、字体与首屏时 |
| 4 | Emil Design Engineering | https://github.com/emilkowalski/skills | MIT（转述） | 转述 | 判断某个动效该不该做、时长与缓动怎么取时 |
| 5 | Vercel Web Design Guidelines | https://github.com/vercel-labs/agent-skills | MIT（转述） | 转述 | 按一百多条界面规则做代码审查时 |
| 6 | Frontend Design（Anthropic） | https://github.com/anthropics/skills/tree/main/skills/frontend-design | 见仓库 LICENSE.txt | 原文 | 需要定视觉方向、避开生成式默认样式时 |
| 7 | Hallmark（Nutlope） | https://github.com/Nutlope/hallmark | MIT（转述） | 原文（SKILL.md） | 从零做营销页，需要底线 lint 与主题发牌时 |
| 8 | Make Interfaces Feel Better（Jakub Krehel） | https://github.com/jakubkrehel/make-interfaces-feel-better | MIT | 原文（SKILL.md、surfaces.md、LICENSE） | 打磨表面、图标与动效细节时，和柔和质感最相关 |
| 9 | UI UX Pro Max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | MIT（转述） | 转述 | 检索风格、色板、字体组合时，含 Neumorphism、Claymorphism |
| 10 | Stageshow（Benji Taylor） | https://github.com/benjitaylor/skills | MIT（转述） | 转述 | 做产品演示图、假界面时 |

## 关于「柔和」

清单里没有专门的 Soft UI skill。和柔和质感最相关的是第 8 个（透明阴影环、同心圆角、克制的动效）和第 9 个的风格条目。
拟物式 Soft UI 的控件边界常达不到 WCAG 1.4.11 的 3:1，采用时按 checklist 的 A、D 组验收。

## 同用提醒

- 不和本规范在同一项目并装自带流程和 lint 的 skill（如 Hallmark、Taste Skill），两套流程会互相打架；清单作者也建议只装两三个。
