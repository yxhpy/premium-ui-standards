# 性能观感

在制作首屏、异步加载或长内容界面时读取本文件。
先确定测量场景，再实现占位与资源策略；加载和回滚的实现统一引用反馈模式。

## 1. 分开记录实验室与真实用户指标

- 按移动端、桌面端分别统计真实访问的第 75 百分位。
  良好目标为 LCP ≤ 2.5s、INP ≤ 200ms、CLS ≤ .1；CLS 没有时间单位。
  验收时写出设备分组和数据来源，不用一次本机测试冒充真实用户分位数。
- 没有真实用户数据时，只报告实验室结果和测量条件。
  验收报告必须明确“尚无真实用户分位数”；不要由 Lighthouse 得分推断所有访问都达标。
- 排查慢交互时，分别查看输入等待、事件处理、下一次绘制。
  在性能录制中定位最慢的交互；不要只优化 API 时长而忽略大 DOM 更新。

建议用以下记录结构固定实验条件。字段值来自实际测量，不预填通过结论。

```js
const sample = {
  scenario: '快速分片',
  device: deviceDescription,
  browser: browserVersion,
  network: networkProfile,
  contentLength: message.length,
  chunkRate: measuredChunksPerSecond,
  timings: { parsing: [], highlighting: [], painting: [] }
};
```

## 2. 首屏主资源尽早可发现

- 首屏主图不要设置 `loading="lazy"`，让浏览器在 HTML 中发现它。
  验收网络瀑布图，主图请求不能等整段界面脚本运行后才开始。
- 将 LCP 耗时拆成服务端响应、资源发现、下载和渲染延迟。
  只预加载确认关键的资源；不要预加载所有图片和字体，挤占首屏带宽。

下面的尺寸由文件元数据读取；不要把示例占位符直接写到生产页面。

```html
<!-- 模板语法：替换为实际文件尺寸与地址。 -->
<img src="{{首屏图片地址}}" width="{{原图宽}}" height="{{原图高}}"
     alt="{{有意义的描述}}">
```

## 3. 用最终内容的尺寸约束骨架

- 给图片和嵌入内容预留宽高或比例。
  验收时比较资源到达前后的边界；不要让下载完成的封面把下方按钮推走。
- 让骨架与最终内容共用容器、比例和间距。
  验收骨架替换前后的滚动位置；不要用一行短骨架替换一整段长正文。
- 刷新已有内容时保留最后成功结果。
  刷新失败的状态文案按 [可信恢复](patterns.md#10-加载通知与可信恢复) 实现，不清空旧内容。

建议刷新时保留旧内容 DOM 和尺寸，用 visibility 隐去旧内容并覆盖骨架；不把旧内容 display:none。
完成后更新内容再移除骨架，失败则恢复旧内容，状态明确为 stale-error；比较刷新前后边界无跳动。

```html
<div class="refresh-card" aria-busy="false">
  <div class="last-success">上次成功内容</div>
  <div class="refresh-skeleton" aria-hidden="true" hidden>骨架占位</div>
</div>
```

```css
.refresh-card { position: relative; }
.refresh-card[aria-busy="true"] .last-success { visibility: hidden; }
.refresh-skeleton { position: absolute; inset: 0; background: var(--hover); }
```

```js
function refreshing(busy) {
  card.setAttribute('aria-busy', String(busy));
  skeleton.hidden = !busy;
}
refreshing(true);
try { renderSuccess(await load()); }
catch { showStaleError(); } // 不改旧内容 DOM。
finally { refreshing(false); }
```

建议由图片元数据生成 `aspect-ratio`，不为所有封面写死同一比例。

```html
<div class="preview" style="aspect-ratio: {{原图宽}} / {{原图高}}">
  <div class="skeleton" aria-hidden="true"></div>
  <!-- 就绪后用 img 替换骨架，沿用同一个 preview 容器。 -->
</div>
```

```css
.preview { overflow: hidden; border-radius: var(--radius-md); }
.preview > * { display: block; inline-size: 100%; block-size: 100%; }
.preview img { object-fit: cover; }
.skeleton { background: var(--hover); }
```

## 4. 字体先可见，再检查度量稳定

- 为自托管字体明确选择 `font-display`。
  `swap` 先显示后备字，但可能换行；`optional` 采用不同的等待取舍。
  在冷缓存慢网中比较两者，不把“文字先可见”等同于“布局不跳”。
- 只预加载首屏确实使用的字体文件或字重。
  验收请求清单；不要把全部字重都放进预加载。

下面假定项目提供 Inter 可变字体文件，实际 wght 轴为 100～900；替换文件时核对真实范围。
静态文件须按每个实际字重分别声明 font-face，不把静态字体标成范围；不要求下载新字体。

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
body { font-family: var(--font-sans); }
```

- 建议在测试环境测量后备字体与产品字体的宽度差，再生成度量调整值。
  `size-adjust` 调整字形缩放，必要时另测上升、下降和行距度量。
  用真实标题、中文回退和按钮复查换行；不要照抄其他字体的百分比。

以下是离线调试骨架：先加载本地产品字体，再测同一文本的宽度。
输出仅用于生成后备 `@font-face` 的 `size-adjust`，不在每次页面加载时现算。

```js
await document.fonts.load('1rem "Inter"');
const ctx = document.createElement('canvas').getContext('2d');
function width(family, text) {
  ctx.font = `1rem ${family}`;
  return ctx.measureText(text).width;
}
const ratio = width('"Inter"', sampleText) / width('Arial', sampleText);
console.log(`size-adjust: ${ratio * 100}%;`);
// 将测得值写入后备字体的 @font-face，而非修改正文的字号。
```

## 5. 反馈时刻与完成时刻分别验收

- 加载指示的显示延迟和最短可见期按 [加载实现](patterns.md#10-加载通知与可信恢复) 配置。
  测试快速、阈值两侧和慢请求；内容就绪后立即可操作，不为动画额外冻结内容。
- 建议为乐观更新记录本地反馈、服务端确认、冲突协调三个时刻。
  回滚流程使用 [并发骨架](patterns.md#乐观更新与回滚)；不要把本地变色速度当保存服务耗时。

## 6. 长内容与动效单独录制

- 建议建立长消息、快速分片、大表格三个固定样本。
  每次记录上文的实验条件，分别归因解析、高亮、布局和绘制成本。
  由目标设备测量设预算，不编造所有设备通用的消息条数上限。
- 在输入、滚动、折叠和水墨 blur 期间检查主线程与 Paint Flashing。
  60Hz 的总帧周期约 16.7ms，不能全部分给 JS；不要仅凭属性名断言动画便宜。
- 水墨动画超预算时，建议先合批分片、减少同时动画的节点，必要时仅淡入。
  仍须在结束后执行 [流式清理](ai-chat.md#流式输出)，不要留下大量 filter 节点。
