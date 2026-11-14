// 整页普查：在目标页面的控制台或自动化 eval 里执行本文件全文，返回一份可比对的测量结果。
// 只读页面，不修改任何东西。LIMITS 是建议默认，项目调整时在方案单的「例外」里记录理由。
// findings 是超出上限的条目；notices 是要人看一眼、但不算超限的提示；coverage 说明这次量到了哪些。
// 区块写 data-census-region，属性值是对齐作用域（如 shell、pane、content）：同值的区块互相比对节奏和对齐线。
// 同一标签承担不同字号角色时写 data-type-role；控件类别可用 data-control 声明。
// 隐藏的状态（对话框、步骤、折叠区、移出画面的抽屉、隐藏的提示）量不到，会列进 notices：逐个打开后再跑。判读方法见 references/coherence.md。
(() => {
  const LIMITS = { sectionRhythms: 2, alignLines: 2, fontSizes: 9, smallTextShare: 0.25, radii: 3, durations: 4,
    controlHeights: 3, borderWidths: 1, offGridValues: 2, regionTextShare: 0.8, tallControl: 64 };
  const cs = el => getComputedStyle(el);
  const rect = el => el.getBoundingClientRect();
  const shown = el => el.checkVisibility
    ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true })
    : cs(el).display !== 'none' && cs(el).visibility !== 'hidden' && cs(el).opacity !== '0';
  // display: contents 没有自己的盒子，按父元素判断是否渲染。
  const rendered = el => !el || el === document.body ||
    (cs(el).display === 'contents' ? rendered(el.parentElement) : shown(el));
  // 完全移出画面：fixed 按视口四边算，absolute 按整个文档四边算，折叠线以下的正文不算移出。
  const root = document.documentElement;
  const offstage = el => {
    const s = cs(el), r = rect(el);
    if (s.position === 'fixed') return r.right <= 0 || r.bottom <= 0 || r.left >= root.clientWidth || r.top >= root.clientHeight;
    return s.position === 'absolute' && (r.right + scrollX <= 0 || r.bottom + scrollY <= 0 ||
      r.left + scrollX >= root.scrollWidth || r.top + scrollY >= root.scrollHeight);
  };
  // 读屏专用（裁切到 1px 以内）和移出画面的元素，连同子孙都不算用户看得见。
  const tuckedCache = new Map();
  const tucked = el => {
    if (!el || el === document.body) return false;
    if (tuckedCache.has(el)) return tuckedCache.get(el);
    const s = cs(el), r = rect(el);
    const clipped = s.display !== 'contents' && r.width <= 1 && r.height <= 1 &&
      (s.overflow !== 'visible' || s.clip !== 'auto' || s.clipPath !== 'none');
    const v = clipped || offstage(el) || tucked(el.parentElement);
    tuckedCache.set(el, v);
    return v;
  };
  // 用户看得见才算：零尺寸、visibility 隐藏、自身或祖先 opacity 为 0、读屏专用、移出文档的都排除。
  const visible = el => {
    const r = rect(el);
    return r.width > 0 && r.height > 0 && shown(el) && !tucked(el);
  };
  const round = (v, n = 2) => Math.round(v * 10 ** n) / 10 ** n;
  const distinct = list => [...new Set(list)];
  const tally = list => {
    const m = new Map();
    for (const v of list) m.set(v, (m.get(v) || 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ×' + n);
  };
  const name = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  const all = [...document.body.querySelectorAll('*')]
    .filter(el => !el.closest('svg') || el.tagName.toLowerCase() === 'svg').filter(visible);
  const ownChars = el => [...el.childNodes].filter(n => n.nodeType === 3)
    .reduce((sum, n) => sum + n.textContent.trim().length, 0);
  const textEls = all.filter(el => ownChars(el) > 0);
  const charsOf = list => list.reduce((sum, el) => sum + ownChars(el), 0);
  const totalChars = charsOf(textEls) || 1;
  const findings = [], notices = [];
  const flag = (ok, text) => { if (!ok) findings.push(text); };
  const notice = (ok, text) => { if (!ok) notices.push(text); };
  const dpr = devicePixelRatio;
  const media = el => ['IMG', 'CANVAS', 'VIDEO'].includes(el.tagName);
  // 颜色的不透明度：transparent 和 alpha 为 0 的颜色等于没画。
  const alpha = c => {
    if (!c || c === 'transparent') return 0;
    const m = c.match(/\/\s*([\d.]+)(%?)\s*\)$/) || c.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)(%?)\s*\)$/);
    return m ? parseFloat(m[1]) / (m[2] ? 100 : 1) : 1;
  };
  // 逐边判断：样式不是 none、宽度大于 0、颜色不透明，这条边才算可见。
  const edges = s => ['Top', 'Right', 'Bottom', 'Left'].filter(d => s['border' + d + 'Style'] !== 'none' &&
    parseFloat(s['border' + d + 'Width']) > 0 && alpha(s['border' + d + 'Color']) > 0);
  const painted = el => {
    const s = cs(el);
    return edges(s).length > 0 || alpha(s.backgroundColor) > 0 || s.backgroundImage !== 'none' || s.boxShadow !== 'none' || media(el);
  };

  // 1. 区块、节奏与对齐线。优先取 data-census-region；没有标注时用常见结构，再退回 body 的子元素。
  const marked = [...document.querySelectorAll('[data-census-region]')].filter(visible);
  const selected = [...document.querySelectorAll('body > header, main > section, main > article, body > section, body > footer')].filter(visible);
  const mode = marked.length ? 'marked' : selected.length ? 'selector' : 'fallback';
  const blocks = mode === 'marked' ? marked : mode === 'selector' ? selected : [...document.body.children].filter(visible);
  const roleOf = el => el.dataset.typeRole || el.tagName.toLowerCase();
  const sections = blocks.map(el => {
    const s = cs(el);
    const texts = textEls.filter(t => el.contains(t));
    // 卡片、面板里的文字带内边距：取比区块窄、里面有文字的有边界外框的左边，不把框内缩进当成另一条对齐线。
    // 没有文字的装饰点、分隔线，以及绝对定位的装饰层，都不算外框。
    const frames = all.filter(b => b !== el && el.contains(b) && !media(b) && painted(b) &&
      !['absolute', 'fixed'].includes(cs(b).position) && rect(b).width < rect(el).width - 1 &&
      texts.some(t => b.contains(t)));
    const starts = [...texts, ...frames].map(t => rect(t).left);
    const h = [...el.querySelectorAll('h1,h2')].find(visible);
    return {
      el: name(el), scope: el.dataset.censusRegion || 'page', height: Math.round(rect(el).height),
      padY: s.paddingTop + '/' + s.paddingBottom,
      minLeft: starts.length ? round(Math.min(...starts), 1) : null,
      heading: h ? roleOf(h) + ' ' + cs(h).fontSize : null,
      landmark: ['HEADER', 'FOOTER'].includes(el.tagName)
    };
  });
  // 应用外框的侧栏、工具栏、阅读列各有自己的对齐线：按作用域分别计数，每个作用域各套上限。
  const scopes = distinct(sections.map(s => s.scope));
  for (const scope of scopes) {
    const group = sections.filter(s => s.scope === scope);
    const tag = scopes.length > 1 ? '（' + scope + '）' : '';
    const rhythms = distinct(group.filter(s => !s.landmark).map(s => s.padY));
    flag(rhythms.length <= LIMITS.sectionRhythms, '区块上下留白' + tag + '有 ' + rhythms.length + ' 种组合：' + rhythms.join('，'));
    const lefts = distinct(group.map(s => s.minLeft).filter(v => v !== null));
    flag(lefts.length <= LIMITS.alignLines, '区块左对齐线' + tag + '有 ' + lefts.length + ' 条：' + lefts.join(' / ') + ' px');
    notice(lefts.length !== 2, '出现第二条左对齐线' + tag + '（' + lefts.join(' / ') + ' px）：确认它是合同里声明的缩进线');
  }
  const regionShare = round(charsOf(textEls.filter(t => blocks.some(b => b.contains(t)))) / totalChars);
  notice(mode !== 'fallback', '没有找到区块，退回 body 的直接子元素来量：给主要区块写 data-census-region');
  notice(mode === 'fallback' || regionShare >= LIMITS.regionTextShare,
    '区块只覆盖 ' + Math.round(regionShare * 100) + '% 的文字，其余内容的节奏和对齐没量到：给主要区块写 data-census-region');
  const roleSizes = new Map();
  for (const h of [...document.querySelectorAll('h1,h2,h3,[data-type-role]')].filter(visible)) {
    const k = roleOf(h);
    roleSizes.set(k, distinct([...(roleSizes.get(k) || []), cs(h).fontSize]));
  }
  for (const [role, list] of roleSizes) flag(list.length <= 1, '同一角色 ' + role + ' 有 ' + list.length + ' 种字号：' + list.join('，'));

  // 2. 字号阶梯与层级落差
  const sizes = textEls.map(el => cs(el).fontSize);
  const sizeSet = distinct(sizes);
  flag(sizeSet.length <= LIMITS.fontSizes, '实际字号 ' + sizeSet.length + ' 种，超过 ' + LIMITS.fontSizes + ' 种');
  const fractional = sizeSet.filter(v => !Number.isInteger(round(parseFloat(v) * dpr, 3)));
  flag(!fractional.length, '字号未落在设备像素上：' + fractional.join('，'));
  const charsBySize = new Map();
  for (const el of textEls) charsBySize.set(cs(el).fontSize, (charsBySize.get(cs(el).fontSize) || 0) + ownChars(el));
  const smallChars = [...charsBySize].filter(([k]) => parseFloat(k) <= 12).reduce((sum, [, n]) => sum + n, 0);
  const smallShare = round(smallChars / totalChars);
  flag(smallShare <= LIMITS.smallTextShare, '12px 及以下文字占全部字符的 ' + Math.round(smallShare * 100) + '%');

  // 3. 间距、圆角、描边、控件、动效
  const spacing = [], offGrid = [];
  const props = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap'];
  const margins = { marginTop: 'margin-top', marginBottom: 'margin-bottom' };
  let guessedAuto = 0;
  for (const el of all) {
    const s = cs(el);
    let typed = null;
    for (const p of props) {
      const v = round(parseFloat(s[p]));
      if (!v || v < 0) continue;
      // auto 外边距是 flex、grid 里推开元素的余量，不是间距值。读不到关键字的浏览器只能跳过并提示。
      if (margins[p]) {
        if (el.computedStyleMap) {
          typed = typed || el.computedStyleMap();
          if (String(typed.get(margins[p])) === 'auto') continue;
        } else if (/flex|grid/.test(cs(el.parentElement).display)) { guessedAuto++; continue; }
      }
      spacing.push(v);
      if (!Number.isInteger(v / 4)) offGrid.push(v + 'px ' + p + ' ' + name(el));
    }
  }
  notice(!guessedAuto, guessedAuto + ' 处 flex、grid 子项的纵向外边距没有计入：这个浏览器读不到 auto 关键字，到 Chromium 里再跑一次');
  // 小于 4px 的值多为描边补偿，不计入；其余不在 4 的倍数上的值按合同至多 2 个命名例外。
  const offGridValues = distinct(offGrid.map(v => v.split(' ')[0])).filter(v => parseFloat(v) >= 4);
  flag(offGridValues.length <= LIMITS.offGridValues, '不在 4 的倍数上的间距值有 ' + offGridValues.length + ' 个：' + offGridValues.join('，'));
  const radii = distinct(all.map(el => cs(el).borderTopLeftRadius)
    .filter(v => v !== '0px' && !v.includes('%') && parseFloat(v) < 999));
  flag(radii.length <= LIMITS.radii, '圆角 ' + radii.length + ' 档：' + radii.join('，'));
  const controls = [...document.querySelectorAll('button, input, select, textarea, a[class*="button"], a[class*="btn"]')].filter(visible);
  const shaped = controls.filter(el => !['checkbox', 'radio', 'range'].includes(el.type));
  // 同类控件同一档圆角：全圆、无底无框的文字操作、有底或有框的按钮分别比对。
  const kindOf = el => {
    if (el.dataset.control) return el.dataset.control;
    const r = rect(el), rad = cs(el).borderTopLeftRadius;
    const full = rad.includes('%') ? parseFloat(rad) >= 50 : parseFloat(rad) >= Math.min(r.width, r.height) / 2;
    return full ? 'round' : painted(el) ? 'boxed' : 'bare';
  };
  const controlRadii = {};
  for (const el of shaped) {
    const k = kindOf(el);
    controlRadii[k] = distinct([...(controlRadii[k] || []), cs(el).borderTopLeftRadius]);
  }
  for (const [k, list] of Object.entries(controlRadii)) {
    if (k !== 'round' && k !== 'bare') flag(list.length <= 1, '同类控件（' + k + '）圆角不统一：' + list.join('，'));
  }
  // 多行输入和复合控件不是按钮档位，不计入高度档，列进提示，人工确认同类同高。
  // 复合控件指高 64px 及以上、或文字分成多行的控件。文字片段中心高低相差超过半个字高才算分行，徽标和不同字号的字不算。
  const stacked = el => {
    const boxes = [];
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim() || !visible(n.parentElement)) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      boxes.push(...[...range.getClientRects()].filter(q => q.width > 0 && q.height > 0));
    }
    const mids = boxes.map(q => q.top + q.height / 2);
    return boxes.length > 1 && Math.max(...mids) - Math.min(...mids) >= Math.max(...boxes.map(q => q.height)) / 2;
  };
  const tall = el => el.tagName === 'TEXTAREA' || rect(el).height >= LIMITS.tallControl || stacked(el);
  const heights = distinct(shaped.filter(el => !tall(el)).map(el => Math.round(rect(el).height)));
  flag(heights.length <= LIMITS.controlHeights, '控件高度 ' + heights.length + ' 档：' + heights.join('，') + ' px');
  const composite = shaped.filter(tall);
  notice(!composite.length, composite.length + ' 个多行输入或复合控件没有计入高度档（' +
    distinct(composite.map(el => Math.round(rect(el).height) + 'px')).join('，') + '）：确认同类同高');
  // 点击区：控件本身达到 24px；复选框和单选框也可以靠任一可见 label 达到 24px。
  const big = r => r.width >= 24 && r.height >= 24;
  const viaLabel = el => ['checkbox', 'radio'].includes(el.type) && [...el.labels].some(l => visible(l) && big(rect(l)));
  const tiny = controls.filter(el => !big(rect(el)) && !viaLabel(el)).map(name);
  flag(!tiny.length, '点击区域小于 24px：' + tiny.slice(0, 8).join('，'));
  const borderWidths = distinct(all.flatMap(el => {
    const s = cs(el);
    return edges(s).map(d => s['border' + d + 'Width']);
  }));
  flag(borderWidths.length <= LIMITS.borderWidths, '描边宽度 ' + borderWidths.length + ' 种：' + borderWidths.join('，'));
  const durations = distinct(all.flatMap(el => cs(el).transitionDuration.split(',').map(v => v.trim())).filter(v => v !== '0s'));
  flag(durations.length <= LIMITS.durations, '过渡时长 ' + durations.length + ' 档：' + durations.join('，'));

  // 4. 像素对齐与位图清晰度。只查有可见边界的盒子；宽度随文字走的行内标签只记提示。
  const off = el => {
    const r = rect(el);
    return [r.left, r.width, r.height].some(v => Math.abs(v * dpr - Math.round(v * dpr)) > 0.02);
  };
  const inlineChip = el => !media(el) && (cs(el).display.startsWith('inline') || ownChars(el) > 0);
  const offAll = all.filter(painted).filter(off);
  const offPixel = offAll.filter(el => !inlineChip(el));
  flag(!offPixel.length, offPixel.length + ' 个有可见边界的盒子未落在设备像素上');
  notice(offAll.length === offPixel.length, (offAll.length - offPixel.length) + ' 个带底色或描边的文字标签尺寸随文字带小数：放大看边缘是否发虚');
  const soft = [...document.images].filter(visible).filter(img => img.naturalWidth && !/svg/i.test(img.currentSrc))
    .filter(img => img.naturalWidth < Math.floor(rect(img).width * dpr))
    .map(img => img.currentSrc.split('/').pop() + ' 固有 ' + img.naturalWidth + 'px，需要 ' + Math.ceil(rect(img).width * dpr) + 'px');
  flag(!soft.length, '位图分辨率不足：' + soft.join('；'));
  const unloaded = [...document.images].filter(img => !img.complete || !img.naturalWidth).length;
  notice(!unloaded, unloaded + ' 张图片尚未加载，清晰度没有检查：把整页滚一遍、等加载完再跑');
  const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  flag(overflowX <= 0, '整页横向溢出 ' + overflowX + 'px');

  // 5. 覆盖：隐藏状态（未打开的对话框、折叠区、移出画面的抽屉、隐藏的提示）这次量不到，只列最外层，逐个打开后再跑。
  // 聚焦才出现的单个跳转链接，以及透明盖在可见 label 上的自定义复选、单选，不算隐藏状态。
  const CONTROL = 'button, select, textarea, a[href], input:not([type="hidden"]):not([type="file"])';
  const away = el => !!el && el !== document.body && (!rendered(el) || (offstage(el) && !el.matches(CONTROL)));
  // 只有文字的隐藏区域，只算用 hidden 属性藏起来、收在折叠区里，或移出画面且不止 1px 的（多是提示、答案和抽屉）；
  // 媒体查询藏起来的响应式文字、读屏专用的播报区不算。
  const quietState = el => !!el.textContent.trim() && (el.hidden || !!el.closest('details:not([open])') ||
    (offstage(el) && (rect(el).width > 1 || rect(el).height > 1)));
  const outermost = [...document.body.querySelectorAll('*')].filter(el =>
    !['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'OPTION', 'OPTGROUP', 'DATALIST'].includes(el.tagName) && !el.closest('svg') &&
    cs(el).display !== 'contents' && away(el) && !away(el.parentElement) && ![...(el.labels || [])].some(visible));
  const stateEls = outermost.filter(el => el.matches(CONTROL) || !!el.querySelector(CONTROL) || quietState(el));
  const hiddenStates = stateEls.map(name);
  notice(!hiddenStates.length, hiddenStates.length + ' 个隐藏状态没有量到：' + hiddenStates.slice(0, 12).join('，') +
    (hiddenStates.length > 12 ? ' 等' : '') + '。逐个打开后再跑；本视口本就不显示的响应式内容可以忽略');
  // 样式藏起来的纯文字分不清是响应式内容，还是操作后才显示的提示（错误、结果）：不逐个点名，汇总成一条，名单放在 coverage。
  const styledText = outermost.filter(el => !stateEls.includes(el) && !rendered(el) && !!el.textContent.trim()).map(name);
  notice(!styledText.length, styledText.length + ' 段只有文字的内容被样式隐藏，没有逐个列出（名单见 coverage.styledText）：' +
    '其中操作后才显示的提示（错误、结果）要造出来再跑');

  return {
    env: { url: location.href, viewport: innerWidth + 'x' + innerHeight, dpr, elements: all.length, overflowX },
    coverage: { mode, regions: blocks.length, scopes, textShare: regionShare, hiddenStates, styledText },
    findings,
    notices,
    sections,
    type: { fontSize: tally(sizes), charsBySize: [...charsBySize].sort((a, b) => b[1] - a[1]).map(([k, n]) => k + ' ' + n + ' 字'), smallShare,
      roles: [...roleSizes].map(([k, v]) => k + ' ' + v.join('/')), fontWeight: tally(textEls.map(el => cs(el).fontWeight)), color: tally(textEls.map(el => cs(el).color)) },
    spacing: { distinct: distinct(spacing).sort((a, b) => a - b), offGrid: tally(offGrid.map(v => v.split(' ')[0])), offGridWho: offGrid.slice(0, 20) },
    shape: { radii, controlRadii, borderWidths, controlHeights: heights },
    motion: { durations },
    pixel: { offPixel: offPixel.length, inlineChips: offAll.length - offPixel.length,
      sample: offPixel.slice(0, 12).map(el => name(el) + ' x' + round(rect(el).left) + ' w' + round(rect(el).width) + ' h' + round(rect(el).height)), softImages: soft }
  };
})()
