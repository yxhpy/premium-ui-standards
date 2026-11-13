# 无障碍（对齐 WCAG 2.2 AA）

无障碍不是额外的加分项，而是大厂上线前的门槛。下面是前端最常踩到的几类，按 WCAG 2.2 AA 整理。其中 2.2 新增的条款单独标注。

## 感知

- **对比度**：阈值与主题配对验收统一见 [基础第 7 节](foundations.md#7-主题配对与状态验收)（1.4.3 / 1.4.11）。
- **不只靠颜色传达信息**：状态要配图标或文字，图表要配图案或标签（1.4.1）。
- **图片**：有意义的图片写 `alt`；装饰性图片用 `alt=""`；图标按钮要有 `aria-label`。
- **文字缩放**：放大到 200% 时不能截断或重叠；页面要能重排到 320px 宽（1.4.4 / 1.4.10）。
- **文本间距**：覆盖为行高 1.5、段后距 2em、字距 .12em、词距 .16em 后，内容不得裁切、重叠或丢功能（1.4.12）。这是耐受测试，不是默认配方；不要固定文本容器高度。
- **悬停或聚焦时出现的内容**（比如 tooltip）：要能用 Esc 关闭，鼠标移到它上面时不能消失，并且一直保持显示，直到用户主动移开（1.4.13）。

## 操作

- **键盘**：所有功能可只用键盘完成，不得产生无退出路径的焦点陷阱（2.1.1 / 2.1.2）。模态循环见下文。
- **焦点顺序**与视觉顺序一致；不要用正数的 `tabindex`。
- **焦点可见**（2.4.7），并且**不能被吸顶元素完全挡住**（2.4.11，2.2 新增）。
- **拖拽要有替代操作**（2.5.7，2.2 新增）：拖拽须提供无需拖动的单指针点击 / 轻触替代；键盘可用另按 2.1.1 验收。侧栏调宽除把手方向键外，还要有可点击的增减按钮或预设宽度；排序提供可点击且可键盘激活的「上移 / 下移」。
- **点击区域**：下限与间距例外见 [布局](layout.md#点击区域)（2.5.8，2.2 新增）。
- **限时内容**：自动消失的提示，如果里面有操作按钮，要能延长时间或暂停（2.2.1）。
- **自动播放或滚动**超过 5 秒的内容，要能暂停（2.2.2）。
- **快捷键**：仅字符的单键或序列，提供关闭、加非字符键重映射、仅控件聚焦时生效三者之一；Shift 产生的字符仍可能受此约束（2.1.4）。

## 理解

- 页面要设置 `lang="zh-CN"`，混入其他语言的片段也要标注 `lang`。
- 聚焦或输入时，不能自动引发切换页面这类重大变化（3.2.1 / 3.2.2）。
- 帮助入口在每个页面上的位置保持一致（3.2.6，2.2 新增）。
- 表单错误、复核与撤销按 [反馈模式](patterns.md)（3.3.1 / 3.3.3 / 3.3.4）。
- 同流程复用输入按 [表单](patterns.md#5-表单)（3.3.7，2.2 新增）。
- 登录验证按 [表单](patterns.md#5-表单)（3.3.8，2.2 新增）。

## 健壮

- **优先用原生元素**：`<button>`、`<a href>`、`<input>`、`<dialog>`、`<details>`。用 div 模拟时，必须补全 role、键盘行为和状态。
- 状态要能被读屏软件获取：`aria-expanded`、`aria-pressed`、`aria-selected`、`aria-invalid`、`aria-busy`。
- **动态消息**用 live region：普通提示用 `aria-live="polite"`，只有真实紧急错误才用 `role="alert"`。
  普通与带操作通知使用页面加载时已存在的播报节点，操作不自动抢焦点，消失后保留等效入口。AI 流式输出不要逐字播报，生成结束后再播报一次摘要或完成状态。

## 用户偏好

- `prefers-reduced-motion`：见 `motion.md`。
- `prefers-contrast: more`：加深发丝线和次要文字。
- `forced-colors: active`：用阴影模拟的边框会消失，要补回真实边框，见 `foundations.md`。
- `prefers-reduced-transparency`：毛玻璃、半透明遮罩改成不透明。

## 怎么测

- 自动检查：axe DevTools 或 Lighthouse 的无障碍项。自动化不能替代手动键盘和读屏检查。
- 手动检查：拔掉鼠标，只用 Tab、Shift+Tab、Enter、Space、Esc 和方向键走一遍主流程。
- 读屏软件：macOS 上用 VoiceOver（Cmd+F5），Windows 上用 NVDA，至少走通主流程一次。
- 页面放大到 400%，或者把窗口缩到 320px 宽，检查是否出现双向滚动。

## 激活与快捷键

### 焦点与真实禁用

- 使用 :focus-visible，并为不支持的环境保留 :focus 回退。
  文本输入被鼠标点击也可能显示焦点；不要用全局 mousedown 隐藏它。
- 无需保留焦点的原生按钮使用 disabled。
  需要解释禁用原因时可用 aria-disabled，但必须在实际命令入口拦截激活。
  用鼠标、Enter、Space 和程序调用验收；不要只写 pointer-events:none。

```js
function execute(button, action) {
  if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;
  action();
}
// 原生 button 的 click 同时覆盖鼠标、Enter 和 Space；程序调用也走 execute。
button.addEventListener('click', () => execute(button, save));
```

### 核心操作与指针取消

- 默认显示核心操作，只在有 hover 且指针精细时弱化。
  验收触屏入口始终可发现；不要依赖设备类型猜测隐藏功能。
- hover 和 focus-within 都须恢复操作可见。
  用 Tab 到消息按钮验收；不要留下透明却仍占焦点顺序的控件。

```css
.actions { opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .actions { opacity: 0; }
  .message:hover .actions, .message:focus-within .actions { opacity: 1; }
}
```

- 普通命令用原生 click 激活。
  按下后移开再松手应能取消，或提供准则允许的等效机制；不要在 pointerdown 删除数据。
- 建议快捷键按最上层弹窗、当前控件、页面的顺序仲裁。
  仅实际处理时 preventDefault；Esc 不应同时关闭两层。
- 全局字符快捷键默认跳过 isComposing 或 keyCode=229、输入框和 contenteditable。
  测试中文候选确认和不同键盘布局；不要抢占系统及浏览器常用组合。

## 复合控件键盘合同

### 菜单与列表框

- 操作菜单打开后聚焦菜单项，上下键移动、Enter 执行、Tab 离开。
  Esc 关闭并归还上下文；子菜单用左右键进入或返回，不能把普通导航链接强套成菜单。
- 多选列表框用上下键移动活动项，用 Space 切换选择。
  长列表支持首字符定位；不要让焦点经过就清空选择，也不要在纯 listbox 里嵌套操作按钮。

### 标签页与 roving tabindex

- 横向标签页用左右键移动，Tab 离开列表进入面板。
  绑定 tab 与 panel 的名称关系；只有内容即时可用才采用焦点即激活。
- 远程加载的标签建议使用 Enter/Space 手动激活。
  连续方向键不得每次卡在请求上，不能把网络等待变成焦点导航成本。
- roving tabindex 在同一组件中只保留一个 0，其余设为 -1。
  移动时同时交换 tabindex 并调用 focus；不要只修改高亮。

```js
function moveFocus(items, current, next) {
  items[current].tabIndex = -1;
  items[next].tabIndex = 0;
  items[next].focus();
}
// 进入时按具体控件合同选择选中项或记忆项，不使用正数 tabindex。
```

### 可编辑组合框

- 列表框弹层使用 aria-controls 关联列表，用 aria-activedescendant 指向活动候选。
  DOM 焦点保留在输入框；不要拦截左右键和原生文本编辑键。
- Down/Up 移动候选，Enter 接受，Esc 先关闭候选。
  验收输入法确认不会执行命令；弹层状态必须与 aria-expanded 同步。

下面接入 [命令面板结构](complex-workflows.md#命令面板)，仅展示键盘与焦点骨架。
本单选建议采用选择跟随活动项：移动时同步 aria-selected 与可见高亮，接受时才执行命令。
过滤、关闭或重开时调用 clearActive，清理旧状态；目标 Safari 须验证输入法事件顺序。
业务命令仍执行禁用和确认检查。

```js
const input = document.querySelector('#command-search');
const list = document.querySelector('#command-options');
let active = -1;
function clearActive() {
  list.querySelectorAll('[role="option"]').forEach(option => {
    option.setAttribute('aria-selected', 'false');
  });
  active = -1;
  input.removeAttribute('aria-activedescendant');
}
function closeCandidates() {
  list.hidden = true; clearActive();
  input.setAttribute('aria-expanded', 'false');
}
function highlight(options) {
  options.forEach((option, index) => {
    option.setAttribute('aria-selected', String(index === active));
  });
  input.setAttribute('aria-activedescendant', options[active].id);
  options[active].scrollIntoView({ block: 'nearest' });
}
```

```js
input.addEventListener('keydown', e => {
  if (e.isComposing || e.keyCode === 229) return;
  const options = [...list.querySelectorAll('[role="option"]')];
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && options.length) {
    e.preventDefault();
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    const step = e.key === 'ArrowDown' ? 1 : -1;
    active = active < 0 ? (step > 0 ? 0 : options.length - 1)
      : (active + step + options.length) % options.length;
    highlight(options);
  } else if (e.key === 'Enter' && active >= 0 && !list.hidden) {
    e.preventDefault();
    executeCandidate(options[active]);
    closeCandidates();
  }
});
```

### 原生模态对话框

- 用 showModal 打开真正模态的 dialog，让背景不可交互。
  showModal 已提供原生焦点限制，无需手写 Tab 循环；只有非原生对话框才需实现循环与背景隔离。
- 打开后聚焦合适内部元素，长内容可先聚焦标题。
  关闭后回到触发器，触发器消失则回到合理的后续任务位置。
- Esc 在没有未关闭子层时关闭对话框。
  第一层在 keydown 中 preventDefault 并 stopPropagation；第二次保留原生 cancel 默认关闭。
  选择原生取消行为以避免重复关闭；cancel 清理候选，close 统一清理并归还焦点。

```js
const dialog = document.querySelector('#command');
const trigger = document.querySelector('#open-command');
const closer = document.querySelector('#close-command');
trigger.addEventListener('click', () => {
  dialog.showModal();
  document.querySelector('#command-search').focus();
});
closer.addEventListener('click', () => dialog.close());
dialog.addEventListener('keydown', e => {
  if (e.isComposing || e.keyCode === 229) {
    if (e.key === 'Escape') e.preventDefault();
    return;
  }
  if (e.key === 'Escape' && !list.hidden) {
    e.preventDefault(); e.stopPropagation(); closeCandidates();
  }
});
```

```js
dialog.addEventListener('cancel', () => { closeCandidates(); }); // 不 preventDefault，原生关闭。
dialog.addEventListener('close', () => {
  closeCandidates();
  if (trigger.isConnected) trigger.focus();
  else focusNextTask(); // 项目提供可聚焦的后续任务位置。
});
// 取消嵌套子层时阻止该次 Esc；其余情况保留原生 cancel 行为。
```

只用键盘走完打开、选择、关闭与归还，再用读屏核对名称和状态。
原生元素仍需在目标浏览器验证，不把上述骨架视为所有复合控件的完整实现。
