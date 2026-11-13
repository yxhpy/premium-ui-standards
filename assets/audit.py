"""无依赖静态验收；从任意目录运行。真实交互按 checklist 另测。"""
from pathlib import Path
import argparse
import re
from urllib.parse import unquote

parser = argparse.ArgumentParser(description='检查 skill 静态结构、代码引用与可读性')
parser.add_argument('--readability', action='store_true', help='额外输出重点文件的正文最长行和代码段统计')
args = parser.parse_args()
ROOT = Path(__file__).resolve().parents[1]
errors = []

def check(ok, label):
    print(('通过 ' if ok else '失败 ') + label)
    if not ok:
        errors.append(label)

def slug(text):
    return re.sub(r'[^\w\s-]', '', text.lower()).replace(' ', '-')

skill = (ROOT / 'SKILL.md').read_text()
match = re.match(r'^---\n(.*?)\n---\n', skill, re.S)
fields = dict(re.findall(r'^(name|description): (.+)$', match[1], re.M)) if match else {}
check(bool(match) and fields.get('name') == 'premium-ui-standards' and bool(fields.get('description')), 'frontmatter 为简单有效映射，含固定 name 和单段 description')
links = []
for path in [ROOT / 'SKILL.md', ROOT / 'README.md', *sorted((ROOT / 'references').glob('*.md'))]:
    for target in re.findall(r'\]\(([^)]+)\)', path.read_text()):
        if re.match(r'https?://', target):
            continue
        file, _, anchor = unquote(target).partition('#')
        resolved = path.parent / file if file else path
        ok = resolved.is_file()
        if ok and anchor:
            headings = re.findall(r'^#+ (.+)$', resolved.read_text(), re.M)
            ok = anchor in [slug(h) for h in headings]
        links.append(ok)
        if not ok:
            print('无效链接', path.relative_to(ROOT), target)
check(all(links), f'相对链接及锚点 {sum(links)}/{len(links)}')
refs = sorted((ROOT / 'references').glob('*.md'))
check(all(f'(references/{f.name})' in skill for f in refs), f'索引覆盖 {len(refs)}/{len(refs)} 参考文件')
css = (ROOT / 'assets/tokens.css').read_text()
clean = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
# 按字符串/括号状态扫描规则和声明，而非只计花括号总数。
stack, segment, quote, parentheses, declarations = [], '', None, 0, []
syntax = True
for char in clean:
    if quote:
        segment += char
        if char == quote:
            quote = None
        continue
    if char in '\"\'':
        quote = char
        segment += char
    elif char == '(':
        parentheses += 1
        segment += char
    elif char == ')':
        parentheses -= 1
        segment += char
    elif char == '{' and parentheses == 0:
        syntax &= bool(segment.strip())
        stack.append(segment.strip())
        segment = ''
    elif char == ';' and parentheses == 0:
        syntax &= bool(stack) and ':' in segment
        declarations.append(segment.strip())
        segment = ''
    elif char == '}' and parentheses == 0:
        syntax &= bool(stack) and not segment.strip()
        if stack:
            stack.pop()
        segment = ''
    else:
        segment += char
syntax &= not stack and not segment.strip() and parentheses == 0 and quote is None
check(syntax, f'CSS 花括号/括号/字符串配对，{len(declarations)} 条声明均以分号结尾')
definitions = set(re.findall(r'(--[\w-]+)\s*:', clean))
uses = set(re.findall(r'var\(\s*(--[\w-]+)', clean))
ref_uses = set()
for path in refs:
    # sources 中的连字符不构成自定义属性；其余所有 --名称 都检查。
    ref_uses.update(re.findall(r'(?<![\w-])--[a-zA-Z][\w-]*', path.read_text()))
local_definitions = set().union(*(set(re.findall(r'(--[\w-]+)\s*:', p.read_text())) for p in refs))
missing = (uses - definitions) | (ref_uses - definitions - local_definitions)
check(not missing, f'CSS/参考自定义属性全部定义；缺失 {sorted(missing)}，参考引用 {len(ref_uses)} 个')
graph = {}
for name, value in re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', clean):
    graph.setdefault(name, set()).update(re.findall(r'var\(\s*(--[\w-]+)', value))
def cyclic(name, ancestors):
    return name in ancestors or any(cyclic(x, ancestors | {name}) for x in graph.get(name, []))
check(not any(cyclic(x, set()) for x in graph), 'token 引用无循环，基础层无向上引用')
base_upward = [x for k, v in graph.items() if k.startswith('--base-') for x in v if not x.startswith('--base-')]
check(not base_upward, '基础层依赖方向通过')
font_values = re.findall(r'--(?:base-)?text-[\w-]+\s*:\s*([^;]+);', clean)
check(all('px' not in v and ('rem' in v or 'var(' in v) for v in font_values), f'字号 token {len(font_values)} 条均为 rem 或别名，无 px')
check(not re.search(r'font-size\s*:\s*(?:[\d.]+px|62\.5%)', clean), '根字号未固定 px/62.5%')
for path in [ROOT / 'SKILL.md', *refs]:
    n = len(path.read_text().splitlines())
    check(n <= (120 if path.name == 'SKILL.md' else 220), f'行数 {path.relative_to(ROOT)}={n}')
research = ROOT.parent / 'research'
if research.is_dir():
    urls = lambda text: set(re.findall(r'https?://[^\s)）>]+', text))
    known = set().union(*(urls(f.read_text()) for f in research.glob('[0-9][0-9]-*.md')))
    listed = urls((ROOT / 'references/sources.md').read_text())
    check(listed <= known, f'来源 URL {len(listed)} 个均出自 research，新增外部 URL {len(listed-known)}')
    ledger = (ROOT / 'references/sources.md').read_text()
    rows = re.findall(r'^\| (\d{2}) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|', ledger, re.M)
    keys = [row[0] for row in rows]
    check(len(keys) == 15 and set(keys) == {f'{i:02}' for i in range(1, 16)}, '覆盖表专题01～15完整且唯一')
    check(len(rows) == 15 and all(int(n) == int(a)+int(b)+int(c) for _, n, a, b, c in rows) and sum(int(x[1]) for x in rows) == 128, '覆盖表15篇、128条互斥计数守恒')
    counts = {f.stem[:2]: len(re.findall(r'^## [A-Z]\d{2} ', f.read_text(), re.M)) for f in research.glob('[0-9][0-9]-*.md')}
    check(all(counts.get(key) == int(n) for key, n, *_ in rows), '覆盖表逐篇数量与research原编号相符')
    destinations_ok = True
    for f in research.glob('[0-9][0-9]-*.md'):
        expected = re.findall(r'^## ([A-Z]\d{2}) ', f.read_text(), re.M)
        lines = re.findall(r'^\| ' + f.stem[:2] + r' \|.*$', ledger, re.M)
        if len(lines) != 1:
            destinations_ok = False
            continue
        entries = re.findall(r'([A-Z]\d{2})→([^；|]+)', lines[0].split('；说明：')[0])
        valid = all((ROOT / 'references' / target).is_file() or target.startswith('舍弃：') for _, target in entries)
        destinations_ok &= valid and len(entries) == len(expected) and {key for key, _ in entries} == set(expected)
        discarded = sum(target.startswith('舍弃：') for _, target in entries)
        destinations_ok &= discarded == int(lines[0].split('|')[5].strip())
    check(destinations_ok, '每条规则具有唯一有效去向或明确舍弃说明，舍弃数一致')
    print('覆盖总数 新增/合并/舍弃', '/'.join(str(sum(int(row[i]) for row in rows)) for i in [2,3,4]))
# 行数上限仍为入口 120、参考 220；新增展开质量约束，不放宽旧检查。
core = {'performance.md', 'complex-components.md', 'token-engineering.md'}
for path in refs:
    fenced = False
    block_lines, blocks, prose = 0, [], []
    for number, line in enumerate(path.read_text().splitlines(), 1):
        if line.startswith('```'):
            if fenced:
                blocks.append(block_lines)
                block_lines = 0
            fenced = not fenced
        elif fenced:
            block_lines += 1
        elif not line.lstrip().startswith('|'):
            prose.append((number, len(line)))
    check(not fenced, f'代码围栏闭合 {path.name}')
    if path.name != 'sources.md':
        check(max(blocks, default=0) <= 25, f'代码块≤25行 {path.name}')
        check(all(n <= 160 for _, n in prose), f'正文行≤160字符 {path.name}')
    if path.name in core:
        check(len(blocks) >= 3, f'重点文件至少3段代码 {path.name}={len(blocks)}')
        check(90 <= len(path.read_text().splitlines()) <= 200, f'重点文件90～200行 {path.name}')
        if args.readability:
            print(f'可读性 {path.name}：正文最长{max(n for _, n in prose)}字符，代码{len(blocks)}段，最长代码块{max(blocks)}行')
print('静态验收', '全部通过' if not errors else f'{len(errors)} 项失败')
raise SystemExit(bool(errors))
