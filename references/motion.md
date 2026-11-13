# 动效

实现操作反馈、折叠、拖拽或弹层过渡时读取本文件。按操作性格选配方，再验证可中断性和减少动效偏好。

## 原则

- 动效用来**回应操作**或**说明变化**：打开、展开、确认、元素位置变了。不要为了「有动感」给每个区块都加入场动画。
- 同一类操作，全站用同一种动效手感。
- 所有非必要动画都要有 `prefers-reduced-motion: reduce` 降级：直接切到终态，或只保留淡入淡出。

## 时长与缓动

以下是项目默认配方，不是行业统一值。Carbon 使用 70 / 110 / 150 / 240 / 400 / 700ms，Material short 使用 50 / 100 / 150 / 200ms；采用现有系统时沿用其映射，勿混搭最大值。

| 档位 | 时长 | 用途 |
|---|---|---|
| instant | 80~120ms | 按下、悬停、颜色变化 |
| quick | 150~200ms | 下拉菜单、tooltip、小元素进出 |
| base | 240~320ms | 折叠展开、面板滑入 |
| slow | 400~500ms | 大面积布局切换（少用） |

- 进入用 ease-out：`cubic-bezier(.16, 1, .3, 1)`；离开用 ease-in，时长约为进入的 70%。
- 持续运动按去向选曲线：Carbon standard `(.2,0,.38,.9)`、进入 `(0,0,.38,.9)`、离开 `(.2,0,1,.9)`。只是移出屏幕待召回的侧栏可用 standard；循环进度可用 linear，勿每圈减速停顿。

## 弹簧：按「性格」选参数

以下为线性阻尼模型的建议起点，接入具体库后实测，不得跨库声称同手感。临界阻尼 `c = 2√(k·m)`。质量 m=1、刚度 k=1200 时，c≈69.3。

| 性格 | 场景 | 参数（m=1） | 表现 |
|---|---|---|---|
| 咬合（临界/过阻尼） | 拖拽松手吸附、侧栏调宽、排序落位 | k=1200，c≥70 | 一下到位，不回弹 |
| 轻快（欠阻尼） | 点赞、复制成功的对勾、开关 | k=500，c=14~18 | 带一点回弹 |
| 柔和 | 卡片入场、弹层出现 | k=300，c=30 | 平稳减速 |

- **直接操作**（手指或鼠标带着元素走）时，跟手阶段不加任何过渡；只有松手后才交给弹簧。
- 不用 JS 也能做弹簧：用 `linear()` 采样弹簧曲线，支持 Chrome 113 / Safari 17.2 / Firefox 112 起。

```css
/* 轻快回弹（手调曲线，近似欠阻尼） */
--ease-bounce: linear(0, 1.18 40%, .96 70%, 1);
```

## 常用模式

- **入场**：用 `@starting-style`（Chrome 117 / Safari 17.5 / Firefox 129），不用 JS 切 class。

```css
.toast { transition: opacity .2s, translate .3s cubic-bezier(.16,1,.3,1); }
@starting-style { .toast { opacity: 0; translate: 0 8px; } }
```
- **折叠展开**使用 display:grid 和 grid-template-rows 的 0fr → 1fr 过渡。
  子元素设置 overflow:hidden；这只作视觉裁切，交互合同见下文。
  Chrome 107 / Safari 16 / Firefox 66 起支持；interpolate-size 不单独作为兼容基线。

```css
.fold { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--dur-base) var(--ease-out); }
.fold[data-open="true"] { grid-template-rows: 1fr; }
.fold > .inner { min-height: 0; overflow: hidden; }
```

- 建议关闭时先将内容内的焦点移回折叠触发按钮，再立即设置内容 inert 与按钮 aria-expanded="false"。
  过渡完成后设置 hidden（需样式保证 hidden 时 display:none）；初始折叠也须 inert + hidden。
  展开时先移除 hidden，建立起始帧后切到 1fr，再解除 inert，同步 aria-expanded="true"。
  减少动效时直接隐藏；快速反转须取消旧完成回调，按最新状态结算，不能依赖 transitionend 唯一完成。
  不支持 inert 时提供等效焦点及读屏隔离，或直接 hidden 无动画；验收折叠内容不进 Tab 且不暴露读屏。

- **瞬时反馈**：时长与暂停按 [反馈模式](patterns.md#1-反馈按打扰程度选组件)，连续触发重置计时器，不叠加提示；复制图标复位见 [AI 消息操作](ai-chat.md#消息操作)。
- **按下反馈**：`:active { scale: .98 }`，持续 100ms 左右。
- 默认只动画 `transform / opacity`；网格展开、拖拽改布局是明确例外，实测重排成本。水墨文本的 `filter: blur()` 保留，但必须按 [性能观感](performance.md) 测 Paint Flashing 与主线程，勿无条件放行大面积模糊。

## 降级

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```
JS 读取 `matchMedia('(prefers-reduced-motion: reduce)')` 的初值并监听 change；命中时将运行中的弹簧推进正确终态，销毁时移除监听。业务不能依赖动画结束事件才能完成。

## 可中断运动与生命周期

### 明确弹簧模型

- 使用 Motion 物理弹簧时，建议先试 stiffness:300、damping:35、mass:1 的无明显回弹起点。
  参数依赖具体库与模型；不得跨库复制后声称手感一致。
- 需要固定节拍时可试 duration:.3、bounce:.15 的时间模型。
  Motion 的 duration 单位是秒，CSS 可写 ms；不要把 300ms 写成 300 秒。
- 物理参数和 duration/bounce 二选一。
  核对实际生效参数，不能堆入两组值后假设每项都独立起效。

```js
// 两种配置选一种，不合并对象。
const physical = { type: 'spring', stiffness: 300, damping: 35, mass: 1 };
const timed = { type: 'spring', duration: .3, bounce: .15 };
```

### 属性与图层生命周期

- 精确列出 transition 的属性。
  新增 padding 后不能意外参与运动；不要写 transition:all。
- 仅在测量证明必要时使用 will-change，交互结束后恢复 auto。
  验收空闲列表不保留大量提升图层；不要给每一行永久加 will-change。

```css
.panel { transition: opacity 150ms, transform 150ms; }
```

### 连续操作与离场

- 建议连续切换从当前视觉状态接管，不等待旧动画队列播完。
  快速开关后界面应跟随最新意图；不要停止点击后仍开关数秒。
- 列表 stagger 可试 Math.min(index,5)*20ms，使新增延迟最多 100ms。
  最后一项仍可立即操作；不要让第 100 项等待两秒才可点击。
- 关闭弹层时同步离场、卸载和焦点归还。
  Radix CSS 可按 data-state="closed" 延迟卸载；JS forceMount 必须配最终卸载。
  验收已关闭内容不能继续获得焦点，不能永久挂着透明弹窗。

### 手势与高亮边界

- 手势过程中可预览，业务提交留在可取消的结束阶段。
  按 [指针取消](accessibility.md#激活与快捷键) 验收；不要滑过阈值就永久删除。
- 松手后将方向和速度传给后续运动，减少动效时直接到终态。
  验收释放方向连续；不要从斜向甩出突然变成居中固定时间线。
- 分段控件的高亮与文字换色共用空间边界，可使用 clip-path。
  慢速回放检查交界；不要让滑块与文字颜色独立补间而错位。

下面是裁切骨架：普通标签和高亮副本共用文本与布局尺寸，高亮副本只作装饰。
动画驱动器同时更新高亮区域与 inset；其几何值由实际控件测量，不设通用常数。

```html
<div class="segments">
  <div class="labels">选项文字</div>
  <div class="highlight-labels" aria-hidden="true">选项文字</div>
</div>
```

```css
.segments { position: relative; }
.highlight-labels {
  position: absolute; inset: 0;
  color: var(--on-brand); background: var(--brand);
  clip-path: inset(0 0 0 0);
  pointer-events: none;
}
/* 实际 inset 由同一高亮区域计算；此处全覆盖只是初始结构。 */
```

```js
function syncHighlight(segments, selectedButton) {
  const outer = segments.getBoundingClientRect();
  const inner = selectedButton.getBoundingClientRect();
  const inset = [inner.top - outer.top, outer.right - inner.right,
    outer.bottom - inner.bottom, inner.left - outer.left];
  segments.querySelector('.highlight-labels').style.clipPath =
    `inset(${inset.map(value => `${value}px`).join(' ')})`;
}
// 同一裁切区域显示高亮背景和换色文字；改变选择时重算。
```
