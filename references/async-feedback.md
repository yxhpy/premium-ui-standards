# 异步反馈与恢复骨架

在编写请求中的按钮、乐观更新、通知或后台取消时读取本文件。
建议由共享状态层承载这些逻辑；文中的 request、render 等函数是项目接入点。

## 延迟显示加载态

- 点击后立即显示按下反馈，但项目默认在 300ms 后才出现加载指示。
  用快速请求验收不会闪现 spinner；不要让用户在这段时间完全看不到响应。
- Vercel 的延迟建议范围是 150~300ms，已出现的指示可保留约 300~500ms 抑制闪烁。
  产品改值时记录理由；业务完成后立即允许操作，不能为凑时长冻结已完成内容。
- NN/G 的 .1 / 1 / 10s 是感知与注意力边界。
  不将它们直接用作 spinner 定时器；长等待说明按 [加载分级](patterns.md#3-加载) 显示。

下面实现默认显示延迟，不强制延后完成结果；新版请求开始后，旧请求不能修改忙碌态。

```js
async function run(request, region, spinner, render) {
  const id = Symbol();
  region.runId = id;
  region.setAttribute('aria-busy', 'true');
  spinner.hidden = true;
  const timer = setTimeout(() => {
    if (region.runId === id) spinner.hidden = false;
  }, 300);
  try {
    const value = await request();
    if (region.runId === id) render(value);
  } catch (error) {
    if (region.runId === id) throw error;
  } finally {
    clearTimeout(timer);
    if (region.runId === id) {
      region.setAttribute('aria-busy', 'false');
      spinner.hidden = true;
    }
  }
}
// 旧请求失败在内部忽略；调用方 catch 仅处理仍为当前请求的错误。
```

## 忙碌范围与按钮

- 保存一行时只将该行标为 aria-busy，不遮住仍可操作的整页。
  验收其他行能够继续操作；不要因更新一个徽标锁住全屏。
- 保留忙碌按钮的原 DOM、名称与焦点，在固定 1em 图标槽中放装饰 spinner。
  验收开始请求时按钮不跳宽、读屏名称仍为“保存”；不要用无名图标替掉全部文字。
- 防重复激活按 [禁用规则](accessibility.md#激活与快捷键) 处理。
  不要只加 aria-disabled 却仍让 Enter 发出请求。

```html
<button type="button" aria-busy="true" aria-disabled="true">
  <span class="busy-icon" aria-hidden="true">…</span>保存
</button>
```

```css
.busy-icon { display: inline-block; inline-size: 1em; }
```

## 乐观更新与回滚

- 建议只对高成功率、可恢复的操作乐观更新；高风险动作等待服务端确认。
  确认失败后要有持续可用的恢复入口，不把未确认操作直接写成“已保存”。
- 建议维护已确认基线与待处理操作队列；任一失败都移除该操作，并从基线重放剩余操作。
  不把另一笔乐观值当作回滚目标；验收初值 0、提交 1 再提交 2、两次失败后回到 0。
- 以下建议按单实体串行提交，显示仍立即更新；save 须提供业务幂等和权威确认值。
  多客户端并发另接服务端版本冲突协议；超时结果未知先查询，确认失败后才从队列移除。

以下骨架的 save 仅在确认成功或确认失败后结算；初始化基线只做一次。

```js
function repaint(entity) {
  entity.value = entity.pending.reduce((value, op) => op.apply(value), entity.confirmed);
  render(entity);
}
```

```js
async function update(entity, apply) {
  entity.pending ??= [];
  if (!Object.hasOwn(entity, 'confirmed')) entity.confirmed = entity.value;
  const op = { id: crypto.randomUUID(), apply };
  entity.pending.push(op);
  mark(op.id, '本地反馈'); repaint(entity);
  const before = entity.sending ?? Promise.resolve();
  entity.sending = before.then(async () => {
    try {
      const result = await save(entity.id, op.apply(entity.confirmed), op.id);
      entity.confirmed = result.value;
      mark(op.id, '服务端确认');
    } catch {
      showPersistentError(entity.id);
    } finally {
      entity.pending = entity.pending.filter(item => item !== op);
      mark(op.id, '冲突协调结束'); repaint(entity);
    }
  });
  await entity.sending;
}
```

绝对值赋值传入 `() => nextValue`；操作是函数时传入 `value => value + 1`。
发送时从已确认基线计算当前操作的目标值，重绘时依次应用待处理函数；不捕获失败的乐观值。
验收初值 0、两次加 1 连续失败回到 0，先失败后成功为 1。

```js
update(entity, value => value + 1); // 函数操作。
update(entity, () => 8); // 绝对赋值。
```

## 通知的播报与恢复路径

- 通知容器须在页面加载时就存在，普通和带操作通知均用 polite / role=status。
  只有真实紧急错误用 role=alert；通知操作不依赖自动聚焦，消失后须有常驻入口完成同一操作。
  检查所用库默认值；Radix Toast 默认 foreground，后台完成可用 background。
  用读屏队列验收，不让大量后台完成消息不断打断用户。
- 带操作的 Toast 默认至少 6s；Radix 默认 5s，不能混写为同一个默认。
  hover、focus 和窗口失焦时暂停计时，逐种状态验收。
- 给通知区域可发现的入口；Radix 默认 F8 时须向用户说明。
  Action altText 写清等效操作位置，不只写“按钮”。
- Toast 关闭后保留历史等恢复路径。
  必须取得用户答复时用对话框；不要把 Toast 永久挂着当确认框。

```html
<!-- 页面初始就存在且不 hidden 的播报节点；出现通知时更新文字。 -->
<div id="notification-status" role="status" aria-atomic="true"></div>
<div id="notification" hidden>
  <span>已归档</span><button type="button">撤销归档</button>
</div>
<a href="#history">查看记录与撤销</a>
<section id="history"><button type="button">撤销最近归档</button></section>
```

播报节点与可操作通知分离时，每次事件须同步更新播报文字；空节点本身不会播报。
也可将初始存在且不隐藏的 status 容器包在通知外层，由其播报子内容变化。

```js
function showArchiveNotice() {
  document.querySelector('#notification').hidden = false;
  document.querySelector('#notification-status').textContent =
    '已归档；可在记录中撤销归档。';
}
```

## 真实进度、旧数据和取消

- 只有总量可计算时才显示确定百分比。
  未知时省略 progress 的 value，配真实阶段或已处理项数；不要用耗时伪造 99%。

```html
<label for="import-progress">正在处理导入文件</label>
<progress id="import-progress"></progress>
<!-- 取得可信总量后才设置 value 和 max，并更新可见进度文字。 -->
```

- 建议区分 initial-loading、ready、refreshing、stale-error、initial-error。
  刷新失败保留最后成功内容，标“更新失败，显示上次数据”并提供重试；不要清空或继续声称实时。
- 建议取消过程区分 running、cancel-requested、cancelled。
  abort 只证明客户端请求或读取中止；后台任务须专门协议确认，未知时保留 taskId 查询入口。
- online 只作为联网线索；同步队列建议区分 queued、sending、confirmed。
  业务确认后才移除“尚未同步”；不要 Wi-Fi 恢复就宣称保存成功。
