# AI 对话 / 智能体界面专项

制作聊天、检索回答或智能体工作台时读取本文件。先实现基础流式行为，再按任务接入来源、附件和运行恢复。

## 流式输出

- **逐段晕开，而不是硬蹦。** 新到达的文本按词（中文按字或分词结果）包进 span，播放 `blur(4~6px) → 0` 加淡入的动画，单段 120~150ms，相邻段错开 20~30ms。
- **流式结束后拆掉 span。** 输出完成后，把动画 span 换回纯文本节点。否则长回答里会堆积成千上万个带 `filter` 的节点，拖慢滚动和文字选中。采用支持结束清理的渲染路径，验收结束后动画节点和 filter 不再累积。
- **代码块、公式、SVG 内部不做动画**，整块出现即可。
- **未闭合的 Markdown 也要正确渲染。** 比如 `**加粗` 还没闭合时，不能先闪出星号，再突然变成粗体。可以用 Streamdown 或 `remend` 这类能处理不完整 Markdown 的解析器。
- **光标**：流式输出时，在末尾显示一个闪烁的光标或圆点；结束时立即移除。
- **自动滚动**：只有用户当前停在底部时（距底部 < 40px），才跟随新内容滚动。用户往上翻时停止跟随，并显示一个「回到底部」按钮。
- 新内容追加时，用 `overflow-anchor` 防止视口跳动（Chrome 56 / Firefox 66 / Safari 27 起支持）。

## 思考过程 / 工具调用

- 默认折叠，标题显示「已思考 12 秒 ›」。计时数字用 `tabular-nums`。
- 展开用网格 `0fr → 1fr` 做过渡，箭头旋转 90°；同步 [折叠合同](motion.md#常用模式) 的 inert、隐藏及焦点状态。
- 思考进行中，用细微的明暗流动（shimmer）提示状态，不要用转圈。
- 工具调用要显示正在做什么（「正在搜索…」「读取了 3 个文件」），完成后收拢成一行摘要。

## 输入框（Composer）

- 随内容自动长高：`field-sizing: content; max-height: 40vh`（Chrome 123 / Safari 26.2 / Firefox 152）。不支持的浏览器用 JS 设置 `height = scrollHeight` 作为回退。
- **Enter 发送，Shift+Enter 换行。中文输入法正在组词时，Enter 不能触发发送：**

```js
textarea.addEventListener('keydown', e => {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});
```
- 在目标 Safari 验证 compositionend 与 keydown 的事件顺序，确认候选不会发送。
- 聚焦按 [双环配方](foundations.md#5-阴影与描边)，同时验收焦点对比度。
- 内容为空时，发送按钮显示为禁用态。生成过程中，发送按钮变成「停止」按钮。
- 草稿要能保留：切换会话再回来时，草稿还在。

## 消息操作

- 消息操作显隐统一按 [激活与快捷键](accessibility.md#激活与快捷键)；确保键盘聚焦和触屏也能发现。
- **复制成功**：按钮图标换成对勾，带轻微回弹，2.5 秒后恢复原状。用 `aria-live="polite"` 播报「已复制」。
- 代码块右上角固定放复制按钮，复制时去掉行号。

## 布局

- 消息列表加 `scrollbar-gutter: stable`，避免滚动条出现时内容整体左移。
- 侧栏拖拽调宽时，松手后吸附到预设宽度（比如收起 64px 或展开 260px），用咬合型弹簧，不回弹。
- 正文行长按 [基础排版](foundations.md#2-字体)，消息列居中。

## 错误与边界状态

- 生成失败时，在该条消息内显示原因和「重试」按钮，不要清空用户已经输入的内容。
- 网络恢复与确认按 [反馈模式](patterns.md#10-加载通知与可信恢复) 处理。
- 超出长度或额度限制时，说明具体限制了什么，以及接下来可以怎么做。

## 来源、附件与分支

### 真实来源与附件能力

- 将引用保存为结构化的 source-url 或 source-document 部件。
  网页显示标题或域名链接，文档显示可识别名称；不要把普通文字中的方括号自动变成可信引用。
- 由业务验证来源与回答的对应关系。
  验收引用能定位到实际来源；不能因为部件类型正确就宣称内容已核验。
- 分开声明文件选择、上传和模型读取能力。
  AI SDK 的 FileList 自动转换示例仅涵盖 image/* 与 text/*；其他类型需自行接入处理路径。
- 选择前说明业务类型和大小限制，选择后显示逐文件处理阶段。
  上传阶段使用 [上传模型](complex-workflows.md#上传)；不要因为能选 PDF 就写“已读取全部页面”。

建议使用下面的消息部件骨架。变量来自可信业务层，不由模型自由文本拼接。

```js
const message = {
  messageId, parentId, branchId,
  parts: [
    { type: 'text', text: answerText },
    { type: 'source-url', sourceId, url: verifiedUrl, title: sourceTitle },
    { type: 'source-document', sourceId: documentId, title: documentName },
    { type: 'file', attachmentId, mediaType: file.type,
      filename: file.name, uploadPhase: 'processing', readable: false }
  ]
};
// readable 只能在处理路径确认可读取后更新，不能由 accept 属性推断。
```

### 编辑与分支

- 建议用 messageId、parentId 和 branchId 保存上下文路径。
  编辑前说明会创建新分支；不要直接改旧消息却让后续回复无提示地挂在原路径上。
- 保留原分支的回复与附件关系，并显示当前分支序号及总数。
  验收切回原分支仍能看到旧结果；不要用覆盖保存破坏历史。
- 发送前预览实际提交的上下文路径。
  验收只包含当前分支祖先消息，不能混入另一分支的回答。

```js
// 建议把消息视为不可变节点，编辑时创建新节点。
const edited = {
  messageId: crypto.randomUUID(),
  parentId: original.parentId,
  branchId: newBranchId,
  parts: editedParts
};
messages.set(edited.messageId, edited);
// original 保持不变；向 parentId 追溯得到此次发送的上下文。
```

## 长会话与运行恢复

### 锚点与缓存

- 建议虚拟化长会话时测量可变高度，以消息 ID 和视口偏移记录阅读锚点。
  向上补历史后恢复同一锚点；不要让用户突然被拖回底部。
- 不回收正在聚焦的消息操作节点。
  用 Tab 和补历史共同验收；不要因移出渲染窗口把键盘焦点丢到页面根部。
- 为未挂载的历史提供全文搜索或导出入口。
  验收能获取窗口以外的内容；不要把浏览器只能搜索挂载节点当成完整历史搜索。
- 建议保持完成块的稳定引用，只更新活动尾块。
  按解析器确认的语法边界缓存完成块，不能按任意换行拆开仍未闭合的代码围栏。

### 流式 Markdown 合批

- 建议将短时间到达的分片合批后再解析，不在每个 token 到达时重解析全部历史。
  渲染器仍须支持未闭合 Markdown；节流不代表网络生成变快。
- 代码高亮和公式按需执行，不反复处理已经完成的块。
  用 [性能样本](performance.md#6-长内容与动效单独录制) 分开记录解析和高亮耗时。
- 用未闭合粗体、代码围栏和链接三个分片样本验收。
  另测链接与 HTML 安全策略；不能假定任何 Markdown 解析器都能安全修复流式输入。

以下骨架按绘制机会合批。renderTail 接入项目的流式解析器，输入必须经过其安全渲染路径。
每个运行创建独立实例；isCurrent 判断运行身份，避免旧分片写入新回答。

```js
function createTailRenderer(isCurrent, renderTail) {
  let text = '', frame = null, closed = false;
  function flush() {
    frame = null;
    if (isCurrent()) renderTail(text);
  }
  return {
    push(chunk) {
      if (closed || !isCurrent()) return;
      text += chunk;
      if (frame === null) frame = requestAnimationFrame(flush);
    },
    finish() {
      closed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      flush(); // 正常完成或停止时都保留当前部分答案。
    }
  };
}
```

### 工具失败与新运行

- 建议每次工具调用保存 toolCallId、参数摘要和运行状态。
  失败区分权限、参数、网络、结果未知；不要只给一个无法定位步骤的全局失败。
- 为失败步骤提供修正参数或重试单步。
  有副作用且结果未知时先查执行结果，再按 [幂等规则](patterns.md#11-表单的结构与并发) 重试。
  不得因支付工具超时就自动重复扣费。
- stop() 的客户端中止不等于后台生产者停止。
  可恢复流要接停止协议并持久化部分答案；确认方式沿用 [取消合同](async-feedback.md#真实进度旧数据和取消)。
- 重新生成创建新运行，建议用 activeStreamId 门控状态变更。
  验收旧停止响应晚到时新运行仍在；不要由旧响应清空新活动身份。

```js
const stoppingId = activeStreamId;
const result = await requestStop(stoppingId);
if (result.confirmed && activeStreamId === stoppingId) {
  markInterrupted(stoppingId);
  activeStreamId = null;
}
// 若停止结果未知，保留停止中状态和查询入口，不标记已停止。
```
