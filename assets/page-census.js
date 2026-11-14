// 整页普查：在目标页面的控制台或自动化 eval 里执行本文件全文，返回一份可比对的测量结果。
// 只读页面，不修改任何东西。LIMITS 是建议默认，项目调整时在方案单的「例外」里记录理由。
// findings 是超出上限的条目；notices 是需要人看一眼、但不算超限的提示。
// 同一标签承担不同字号角色时写 data-type-role；控件类别可用 data-control 声明。
// 判读方法见 references/coherence.md。每个目标视口各跑一次。
(() => {
  const LIMITS = { sectionRhythms: 2, alignLines: 2, fontSizes: 9, smallTextShare: 0.25, radii: 3,
    durations: 4, controlHeights: 3, borderWidths: 1, offGridValues: 2 };
  const cs = el => getComputedStyle(el);
  const rect = el => el.getBoundingClientRect();
  // 用户看得见才算：零尺寸、visibility 隐藏、自身或祖先 opacity 为 0 的都排除。
  const visible = el => {
    const r = rect(el);
    if (!(r.width > 0 && r.height > 0)) return false;
    if (el.checkVisibility) return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true });
    return cs(el).visibility !== 'hidden' && cs(el).opacity !== '0';
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
  const findings = [], notices = [];
  const flag = (ok, text) => { if (!ok) findings.push(text); };
  const notice = (ok, text) => { if (!ok) notices.push(text); };
  const dpr = devicePixelRatio;
  const media = el => ['IMG', 'CANVAS', 'VIDEO'].includes(el.tagName);
  const painted = el => {
    const s = cs(el);
    const bordered = ['Top', 'Right', 'Bottom', 'Left'].some(d => s['border' + d + 'Style'] !== 'none' && parseFloat(s['border' + d + 'Width']) > 0);
    return bordered || s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backgroundImage !== 'none' || s.boxShadow !== 'none' || media(el);
  };

  // 1. 区块节奏与对齐线
  let blocks = [...document.querySelectorAll('body > header, main > section, main > article, body > section, body > footer')].filter(visible);
  if (!blocks.length) blocks = [...document.body.children].filter(visible);
  const roleOf = el => el.dataset.typeRole || el.tagName.toLowerCase();
  const sections = blocks.map(el => {
    const s = cs(el);
    const texts = [...el.querySelectorAll('h1,h2,h3,p,a,button,label,summary,li')].filter(visible);
    const h = el.querySelector('h1,h2');
    return {
      el: name(el), height: Math.round(rect(el).height), padY: s.paddingTop + '/' + s.paddingBottom,
      minLeft: texts.length ? round(Math.min(...texts.map(t => rect(t).left)), 1) : null,
      heading: h ? roleOf(h) + ' ' + cs(h).fontSize : null,
      landmark: ['HEADER', 'FOOTER'].includes(el.tagName)
    };
  });
  const content = sections.filter(s => !s.landmark);
  const rhythms = distinct(content.map(s => s.padY));
  flag(rhythms.length <= LIMITS.sectionRhythms, '区块上下留白有 ' + rhythms.length + ' 种组合：' + rhythms.join('，'));
  const lefts = distinct(sections.map(s => s.minLeft).filter(v => v !== null));
  flag(lefts.length <= LIMITS.alignLines, '区块左对齐线有 ' + lefts.length + ' 条：' + lefts.join(' / ') + ' px');
  notice(lefts.length !== 2, '出现第二条左对齐线（' + lefts.join(' / ') + ' px）：确认它是合同里声明的缩进线');
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
  const totalChars = textEls.reduce((sum, el) => sum + ownChars(el), 0) || 1;
  const charsBySize = new Map();
  for (const el of textEls) charsBySize.set(cs(el).fontSize, (charsBySize.get(cs(el).fontSize) || 0) + ownChars(el));
  const smallChars = [...charsBySize].filter(([k]) => parseFloat(k) <= 12).reduce((sum, [, n]) => sum + n, 0);
  const smallShare = round(smallChars / totalChars);
  flag(smallShare <= LIMITS.smallTextShare, '12px 及以下文字占全部字符的 ' + Math.round(smallShare * 100) + '%');

  // 3. 间距、圆角、描边、控件、动效
  const spacing = [], offGrid = [];
  const props = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginBottom', 'rowGap', 'columnGap'];
  for (const el of all) {
    const s = cs(el);
    for (const p of props) {
      const v = round(parseFloat(s[p]));
      if (!v || v < 0) continue;
      spacing.push(v);
      if (!Number.isInteger(v / 4)) offGrid.push(v + 'px ' + p + ' ' + name(el));
    }
  }
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
  const heights = distinct(shaped.map(el => Math.round(rect(el).height)));
  flag(heights.length <= LIMITS.controlHeights, '控件高度 ' + heights.length + ' 档：' + heights.join('，') + ' px');
  const tiny = controls.filter(el => rect(el).height < 24 || rect(el).width < 24).map(name);
  flag(!tiny.length, '点击区域小于 24px：' + tiny.slice(0, 8).join('，'));
  const borderWidths = distinct(all.flatMap(el => {
    const s = cs(el);
    return ['Top', 'Right', 'Bottom', 'Left'].filter(d => s['border' + d + 'Style'] !== 'none').map(d => s['border' + d + 'Width']);
  }).filter(v => v !== '0px'));
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

  return {
    env: { url: location.href, viewport: innerWidth + 'x' + innerHeight, dpr, elements: all.length, overflowX },
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
