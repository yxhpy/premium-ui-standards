# 上传与命令面板

实现复杂流程时加载；表格和批量选择仍按 [复杂组件](complex-components.md)。

## 上传

- 提供原生文件选择按钮；拖放只作附加入口。
  选择前显示实际类型和大小限制；不要让键盘用户只能面对拖放区。
- 建议每个文件独立保存阶段、错误和服务器任务身份。
  阶段区分选择、上传、处理中、完成、失败；文件选中不等于服务器处理完成。
- 上传失败时保留文件名、错误和重试入口。
  已上传项允许移除；服务端仍须校验文件，不能只信任 input 的 accept。
- 取消上传或处理按 [取消协议](patterns.md#10-加载通知与可信恢复) 确认结果。
  请求中止后仍保留查询身份，不直接宣布后台已停止。

```js
const item = {
  id: crypto.randomUUID(),
  file,
  name: file.name,
  phase: 'selected', // uploading | processing | done | failed
  loaded: 0,
  total: file.size,
  taskId: null,
  error: null
};
// 网络上传结束进入 processing；业务确认后才能进入 done。
// phase、文件名、进度、错误由同一个对象渲染到对应文件行。
```

## 命令面板

活动候选的单选语义与清理按组合框骨架同步；建议用同一属性驱动视觉高亮：

```css
[role="option"][aria-selected="true"] {
  background: var(--surface-3); color: var(--fg);
  outline: 1px solid var(--ring); outline-offset: -1px;
}
```


- 建议将模态对话框与可编辑组合框组合，打开后聚焦搜索框。
  使用 [组合框和对话框键盘骨架](accessibility.md#复合控件键盘合同)，不要只摆放 ARIA 属性。
- 每项显示适用对象、禁用原因和快捷键。
  禁用命令不得被点击或 Enter 执行；危险命令仍需确认，不在移动候选时执行。
- Esc 先关闭候选或子层，再关闭面板并归还焦点。
  用中文输入法和嵌套弹层验收，不让全局监听抢先关闭整层。

```html
<button id="open-command" type="button">打开命令</button>
<dialog id="command" aria-labelledby="command-title">
  <h2 id="command-title">命令</h2>
  <label for="command-search">搜索命令</label>
  <input id="command-search" role="combobox" aria-autocomplete="list"
         aria-expanded="true" aria-controls="command-options">
  <ul id="command-options" role="listbox" aria-label="可用命令">
    <li id="command-export" role="option" aria-selected="false">
      导出当前筛选结果
    </li>
  </ul>
  <button type="button" id="close-command">关闭</button>
</dialog>
```
