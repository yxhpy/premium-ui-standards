# 基础：颜色层次、字体、间距、圆角、阴影

确定 Web 界面的视觉基础或审查质感时读取本文件。先采用现有角色配方，再用实际字体、背景和交互状态验收。

## 1. 颜色层次（Surface）

默认用微明度分层，以语义角色区分背景；必要的边界按第 5 节处理。四层是本项目起点，不是行业上限；不要混淆容器角色数、DOM 嵌套数和 z-index。

| 角色 | 用途 | 暗色（oklch 明度） | 浅色（oklch 明度） |
|---|---|---|---|
| `surface-0` | 页面底 / 应用背景 | 0.17 | 0.965 |
| `surface-1` | 侧栏、次要区域 | 0.205 | 0.98 |
| `surface-2` | 卡片、气泡、输入框 | 0.225 | 1.0 |
| `surface-3` | 卡片里的卡片、悬停态、弹层 | 0.25 | 1.0 + 阴影 |

- 用 `oklch(L C H)` 定义：`H` 取品牌色相，`C` 保持在 0.003~0.008 之间，得到「有温度的中性灰」。只改基础层 `--base-hue` 一个变量，就能让整套灰阶跟随品牌。
- 第一步（0→1）可以比后面几步稍大。作为参考：某大厂客户端暗色用的是 `#0B0B0B → #151515 → #1A1A19 → #20201F`，按 sRGB 通道算约为 3.9% → 2% → 2.4%。
- 浅色模式下层级反过来：页面底最暗，卡片最亮，靠阴影而不是明度往上浮。
- **默认分隔线**（表格、长列表）：用 `color-mix(in oklch, currentColor 8%, transparent)` 的 1px 发丝线，默认避免高对比装饰实线；静态卡片的必要边界见第 8 节。
- 不要用嵌套卡片来表达层级。超过两层嵌套，先考虑用间距和标题分组。

**文字颜色**：至少三档。

| 角色 | 暗色明度 | 浅色明度 | 对比度要求 |
|---|---|---|---|
| `fg` 正文 | 0.93 | 0.22 | ≥ 7:1 |
| `fg-muted` 次要 | 0.72 | 0.45 | ≥ 4.5:1 |
| `fg-subtle` 元信息（仅配对达标时） | 0.60 | 0.56 | 普通小字 ≥ 4.5:1；不要借“非关键”降低文本门槛 |

按基础层 `--base-hue: 80` 的既有计算快照（oklch → sRGB，WCAG 2 对比度）：

| | 浅色 surface-0 / 1 / 2 | 暗色 surface-0 / 1 / 2 / 3 |
|---|---|---|
| 换算色值 | `#F5F3F0` / `#FAF8F5` / `#FFFFFF` | `#100F0D` / `#181715` / `#1D1C1A` / `#23211F` |
| `fg` | 15.6 / 16.3 / 17.3 | 15.6 / 14.6 / 13.9 / 13.0 |
| `fg-muted` | 6.7 / 7.0 / 7.4 | 7.7 / 7.2 / 6.9 / 6.5 |
| `fg-subtle` | 4.2 / 4.4 / 4.7 | 4.8 / 4.5 / 4.3 / 4.1 |
| 焦点环 `--ring` | 3.8 / 3.8 / 3.9 | 5.3 / 5.2 / 5.1 / 4.9 |

此表为既有计算快照。fg-subtle 在浅色 surface-0/1 不足普通小字门槛，改用 fg-muted；占位文字统一按第 7 节。
换了色相或明度以后要重新计算。
`oklch()` 需要 Chrome 111 / Safari 15.4 / Firefox 113 起支持。
`color-mix()` 需要 Chrome 111 / Safari 16.2 / Firefox 113 起支持；兼容更老浏览器时使用上表的十六进制值。

## 2. 字体

- **字体栈**：西文字体在前，中文字体在后，系统字体兜底。例如：`"Inter", "PingFang SC", "Noto Sans SC", system-ui, sans-serif`。代码用 `ui-monospace, SFMono-Regular, Menlo, monospace`。
- **字号**：使用 rem，单位与根字号规则见 [token 工程](token-engineering.md#单位)。项目默认正文 .9375~1rem、UI 控件 .8125~.875rem、最小 .75rem；默认暴露 5~6 档，确有独立角色可增加。
- **行高**：中文正文 1.7~1.8，西文正文 1.5~1.6，标题 1.2~1.3。
- **行长**：正文不超过 70 个汉字或 80 个英文字符（`max-width: 40em` 左右）。
- **暗色字重减细**：对支持连续权重的字体，默认试用下列降一档配方，减少深底浅字的光渗显粗。逐项验读中文小字和缩放；若笔画变细难辨，保留原权重。此配方是工艺建议，不是行业定值。

```css
:root { --w-body: 400; --w-medium: 500; --w-bold: 600; }
@media (prefers-color-scheme: dark) {
  :root { --w-body: 360; --w-medium: 460; --w-bold: 560; }
}
```
  非可变字体不支持 360 这种中间值，会被就近取到 300 或 400。这种情况下，暗色只把 bold 降到 medium，正文保持不变。
- **数字**：计时、计数、金额、表格列一律用 `font-variant-numeric: tabular-nums`。
- **换行**：正文用 `text-wrap: pretty`（Chrome 117 / Safari 26 起支持，Firefox 不支持，自动回退）；标题用 `text-wrap: balance`（Chrome 114 / Safari 17.5 / Firefox 121）。
- **中英混排**：不要手动加空格硬凑间距，用 `text-autospace: normal` 让浏览器自动在中西文之间加间隙（Chrome 140 / Safari 18.4 / Firefox 145 起支持；旧版本直接忽略）。
- **平滑**：macOS 暗色下加 `-webkit-font-smoothing: antialiased`，能减少发胖感。

## 3. 间距

- 间距档位、光学例外见 [布局网格](layout.md#网格)。
- **组内间距 < 组间间距**：相关的元素靠近，不相关的拉开。宁可用间距分组，也不要画线。
- 点击区域见 [布局](layout.md#点击区域)。

## 4. 圆角

- 按角色设定圆角。项目风格默认：小控件 6~8px、输入框和按钮 10~12px、卡片 14~16px、弹层 16~20px；Fluent 风格常用 2 / 4 / 8 / 12px，不能把小圆角判为质量不足。贴边处按需要取消圆角。
- **嵌套圆角公式**：内层圆角 = 外层圆角 − 内边距（项目默认最小 4px，贴边或小圆角体系另按角色处理）。否则内外圆角的弧线不同心，看起来会「鼓」。

## 5. 阴影与描边

- 阴影由两层组成：一层贴身的小阴影负责边缘，一层扩散的大阴影负责高度。

```css
--shadow-1: 0 1px 2px rgb(0 0 0 / .06), 0 1px 1px rgb(0 0 0 / .04);
--shadow-2: 0 2px 4px rgb(0 0 0 / .06), 0 8px 24px rgb(0 0 0 / .08);
--shadow-3: 0 4px 8px rgb(0 0 0 / .08), 0 16px 48px rgb(0 0 0 / .14);
```
- 暗色模式优先用更亮一层的 surface 和极淡内描边，保留阴影作为深度补充：`inset 0 0 0 1px rgb(255 255 255 / .06)`。
- **输入框聚焦**：不用高饱和的亮色 outline，改为加深内描边，并在外面加一圈低透明度的光晕（双环）。但这圈焦点环和背景的对比度仍要达到 3:1，见 checklist。
- **强制颜色模式**（Windows 高对比度）会去掉 box-shadow，用 shadow 模拟的边框也会跟着消失，需要补回来：

```css
@media (forced-colors: active) {
  .card, .composer { border: 1px solid CanvasText; }
}
```

## 6. 状态

每个交互组件把可达的状态写全：默认、悬停、按下、聚焦、禁用、加载、错误；到不了的状态（静态链接的加载、FAQ 的错误）不造。具体要求：
- 悬停：surface 提升一档，不要变色。
- 按下：`scale(.98)` 或 surface 回落一档，持续 80~120ms。
- 禁用：透明度 0.45~0.5，`cursor: not-allowed`，同时保持可读。
- 加载与按钮忙碌行为统一按 [反馈模式](patterns.md#3-加载) 实现。
- 错误展示见 [反馈模式](patterns.md#5-表单)，字段错误不额外弹窗打断。
- 空状态与恢复入口见 [反馈模式](patterns.md#6-空状态)。

## 7. 主题、配对与状态验收

### 对比度按实际配对计算

- 将操作强调色与成功、警告、危险、信息色分开。
  组件引用用途明确的前景、背景和边框；命名与生成按 [token 工程](token-engineering.md)。
  不要把品牌绿当成功色，或让同一个红色同时作浅底与文字。
- 建议为实际文字建立浅/暗 × 默认/浮起/覆盖 × 默认/悬停/选中的配对矩阵。
  18 组是起步测试预算；验收真实使用的组合，不用其他色阶的“五档差”代替计算。
- 透明文字和背景先合成，再计算 WCAG 2 比值。
  不要只拿源色值计算，忽略父级 opacity 造成的变淡。
- 正文至少 4.5:1，项目建议 7:1。
  大字为 18pt 普通或 14pt 粗体（约 24 / 18.667 CSS px）时至少 3:1；不要把普通 18px 当大字。
- 必要图标、控件边界和焦点指示至少 3:1。
  APCA 可以另列感知评估，但不能用它替代 AA 比值。
- 启用输入框的普通占位文字也须达到 4.5:1。
  验收最终合成色；不要以“次要信息”为由统一降低到 3:1。

```css
input::placeholder { color: var(--fg-muted); opacity: 1; }
.well { background: var(--surface-sunken); }
.row:hover { background: var(--hover); }
```

### 表面和导航的用途

- 默认四层可映射凹槽、默认、浮起和覆盖，Material 的五种容器角色可按任务采用。
  验收每个角色有明确用途；不要把第五种 token 本身判成违规。
- 凹槽使用不透明 surface-sunken，悬停使用透明 hover 叠色。
  切换暗色验收凹槽仍比上层更低；不要因浅色截图相似合并两种语义。
- 建议先弱化导航背景、冗余图标和装饰，再调整文字色。
  导航必要文字仍须通过对比度；不要把侧栏整体透明度降到 .35。
- 公共头部操作保持可预测位置。
  在多个页面比较同一操作的入口；不要让“分享”每页换一个角落。

### 状态含义与焦点叠加

- 强制颜色模式下保留 forced-color-adjust:auto，并补系统色轮廓。
  验收阴影消失后控件和焦点仍可辨；不要全站固定品牌色压过系统偏好。
- 瞬时按下用 :active，二态按钮用 aria-pressed，标签页用 aria-selected。
  二态按钮通常保持名称不变；不要用 :active 保存收藏状态。
- 分别展示 selected+focus、invalid+focus 和 loading+focus 样本。
  选中背景或错误边线不能覆盖焦点；不要只测试互斥的单状态截图。
- 从组件真实 data-state、data-disabled 等属性派生视觉。
  用 Esc、外部点击和程序控制分别关闭，验收箭头、背景、ARIA 同时变化；不要维护第二份视觉布尔值。

```css
[aria-selected="true"] { background: var(--surface-2); }
[aria-invalid="true"] { border-color: var(--danger-border); }
:focus { outline: 2px solid var(--ring); outline-offset: 2px;
  box-shadow: inset 0 0 0 1px var(--input-focus-ring), 0 0 0 4px var(--focus-halo); }
@supports selector(:focus-visible) {
  :focus:not(:focus-visible) { outline: none; box-shadow: none; }
}
@media (forced-colors: active) {
  .control { border: 1px solid ButtonText; }
  :focus { outline: 2px solid Highlight; box-shadow: none; }
}
```

## 8. 排版与合成细节

### 排版角色一起调整

- 将字号、行高和字重组合为语义角色，不只替换字号。
  Fluent 紧凑 Web 的 14/20 与 Ant 的 14/22 属于不同系统组合，字号以默认根换算为 .875rem。
- 中文阅读正文默认行高 1.75，紧凑 UI 建议 1.5。
  用真实长段和控件标签验收；不要把紧凑按钮的配方强套给文章。
- 控件主动继承排版，并保留原生交互。
  比较正文与按钮的字体；不要让浏览器默认小号字体混入产品界面。

```css
input, button, textarea, select { font: inherit; }
.article { font-size: var(--text-md); line-height: var(--leading-cjk); }
```

- 在计时器或金额列比较 1111 与 8888 的宽度，确认字体确实支持 tabular-nums。
  需要齐线形态时另加 lining-nums；不要用等宽代码字体覆盖整个界面。
- 自动混排间距只作增强，代码和标识符保留原始文本。
  用复制结果验收；不要为了美观向订单号插入空格。
- 数值与单位可局部用 `10&nbsp;MB`，技术标识可标 translate="no"。
  在窄屏检查换行；不要给整段文字加 nowrap。
- 字体有 opsz 轴时使用 font-optical-sizing:auto。
  比较 .75rem 小字与 2.5rem 标题；没有该轴时不能声称属性已改善渲染。

### 边框、阴影与裁切

- 静态同色卡片允许用必要边框区分边界。
  验收语义仍是平面分组；不要为了禁止边框强加浮起阴影。
- 每条列表交界只画一次。
  检查半透明线交叉处没有加深；不要上下两行同时画同一条边。
- 建议分别使用 shadow-neutral 与 shadow-brand 表达中性和彩色表面的阴影。
  在浅、暗和彩色背景比对感知高度；不要把模糊半径当成 z-index。
- 圆角媒体只在内层裁切，交互外壳保留焦点空间。
  用 Tab 检查四边，必要时 portal 弹层；不要用整卡 overflow:hidden 裁掉焦点和提示。

```css
.flat-card { border: 1px solid var(--hairline); }
.row + .row { border-block-start: 1px solid var(--hairline); }
.media { border-radius: inherit; overflow: hidden; }
```
