// 本件由 tools/assemble.py 生成·勿手改：首屏 JS 分片（进这一页那一刻才取），源＝js/ 那些拆分件
let _dxDeck = 'lenormand';
let _dxQ = '';
let _dxGroup = 'all';
let _dxKey = '';
let _dxTop = 0;
const DX_GROUPS = {
lenormand: [{ id: 'all', name: '全部' }, { id: 'warm', name: '偏暖' }, { id: 'mid', name: '中性' }, { id: 'cold', name: '偏冷' }],
tarot: [{ id: 'all', name: '全部' }, { id: 'major', name: '大牌' }, { id: '权杖', name: '权杖' }, { id: '圣杯', name: '圣杯' }, { id: '宝剑', name: '宝剑' }, { id: '钱币', name: '钱币' }],
};
function _dxInGroup(c, gid) {
const g = gid || _dxGroup;
if (g === 'all') return true;
if (c.deck === 'lenormand') {
if (g === 'warm') return c.tone > 0;
if (g === 'cold') return c.tone < 0;
return c.tone === 0;
}
if (g === 'major') return !!c.big;
return c.suit === g;
}
function _dxList() {
const q = _dxQ.trim().toLowerCase();
const all = DIVINE_ALL.filter(c => c.deck === _dxDeck && _dxInGroup(c));
if (!q) return all;
return all.filter(c => [c.cn, c.en, c.kw, c.core, c.rv, c.love, c.int, c.p, c.w2, c.pc, c.st, c.stRv, c.emo, c.suit, c.time, c.note]
.filter(Boolean).join(' ').toLowerCase().indexOf(q) >= 0);
}
function _dxTone(c) { return c.tone > 0 ? '偏暖' : (c.tone < 0 ? '偏冷' : '中性'); }
function _dxSec(label, text) {
return text ? `<div class="dx-sec"><b>${label}</b><p>${escapeHTML(String(text))}</p></div>` : '';
}
function _dxSections(c) {
const out = [];
if (c.deck === 'lenormand') {
out.push(_dxSec('核心信息', c.core));
out.push(_dxSec('情绪状态', c.emo));
out.push(_dxSec('关键词', c.kw));
out.push(_dxSec('感情指向', c.love));
out.push(_dxSec('关系与亲密', c.int));
out.push(_dxSec('像这样的人', c.p));
out.push(_dxSec('落到做事上', c.w2));
out.push(_dxSec('画面上', c.pc));
out.push(_dxSec('时间', c.time));
out.push(_dxSec('气质', _dxTone(c) + '（只参与连读时的语气，不单独定吉凶）'));
} else {
out.push(_dxSec('正位关键词', c.kw));
if (c.core) out.push(_dxSec('正位核心', c.core));
out.push(_dxSec('正位时的状态', c.st));
out.push(_dxSec('逆位释义', c.rv));
out.push(_dxSec('逆位时的状态', c.stRv));
out.push(_dxSec('感情指向', c.love));
out.push(_dxSec('正位时的亲密', c.int));
out.push(_dxSec('逆位时的亲密', c.intRv));
out.push(_dxSec('像这样的人', c.p));
out.push(_dxSec('落到做事上', c.w2));
out.push(_dxSec('画面上', c.pc));
out.push(_dxSec('牌面位置', c.big ? '大牌 · 22 张大阿卡纳之一' : (c.suit + '组 · ' + (DV_RANK_CN[c.rank] || c.rank))));
if (c.el) out.push(_dxSec('元素与字母', c.el));
}
out.push(_dxSec('补记', c.note));
return out.join('');
}
function _dxArtHTML(c, cls) {
const hi = cls === 'dx-hero-art' ? divineArtHi(c) : '';
const set = hi ? ` srcset="${divineArtOf(c)} 320w, ${hi} 640w" sizes="230px"` : '';
return `<span class="${cls}"><img src="${divineArtOf(c)}"${set} alt="${escapeHTML(c.cn)}" loading="lazy" decoding="async" onerror="divineArtFail(this,'.${cls}')"><i class="dx-art-fb" onclick="divineArtReload(this.parentElement)">牌面图没带上</i></span>`;
}
function _dxItemHTML(c) {
return `<button type="button" class="dx-item" data-dx-open="${divineKeyOf(c)}">` +
_dxArtHTML(c, 'dx-art') +
`<b>${escapeHTML(c.cn)}</b><small>${escapeHTML(c.en)}</small></button>`;
}
function _dxDetailHTML(c, list) {
const i = list.findIndex(x => divineKeyOf(x) === divineKeyOf(c));
const prev = i > 0 ? list[i - 1] : null;
const next = i >= 0 && i < list.length - 1 ? list[i + 1] : null;
const tags = [];
tags.push(`<i class="dx-tag">${escapeHTML(c.deck === 'lenormand' ? '雷诺曼' : '塔罗')}</i>`);
if (c.deck === 'lenormand') tags.push(`<i class="dx-tag">第 ${c.num} 张</i>`, `<i class="dx-tag">${_dxTone(c)}</i>`);
else tags.push(`<i class="dx-tag">${escapeHTML(c.big ? '大牌' : c.suit + '组 · ' + (DV_RANK_CN[c.rank] || c.rank))}</i>`);
return `<div class="dx-hero">` +
_dxArtHTML(c, 'dx-hero-art') +
`<h3>${escapeHTML(c.cn)}</h3><span class="dx-hero-en">${escapeHTML(c.en)}</span>` +
`<div class="dx-tags">${tags.join('')}</div></div>` +
`<div class="dx-sheet">${_dxSections(c)}</div>` +
`<div class="dx-nav">` +
`<button type="button" class="dx-step" data-dx-prev="${prev ? divineKeyOf(prev) : ''}"${prev ? '' : ' disabled'}><i>←</i><span>${prev ? escapeHTML(prev.cn) : '到头了'}</span></button>` +
`<button type="button" class="dx-step next" data-dx-next="${next ? divineKeyOf(next) : ''}"${next ? '' : ' disabled'}><span>${next ? escapeHTML(next.cn) : '到底了'}</span><i>→</i></button>` +
`</div><button type="button" class="dx-back" data-dx-back="1">返回图鉴</button>`;
}
function renderDivineDex() {
const view = document.getElementById('divineDexView');
if (!view) return;
const list = _dxList();
const stat = document.getElementById('dxStat');
const decks = document.getElementById('dxDecks');
const grid = document.getElementById('dxGrid');
const none = document.getElementById('dxNone');
const detail = document.getElementById('dxDetail');
if (decks) decks.innerHTML = DIVINE_DECKS.map(d =>
`<button type="button" class="dx-deck${d.id === _dxDeck ? ' on' : ''}" data-dx-deck="${d.id}"><b>${escapeHTML(d.name)}</b><small>${DIVINE_ALL.filter(c => c.deck === d.id).length}</small></button>`).join('');
const groups = document.getElementById('dxGroups');
if (groups) groups.innerHTML = (DX_GROUPS[_dxDeck] || []).map(g => {
const n = DIVINE_ALL.filter(c => c.deck === _dxDeck && _dxInGroup(c, g.id)).length;
return `<button type="button" class="dx-group${g.id === _dxGroup ? ' on' : ''}" data-dx-group="${g.id}">${escapeHTML(g.name)}<i>${n}</i></button>`;
}).join('');
if (stat) stat.textContent = (_dxQ || _dxGroup !== 'all') ? '对上 ' + list.length + ' 张' : '共 ' + list.length + ' 张';
const cur = _dxKey ? divineCard(_dxKey) : null;
view.dataset.dxMode = cur ? 'detail' : 'grid';
if (grid) grid.innerHTML = list.map(_dxItemHTML).join('');
if (none) none.hidden = !!(list.length || cur);
if (detail) {
detail.hidden = !cur;
detail.innerHTML = cur ? _dxDetailHTML(cur, list) : '';
}
}
function dxOpenCard(key) {
if (!divineCard(key)) return;
const view = document.getElementById('divineDexView');
if (view && !_dxKey) _dxTop = view.scrollTop;
_dxKey = key;
renderDivineDex();
if (view) view.scrollTop = 0;
}
function openDivineDex() {
_dxDeck = 'lenormand';
_dxQ = '';
_dxGroup = 'all';
_dxKey = '';
_dxTop = 0;
const s = document.getElementById('dxSearch');
if (s) s.value = '';
const view = document.getElementById('divineDexView');
if (view) view.scrollTop = 0;
renderDivineDex();
}
const _dxViewEl = document.getElementById('divineDexView');
_dxViewEl && _dxViewEl.addEventListener('click', e => {
const dk = e.target.closest('[data-dx-deck]');
if (dk) { _dxDeck = dk.dataset.dxDeck; _dxGroup = 'all'; _dxKey = ''; _dxQ = ''; const s = document.getElementById('dxSearch'); if (s) s.value = ''; renderDivineDex(); const v = document.getElementById('divineDexView'); if (v) v.scrollTop = 0; return; }
const gp = e.target.closest('[data-dx-group]');
if (gp) { _dxGroup = gp.dataset.dxGroup; _dxKey = ''; renderDivineDex(); const v = document.getElementById('divineDexView'); if (v) v.scrollTop = 0; return; }
const it = e.target.closest('[data-dx-open]');
if (it) { dxOpenCard(it.dataset.dxOpen); return; }
const pv = e.target.closest('[data-dx-prev]');
if (pv && !pv.hasAttribute('disabled')) { dxOpenCard(pv.dataset.dxPrev); return; }
const nx = e.target.closest('[data-dx-next]');
if (nx && !nx.hasAttribute('disabled')) { dxOpenCard(nx.dataset.dxNext); return; }
if (e.target.closest('[data-dx-back]')) {
_dxKey = '';
renderDivineDex();
const v = document.getElementById('divineDexView');
if (v) v.scrollTop = _dxTop;
return;
}
});
const _dxSearchEl = document.getElementById('dxSearch');
_dxSearchEl && _dxSearchEl.addEventListener('input', () => {
_dxQ = _dxSearchEl.value || '';
_dxKey = '';
renderDivineDex();
});
