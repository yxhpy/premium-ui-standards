# 布局与响应式

新建页面布局、调整响应式或排查滚动溢出时读取本文件。按内容失效位置选择断点，来源见 [来源索引](sources.md)。

## 网格

- **间距**用 4px 基准（细节）；**布局**用 8px 基准（模块尺寸、区块间距）。这两者不冲突：组件内部可以用 4 / 12，区块之间用 8 的倍数。
- 栅格：中后台常用 24 栏（Ant Design），营销页和内容页可用 12 栏（项目选择，非行业限定）。栏间距（gutter）取定值，比如 16 / 24。
- 一个区块要从某一栏的起点开始，到某一栏的终点结束，不要停在栏间距里。

## 典型布局

- **左右布局**（工作台、AI 客户端）：左侧导航固定宽度，可以收起；右侧工作区随视口伸缩。正文内容再限制一个最大宽度并居中。
- **上下布局**（官网、文档）：两侧留白有最小值，留白缩到最小值后，再压缩中间的内容区。
- 设计稿统一一个画板宽度，比如 1440，同时标明哪些区块是动态的。

## 响应式

- 水平内容按等效 320 CSS px 宽度重排，垂直内容按等效 256 CSS px 高度重排。
  例如 1280px 宽屏放大到 400% 后，水平内容仍须保留信息和功能，整页不得双向滚动。
- 需二维理解的表格等可局部滚动，单元格仍考虑重排。
  代码块可提供局部横滚；不要借组件例外豁免整个页面。
- 移动端设计稿以 375px 宽为基准，但 320px 也要能正常使用。
- 断点按内容来定，不按设备型号来定。常用参考值：640 / 768 / 1024 / 1280 / 1536。组件自身的适配优先用容器查询（`@container`），而不是视口断点。
- **不要仅依赖 `pointer: coarse/fine` 隐藏核心功能**。很多设备同时支持触摸、鼠标和键盘，这个判断并不可靠。
- 尊重用户偏好：浏览器默认字号（字号用 `rem`，不要把根字号写死成 px）、`prefers-reduced-motion`、`prefers-color-scheme`、`prefers-contrast`。
- 移动端在原留白上追加安全区：`padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px))`，横屏检查左右 inset、软键盘遮挡；视口高度用 `dvh`/`svh`，不用 `100vh`（会被浏览器地址栏遮挡）。
- 弱设备、慢网及占位尺寸验收见 [性能观感](performance.md)。

## 移动输入字号

- 建议触屏或窄视口下 input / textarea / select 的计算字号不小于 1rem（默认根字号为 16px）。
  这是针对 iOS Safari 小于 16px 时聚焦自动放大的工程经验，须在目标设备确认；根字号改变时检查计算值。
- 不得用 maximum-scale 或 user-scalable=no 禁用页面缩放来规避。
  验收聚焦后仍能手势缩放；沿用现有字号阶梯，无需新增专用 token。

```css
@media (pointer: coarse), (max-width: 40rem) {
  input, textarea, select { font-size: max(1rem, 16px); }
}
```

## 点击区域

| 标准 | 尺寸 |
|---|---|
| WCAG 2.2 AA 最低要求（2.5.8） | 24×24 CSS px，或保证周围有足够间距 |
| 桌面推荐 | ≥ 32px |
| 触屏项目舒适值（不等同 WCAG AA 下限） | ≥ 44px |

视觉尺寸小于推荐值时，用透明的 padding 或伪元素把可点击区域扩大，不要把按钮本身做大。

## 层级（z-index）

层级合同与数值统一见 [token 工程](token-engineering.md#层级合同)。不要在低层叠上下文里不断加大数字。

## 吸顶元素

用了吸顶头部或底部栏时，要加 `scroll-padding-top` / `scroll-padding-bottom`，避免键盘焦点或锚点跳转的目标被吸顶元素挡住（WCAG 2.4.11）。

## 内在布局与极端内容

### 网格与光学例外

- 基准网格允许命名的 2 / 6 / 10px 光学例外，并记录图标内置留白等理由。
  验收例外有复用用途；不要让每个组件随手发明 7px、9px 间距。
- 先对齐容器边缘和文字基线，再对局部图标做光学修正。
  可用 translateY(1px) 调整图标 wrapper；不要移动整行文字或命中区掩盖布局错误。
- 选定一套栅格再迁移 span 数值。
  Carbon 的断点 320 / 672 / 1056 / 1312 / 1584px 对应 4 / 8 / 16 / 16 / 16 列。
  Ant 使用 24 栏；验收迁移后占宽相同，不能直接复用 span 数字。

### 宽屏数量与内容收缩

- 宽屏要展示更多卡片时，建议用 auto-fit 增加列数。
  16rem 是可调整的最小卡片起点；用最长标题验收，不让文字被挤成不可读窄列。
- 宽屏需要阅读更多单项内容时，保留列数并扩大列宽。
  验收文章或说明的阅读任务；不要把文件目录中的每张卡无限拉宽却不增加数量。
- 建议分栏主区使用 minmax(0,1fr)，子项设置 min-inline-size:0。
  用连续 200 字符和宽代码验收；不要让最小内容宽度撑出整页横滚。

```css
.cards {
  display: grid; gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
}
.workspace { display: grid; grid-template-columns: 16rem minmax(0, 1fr); }
.workspace > main { min-inline-size: 0; }
.prose { overflow-wrap: anywhere; word-break: normal; }
.code-scroll { overflow-x: auto; }
```

- 建议用长 URL、空名称、超大数字和图片失败建立极端内容样本。
  正文换行、代码局部滚动；关键标识截断时提供可聚焦的完整值和完整复制入口。
  不要用一律 overflow:hidden 把错误原因和订单号永久藏掉。
- 优先使用 padding-inline、margin-block-end 和 gap 表达逻辑方向。
  验收共享组件没有靠重复左右样式维持间距；这里不覆盖完整 RTL 适配。

### 容器查询

- 在外层声明命名容器，在内部根据该容器改变布局。
  36rem 为示例断点；同一卡片放在侧栏和主栏分别验收，不只测试视口宽度。
- 保留单栏作为无查询支持时的基线。
  嵌套时检查命中的祖先容器；不要对容器自身尺寸作循环查询。

```css
.slot { container: summary / inline-size; }
.summary { display: grid; gap: var(--space-3); }
@container summary (min-width: 36rem) {
  .summary { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
}
```

- 使用 Polaris s-stack/s-grid 时显式传 gap。
  测试换行后的块向间距；不要假设旧 React Stack 的默认间距仍存在。
- 建议将导航重叠或操作换行失控的位置作为断点依据。
  在断点两侧和超宽窗口验收，折叠时保留输入、焦点上下文和主任务。

### 滚动祖先与媒体

- 检查 sticky 最近的滚动祖先、对应轴 inset 和父容器边界。
  overflow:hidden 也会影响参照；不要为了裁圆角意外改变表头的吸顶容器。
- 仅在需要隔离的真实滚动容器上使用 overscroll-behavior:contain。
  另测背景锁滚；不要用全站 none 禁掉预期的原生导航手势。
- 媒体块用 display:block 消除行内基线缝隙，并限制 max-width:100%。
  行内图标单独覆盖；尺寸预留按 [性能观感](performance.md#3-用最终内容的尺寸约束骨架)。
- 子级使用百分比高度前，确认包含块已有明确高度。
  否则用 flex/grid 填充并设 min-block-size:0；不要不断叠加 height:100% 猜结果。

```css
.scroll-panel { min-block-size: 0; overflow: auto; overscroll-behavior: contain; }
.media { display: block; max-width: 100%; }
```

### URL 与历史恢复

- 将筛选、标签和分页编码到 URL，恢复时从同一查询状态渲染界面。
  打开分享链接应还原条件；不要让 URL 与组件状态各自保存不同筛选值。
- Back/Forward 应恢复查询和阅读位置。
  用实际回退流程验收，不清空筛选并把滚动归零；表格请求见 [复杂组件](complex-components.md#查询与列布局)。
