# 设计 token 工程

在新建 token、接入主题或修改公共变量时读取本文件。
建议先检查依赖方向，再调整语义映射，最后在实际组件中验收；三层架构属于项目默认做法。

## 分层与依赖

### 基础、语义、组件各负责什么

- 基础层保存调色板、尺寸、字号和时长。
  修改基础值时应能解释其度量或视觉用途；不要让基础 token 引用组件状态。
- 语义层描述用途、部位和状态，例如操作背景、正文、危险文字。
  验收换主题后用途仍成立；不要因两种角色当前同色就合并它们。
- 组件层只为需要独立变化的角色建立别名。
  建议按基础 → 语义 → 组件单向依赖；不要给每个按钮复制原始色值。

以下片段摘用起步文件已有的名称与数值，展示依赖方向。
它不是要求在每个组件内重复声明一次；项目应集中导入 `assets/tokens.css`。

```css
:root {
  /* 基础层 */
  --base-brand: oklch(.52 .17 258);
  --base-on-brand: #fff;
  /* 语义层 */
  --brand: var(--base-brand);
  --on-brand: var(--base-on-brand);
  /* 组件层 */
  --button-primary-bg: var(--brand);
  --button-primary-fg: var(--on-brand);
}
.primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-fg);
}
```

### 校验依赖后再发布

- 建议构建时拒绝未知引用和循环引用。
  验收每条别名链最终都到达有效值；不要等组件显示透明背景才找断链。
- 建议检查类型、重名和没有用途的 token。
  颜色角色不能指向尺寸对象；不要仅因字符串能生成 CSS 就认为类型正确。
- 建议对生成后的 CSS 再检查一次引用关系。
  输出名称必须与使用端一致，不能只验证输入 JSON。

下面是构建器的伪代码；校验类型时使用项目所采用的交换格式。

```text
对每个 token：
  确认名称唯一，并读取声明的类型。
  收集别名指向的 token；不存在则报错。
  用当前访问路径检测循环；发现环则报错。
  比较引用两端类型；不兼容则报错。
生成 CSS 后：
  收集声明和 var 引用，拒绝缺失引用。
  对照输出映射，确认公共名称没有意外改名。
```

### 与设计工具交换数据

- 需要交换格式时采用 DTCG Format 2025.10 的 `$value`、`$type`、`$description` 和引用机制。
  先检查工具支持的版本；不要把 drafts 或任意自定义 JSON 当成兼容格式。
- 将该格式标为稳定社区组报告，不写成 W3C Recommendation。
  dimension 使用带 value、unit 的对象；不要把一个裸数字当成完整尺寸。

以下 dimension 示例使用起步文件的现有细节间距。

```json
{
  "space": {
    "small": {
      "$type": "dimension",
      "$description": "组件内细节间距",
      "$value": { "value": 4, "unit": "px" }
    }
  }
}
```

删除未被颜色消费的语义 hue / chroma 别名；灰阶色相改基础层 `--base-hue`，
浅色彩度改 `--base-chroma`；暗色彩度在基础暗色配方中显式定义，改值后重验主题。

## 单位

- 字号 token 一律使用 rem，根字号保留用户默认。
  验收用户增大浏览器默认字号后正文随之增大；不要固定根字号为 px 或改成 62.5%。
- 以默认根 16px 换算：12 → .75rem、13 → .8125rem、15 → .9375rem。
  同一换算下，18 → 1.125rem、22 → 1.375rem、30 → 1.875rem。
  这些是起步配方，不是要求覆盖用户的根字号。
- 建议随文本伸缩的布局间距采用 rem。
  细线与局部光学补偿允许 px；不要把所有 1px 线机械转成 rem。
- 行高使用无单位倍数，并检查放大后没有裁切。
  CSS px 也支持浏览器缩放，不以“用了 px”单独判定无障碍失败。

```css
html { font-size: 100%; }
body {
  font-size: var(--text-md);
  line-height: var(--leading-cjk);
}
.input { border: 1px solid var(--hairline); }
```

## 主题与状态

### 首次绘制与用户选择

- 建议基础调色板共享，通过主题切换语义映射。
  起步 CSS 已定义浅、暗映射；不要在组件内直接反转背景色。
- 显式用户选择优先于系统偏好。
  首次绘制前设置 data-theme，未选择时移除该属性，让起步 CSS 跟随系统。
- 让 SSR 或水合使用相同的主题入口。
  验收首帧、原生 input/select、滚动条和弹层一致；不要水合后又闪回浅色。

下面脚本放在主题样式首次绘制前；`applyTheme` 也可用于主题选择器。
存储不可用时回到系统偏好，不让初始化失败阻断页面。

```js
const root = document.documentElement;
function applyTheme(choice) {
  if (choice === 'light' || choice === 'dark') {
    root.dataset.theme = choice;
  } else {
    delete root.dataset.theme;
  }
}
try {
  applyTheme(localStorage.getItem('ui-theme'));
} catch {
  applyTheme(null);
}
// 起步 CSS 负责 color-scheme；不要再维护第二套原生配色状态。
```

### 状态色成对使用

- 为 success、warning、danger、info 分别保留 fg、bg、border 角色。
  验收切主题时三者一起变化；不要用一个危险红同时写文字和铺浅底。
- 让组件消费语义 token，并保留独立焦点指示。
  实际背景的配对与对比度按 [基础](foundations.md#7-主题配对与状态验收) 验算。
  起步数值不是所有品牌和透明叠层的通过保证。

```css
.notice-danger {
  background: var(--danger-bg);
  color: var(--danger-fg);
  border: 1px solid var(--danger-border);
}
.notice-danger button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### 公共名称的变更

- 建议记录旧名、新名、兼容别名和计划移除时间。
  在删除旧名以前检查全部消费者；不要直接删名使现有组件失去值。
- 变更后回归浅色、暗色和强制颜色模式。
  验收实际状态样本，不只比较 token 文件的文本差异。

## 层级合同

- 建议普通应用根使用现有 base 0、sticky 100、dropdown 200、overlay 300、modal 400、toast 500、tooltip 600。
  这些数值是项目预算；在同一上下文中验收覆盖顺序，不将它们当行业定值。
- 建议普通 portal 挂到同一应用根，并写清所属上下文。
  原生 dialog.showModal() 和 popover 位于 top layer，不能靠普通 z-index 越过它们。
- 覆盖异常时先检查 transform、opacity 等产生的层叠上下文。
  回归嵌套弹窗、浮层和粘性表格；不要不断增加 999999。

```css
.app { isolation: isolate; }
.sticky { z-index: var(--z-sticky); }
.dropdown { z-index: var(--z-dropdown); }
.modal-portal { z-index: var(--z-modal); }
.toast-portal { z-index: var(--z-toast); }
/* 以上对象仍需由组件设置合适的 position；top layer 单独处理。 */
```
