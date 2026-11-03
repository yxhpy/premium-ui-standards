# 动效

## 原则

- 动效用来**回应操作**或**说明变化**：打开、展开、确认、元素位置变了。不要为了「有动感」给每个区块都加入场动画。
- 同一类操作，全站用同一种动效手感。
- 所有非必要动画都要有 `prefers-reduced-motion: reduce` 降级：直接切到终态，或只保留淡入淡出。

## 时长与缓动

| 档位 | 时长 | 用途 |
|---|---|---|
| instant | 80~120ms | 按下、悬停、颜色变化 |
| quick | 150~200ms | 下拉菜单、tooltip、小元素进出 |
| base | 240~320ms | 折叠展开、面板滑入 |
| slow | 400~500ms | 大面积布局切换（少用） |

- 进入用 ease-out：`cubic-bezier(.16, 1, .3, 1)`；离开用 ease-in，时长约为进入的 70%。
- 不要用 `linear` 做位移动画，也不要用浏览器默认的 `ease` 做所有动画。

## 弹簧：按「性格」选参数

临界阻尼 `c = 2√(k·m)`。质量 m=1、刚度 k=1200 时，c≈69.3。

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
- **折叠展开**：`display: grid; grid-template-rows: 0fr → 1fr`，子元素加 `overflow: hidden`（Chrome 107 / Safari 16 / Firefox 66）。`interpolate-size` 目前只有 Chrome 支持，暂时不要单独依赖它。
- **瞬时反馈**：「已复制」「已保存」显示 2~3 秒后自动消失；连续点击要重置计时器，不要叠加多个提示。
- **按下反馈**：`:active { scale: .98 }`，持续 100ms 左右。
- **只动画 `transform`、`opacity`、`filter`**。不要动画 `width`、`height`、`top`、`left`，除非是侧栏拖拽这类必须改布局的场景。

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
JS 弹簧里也要读取 `matchMedia('(prefers-reduced-motion: reduce)')`，命中时直接跳到终态。
