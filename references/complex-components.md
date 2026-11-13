# 复杂组件与流程

在实现数据表或批处理时读取本文件；上传和命令面板见 [复杂流程](complex-workflows.md)。
以下代码是最小结构骨架；业务请求和状态渲染函数由项目接入，不代表完整组件库。

## 查询与列布局

### 可排序表头

- 将排序入口放在列头中的原生 button 内。
  按 Enter、Space 应与点击执行同一逻辑；不要把 click 只绑在不可聚焦的 th 上。
- 在当前排序列的 th 上设置 `aria-sort="ascending"` 或 `"descending"`。
  未排序时使用 `none` 或移除属性；只有当前排序列常驻显示方向图标及可见或读屏方向文本。
- 未排序列只显示低对比的可排序提示图标，不显示“未排序”字样。
  表头按钮默认无边框、无底色，hover / focus 时显现交互状态；表头文字不换行。
- 明确数值、日期、文本的排序方式，以及本页或全部结果的排序范围。
  用跨页样本验收；不要只排序当前页却声称全结果已排序。

```html
<table>
  <thead><tr><th scope="col" aria-sort="ascending">
    <button type="button" id="sort-name">
      名称 <span aria-hidden="true">↑</span><span class="sr-only">升序</span>
    </button>
  </th><th scope="col"><button type="button">
    大小 <span class="sort-hint" aria-hidden="true">↕</span>
  </button></th></tr></thead>
  <tbody><!-- 行内容 --></tbody>
</table>
```

```js
const button = document.querySelector('#sort-name');
button.addEventListener('click', () => {
  const th = button.closest('th');
  const next = th.getAttribute('aria-sort') === 'ascending'
    ? 'descending' : 'ascending';
  applyQuery({ ...query, sort: { key: 'name', direction: next } });
  // 由同一查询状态渲染 aria-sort 与箭头，不另存视觉状态。
});
```

### 查询状态

- 建议用一个 query 对象保存 filter、sort、page 和 pageSize。
  筛选改变时校正页码；验收末页筛选后的有效页，不把越界页误当无结果。
- 建议为查询响应加递增版本门控，只接受当前查询的结果。
  用倒序响应验收；取消请求后也不能省略版本判断。
- 显示当前筛选条件和总结果数。
  URL 及历史恢复按 [布局](layout.md#内在布局与极端内容)，不要另建一份查询状态。

### 吸顶表头与固定列

- 建议表头和表体共享同一 table 或列定义。
  给标识列、数值列和说明列分别确定宽度策略；不要独立测量两套不一致的列宽。
- 让表头固定在所属滚动容器顶部，首列固定在逻辑起始边。
  滚动到交叉位置时，交叉表头必须覆盖普通表头与固定单元格。
- 给固定单元格不透明背景，长说明提供展开入口。
  验收文字不会透出叠印，窄屏横滚后仍可辨认行；不要裁掉唯一的标识列。

以下建议在 `.table-scroll` 内定义局部层级：固定列 < 表头 < 交叉表头。
容器须有块向高度约束；此例要求父布局有明确的可用块高度，百分比上限才会生效。
粘性定位与外层吸顶偏移还须按 [布局](layout.md#吸顶元素) 检查。

```css
.table-scroll {
  --table-z-column: 1; --table-z-header: 2; --table-z-corner: 3;
  overflow: auto; max-block-size: 100%; isolation: isolate; padding: 0;
}
.table-scroll table { border-spacing: 0; inline-size: 100%; table-layout: fixed; }
.table-scroll th, .table-scroll td { background: var(--surface-1); }
.table-scroll thead th {
  position: sticky; inset-block-start: 0; z-index: var(--table-z-header);
}
.table-scroll .fixed {
  position: sticky; inset-inline-start: 0; z-index: var(--table-z-column);
}
.table-scroll thead .fixed { z-index: var(--table-z-corner); }
```

```css
th { white-space: nowrap; }
th button { border: 0; background: transparent; white-space: nowrap; }
th button:hover, th button:focus-visible { background: var(--hover); }
.sort-hint { color: var(--fg-muted); }
```

- sticky 表头的滚动容器不设内边距，需要留白时放在外层包裹元素。
  纵向滚动后，表头上沿与滚动容器上沿之间不得看到行内容。
- 建议窄容器内固定列不超过容器宽度约 40%；这是起点建议，须按真实内容验收。
  超出时仅留最小标识（选择列只留复选框，文字改为读屏文本），或取消固定；不得遮住其余列。

下面用外层作查询容器；建议断点由内容确定，不支持容器查询时按同条件用媒体查询回退。
固定布局须给其余列分配可用宽度并处理长内容；窄屏覆盖规则须胜过基础最小宽度，验收计算宽度。

```css
.table-frame { container-type: inline-size; }
.table-scroll { padding: 0; }
@container (max-width: 30rem) {
  .table-scroll .fixed { inline-size: 4rem; min-inline-size: 0; }
  /* 选择列文字用项目已有 sr-only 工具类的裁切配方，保留可访问名称。 */
  .selection-text { position: absolute; inline-size: 1px; block-size: 1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
/* 若最小标识仍超过建议比例，取消固定；验收横滚后标识仍可获取。 */
```

## 批量操作

### 表头三态与选择范围

- 表头复选框只控制标明的集合，并显示“本页”或“全部筛选结果”。
  验收分页前后选择范围；不要勾选本页入口后静默作用于全库。
- 根据选中数量设置原生复选框的 checked 和 indeterminate 属性。
  验收全不选、部分、全选三种情况；不要仅绘制一条横线假装三态。
- 选择后显示数量、批量操作和退出入口。
  点击“取消选择”必须清空相应集合，不只隐藏工具栏。
- 部分选择只报实际数量，并提供“选择全部 N 项”入口。
  只有选满所标明的集合才显示“全部当前结果”；验收只选一项时不出现全选范围声明。

```html
<table><thead><tr><th scope="col">
  <label><input id="select-page" type="checkbox">选择本页</label>
</th></tr></thead><tbody><!-- 行复选框与数据 --></tbody></table>
<div id="batch-bar" hidden>
  <span id="selected-count"></span>
  <button type="button" id="select-rest">选择全部本页项</button>
  <button type="button" id="clear-selection">取消选择</button>
</div>
```

```js
const selected = new Set();
function syncSelection(pageIds, selected) {
  const box = document.querySelector('#select-page');
  const count = pageIds.filter(id => selected.has(id)).length;
  box.disabled = pageIds.length === 0;
  box.checked = pageIds.length > 0 && count === pageIds.length;
  box.indeterminate = count > 0 && count < pageIds.length;
  document.querySelector('#batch-bar').hidden = selected.size === 0;
  document.querySelector('#selected-count').textContent =
    `已选择 ${count} 项${box.checked ? "（全部本页结果）" : ""}`;
  const rest = document.querySelector('#select-rest');
  rest.hidden = box.checked; rest.textContent = `选择全部 ${pageIds.length} 项`;
  rest.onclick = () => { pageIds.forEach(id => selected.add(id)); syncSelection(pageIds, selected); };
}
document.querySelector('#select-page').addEventListener('change', e => {
  pageIds.forEach(id => e.target.checked ? selected.add(id) : selected.delete(id));
  syncSelection(pageIds, selected);
});
document.querySelector('#clear-selection').addEventListener('click', () => {
  selected.clear(); syncSelection(pageIds, selected);
});
// pageIds 由当前页数据提供，行复选框变化也调用 syncSelection。
// 本页模式翻页时清空选择；跨页模式另行明确范围和数量文案。
```

### 分组展示执行结果

- 建议执行前显示对象数量和范围，完成后分为成功、失败、结果未知。
  每组应能定位对象和失败原因；不要用一个全局失败提示抹掉部分成功。
- 只重试已经确认未成功的对象，并复用 [幂等身份](patterns.md#11-表单的结构与并发)。
  结果未知先查询执行结果；不要因超时直接重做成功对象。
- 不可逆操作沿用 [危险确认](patterns.md#2-危险操作能撤销就不要确认)。
  初始焦点放安全动作，不另造一套批量确认行为。

```html
<section aria-labelledby="batch-title">
  <h2 id="batch-title">批量移动结果</h2>
  <h3>成功</h3><ul id="succeeded"><!-- 对象名称 --></ul>
  <h3>失败</h3><ul id="failed"><!-- 名称、原因、可重试入口 --></ul>
  <h3>结果未知</h3><ul id="unknown"><!-- 名称、查询结果入口 --></ul>
</section>
```

## 上传与命令面板

上传状态与命令面板结构见 [复杂流程](complex-workflows.md)。
