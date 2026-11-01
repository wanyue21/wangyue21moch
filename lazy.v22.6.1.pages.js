// 本件由 tools/assemble.py 生成·勿手改：首屏 JS 分片（进这一页那一刻才取），源＝js/ 那些拆分件
const CL_TAB_KEY = 'ordinal-calllog-tab';
const CL_TABS = [['all', '全部'], ['voice', '语音'], ['video', '视频']];
const CL_OUT = { answer: '接通', reject: '已拒绝', miss: '未接', busy: '忙线', cancel: '已取消', drop: '异常结束' };
let _clTab = 'all';
let _clOpened = {};
let _clExOpened = {};
let _clVoice = {};
let _clCards = {};
let _clAudio = null, _clAudioBtn = null;
function _clTabOf() {
try {
const v = localStorage.getItem(CL_TAB_KEY);
if (v === 'voice' || v === 'video' || v === 'all') return v;
} catch (e) {}
return 'all';
}
function _clPad(n) { return String(n).padStart(2, '0'); }
function _clWhen(ms) {
const d = new Date(Number(ms) || Date.now());
if (!isFinite(d.getTime())) return '';
return _clPad(d.getMonth() + 1) + '-' + _clPad(d.getDate()) + ' ' + _clPad(d.getHours()) + ':' + _clPad(d.getMinutes());
}
function _clTimeOf(m) { return String((m && m.time) || ''); }
function _clStopAudio() {
if (_clAudio) { try { _clAudio.pause(); } catch (e) {} }
_clAudio = null;
if (_clAudioBtn) {
_clAudioBtn.classList.remove('playing');
_clAudioBtn.textContent = '▶';
_clAudioBtn = null;
}
}
function _clMsgText(m) {
if (!m) return '';
if (m.recalled) return '（撤回了一条消息）';
const t = String(m.text || '');
if (m.voice || m.tts) return t;
if (m.video) return t || '';
const card = (typeof _msgCardCap === 'function') ? _msgCardCap(m) : '';
if (card) return t && t !== '[表情包]' ? t + ' · ' + card : card;
if (m.sticker && (!t || t === '[表情包]')) return '';
return t;
}
function _clMsgRow(rec, m, nameOf) {
const who = m.from === 'me' ? '我' : (m.from === 'system' ? '·' : 'TA');
const cls = m.from === 'me' ? ' me' : (m.from === 'system' ? ' sys' : '');
const at = _clTimeOf(m);
const voiceUrl = m.voice || m.tts;
let inner = '';
if (voiceUrl) {
const key = rec.id + ':' + m.id;
_clVoice[key] = { url: voiceUrl, cap: String(m.text || '') };
const dur = Math.max(0, Math.round(Number(m.dur) || 0));
inner = '<span class="cl-voice"><button type="button" class="cl-vplay" data-cl-voice="' + escapeHTML(key) + '" aria-label="播放这条语音">▶</button>'
+ (dur ? '<span class="cl-vdur">' + dur + '″</span>' : '<span class="cl-vdur">语音</span>')
+ (_clMsgText(m) ? '<span>' + escapeHTML(screenSafeText(_clMsgText(m))) + '</span>' : '')
+ '</span>';
} else {
const txt = _clMsgText(m);
const isImg = !!(m.sticker || m.imgs || m.video) && (!txt || txt === '[表情包]');
if (isImg) {
const kind = m.video ? '视频' : (m.imgKind === 'image' || m.imgs ? '图片' : '表情包');
inner = '<span class="cl-tag">' + kind + '</span>';
} else if (m.dv) {
const key = rec.id + ':' + m.id;
_clCards[key] = { dv: m.dv, who: nameOf };
const cap = (typeof dvBriefOf === 'function') ? dvBriefOf(m.dv) : '牌面';
inner = '<button type="button" class="cl-dvcard" data-cl-card="' + escapeHTML(key) + '">'
+ '<span class="cl-dvcard-t">占卜 · ' + escapeHTML(screenSafeText(cap)) + '</span>'
+ '<span class="cl-dvcard-c">看牌面 ›</span></button>';
} else {
inner = escapeHTML(screenSafeText(txt || ''));
}
}
if (!inner) return '';
return '<div class="cl-row' + cls + '"><span class="cl-who">' + who + '</span><div class="cl-bub">' + inner + '</div>'
+ (at ? '<span class="cl-at">' + escapeHTML(at) + '</span>' : '') + '</div>';
}
function _clGreetRows(rec) {
const gs = Array.isArray(rec.greet) ? rec.greet : [];
if (!gs.length) return '';
const rows = gs.map((g, i) => {
const key = rec.id + ':g' + i;
const url = (g.tts && typeof mmVoiceByStamp === 'function') ? mmVoiceByStamp(rec.cid, g.tts) : '';
if (url) _clVoice[key] = { url, cap: String(g.text || '') };
const txt = String(g.text || g.name || '语音') || '语音';
return '<div class="cl-grow"><span class="cl-who">TA</span><div class="cl-bub">'
+ (url ? '<span class="cl-voice"><button type="button" class="cl-vplay" data-cl-voice="' + escapeHTML(key) + '" aria-label="重播这句">▶</button></span>' : '')
+ escapeHTML(screenSafeText(txt)) + '</div></div>';
}).join('');
return '<div class="cl-greet"><div class="cl-gh">接通语音</div>' + rows + '</div>';
}
function _clExprRows(rec) {
const ex = (rec && Array.isArray(rec.exprs)) ? rec.exprs : [];
const runs = [];
for (const e of ex) {
if (!e) continue;
const emoji = String(e.emoji || ''), words = String(e.words || '');
if (!emoji && !words) continue;
const kind = e.kind === 'emo' ? 'emo' : 'expr';
const last = runs[runs.length - 1];
if (last && last.emoji === emoji && last.words === words && last.kind === kind) { last.n++; continue; }
runs.push({ emoji, words, kind, n: 1, ts: Number(e.ts) || 0 });
}
if (!runs.length) return '';
const on = _clExOpened[rec.id] ? ' is-open' : '';
const rows = runs.map(r =>
'<div class="cl-exrow' + (r.kind === 'emo' ? ' is-emo' : '') + '">'
+ '<span class="cl-exface" aria-hidden="true">' + escapeHTML(r.emoji) + '</span>'
+ (r.kind === 'emo' ? '<span class="cl-extag">情绪</span>' : '')
+ '<span class="cl-exwords">' + escapeHTML(r.words) + '</span>'
+ (r.n > 1 ? '<span class="cl-exn">×' + r.n + '</span>' : '')
+ '<span class="cl-exat">' + escapeHTML((typeof _vcEmoClockText === 'function') ? _vcEmoClockText(r.ts) : '') + '</span>'
+ '</div>').join('');
return '<div class="cl-exs' + on + '">'
+ '<button type="button" class="cl-exh" data-cl-exfold="' + escapeHTML(String(rec.id)) + '" aria-expanded="' + (on ? 'true' : 'false') + '">'
+ '<span class="cl-exh-t">这一通的表情 · ' + ex.length + '</span>'
+ '<span class="cl-exh-ar" aria-hidden="true"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5 6.5 7l-5 5.5"/></svg></span>'
+ '</button>'
+ '<div class="cl-exb">' + rows + '</div>'
+ '</div>';
}
function renderCallLog() {
_clTab = _clTabOf();
const list = document.getElementById('callLogList');
if (!list) return;
_clStopAudio();
_clVoice = {};
_clCards = {};
const all = Array.isArray(data.callLogs) ? data.callLogs.slice().reverse() : [];
const recs = _clTab === 'all' ? all : all.filter(r => (r.mode === 'video') === (_clTab === 'video'));
const chips = document.getElementById('clChips');
if (chips) {
chips.innerHTML = CL_TABS.map(([k, label]) => {
const n = k === 'all' ? all.length : all.filter(r => (r.mode === 'video') === (k === 'video')).length;
const on = k === _clTab ? ' on' : '';
return '<button type="button" class="fchip' + on + '" data-cl-tab="' + k + '">' + label + (n ? ' ' + n : '') + '</button>';
}).join('');
}
if (!recs.length) {
list.innerHTML = '<div class="cl-empty">' + (all.length ? '这一档还没有通话记录' : '还没有通话记录<br>打通一次，这一页就记下来了') + '</div>';
return;
}
if (!Object.keys(_clOpened).length) _clOpened[recs[0].id] = true;
list.innerHTML = recs.map(rec => {
const c = (data.contacts || []).find(x => x && x.id === rec.cid) || null;
const nm = (c && typeof chatNameOf === 'function' && chatNameOf(c)) || (c && (c.chatName || c.name)) || '已删除的联系人';
const avSrc = (c && typeof chatAvatarOf === 'function' && chatAvatarOf(c)) || '';
const av = avSrc ? '<img src="' + escapeHTML(avSrc) + '" alt="">' : escapeHTML(String(nm).slice(0, 1) || '?');
const mode = rec.mode === 'video' ? '视频' : '语音';
const out = CL_OUT[rec.outcome] || (rec.open ? '通话中' : '');
const dur = Number(rec.durationMs) > 0 ? _callFmt(rec.durationMs) : '';
const bad = rec.outcome === 'reject' || rec.outcome === 'miss' || rec.outcome === 'busy' || rec.outcome === 'cancel' || rec.outcome === 'drop';
const rows = (rec.msgs || []).map(m => _clMsgRow(rec, m, nm)).filter(Boolean).join('');
const greet = _clGreetRows(rec);
const exprs = _clExprRows(rec);
const body = (greet || rows || exprs)
? '<div class="clg-tx">' + greet + rows + exprs + '</div>'
: '<div class="clg-tx"><div class="cl-row sys"><span class="cl-who">·</span><div class="cl-bub">这一通没有留下内容</div></div></div>';
const open = _clOpened[rec.id] ? ' is-open' : '';
return '<article class="cl-rec' + open + '" data-cl-rec="' + escapeHTML(String(rec.id)) + '">'
+ '<button type="button" class="cl-rhead" data-cl-fold="' + escapeHTML(String(rec.id)) + '" aria-expanded="' + (open ? 'true' : 'false') + '">'
+ '<span class="cl-rav">' + av + '</span>'
+ '<span class="cl-rmain"><span class="cl-rname">' + escapeHTML(nm)
+ '<span class="cl-mode' + (rec.mode === 'video' ? ' video' : '') + '">' + mode + '通话</span></span>'
+ '<span class="cl-rsub">' + escapeHTML(_clWhen(rec.startAt))
+ (out ? ' · <span class="cl-out' + (bad ? ' bad' : '') + '">' + out + '</span>' : '')
+ (dur ? ' · ' + dur : '') + '</span></span>'
+ '<span class="cl-ar" aria-hidden="true"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5 6.5 7l-5 5.5"/></svg></span>'
+ '</button>'
+ '<div class="cl-body">' + body + '</div>'
+ '</article>';
}).join('');
}
(function _clBind() {
const chips = document.getElementById('clChips');
if (chips) chips.addEventListener('click', e => {
const b = e.target.closest('[data-cl-tab]');
if (!b) return;
const v = b.dataset.clTab;
if (v !== 'voice' && v !== 'video' && v !== 'all') return;
try { localStorage.setItem(CL_TAB_KEY, v); } catch (e2) {}
_clTab = v;
renderCallLog();
});
const list = document.getElementById('callLogList');
if (!list) return;
list.addEventListener('click', e => {
const exf = e.target.closest('[data-cl-exfold]');
if (exf) {
const box = exf.closest('.cl-exs');
const on = !(box && box.classList.contains('is-open'));
if (box) box.classList.toggle('is-open', on);
exf.setAttribute('aria-expanded', on ? 'true' : 'false');
_clExOpened[exf.dataset.clExfold] = on;
return;
}
const fold = e.target.closest('[data-cl-fold]');
if (fold) {
const id = fold.dataset.clFold;
const art = fold.closest('.cl-rec');
const on = !(art && art.classList.contains('is-open'));
if (art) art.classList.toggle('is-open', on);
fold.setAttribute('aria-expanded', on ? 'true' : 'false');
_clOpened[id] = on;
if (!on) _clStopAudio();
return;
}
const cb = e.target.closest('[data-cl-card]');
if (cb) {
const c = _clCards[cb.dataset.clCard];
if (c && c.dv && typeof dvOpenRec === 'function') dvOpenRec(c.dv, (c.who || 'TA') + ' 抽的', false, []);
return;
}
const vb = e.target.closest('[data-cl-voice]');
if (!vb) return;
const row = _clVoice[vb.dataset.clVoice];
if (!row || !row.url) { if (typeof showToast === 'function') showToast('这段语音不在字卡库里了'); return; }
if (_clAudioBtn === vb && _clAudio && !_clAudio.paused) { _clStopAudio(); return; }
_clStopAudio();
let a;
try { a = new Audio(row.url); } catch (err) { if (typeof showToast === 'function') showToast('这段录音放不出来'); return; }
_clAudio = a; _clAudioBtn = vb;
vb.classList.add('playing'); vb.textContent = '■';
a.onended = _clStopAudio;
a.onerror = () => { _clStopAudio(); if (typeof showToast === 'function') showToast('这段录音放不出来'); };
const p = a.play();
if (p && p.catch) p.catch(() => { _clStopAudio(); if (typeof showToast === 'function') showToast('浏览器不让自动播，再点一次试试'); });
});
})();
let statsScope = 'all';
const STATS_TABS = [
{ k: 'overview', name: '概览' },
{ k: 'hours', name: '时段' },
{ k: 'cards', name: '字卡' },
{ k: 'calls', name: '通话' },
{ k: 'listen', name: '听歌' },
{ k: 'timeline', name: '时光线' },
];
const STATS_TAB_KEY = 'ordinal-stats-tab';
let statsTab = 'overview';
function _statsTabLoad() {
let v = null;
try { v = localStorage.getItem(STATS_TAB_KEY); } catch (e) { }
statsTab = STATS_TABS.some(x => x.k === v) ? v : 'overview';
}
function _statsTabSet(k) {
if (!STATS_TABS.some(x => x.k === k) || k === statsTab) return;
statsTab = k;
try { localStorage.setItem(STATS_TAB_KEY, k); } catch (e) { }
}
function _statsScopeMsgs() {
if (statsScope !== 'all' && data.chats && data.chats[statsScope]) return data.chats[statsScope].msgs || [];
let all = [];
for (const c of data.contacts || []) { const ch = data.chats && data.chats[c.id]; if (ch && ch.msgs) all = all.concat(ch.msgs); }
return all;
}
function _statsNum(n) {
const v = Math.max(0, Math.round(Number(n) || 0));
return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function _statsStreak(daySet) {
const dayNo = [];
for (const k of daySet) {
const d = new Date(String(k).replace(/-/g, '/'));
if (isNaN(d.getTime())) continue;
dayNo.push(Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000));
}
if (!dayNo.length) return 0;
const uniq = [...new Set(dayNo)].sort((a, b) => a - b);
let best = 1, run = 1;
for (let i = 1; i < uniq.length; i++) {
if (uniq[i] === uniq[i - 1] + 1) { run++; if (run > best) best = run; }
else run = 1;
}
return best;
}
function _statsBarsHTML(cnt, opts) {
const o = opts || {};
const max = cnt.length ? Math.max(...cnt) : 0;
const bars = cnt.map((v, i) => `<div class="stats-hour${max > 0 && v === max ? ' hi' : ''}"${o.tip ? ` title="${escapeHTML(o.tip(v, i))}"` : ''}><i style="height:${max ? Math.max(Math.round(v / max * 100), 1) : 1}%"></i></div>`).join('');
const x = (o.labels || []).map(s => `<span>${escapeHTML(String(s))}</span>`).join('');
const note = max ? (o.peak ? `<p class="stats-note">${escapeHTML(o.peak)}</p>` : '') : '<p class="stats-note">这一项还没有记录。</p>';
return `<div class="stats-hours${o.sm ? ' sm' : ''}">${bars}</div>` + (x ? `<div class="stats-hours-x">${x}</div>` : '') + note;
}
function _statsMonthCells(tsList) {
let firstTs = 0;
tsList.forEach(ts => { if (ts && (!firstTs || ts < firstTs)) firstTs = ts; });
const now = new Date();
const cur = { y: now.getFullYear(), m: now.getMonth() };
if (!firstTs) return { cells: [], cut: 0, cur };
const f = new Date(firstTs);
let span = (cur.y - f.getFullYear()) * 12 + (cur.m - f.getMonth()) + 1;
const cut = Math.max(0, span - 24);
span = Math.min(span, 24);
const cells = [];
for (let i = 0; i < span; i++) {
const d = new Date(cur.y, cur.m - (span - 1 - i), 1);
cells.push({ y: d.getFullYear(), m: d.getMonth(), n: 0 });
}
tsList.forEach(ts => {
const d = new Date(ts);
const c = cells.find(x => x.y === d.getFullYear() && x.m === d.getMonth());
if (c) c.n++;
});
return { cells, cut, cur };
}
function _statsMonthLabel(c, cur) {
return (c.y === cur.y ? '' : c.y + '年') + (c.m + 1) + '月';
}
function _statsTrendHTML(tsList) {
const buckets = _statsMonthCells(tsList);
const cells = buckets.cells;
const cur = buckets.cur;
if (cells.length < 2) {
const only = cells.length ? cells[0].n : 0;
return `<p class="stats-note">记录还在第一个月里 · 本月 ${only} 句</p>`;
}
const max = Math.max(...cells.map(c => c.n)) || 1;
const pts = cells.map((c, i) => `${(i / (cells.length - 1) * 300).toFixed(1)},${(56 - c.n / max * 46).toFixed(1)}`);
const thisM = cells[cells.length - 1], lastM = cells[cells.length - 2];
let right = '本月 ' + thisM.n + ' 句';
if (lastM.n > 0) {
const diff = Math.round((thisM.n - lastM.n) / lastM.n * 100);
right = '本月 ' + thisM.n + ' 句 · ' + (diff === 0 ? '与上月持平' : (diff > 0 ? '↑' : '↓') + Math.abs(diff) + '%');
}
return `<svg class="stats-trend" viewBox="0 0 300 64" aria-hidden="true"><polyline points="${pts.join(' ')}"/><circle cx="300" cy="${(56 - thisM.n / max * 46).toFixed(1)}" r="3"/></svg>` +
`<div class="stats-trend-x"><span>${escapeHTML(_statsMonthLabel(cells[0], cur))}</span><span>${escapeHTML(right)}</span></div>`;
}
function renderStats() {
const el = $('#statsOutput'); if (!el) return;
const msgs = _statsScopeMsgs();
const total = msgs.length;
let mine = 0, partner = 0, sys = 0;
const typeCnt = { text: 0, sticker: 0, cardParts: 0, ask: 0, quote: 0, recall: 0, game: 0 };
const days = new Set();
const hourCnt = new Array(24).fill(0);
let first = null, last = null;
const classify = m => {
if (m.recalled) return 'recall';
if (m.ask) return 'ask';
if (m.game) return 'game';
if (m.sticker) return 'sticker';
if (Array.isArray(m.cardParts) && m.cardParts.length) return 'cardParts';
if (m.quote || m.quoteImg) return 'quote';
return 'text';
};
for (const m of msgs) {
if (m.from === 'system') sys++;
else if (m.from === 'me') mine++;
else partner++;
const cat = m.from === 'system' ? null : classify(m);
if (cat) typeCnt[cat]++;
if (m.date) days.add(m.date);
const t = m.time || '';
if (t) {
const h = parseInt(String(t).split(':')[0], 10);
if (h >= 0 && h <= 23) hourCnt[h]++;
const stamp = (m.date ? m.date + ' ' : '') + t;
if (!first || stamp < first) first = stamp;
if (!last || stamp > last) last = stamp;
}
}
const dayCount = days.size;
const avg = dayCount ? (total / dayCount).toFixed(1) : '0';
const streak = _statsStreak(days);
const allTs = [];
for (const cid of Object.keys(data.chats || {})) {
const ms = (data.chats[cid] && Array.isArray(data.chats[cid].msgs)) ? data.chats[cid].msgs : [];
for (const m of ms) { const t = _tsOf(m.date, m.time); if (t) allTs.push(t); }
}
const typeNames = { text: '文字', sticker: '表情包 / 图片', cardParts: '多字卡', ask: '问问TA', quote: '引用', recall: '撤回', game: '游戏卡' };
const maxType = Math.max(1, ...Object.values(typeCnt));
const typeBars = Object.keys(typeNames).map(k => {
const n = typeCnt[k];
const w = n ? Math.round(n / maxType * 100) : 0;
const pct = total ? Math.round(n / total * 100) : 0;
return `<div class="stats-bar-row"><span class="stats-bar-label">${typeNames[k]}</span><div class="stats-bar-track"><i style="width:${w}%"></i></div><b>${n}<em>${pct}%</em></b></div>`;
}).join('');
const hourMax = hourCnt.length ? Math.max(...hourCnt) : 0;
const peakHour = hourCnt.findIndex(v => hourMax > 0 && v === hourMax);
const hourBars = _statsBarsHTML(hourCnt, {
labels: ['0', '6', '12', '18', '24'],
tip: (v, i) => i + ':00 共 ' + v + ' 条',
peak: '最热闹的是 ' + peakHour + ' 点 · 说了 ' + hourCnt[peakHour] + ' 句'
});
const _annMain = (typeof annMainFor === 'function') ? annMainFor(statsScope !== 'all' ? statsScope : '') : null;
const _annDated = (_annMain && !_annMain.yearly) ? _annMain : null;
let accompany;
if (_annDated) {
const d = Math.max(0, Math.floor((Date.now() - new Date(_annDated.date + 'T00:00:00').getTime()) / 86400000));
const who = _annDated.contactId ? `（和 ${escapeHTML(annContactName(_annDated.contactId))}）` : '';
accompany = `自${who}纪念日 <b>${d}</b> 天以来，「${escapeHTML(partnerName())}」一直陪在你身边`;
} else if (first) {
const _firstTs = new Date(String(first).replace(/-/g, '/')).getTime();
const _days = Math.floor((Date.now() - _firstTs) / 86400000);
accompany = Number.isFinite(_days) && _days >= 0
? `从第一条消息（<b>${escapeHTML(first)}</b>）收录的 <b>${_days}</b> 天前起，「${escapeHTML(partnerName())}」被你收进心里了`
: `从第一条消息（<b>${escapeHTML(first)}</b>）起，「${escapeHTML(partnerName())}」被你收进心里了`;
} else {
accompany = `还没有聊天记录，去和「${escapeHTML(partnerName())}」聊聊天吧`;
}
const dayCnt = [];
for (let i = 6; i >= 0; i--) {
const d = new Date(); d.setDate(d.getDate() - i);
const key = d.toLocaleDateString('zh-CN');
let n = 0; for (const m of msgs) if (m.date === key) n++;
dayCnt.push({ label: (d.getMonth() + 1) + '/' + d.getDate(), n });
}
const weekMax = dayCnt.reduce((mx, x) => Math.max(mx, x.n), 0);
const peakDay = dayCnt.find(x => x.n === weekMax);
const weekBars = _statsBarsHTML(dayCnt.map(x => x.n), {
sm: true,
labels: dayCnt.map(x => x.label),
tip: (v, i) => dayCnt[i].label + ' 共 ' + v + ' 条',
peak: '这七天里 ' + (peakDay ? peakDay.label : '') + ' 说得最多 · ' + (peakDay ? peakDay.n : 0) + ' 条'
});
_statsTabLoad();
let lTotal = 0, lTracks = 0, lWeek = 0;
try {
const lplx = _plRoot();
const playsAll = (lplx && lplx.plays && typeof lplx.plays === 'object' && !Array.isArray(lplx.plays)) ? lplx.plays : {};
const weekAgo = Date.now() - 7 * 86400000;
Object.keys(playsAll).forEach(k => {
const v = playsAll[k] || {};
const n = Math.max(0, Math.floor(Number(v.n) || 0));
if (!n) return;
lTotal += n; lTracks++;
if (Number(v.last) >= weekAgo) lWeek++;
});
} catch (e) {}
const panels = {
overview: `<div class="stats-sec">
      <div class="stats-accompany">${accompany}</div>
      <div class="stats-hour-label">说得多少</div>
      <div class="stats-lines">
        <div><span>我发送</span><b>${_statsNum(mine)} 条</b></div>
        <div><span>对方发送</span><b>${_statsNum(partner)} 条</b></div>
        <div><span>系统消息</span><b>${_statsNum(sys)} 条</b></div>
        <div><span>平均每天</span><b>${avg} 条</b></div>
        <div><span>最早互动</span><b>${first ? escapeHTML(first) : '—'}</b></div>
        <div><span>最近互动</span><b>${last ? escapeHTML(last) : '—'}</b></div>
      </div>
      <div class="stats-hour-label">说是哪种消息</div>
      <div class="stats-bars">${typeBars}</div>
      <p class="stats-note">共 ${total} 条消息：含 ${typeCnt.sticker} 张表情包/图片、${typeCnt.quote} 次引用、${typeCnt.recall} 条撤回、${typeCnt.ask} 张问问TA卡片、${typeCnt.cardParts} 次一句话由多张字卡拼成的回复、${typeCnt.game} 张游戏卡。</p>
    </div>`,
hours: `<div class="stats-sec"><div class="stats-hour-label">一天里哪几个钟头说得最多</div>${hourBars}<div class="stats-hour-label">近 7 天每天条数</div>${weekBars}</div>`,
cards: `<div class="stats-sec">
      <div class="stats-switch" id="statsCardSwitch"><button class="stats-switch-btn" data-side="partner">联系人</button><button class="stats-switch-btn" data-side="me">我的</button></div>
      <div id="statsCardRank"></div>
    </div>`,
calls: `<div class="stats-sec">${callStatsHTML()}</div>`,
listen: `<div class="stats-sec">
      <div class="stats-grid">
        <div class="stats-tile"><b>${_statsNum(lTotal)}</b><span>总播放次数</span></div>
        <div class="stats-tile"><b>${_statsNum(lTracks)}</b><span>听过的曲目</span></div>
        <div class="stats-tile"><b>${_statsNum(lWeek)}</b><span>近 7 天听过</span></div>
      </div>
      <div id="statsListenRank"></div>
      <p class="stats-note">只数「开播」：切歌、单曲循环重放都算一次，一首听到一半停掉也算一次。听歌次数是整个应用合在一起算的，不分是哪一位。</p>
    </div>`,
timeline: `<div class="stats-sec">${_statsTimelineHTML(allTs)}</div>`,
};
const listenOnly = statsTab === 'listen';
el.innerHTML = `
    ${listenOnly ? '' : '<div class="stats-scope" id="statsScope"></div>'}
    ${listenOnly ? '' : `<div class="stats-grid">
      <div class="stats-tile"><b>${_statsNum(total)}</b><span>消息条数</span></div>
      <div class="stats-tile"><b>${_statsNum(dayCount)}</b><span>聊天天数</span></div>
      <div class="stats-tile"><b>${_statsNum(streak)}</b><span>连续天数</span></div>
    </div>`}
    <div class="stats-tabs" id="statsTabs">${STATS_TABS.map(t => `<button type="button" class="stats-tab${statsTab === t.k ? ' active' : ''}" data-stats-tab="${t.k}">${t.name}</button>`).join('')}</div>
    <div class="stats-panel" data-tab="${statsTab}">${panels[statsTab]}</div>
  `;
const tabsEl = $('#statsTabs');
if (tabsEl) tabsEl.onclick = e => {
const b = e.target.closest('.stats-tab'); if (!b) return;
_statsTabSet(b.dataset.statsTab);
renderStats();
};
const scopeEl = el.querySelector('#statsScope');
if (scopeEl) {
const chips = [{ id: 'all', label: '全部' }]
.concat((data.contacts || []).map(c => ({ id: c.id, label: (c.kind === 'group' ? '群·' : '') + c.name })));
scopeEl.innerHTML = chips.map(c => `<button type="button" class="scope-chip${statsScope === c.id ? ' on' : ''}" data-scope="${escapeHTML(c.id)}">${escapeHTML(c.label)}</button>`).join('');
scopeEl.onclick = function (e) {
const b = e.target.closest('.scope-chip'); if (!b) return;
statsScope = b.dataset.scope;
renderStats();
};
}
const sw = $('#statsCardSwitch');
if (sw) {
sw.querySelector('[data-side="' + statsCardSide + '"]').classList.add('on');
sw.onclick = function (e) {
const b = e.target.closest('.stats-switch-btn'); if (!b) return;
statsCardSide = b.dataset.side;
sw.querySelectorAll('.stats-switch-btn').forEach(x => x.classList.remove('on'));
b.classList.add('on');
buildCardRank(statsCardSide);
};
}
buildCardRank(statsCardSide);
if (statsTab === 'listen') _statsListenFill();
}
function _statsListenFill() {
const el = document.getElementById('statsListenRank'); if (!el) return;
let playsAll = {};
try { const p = _plRoot(); if (p && p.plays && typeof p.plays === 'object') playsAll = p.plays; } catch (e) {}
const tracks = Object.keys(playsAll)
.map(id => { const t = plById(id); return t ? { t, n: Math.max(0, Math.floor(Number(playsAll[id] && playsAll[id].n) || 0)) } : null; })
.filter(x => x && x.n > 0);
if (!tracks.length) { el.innerHTML = '<div class="stats-empty">还没有听过歌 · 在播放器里放一首就有了</div>'; return; }
tracks.sort((a, b) => b.n - a.n);
const libTag = {};
const rows = tracks.slice(0, 50).map(x => {
const k = x.t.name + (x.t.artist ? ' · ' + x.t.artist : '');
libTag[k] = (typeof _plSrcLabel === 'function') ? _plSrcLabel(x.t) : '';
return [k, x.n];
});
const moreNote = tracks.length > rows.length ? `<div class="stats-empty">仅显示前 ${rows.length} 首，共听过 ${tracks.length} 首</div>` : '';
_statsRankFill(el, rows, libTag, moreNote);
}
let statsCardSide = 'partner';
function callStatsHTML() {
const all = data.calls || [];
const calls = statsScope === 'all' ? all : all.filter(c => (c && c.cid) === statsScope);
const legacy = statsScope === 'all' ? all.filter(c => !c || !c.cid).length : 0;
const total = calls.length;
if (!total) return '<p class="stats-note">' + (statsScope === 'all' ? '还没有通话记录。' : '这位还没有通话记录。') + '</p>';
const cnt = { answer: 0, reject: 0, miss: 0, busy: 0, cancel: 0 };
let durMs = 0;
for (const c of calls) { cnt[c.outcome] = (cnt[c.outcome] || 0) + 1; if (c.durationMs) durMs += c.durationMs; }
const answered = cnt.answer;
const unconnected = total - answered;
const min = Math.floor(durMs / 60000), sec = Math.round((durMs % 60000) / 1000);
const durStr = min + ':' + String(sec).padStart(2, '0');
const parts = [];
parts.push(`接通 ${answered} 通`);
parts.push(`未接 ${cnt.miss} 通`);
parts.push(`忙线 ${cnt.busy} 通`);
parts.push(`拒绝 ${cnt.reject} 通`);
if (cnt.cancel) parts.push(`取消 ${cnt.cancel} 通`);
return `
    <div class="stats-grid">
      <div class="stats-tile"><b>${_statsNum(total)}</b><span>总通话</span></div>
      <div class="stats-tile"><b>${_statsNum(answered)}</b><span>已接通</span></div>
      <div class="stats-tile"><b>${durStr}</b><span>累计时长</span></div>
    </div>
    <p class="stats-note">未接通 ${unconnected} 通。共 ${total} 通：${parts.join('、')}。${legacy ? '另有更早的 ' + legacy + ' 通 · 那时还没记下是谁。' : ''}</p>`;
}
function _statsRankFill(el, rows, libTag, moreNote) {
const maxN = Math.max(1, rows.length ? rows[0][1] : 1);
const totalN = rows.reduce((s, [, n]) => s + n, 0);
const rankTop = 10;
el.innerHTML = rows.map(([k, n], i) => {
const cat = libTag[k];
const w = Math.max(1, Math.round(n / maxN * 100));
const pct = totalN ? Math.round(n / totalN * 100) : 0;
const tag = cat ? `<span class="ck-tag">${escapeHTML(cat)}</span>` : '<span class="ck-tag hist">历史</span>';
const row = `<div class="ck-row"${i < rankTop ? '' : ' hidden'}><span class="ck-rk">${i + 1}</span><div class="ck-head">${tag}<b class="ck-text">${escapeHTML(k)}</b></div><div class="ck-track"><i style="width:${w}%"></i></div><em class="ck-cnt">${n}<i>${pct}%</i></em></div>`;
if (i === rankTop - 1 && rows.length > rankTop) {
return row + `<button type="button" class="stats-more" data-rank-more>展开其余 ${rows.length - rankTop} 张</button>`;
}
return row;
}).join('') + (moreNote || '');
const more = el.querySelector('[data-rank-more]');
if (more) more.onclick = () => {
el.querySelectorAll('.ck-row[hidden]').forEach(r => { r.hidden = false; });
more.remove();
};
}
function buildCardRank(side) {
const el = $('#statsCardRank'); if (!el) return;
const who = side === 'me' ? '我的' : '联系人';
const lib = cardLibIndex();
const freq = {};
for (const m of _statsScopeMsgs()) {
if (!m || m.from !== side) continue;
if (m.sticker) continue;
let frags = [];
if (Array.isArray(m.cardParts) && m.cardParts.length) frags = m.cardParts;
else if (typeof msgLiveText === 'function' ? msgLiveText(m) : m.text) frags = [msgLiveText(m)];
else continue;
for (const f of frags) {
const k = String(f).trim();
if (k) freq[k] = (freq[k] || 0) + 1;
}
}
const rows = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 50);
if (!rows.length) { el.innerHTML = `<div class="stats-empty">「${who}」还没有字卡记录</div>`; return; }
const kinds = Object.keys(freq).length;
_statsRankFill(el, rows, lib, kinds > rows.length ? `<div class="stats-empty">仅显示前 ${rows.length} 张，共 ${kinds} 种</div>` : '');
}
function _tsOf(dateStr, timeStr) {
const t = new Date(`${dateStr || ''} ${timeStr || ''}`).getTime();
return isFinite(t) ? t : 0;
}
function _statsTimelineHTML(tsList) {
const items = [];
const push = (ts, label, detail) => { if (ts) items.push({ ts, label, detail: detail || '' }); };
let firstMsg = 0, totalMsgs = 0;
for (const cid of Object.keys(data.chats || {})) {
const ms = (data.chats[cid] && Array.isArray(data.chats[cid].msgs)) ? data.chats[cid].msgs : [];
totalMsgs += ms.length;
}
(tsList || []).forEach(t => { if (t && (!firstMsg || t < firstMsg)) firstMsg = t; });
if (firstMsg) {
const d = new Date(firstMsg);
push(firstMsg, '第一次对话', `${d.getFullYear()} 年 ${d.getMonth() + 1} 月的一切从这里开始`);
}
let firstCall = null;
for (const c of (data.calls || [])) { const t = _tsOf(c.date, c.time || '00:00:00'); if (t && (!firstCall || t < firstCall.ts)) firstCall = { ts: t, c }; }
if (firstCall) push(firstCall.ts, '第一次通话', (firstCall.c.duration || '00:00') + ' · ' + (firstCall.c.date || ''));
let firstRecv = null, firstSent = null;
for (const m of (data.receivedLetters || [])) {
const t = _tsOf(m.postmark, m.time || '12:00:00');
if (t && (!firstRecv || t < firstRecv.ts)) firstRecv = { ts: t, m };
}
for (const m of (data.sentLetters || [])) {
const t = _tsOf(m.postmark, m.time || '12:00:00');
if (t && (!firstSent || t < firstSent.ts)) firstSent = { ts: t, m };
}
if (firstRecv) push(firstRecv.ts, '收到第一封来信', (firstRecv.m.text || '').slice(0, 24) + '…');
if (firstSent) push(firstSent.ts, '寄出第一封信', (firstSent.m.text || '').slice(0, 24) + '…');
let firstFav = null, firstTaFav = null;
try {
for (const b of collectBooks()) {
for (const f of collectBookAt(b.key)) {
if (!f || !f.ts) continue;
if ((f.by || 'me') === 'ta') { if (!firstTaFav || f.ts < firstTaFav.ts) firstTaFav = f; }
if (!firstFav || f.ts < firstFav.ts) firstFav = f;
}
}
} catch (e) {}
if (firstFav) { const d = new Date(firstFav.ts); push(firstFav.ts, '第一次收藏', `「${(firstFav.text || '').slice(0, 18)}」`); }
if (firstTaFav) { const d = new Date(firstTaFav.ts); push(firstTaFav.ts, partnerName() + ' 第一次收藏你的话', `「${(firstTaFav.text || '').slice(0, 18)}」`); }
let firstNear = null, firstDream = null;
for (const cid of Object.keys((data.cjian || {}).by || {})) {
for (const e of ((data.cjian.by[cid] || {}).hist || [])) {
if (e.k === 'n' && (!firstNear || e.ts < firstNear.ts)) firstNear = e;
if (e.k === 'd' && (!firstDream || e.ts < firstDream.ts)) firstDream = e;
}
}
if (firstNear) push(firstNear.ts, '第一次「好像有什么靠近了」', '');
if (firstDream) push(firstDream.ts, '第一个梦', `「${(firstDream.t || '').slice(0, 18)}」`);
const MSG_MILE = [100, 500, 1000, 2000, 5000];
const reached = MSG_MILE.filter(n => totalMsgs >= n);
for (const a of (data.anniversaries || [])) {
if (!a || !a.date) continue;
let t, detail = a.date;
if (a.yearly) {
const p = a.date.split('-');
const now = new Date();
t = new Date(now.getFullYear(), +p[0] - 1, +p[1]).getTime();
detail = '每年 ' + (+p[0]) + '.' + (+p[1]);
} else {
t = new Date(a.date + 'T00:00:00').getTime();
}
if (t) push(t, '纪念日 · ' + (a.name || '那一天'), detail);
}
items.sort((a, b) => a.ts - b.ts);
const fmt = ts => { const d = new Date(ts); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; };
const days = firstMsg ? Math.floor((Date.now() - firstMsg) / 86400000) + 1 : 0;
let html = _statsTrendHTML(tsList || []) + `<div class="tl-head">相伴第 <b>${days}</b> 天 · 说过 <b>${totalMsgs}</b> 句${reached.length ? ' · 已跨过 ' + reached.join('/') + ' 句' : ''}</div>`;
if (!items.length) return html + '<div class="tl-empty">时间线会随着你们的记录慢慢长出来</div>';
html += '<div class="stats-tl">' + items.map(it => `<div class="tl-item"><span class="tl-dot"></span><div class="tl-main"><div class="tl-date">${fmt(it.ts)}</div><div class="tl-label">${it.label}</div>${it.detail ? `<div class="tl-detail">${escapeHTML(it.detail)}</div>` : ''}</div></div>`).join('') + '</div>';
return html;
}
let lsScope = 'all';
const LS_TABS = [
{ k: 'overview', name: '概览' },
{ k: 'cards', name: '字卡' },
{ k: 'months', name: '按月' },
{ k: 'hours', name: '时段' },
{ k: 'types', name: '类型' },
];
const LS_TAB_KEY = 'ordinal-letterstats-tab';
let lsTab = 'overview';
function _lsTabLoad() {
let v = null;
try { v = localStorage.getItem(LS_TAB_KEY); } catch (e) { }
lsTab = LS_TABS.some(x => x.k === v) ? v : 'overview';
}
function _lsTabSet(k) {
if (!LS_TABS.some(x => x.k === k) || k === lsTab) return;
lsTab = k;
try { localStorage.setItem(LS_TAB_KEY, k); } catch (e) { }
}
function _lsRows() {
const out = [];
(data.sentLetters || []).forEach(m => { if (m) out.push({ m, sent: true, cid: m.cid || mainChatId() }); });
(data.receivedLetters || []).forEach(m => { if (m) out.push({ m, sent: false, cid: m.cid || mainChatId() }); });
return lsScope === 'all' ? out : out.filter(r => r.cid === lsScope);
}
function _lsTs(m) {
const p = _mbParsePostmark(m && m.postmark);
if (!p) return 0;
const t = /(\d{1,2}):(\d{2})/.exec((m && m.time) || '');
return new Date(p.y, p.m - 1, p.d, t ? +t[1] : 0, t ? +t[2] : 0).getTime() || 0;
}
function _lsCards(rows) {
const freq = {}, catCnt = {}, libTag = {};
const cache = {};
let hits = 0, miss = 0, taLetters = 0, perN = 0, perSum = 0, perMax = 0;
rows.filter(r => !r.sent).forEach(r => {
const segs = cardSegs(r.m.text || '');
if (!segs.length) return;
taLetters++;
const key = lsScope === 'all' ? '' : r.cid;
if (!cache[key]) cache[key] = cardLibIndex(key || undefined);
const lib = cache[key];
let n = 0;
segs.forEach(s => {
const cat = lib[s];
if (cat === undefined) { miss++; return; }
if (libTag[s] === undefined) libTag[s] = cat;
freq[s] = (freq[s] || 0) + 1;
catCnt[cat] = (catCnt[cat] || 0) + 1;
hits++; n++;
});
perN++; perSum += n; if (n > perMax) perMax = n;
});
return { freq, catCnt, libTag, hits, miss, taLetters, kinds: Object.keys(freq).length, perN, perSum, perMax };
}
function _lsBarRow(label, n, max, total) {
const w = n ? Math.round(n / Math.max(1, max) * 100) : 0;
const pct = total ? Math.round(n / total * 100) : 0;
return `<div class="stats-bar-row"><span class="stats-bar-label">${escapeHTML(label)}</span><div class="stats-bar-track"><i style="width:${w}%"></i></div><b>${n}<em>${pct}%</em></b></div>`;
}
function renderLetterStats() {
const el = $('#lsOutput'); if (!el) return;
const rows = _lsRows();
const sent = rows.filter(r => r.sent), recv = rows.filter(r => !r.sent);
const card = _lsCards(rows);
const wordsOf = list => list.reduce((s, r) => s + String(r.m.text || '').length, 0);
const sentWords = wordsOf(sent), recvWords = wordsOf(recv);
const perAvg = card.perN ? (Math.round(card.perSum / card.perN * 10) / 10) : 0;
const days = new Set(), hourCnt = new Array(24).fill(0), tsList = [];
let first = 0, last = 0;
rows.forEach(r => {
const ts = _lsTs(r.m);
if (ts) {
days.add(new Date(ts).toLocaleDateString('zh-CN'));
tsList.push(ts);
if (!first || ts < first) first = ts;
if (ts > last) last = ts;
const hm = /(\d{1,2}):(\d{2})/.exec(r.m.time || '');
if (hm) { const h = +hm[1]; if (h >= 0 && h <= 23) hourCnt[h]++; }
}
});
const fmt = ts => { if (!ts) return '—'; const d = new Date(ts); return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate(); };
const dayCnt = [];
for (let i = 6; i >= 0; i--) {
const d = new Date(); d.setDate(d.getDate() - i);
const key = d.toLocaleDateString('zh-CN');
let n = 0; rows.forEach(r => { const ts = _lsTs(r.m); if (ts && new Date(ts).toLocaleDateString('zh-CN') === key) n++; });
dayCnt.push({ label: (d.getMonth() + 1) + '/' + d.getDate(), n });
}
const hourMax = Math.max(...hourCnt);
const peakHour = hourCnt.findIndex(v => hourMax > 0 && v === hourMax);
const hourBars = _statsBarsHTML(hourCnt, {
labels: ['0', '6', '12', '18', '24'],
tip: (v, i) => i + ':00 共 ' + v + ' 封',
peak: '最热闹的是 ' + peakHour + ' 点 · 写了 ' + hourCnt[peakHour] + ' 封'
});
const weekMax = Math.max(...dayCnt.map(x => x.n));
const peakDay = dayCnt.find(x => weekMax > 0 && x.n === weekMax);
const weekBars = _statsBarsHTML(dayCnt.map(x => x.n), {
sm: true,
labels: dayCnt.map(x => x.label),
tip: (v, i) => dayCnt[i].label + ' 写了 ' + v + ' 封',
peak: '这七天里 ' + (peakDay ? peakDay.label : '') + ' 写得最多 · ' + (peakDay ? peakDay.n : 0) + ' 封'
});
const mo = _statsMonthCells(tsList);
const moLabelsAll = mo.cells.map(c => _statsMonthLabel(c, mo.cur));
const moLabels = moLabelsAll.length > 8
? [moLabelsAll[0], moLabelsAll[Math.floor((moLabelsAll.length - 1) / 2)], moLabelsAll[moLabelsAll.length - 1]]
: moLabelsAll;
const moMax = Math.max(0, ...mo.cells.map(c => c.n));
const moPeak = mo.cells.find(c => moMax > 0 && c.n === moMax);
const monthBars = tsList.length
? _statsBarsHTML(mo.cells.map(c => c.n), {
sm: true,
labels: moLabels,
tip: (v, i) => _statsMonthLabel(mo.cells[i], mo.cur) + ' 写了 ' + v + ' 封',
peak: '写得最多的是 ' + (moPeak ? _statsMonthLabel(moPeak, mo.cur) : '') + ' · ' + (moPeak ? moPeak.n : 0) + ' 封'
+ (mo.cut ? '（更早的 ' + mo.cut + ' 个月没有显示在这里）' : '')
})
: `<p class="stats-note">${rows.length ? '这些信的邮戳拆不出年月日（旧档那种只写「9/28」的），按月这一节量不出来。' : '还没有信，按月这一节没有东西可画。'}</p>`;
const kindCnt = {
'TA 主动写的': recv.filter(r => (r.m.kind || 'proactive') !== 'reply').length,
'TA 回你的': recv.filter(r => r.m.kind === 'reply').length,
'你寄出的': sent.length,
'夹了图的': rows.filter(r => !!r.m.img).length
};
const kindMax = Math.max(1, ...Object.values(kindCnt));
const kindBars = Object.keys(kindCnt).map(k => _lsBarRow(k, kindCnt[k], kindMax, sent.length + recv.length)).join('');
const catKeys = Object.keys(card.catCnt).sort((a, b) => card.catCnt[b] - card.catCnt[a]);
const catMax = Math.max(1, ...catKeys.map(k => card.catCnt[k]));
const catBars = catKeys.length
? catKeys.map(k => _lsBarRow(k, card.catCnt[k], catMax, card.hits)).join('')
: '<div class="stats-empty">TA 的信里还没比到库里的字卡</div>';
const rankRows = Object.entries(card.freq).sort((a, b) => b[1] - a[1]).slice(0, 50);
_lsTabLoad();
const panels = {
overview: `<div class="stats-sec">
      <div class="stats-lines">
        <div><span>TA 的信共</span><b>${_statsNum(recvWords)} 字</b></div>
        <div><span>你写的信共</span><b>${_statsNum(sentWords)} 字</b></div>
        <div><span>写信天数</span><b>${days.size} 天</b></div>
        <div><span>最早一封</span><b>${fmt(first)}</b></div>
        <div><span>最近一封</span><b>${fmt(last)}</b></div>
      </div>
    </div>`,
cards: `<div class="stats-sec">
      <div class="stats-hour-label">用了多少张卡</div>
      <div class="stats-lines">
        <div><span>用掉字卡</span><b>${_statsNum(card.hits)} 张</b></div>
        <div><span>TA 一封平均几张</span><b>${perAvg} 张</b></div>
        <div><span>一封最多几张</span><b>${card.perMax} 张</b></div>
        <div><span>出现过的卡</span><b>${card.kinds} 种 · ${catKeys.length} 类</b></div>
      </div>
      <div class="stats-hour-label">哪几句被抽到最多</div>
      <div id="lsRank"></div>
      <p class="stats-note">「用掉字卡」是把 TA 信里的句子和你现在的字卡库比对出来的，另有 ${card.miss} 段没比对上——你删过或改过的句子、以及绑给别人的专属卡，都算在这一段里）。你寄出去的是你自己打的字，不算进抽卡这一格。</p>
    </div>`,
months: `<div class="stats-sec">${monthBars}</div>`,
hours: `<div class="stats-sec"><div class="stats-hour-label">一天里哪几个钟头写得最多</div>${hourBars}<div class="stats-hour-label">近 7 天每天封数</div>${weekBars}</div>`,
types: `<div class="stats-sec">
      <div class="stats-hour-label">信是哪一类</div>
      <div class="stats-bars">${kindBars}</div>
      <div class="stats-hour-label">信里的卡是哪一类</div>
      <div class="stats-bars">${catBars}</div>
      <p class="stats-note">「夹了图」是同一批信里的另一件事（一封主动信也可能夹着图），所以这一行的百分比不按封数归一。</p>
    </div>`,
};
el.innerHTML = `
    <div class="stats-scope" id="lsScope"></div>
    <div class="stats-grid">
      <div class="stats-tile"><b>${_statsNum(recv.length)}</b><span>收到的信</span></div>
      <div class="stats-tile"><b>${_statsNum(sent.length)}</b><span>寄出的信</span></div>
      <div class="stats-tile"><b>${_statsNum(sentWords + recvWords)}</b><span>总字数</span></div>
    </div>
    <div class="stats-tabs" id="lsTabs">${LS_TABS.map(t => `<button type="button" class="stats-tab${lsTab === t.k ? ' active' : ''}" data-ls-tab="${t.k}">${t.name}</button>`).join('')}</div>
    <div class="stats-panel" data-tab="${lsTab}">${panels[lsTab]}</div>
  `;
const tabsEl = $('#lsTabs');
if (tabsEl) tabsEl.onclick = e => {
const b = e.target.closest('.stats-tab'); if (!b) return;
_lsTabSet(b.dataset.lsTab);
renderLetterStats();
};
const scopeEl = el.querySelector('#lsScope');
if (scopeEl) {
const chips = [{ id: 'all', label: '全部' }].concat((data.contacts || []).map(c => ({ id: c.id, label: fixedNameOf(c) })));
scopeEl.innerHTML = chips.map(c => `<button type="button" class="scope-chip${lsScope === c.id ? ' on' : ''}" data-scope="${escapeHTML(c.id)}">${escapeHTML(c.label)}</button>`).join('');
scopeEl.onclick = e => {
const b = e.target.closest('.scope-chip'); if (!b) return;
lsScope = b.dataset.scope;
renderLetterStats();
};
}
const rankEl = $('#lsRank');
if (rankEl) {
if (!rankRows.length) {
rankEl.innerHTML = '<div class="stats-empty">TA 还没有写信，或信里的句子都没比到库里的卡</div>';
} else {
_statsRankFill(rankEl, rankRows, card.libTag,
card.kinds > rankRows.length ? `<div class="stats-empty">仅显示前 ${rankRows.length} 张，共 ${card.kinds} 种</div>` : '');
}
}
}
function _rhNum(v) { return Math.max(0, Math.min(100, Number(v) || 0)); }
function _rhPct(v) {
const n = Math.round(_rhNum(v) * 10) / 10;
return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + '%';
}
function _rhMul(v) { return String(Math.round((Number(v) || 1) * 100) / 100); }
function _rhFamOf(cid, key) {
const en = (data.cjian && data.cjian.by) ? data.cjian.by[cid] : null;
if (!en || !key) return '';
const k = (typeof _cjDoKeyOf === 'function') ? _cjDoKeyOf(en) : '';
const d = (k && typeof CJ_DO !== 'undefined') ? CJ_DO[k] : null;
return (d && !d.flat && d.label) ? d.label : '';
}
function _rhNameOf(cid, c) {
if (c && c.kind === 'group') return c.name || '这个群';
try { if (typeof chatPartnerNameOf === 'function') return chatPartnerNameOf(cid) || (c && c.name) || 'TA'; } catch (e) {}
return (c && c.name) || 'TA';
}
function _rhLiveData() {
const cid = data.activeChat;
if (!cid) return null;
const c = (data.contacts || []).find(x => x && x.id === cid) || null;
const isGroup = !!(c && c.kind === 'group');
const bh = (cid === data.activeChat)
? (data.behavior || (data.chatSettings && data.chatSettings[cid]) || defaults.behavior || {})
: ((data.chatSettings && data.chatSettings[cid]) || defaults.behavior || {});
const D = (typeof defaults !== 'undefined' && defaults.behavior) ? defaults.behavior : {};
const baseRn = _rhNum(bh.rnProb != null ? bh.rnProb : D.rnProb);
const baseStray = _rhNum(bh.strayProb != null ? bh.strayProb : D.strayProb);
const rnOn = bh.rnOn !== false;
const strayOn = bh.strayOn !== false;
const byState = bh.rnByState !== false;
const mul = (byState && typeof cjActivityNrMul === 'function') ? cjActivityNrMul(cid, bh) : 1;
const effRn = _rhNum(baseRn * mul);
const actKey = (typeof _cjActOf === 'function') ? _cjActOf(cid) : '';
const actLabel = (actKey && typeof CJ_ACTIVITY !== 'undefined' && CJ_ACTIVITY[actKey]) ? CJ_ACTIVITY[actKey].label : '';
const pStray = strayOn ? baseStray / 100 : 0;
const pRn = rnOn ? effRn / 100 : 0;
const total = (1 - (1 - pStray) * (1 - pRn)) * 100;
return { cid, c, isGroup, baseRn, baseStray, rnOn, strayOn, byState, mul, effRn, actKey, actLabel, fam: _rhFamOf(cid, actKey), total };
}
function renderReplyHelp() {
const box = document.getElementById('rhLive');
if (!box) return;
const d = _rhLiveData();
if (!d) { box.innerHTML = ''; box.hidden = true; return; }
box.hidden = false;
const who = escapeHTML(_rhNameOf(d.cid, d.c));
const swTxt = !d.rnOn && !d.strayOn ? '两枚都关着'
: !d.rnOn ? '「已读不回」关着'
: !d.strayOn ? '「话没挤过来」关着'
: '两枚都开着';
const go = '<button type="button" class="rh-go" data-rh-go>去「回复节奏」调整</button>';
if (d.isGroup) {
box.innerHTML = `
      <div class="rh-live-top"><span class="rh-live-kicker">此刻这一本 · 群聊</span><span class="rh-live-who">${who}</span></div>
      <p class="rh-live-main">群聊里「已读不回」按<b>每位成员各自</b>的档抽；「话没挤过来」这一枚在群聊里不抽。</p>
      <div class="rh-live-rows">
        <div class="rh-live-row"><span>本群底座（没单独设过的成员跟随这里）</span><b>${_rhPct(d.baseRn)}</b></div>
        <div class="rh-live-row"><span>「允许已读不回」</span><b>${d.rnOn ? '开' : '关'}</b></div>
        <div class="rh-live-row"><span>「按此刻在做什么浮动」</span><b>${d.byState ? '开 · 每位成员按各自状态' : '关'}</b></div>
      </div>
      <p class="rh-live-note">每位成员点进自己的单聊还能单独设；这一页显示的是本群这份底座。</p>
      ${go}`;
return;
}
let stateLine;
if (!d.byState) stateLine = '随状态浮动已关（×1）';
else if (!d.actKey) stateLine = '读不到 TA 此刻在做什么（×1）';
else stateLine = '此刻：' + d.actLabel + (d.fam ? ' · ' + d.fam : '') + '（×' + _rhMul(d.mul) + '）';
const main = (d.rnOn || d.strayOn)
? `按现在的设置，这一轮大约 <b>${_rhPct(d.total)}</b> 不会给你正文。`
: '两枚都关着：每一轮都会给你正文。';
box.innerHTML = `
    <div class="rh-live-top"><span class="rh-live-kicker">此刻这一本</span><span class="rh-live-who">${who}</span></div>
    <p class="rh-live-main">${main}</p>
    <div class="rh-live-rows">
      <div class="rh-live-row"><span>话没挤过来</span><b>${_rhPct(d.baseStray)}${d.strayOn ? '' : '（已关）'}</b></div>
      <div class="rh-live-row"><span>已读不回</span><b>${_rhPct(d.baseRn)} × ${_rhMul(d.mul)} = ${_rhPct(d.effRn)}${d.rnOn ? '' : '（已关）'}</b></div>
      <div class="rh-live-row"><span>TA 此刻</span><b>${escapeHTML(stateLine)}</b></div>
      <div class="rh-live-row"><span>两枚开关</span><b>${swTxt}</b></div>
    </div>
    <p class="rh-live-note">这个数只代表此刻；TA 的状态每 8–25 分钟变一次，换一程就重新算。连发很多条不会把上面的数变小，原因见下面「为什么连发十几条」。</p>
    ${go}`;
}
function _replyHelpGoMate() {
if (typeof showView === 'function') showView('mate');
const openSpeed = () => {
const card = document.querySelector('#mateView .setting-card[data-fold="speed"]');
if (!card) return false;
if (card.classList.contains('open')) return true;
card.classList.add('open');
try { card.scrollIntoView({ block: 'start' }); } catch (e) {}
return true;
};
setTimeout(openSpeed, 120);
setTimeout(() => {
const card = document.querySelector('#mateView .setting-card[data-fold="speed"]');
if (card && !card.classList.contains('open')) openSpeed();
}, 420);
}
(function () {
const v = document.getElementById('replyHelpView');
if (!v) return;
v.addEventListener('click', e => {
if (!e.target.closest('[data-rh-go]')) return;
_replyHelpGoMate();
});
})();
const INTRO_SECTIONS = [
{
id: 'chat', name: '聊天与陪伴', sub: '平时说话的那些', items: [
{ n: '聊天', d: '发文字、语音、图片、表情包。长按一条消息可以引用、撤回、删除，也可以问 TA「这句说谁」「这句本意」。', w: '底部导航「聊天」' },
{ n: '拍一拍', d: '点一下 TA 的头像，聊天里会出现一条拍一拍。', w: '聊天页 · 输入栏' },
{ n: '让对方继续说', d: '点一下 TA 的昵称，TA 会接着往下说几句。不想用可以在「TA 的设置」里关掉。', w: '聊天页 · TA 的昵称' },
{ n: '语音朗读', d: '点气泡右下角的小喇叭，TA 把这条消息念给你听。只有给这位设过音色时才有这枚喇叭。', w: '聊天页 · 气泡右下角' },
{ n: '发语音', d: '点输入栏的麦克风开始录音，停止后可以先试听，满意再发送。', w: '聊天页 · 输入栏麦克风' },
{ n: '通话', d: '和 TA 打一通电话。接通、拒绝、铃声和通话时长上限都能在设置里调。', w: '聊天页顶部 · 听筒图标' },
{ n: '世界感知', d: 'TA 那边的时间、天气、心情、方位和连接状态。TA 有时会拿这些读数当话头，主动说一句给你。', w: '底部导航「世界感知」' },
{ n: 'TA 想问你', d: 'TA 偶尔发一张选择题卡过来等你回答。自带的题库可以停用但不能删除，也可以自己加公共或专属的问题。', w: '更多 › TA 想问你' },
{ n: '回忆闪回', d: 'TA 会偶尔重提三天前说过的话、收藏过的内容。', w: 'TA 的设置 · 开关' },
{ n: '已读不回 · 别频繁主动找', d: '让 TA 有时看过不回，或者少来打扰你。具体数值和算法在「回复节奏」那一页。', w: 'TA 的设置 · 回复节奏' },
{ n: '主动消息管理', d: '一次性关掉某些联系人和群的主动消息。关掉之后你主动说话、打电话都不受影响。', w: '更多 › 主动消息管理' },
{ n: '夜间免打扰', d: '默认 23:00 到早上 7:00 之间，TA 不主动发消息也不打来。时间段有三档可选。', w: '设置 · 通知' },
{ n: '单人模式', d: '指定一位作为主页，打开应用直接进到那儿的聊天，其他联系人不再主动发消息。', w: '设置 · 通知' }
]
},
{
id: 'shortcut', name: '快捷方式', sub: '在聊天里长按就能到', items: [
{ n: '抽字卡', d: '聊天输入框空着的时候，长按发送按钮半秒，摊开一副牌。你来抽或者让 TA 抽，抽完可以直接发到聊天里。', w: '聊天页 · 长按发送按钮' },
{ n: '占卜', d: '长按聊天里 TA 的头像，直接进占卜：抽一张、三张、五张或自由抽，不用先回「更多」那一页。', w: '聊天页 · 长按 TA 的头像' },
{ n: '心讯', d: '长按聊天里我的头像，直接进心讯；带的是当前正在聊的这一位。', w: '聊天页 · 长按我的头像' }
]
},
{
id: 'record', name: '记录与收藏', sub: '存下来、翻得回去', items: [
{ n: '收藏', d: '把聊天里的话和信收进收藏夹。TA 也会自己收藏你说过的话。', w: '更多 › 收藏' },
{ n: '信箱', d: '写信、寄信、拆信都在这里，每个联系人各存一份。', w: '更多 › 信箱' },
{ n: '朋友圈', d: '大家按各自的节奏发一条动态。你也可以发，他们会点赞和评论。', w: '更多 › 朋友圈' },
{ n: '纪念日', d: '可以记好几个日子。到了当天 TA 会来祝福，信上会盖一枚心戳。TA 自己也会想起某个日子。', w: '更多 › 纪念日' },
{ n: '聊天统计', d: '聊了多少句、最常用的字卡、一天里哪些时段聊得多，还有一条时间线。', w: '更多 › 聊天统计' },
{ n: '写信统计', d: '寄出和收到的信：多少封、多少字、信里用到哪几类字卡。', w: '信箱页右上角 · 小图表' },
{ n: '搜索聊天记录', d: '一句话同时搜聊天、信、收藏和字卡。', w: '首页顶部 · 搜索框' }
]
},
{
id: 'cards', name: '字卡与内容', sub: 'TA 说话用的那些词', items: [
{ n: '字卡库', d: '你自己建的分组和字卡，分公共和专属两种。TA 说话时从这里挑。', w: '底部导航「字卡库」' },
{ n: '系统预设字卡', d: '应用自带的话术和「TA 心里话」，聊天情绪用的标签也在这里。', w: '字卡库页右上角 · 预设' },
{ n: '字卡适应度', d: '照你存好的卡摇一遍：这一本够不够 TA 说（难 ∶ 中 ∶ 易），抽出来会是什么。', w: '字卡库页右上角 · 适应度' },
{ n: '聊天情绪', d: '给消息加情绪标签和逻辑连接词，有星言、mochi、混合三种，默认走混合。', w: '系统预设字卡 › 聊天情绪' },
{ n: '头像昵称', d: '互相改头像和昵称，TA 会记住你换过形象。聊天里那枚「印象」标签记的就是这本账。', w: 'TA 的设置 · 头像昵称' },
{ n: '问问 TA', d: '你出题 TA 选，或者你写字卡 TA 来回。题型有单选、多选和自由填写。', w: '聊天页 · 输入栏' },
{ n: '心讯', d: '两个人只用字卡说话。你推几张过去，TA 按你设置的回牌方式递回来，翻开才看得到内容。', w: '更多 › 心讯；或长按聊天里我的头像' },
{ n: '占卜 · 牌面图鉴', d: '两副牌共用一套牌阵，可以抽一张、三张、五张或自由抽。每张牌说六栏：核心信息、情绪状态、感情里、关系与亲密、像这样的人、落到做事上；单翻一张还能看到牌面上画了什么。最后合起来一句「TA 想表达什么」。', w: '更多 › 占卜；或长按聊天里 TA 的头像' },
{ n: '摘一句', d: 'TA 从你正在听的歌里摘一两句（带译文）发到聊天里。', w: '播放器设置 · 摘一句' }
]
},
{
id: 'play', name: '玩', sub: '小游戏和一起听歌', items: [
{ n: '游戏中心', d: '合成、2048、消灭星星、连连看四款。TA 会立一个挑战分等你超过。', w: '更多 › 游戏中心' },
{ n: '播放器', d: '曲库全站共用一份。TA 能不能邀请你一起听、一首唱完替你做什么，每个联系人单独授权。', w: '更多 › 播放器' }
]
},
{
id: 'look', name: '外观', sub: '改成你喜欢的样子', items: [
{ n: '会话外观', d: '换气泡颜色、圆角和聊天背景图，每个联系人可以各设一套。', w: 'TA 的设置 · 外观' },
{ n: '气泡 CSS', d: '直接写 CSS 改气泡样式，编辑器里有真实预览。写好的方案能存好几套，随时换。', w: 'TA 的设置 · 外观 · 自定义气泡 CSS' },
{ n: '美化库', d: '背景图、气泡样式、字体样式三类素材，每类都能存多份，点哪份就用哪份。', w: 'TA 的设置 · 外观 · 美化库' },
{ n: '全站字体', d: '上传一个字体文件或字体 CSS，全站的大标题跟着换。', w: '设置 · 外观 · 全站字体' },
{ n: '桌面美化', d: '换壁纸，调提亮、压暗、缩放和取景，还能选壁纸铺到哪几页、导航条要不要薄纱。', w: '设置 · 外观 · 桌面背景' },
{ n: '字号', d: '全站文字在 80%~140% 之间拖动调节，拖到哪当场变多大。', w: '设置 · 外观 · 字号' },
{ n: '全屏模式', d: '藏掉浏览器工具栏与系统状态栏，内容铺满整屏。iPhone 拿不到网页全屏，装到桌面才是那边最满的形态；换用法（浏览器 ↔ 桌面图标）前先备份。', w: '设置 · 外观 · 全屏模式' }
]
},
{
id: 'notify', name: '提醒与工具', sub: '该响的时候响一声', items: [
{ n: '桌面前台横幅', d: '应用正在用时来了消息，屏幕顶部会弹一条横幅，点它直接进到那儿的聊天。', w: '设置 · 通知' },
{ n: '系统通知', d: '应用切到后台时来消息、来信、来电，走系统通知栏，点通知同样能直接进去。', w: '设置 · 通知' },
{ n: '后台保活', d: '让应用切到后台也不被系统杀掉，消息不会漏。', w: '设置 · 通知' },
{ n: '提示音', d: '每个联系人一套：TA 发来、你发出、来电振铃，三种声音分开选。', w: 'TA 的设置 · 声音' },
{ n: '屏幕信息', d: '视口、键盘、安全区的实际数值，反馈屏幕显示问题时用得上。', w: '设置 · 数据 · 屏幕信息' },
{ n: '诊断信息', d: '设备和存储的体检报告，能复制也能导出。', w: '设置 · 数据 · 诊断信息' },
{ n: '检测功能', d: '一轮查一遍：能不能存住、装不装得下、TA 说不说得出话、通知通不通、屏上有没有画不出来的东西。只读，不改设置、也不发请求；要问接口的那几样会写明去哪一页按哪枚钮。', w: '更多 › 检测功能' }
]
},
{
id: 'site', name: '数据与本站', sub: '东西都在你自己手里', items: [
{ n: '数据备份', d: '导出和导入全部数据。超过 7 天没备份会提醒你一句。所有东西只存在这台设备上，不在服务器上。', w: '设置 · 数据 · 数据管理' },
{ n: '安装到桌面', d: '把应用装到桌面，像普通 App 一样打开，装好之后离线也能用。装到桌面与浏览器可能是两套存储，装之前先导出备份，到新用法里看不到原来的内容时再导入。', w: '设置 · 数据 · 安装到桌面' },
{ n: '使用大全', d: '全部功能一页看全，开关直接做在功能行上。和这一页的分工是：那一页管开关，这一页管讲解。', w: '更多页右上角 · 使用大全' },
{ n: '更新公告', d: '每个版本改了什么，最新一条永远在最上面。', w: '更多 › 更新公告' },
{ n: '许可与关于', d: '代码已开源：自己拿代码改、自己私人用，不用问；链接禁止二传，公开二改版要先经作者同意、只能从本人主页获取。一比一整体照搬算抄袭；借鉴不禁，用了本站代码要标注借鉴来源与作者署名，喂 AI 洗一遍也不算从零写。', w: '设置 · 关于' }
]
}
];
const FIN_ARROW = '<span class="fin-ar" aria-hidden="true"><svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5 6.5 7l-5 5.5"/></svg></span>';
function renderFeatureIntro() {
const body = document.getElementById('finBody');
if (!body) return;
const cnt = document.getElementById('finCount');
let n = 0;
INTRO_SECTIONS.forEach(s => { n += s.items.length; });
if (cnt) cnt.textContent = n + ' 项';
body.innerHTML = INTRO_SECTIONS.map(s => `
    <section class="fin-sec" data-fin-sec="${s.id}">
      <button type="button" class="fin-sec-h" aria-expanded="false" aria-controls="fin-pane-${s.id}">
        <span class="fin-sec-tx"><b>${s.name}</b><i>${s.sub}</i></span>
        <em class="fin-sec-n">${s.items.length} 项</em>${FIN_ARROW}
      </button>
      <div class="fin-pane" id="fin-pane-${s.id}" hidden>
        ${s.items.map(it => `
          <div class="fin-item"><p><b>${it.n}</b>${taLabel(it.d, (data && data.activeChat) || '')}</p><span class="fin-where">在哪：${it.w}</span></div>`).join('')}
      </div>
    </section>`).join('');
_finBindSec();
}
function _finBindSec() {
const body = document.getElementById('finBody');
if (!body || body.dataset.finBound) return;
body.dataset.finBound = '1';
body.addEventListener('click', e => {
const h = e.target.closest('.fin-sec-h');
if (!h) return;
const sec = h.closest('.fin-sec');
if (!sec) return;
const open = !sec.classList.contains('open');
body.querySelectorAll('.fin-sec.open').forEach(s => {
if (s === sec) return;
s.classList.remove('open');
const hh = s.querySelector('.fin-sec-h');
const pp = s.querySelector('.fin-pane');
if (hh) hh.setAttribute('aria-expanded', 'false');
if (pp) pp.hidden = true;
});
sec.classList.toggle('open', open);
h.setAttribute('aria-expanded', open ? 'true' : 'false');
const pane = sec.querySelector('.fin-pane');
if (pane) pane.hidden = !open;
});
}
const FB_RULES = [
['bug 报修需带', '手机型号 + 浏览器型号 + 问题'],
['数据相关问题需报', '设置 → 数据 · 诊断信息'],
['屏幕相关问题需报', '设置 → 数据 · 屏幕信息'],
['iOS 需补充系统版本', 'iOS 不同系统版本可能出现的问题不一样']
];
const FB_RULES_NOTE = '手机型号、浏览器型号与版本，点下面那枚按钮就能整段复制，和问题一起发；诊断信息、屏幕信息在「设置 → 数据」里自己复制一份。';
const FB_RULES_WARN = '需描述清楚问题：描述不清楚或非bug的问题不予回复，请按格式重新提交。';
const FB_RULES_TAIL = '有问题可以报，描述清楚，作者看到会修。但任何报修都不保证修复时间，且不会一对一回复。';
const FB_HOSTS = [
{ head: 'fbHead', rules: 'fbRules', meta: 'fbMetaOut', copy: 'fbCopy' },
{ head: 'agRepHead', rules: 'agRepRules', meta: 'agRepMetaOut', copy: 'agRepCopy' }
];
function _fbFromLabel() {
try {
if (typeof _navStack === 'undefined' || !_navStack || !_navStack.length) return '';
const v = _navStack[_navStack.length - 1];
const nm = (typeof topbarName === 'function') ? topbarName(v) : '';
return nm || v || '';
} catch (e) { return ''; }
}
function fbMetaText() {
const sc = window.screen || {};
const store = (typeof _useLS !== 'undefined' && _useLS) ? 'localStorage 兜底' : 'IndexedDB';
return [
'版本 ' + (window.APP_VER || '?'),
'时间 ' + new Date().toLocaleString('zh-CN'),
'来源 ' + (_fbFromLabel() || '—'),
'视口 ' + window.innerWidth + '×' + window.innerHeight + ' · DPR ' + (Math.round((window.devicePixelRatio || 1) * 100) / 100),
'屏幕 ' + (sc.width || '?') + '×' + (sc.height || '?'),
'存储 ' + store,
'UA ' + (navigator.userAgent || '')
].join('\n');
}
function _fbPaintHead(hostId) {
const host = document.getElementById(hostId);
if (!host) return;
host.innerHTML = '<p class="fb-lead">' + escapeHTML(FB_RULES_TAIL) + '</p>'
+ '<p class="fb-warn">' + escapeHTML(FB_RULES_WARN) + '</p>';
}
function _fbPaintRules(hostId) {
const host = document.getElementById(hostId);
if (!host) return;
const one = FB_RULES.length === 1;
const body = one
? '<p class="fb-rules-one"><b>' + escapeHTML(FB_RULES[0][0]) + '</b> · ' + escapeHTML(FB_RULES[0][1]) + '</p>'
: '<ul class="fb-rules-l">' + FB_RULES.map(r => '<li><b>' + escapeHTML(r[0]) + '</b> · ' + escapeHTML(r[1]) + '</li>').join('') + '</ul>';
host.innerHTML = '<div class="fb-rules-h">报修须知</div>' + body
+ '<p class="fb-rules-n">' + escapeHTML(FB_RULES_NOTE) + '</p>';
}
function _fbPaintMeta(hostId) {
const el = document.getElementById(hostId);
if (el) el.textContent = fbMetaText();
}
function _fbCopyLegacy(t) {
const ta = document.createElement('textarea');
ta.value = t;
ta.setAttribute('readonly', '');
ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
document.body.appendChild(ta);
ta.select();
try { ta.setSelectionRange(0, ta.value.length); } catch (e) {}
try { document.execCommand('copy'); } catch (e) {}
ta.remove();
}
function _fbCopyNow(t) {
if (!t) return;
const done = () => { try { showToast('已复制'); } catch (e) {} };
try {
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(t).then(done, () => { _fbCopyLegacy(t); done(); });
return;
}
} catch (e) {}
_fbCopyLegacy(t);
done();
}
function _fbBindCopy(cfg) {
const b = document.getElementById(cfg.copy);
if (!b) return;
b.addEventListener('click', () => {
_fbPaintMeta(cfg.meta);
_fbCopyNow(fbMetaText());
});
}
function _fbPaintHost(cfg) {
_fbPaintHead(cfg.head);
_fbPaintRules(cfg.rules);
_fbPaintMeta(cfg.meta);
}
function renderFeedbackPage() {
_fbPaintHost(FB_HOSTS[0]);
}
function agRepOpen() {
const layer = document.getElementById('agReport');
if (!layer) return;
_fbPaintHost(FB_HOSTS[1]);
layer.hidden = false;
}
function agRepClose() {
const layer = document.getElementById('agReport');
if (layer) layer.hidden = true;
}
function _fbBindGate() {
const btn = document.getElementById('ageGateReport');
const layer = document.getElementById('agReport');
if (!btn || !layer) return;
btn.hidden = false;
btn.addEventListener('click', agRepOpen);
const x = document.getElementById('agRepClose');
if (x) x.addEventListener('click', agRepClose);
layer.addEventListener('click', e => { if (e.target === layer) agRepClose(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !layer.hidden) agRepClose(); });
}
(function _fbBoot() {
FB_HOSTS.forEach(cfg => { _fbBindCopy(cfg); _fbPaintHost(cfg); });
_fbBindGate();
})();
const CK_LABEL = { ok: '过', warn: '要看', bad: '不通', none: '没试' };
const CK_MARK = { ok: '✓', warn: '!', bad: '✗', none: '·' };
let _ckRes = {};
let _ckBusy = {};
let _ckAt = 0;
let _ckNote = '';
const CK_FREE = ['store', 'space', 'img', 'words', 'active', 'css', 'font', 'num', 'build', 'fit', 'bg'];
function _ckTxt(segs) {
return segs.map(g => String(typeof g === 'string' ? g : g.v)).join('');
}
function _ckHtml(segs) {
return segs.map(g => {
const s = String(typeof g === 'string' ? g : g.v);
const k = (typeof g === 'object' && g.k) || '';
if (k === 'b') return '<b>' + escapeHTML(s) + '</b>';
if (k === 'w') return '<span class="ckx-who">' + escapeHTML(s) + '</span>';
return escapeHTML(s);
}).join('');
}
function _ckR(s, ...t) { return { s: s, t: t }; }
const CK_NOHOST = w => _ckR('bad', '这一行查不了：', { k: 'w', v: w }, ' 没给页面用（写它的那一件没把这一只口挂出来）＝这一行是死的，不是没问题');
function _ckCan(fn) { return typeof window[fn] === 'function'; }
function _ckGo(tab, fold, hit) {
if (typeof _hubGoFold !== 'function') { try { showView('settings'); } catch (e) {} }
else _hubGoFold(tab, fold);
if (!hit) return;
setTimeout(() => {
const el = document.getElementById(hit);
if (!el) return;
el.classList.add('ap-hit');
setTimeout(() => el.classList.remove('ap-hit'), 1600);
try { el.scrollIntoView({ block: 'center' }); } catch (e) {}
}, 120);
}
async function _ckStoreTrial() {
if (typeof dbWriteProbe !== 'function') return CK_NOHOST('db.js 的存试探针');
const r = await dbWriteProbe();
if (r.mode === 'ls') {
return r.ok ? _ckR('ok', '本机那一份：写得进、读得回、也擦干净了')
: _ckR('bad', '本机那一份写不进去（', { k: 'w', v: String(r.err || '') }, '）——这一趟改的东西关掉页面就没了');
}
if (r.step === 'open') return _ckR('bad', '本机存档打不开（', { k: 'w', v: String(r.err || '') }, '），所以现在什么都存不下');
if (r.step === 'write') return _ckR('bad', '写不进去（', { k: 'w', v: String(r.err || '') }, '）——这一趟改的东西只活在内存里，关掉页面就没了');
if (!r.ok) return _ckR('bad', '写进去了，读回来的却不是那一枚——本机存档已经不可信，先导一份出来再说');
const tail = r.left ? ['·只是那一格测试记录没擦掉（几十字节，不影响你的东西）'] : [];
return _ckR('ok', '真存了一条测试记录：写得进、读回来一字不差、也擦干净了', ...tail);
}
function _ckBackupText(obj) {
const raw = String((obj && obj.raw) || '');
if (!raw.trim()) return _ckR('none', '没选文件，所以没验（选了也只是**读它**，不会导进来）');
let d = null;
try { d = JSON.parse(raw); } catch (e) { return _ckR('bad', '这份文件不是能读的 JSON（', { k: 'w', v: String((e && e.message) || e).slice(0, 60) }, '）'); }
if (!d || typeof d !== 'object' || !d.chats) return _ckR('bad', '这份里没有会话那一段——多半不是本站导出的那份');
if (typeof _importStats !== 'function') return CK_NOHOST('_importStats');
const st = _importStats(d);
const cur = typeof _exportPayloadShape === 'function' ? _exportPayloadShape(data) : null;
const cst = cur ? _importStats(cur) : null;
const bits = [];
if (st.msgs) bits.push(st.msgs + ' 条消息');
if (st.contacts) bits.push(st.contacts + ' 位');
if (st.cards) bits.push(st.cards + ' 张字卡');
if (st.letters) bits.push(st.letters + ' 封信');
if (st.moments) bits.push(st.moments + ' 条朋友圈');
const p = ['这份装了 ', { k: 'b', v: bits.join('∶') || '一样都没有' }, ''];
if (obj.name) p.push('（', { k: 'w', v: String(obj.name).slice(0, 24) }, '）');
let s = 'ok';
let imgN = 0;
try {
if (typeof stWalkImages === 'function') { const imgs = []; stWalkImages(d, [], 0, imgs, typeof stAliasSkip === 'function' ? stAliasSkip(d) : {}); imgN = imgs.length; }
} catch (e) {}
if (imgN) p.push(' ∶ 图和语音 ', { k: 'b', v: imgN + ' 项', }, '带在里面');
const vidN = typeof videoCount === 'function' ? videoCount() : 0;
if (vidN) { s = 'warn'; p.push(' ∶ 但视频 ', { k: 'w', v: vidN + ' 段', }, '带不走（那几段只存在这台设备上，换机那天才知道＝没了）'); }
if (cst) {
const gap = [];
if (cst.msgs !== st.msgs) gap.push('消息 现在 ' + cst.msgs + ' ∶ 这份 ' + st.msgs);
if (cst.contacts !== st.contacts) gap.push('人 现在 ' + cst.contacts + ' ∶ 这份 ' + st.contacts);
if (cst.cards !== st.cards) gap.push('字卡 现在 ' + cst.cards + ' ∶ 这份 ' + st.cards);
if (gap.length) p.push(' ∶ 和你现在这份比 ', { k: 'w', v: gap.join('∶') }, '（差多少不一定是坏：导完之后你又聊过的话就这么多）');
}
return { s: s, t: p };
}
function _ckBrokenImgs() {
const out = { n: 0, scanned: 0, bad: [] };
try {
const all = document.images || [];
for (let i = 0; i < all.length && i < 400; i++) {
const im = all[i];
const addr = String(im.getAttribute('src') || im.getAttribute('data-src') || '');
if (!addr.trim()) continue;
if (!im.complete) continue;
out.scanned++;
if (im.naturalWidth === 0) {
out.n++;
if (out.bad.length < 3) out.bad.push(String(im.alt || im.id || '（这一张）').slice(0, 16));
}
}
} catch (e) {}
return out;
}
function _ckImgHeads() {
const out = { n: 0, cut: 0, where: [] };
try {
if (typeof stWalkImages !== 'function' || typeof stAliasSkip !== 'function' || typeof data === 'undefined' || !data) return null;
const imgs = [];
stWalkImages(data, [], 0, imgs, stAliasSkip(data));
out.n = imgs.length;
imgs.forEach(it => {
const s = String(it.raw || '');
const comma = s.indexOf(',');
if (comma < 0 || comma > s.length - 8) { out.cut++; if (out.where.length < 2) out.where.push(typeof stPathText === 'function' ? stPathText(it.trail) : '（一处）'); }
});
} catch (e) { return null; }
return out;
}
async function _ckImgTrial() {
const b = _ckBrokenImgs(), h = _ckImgHeads();
const parts = [];
if (h && h.cut) parts.push('存档里有 ', { k: 'b', v: h.cut + ' 张图片数据断了一半' }, '（', { k: 'w', v: h.where.join('∶') }, '）——屏上就是空白一块');
else parts.push(h ? ('存档里 ' + h.n + ' 张图，都是完整的') : '图片这一项读不到');
if (b.n) parts.push(' ∶ 屏上还有 ', { k: 'b', v: b.n + ' 张开不了' }, '（', { k: 'w', v: b.bad.join('∶') }, '）');
const s = (h && h.cut) || b.n ? 'bad' : 'ok';
return { s: s, t: parts, note: '查的屏上那 ' + b.scanned + ' 张' };
}
async function _ckSpaceTrial() {
if (typeof storageScan !== 'function') return CK_NOHOST('storageScan');
let r = await storageScan();
if (!r) { await new Promise(res => setTimeout(res, 700)); r = await storageScan(); }
if (!r) return _ckR('bad', '这一行没跑完：本机存储那一栏自己读不动');
const p = [];
if (r.est) p.push('占了 ', { k: 'b', v: stFmt(r.est.usage) }, ' ∶ 这台设备还能放 ', { k: 'b', v: stFmt(r.est.quota) });
else p.push('这台设备的浏览器没把占用报给我们');
p.push(' ∶ 图 ', { k: 'b', v: (r.imgN || 0) + ' 张' }, ' 共 ', { k: 'b', v: stFmt(r.imgTotal || 0) });
if (r.dup && r.dup.waste > 0) p.push('（同一张图存了 ' + r.dup.kinds + ' 份，多占 ', { k: 'w', v: stFmt(r.dup.waste) }, '，要压小去 设置 → 数据 → 存储）');
const persist = r.persisted;
let s = 'ok';
if (persist === false) { s = 'warn'; p.push(' ∶ 还没拿到「不会被自动清掉」那一句'); }
else if (persist === null) p.push(' ∶ 这台设备没有申请那一步的接口（这样打开的网页被系统整站清掉是可能的）');
return { s: s, t: p, persisted: persist };
}
const CK_TEST_MARK = '【测试】这一句是刚查的';
async function _ckReplyTrial() {
const o = typeof currentContact === 'function' ? currentContact() : null;
if (!o) return _ckR('warn', '现在没选中谁——先在聊天页点开一位，这一发才知道问的是他');
const cid = o.id;
if (typeof partnerReply !== 'function') return CK_NOHOST('partnerReply');
const before = (data.chats && data.chats[cid] && data.chats[cid].msgs) ? data.chats[cid].msgs.length : 0;
const t0 = Date.now();
const mine = { id: (typeof nextId === 'function' ? nextId() : Date.now()), from: 'me', text: CK_TEST_MARK, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), date: new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate() };
if (!data.chats[cid]) data.chats[cid] = { msgs: [], unread: 0, draft: '' };
data.chats[cid].msgs.push(mine);
if (cid === data.activeChat) { try { data.messages = data.chats[cid].msgs; } catch (e) {} }
const ids = [mine.id];
try { renderMessages(); } catch (e) {}
try { save(); } catch (e) {}
try { partnerReply(cid, CK_TEST_MARK); } catch (e) { return _ckR('bad', '话是发出去了，但他那边那一条链没跑起来（', { k: 'w', v: String((e && e.message) || e).slice(0, 40) }, '）'); }
let first = 0, n = 0, quiet = 0;
for (let i = 0; i < 62; i++) {
await new Promise(res => setTimeout(res, 400));
const ms = (data.chats[cid] && data.chats[cid].msgs) || [];
const nowN = ms.length - before - 1;
if (nowN > n) { if (!first) first = Date.now() - t0; n = nowN; quiet = 0; }
else if (n > 0) quiet++;
ms.forEach(m => { if (m && m.id && ids.indexOf(m.id) < 0 && m.from !== 'me') ids.push(m.id); });
const busy = typeof _pendingBusy === 'function' ? _pendingBusy(cid) : false;
if (n > 0 && quiet >= 5 && !busy) break;
}
try { save(); } catch (e) {}
const undo = { label: '撤掉刚才那几条（我的与他接的）', act: () => _ckWithdraw(cid, before) };
if (!n) {
const why = [];
if (typeof chatSilentOn === 'function' && chatSilentOn(cid)) why.push('他在「不再主动找我」那份名单里（只影响他自己开口，回话不受影响）');
if (typeof nightOn === 'function' && nightOn()) why.push('此刻是夜里那一档');
return { s: 'bad', t: ['等了 25 秒，他没有回话', ...why.map(w => ' ∶ ' + w), ' ∶ 屏上那条「', { k: 'w', v: CK_TEST_MARK }, '」是刚发的，可以撤'], cid: cid, undo: { label: '撤掉我刚发的那一条', act: () => _ckWithdraw(cid, before) } };
}
return {
s: 'ok', t: ['他回了 ∶ ', { k: 'b', v: (Math.round(first / 100) / 10) + ' 秒' }, ' 接话 ∶ 一共 ', { k: 'b', v: n + ' 条' }, '（等他这一轮说完）'],
cid: cid, ids: ids, undo: undo,
keep: { label: '就留着，不撤', act: async () => _ckR('ok', '留下了——那就当正常说过一次话') }
};
}
async function _ckWithdraw(cid, before) {
const ms = (data.chats[cid] && data.chats[cid].msgs) || [];
let n = 0;
for (let i = ms.length - 1; i >= before; i--) {
const m = ms[i];
if (!m || m.src) continue;
if (m.from === 'me' && m.text !== CK_TEST_MARK) continue;
const id = m.id; ms.splice(i, 1); n++;
try { if (typeof msgJournalDropMsg === 'function') msgJournalDropMsg(cid, id); } catch (e) {}
}
if (cid === data.activeChat) { try { data.messages = ms; } catch (e) {} }
try { flushSave(); } catch (e) { try { save(); } catch (x) {} }
try { renderMessages(); } catch (e) {}
return _ckR('ok', '撤掉了这一发的 ', n + ' 条', cid === data.activeChat ? '（聊天页已经回到你原来那一屏）' : '');
}
const CK_TTS_LINE = '这一句是刚查的，用来听他的声音通不通';
function _ckVoiceOwner() {
const o = typeof currentContact === 'function' ? currentContact() : null;
if (!o) return { none: true };
if (o.kind === 'group') {
const ms = (o.members || []).filter(Boolean);
const ready = ms.filter(nm => { try { return mmTtsReady(mmOwnerOf(o.id, nm)); } catch (e) { return false; } });
return { group: true, total: ms.length, ready: ready.length, owner: ready.length ? mmOwnerOf(o.id, ready[0]) : null, names: ms.filter(nm => !(ready.indexOf(nm) >= 0)) };
}
return { single: true, name: o.name, ready: mmTtsReady(o), owner: o };
}
async function _ckVoiceTrial() {
if (!_ckCan('mmSettings')) return CK_NOHOST('mmSettings');
const v = mmSettings() || {};
if (!v.on) return _ckR('bad', '声音的总开关没勾，全站一个字也不会念出来');
if (!String(v.key || '').trim()) return _ckR('bad', '要填的那一串密钥还空着（MiniMax 开放平台那一串），所以念不出来');
const who = _ckVoiceOwner();
if (who.none) return _ckR('warn', '现在没选中谁——先在聊天页点开一位，这一发才知道问的是他的声音');
if (who.group && !who.ready) return _ckR('bad', '群里 ' + who.total + ' 位都没绑声音（', { k: 'w', v: (who.names || []).slice(0, 3).join('∶') }, '）——一人一号，不借别人的声音');
if (who.single && !who.ready) return _ckR('bad', '这位还没绑声音，气泡上也不会有小喇叭');
const owner = who.owner;
const timbre = String(owner.mmTimbre || '').trim();
let url = null;
try { url = typeof mmLibraryLookup === 'function' ? mmLibraryLookup(CK_TTS_LINE, timbre, owner.id) : null; } catch (e) {}
if (url) {
const played = await _mmPlayNow(url);
return played ? _ckR('ok', '放了库里存好的那一句（', { k: 'w', v: owner.name || '这位' }, '）——一次都没花')
: _ckR('warn', '声音已经有了（库里那句），但这台设备不让你这样点开它——先点一下屏幕任何地方再试');
}
return {
s: 'warn', t: ['库里没有这一句，所以先不放（放就得现合成一次）。要真听，按下面那枚——', { k: 'b', v: '会花一次额度' }],
pay: { label: '真念一句（会花一次额度）', act: async () => {
try {
const u = await mmSynth(CK_TTS_LINE, timbre);
const played = await _mmPlayNow(u);
try { mmSaveToLibrary(CK_TTS_LINE, timbre, u, owner); } catch (e) {}
return played ? _ckR('ok', '念出来了也放进他那本声音的卡里了——下次同句同音色就一次都不花')
: _ckR('warn', '合成成功了，但这台设备不让这样开播（浏览器拦自动播放）：声音已经拿到，再点一次就响');
} catch (e) { return _ckR('bad', '念不成：', { k: 'w', v: String((e && e.message) || e).slice(0, 80) }, '——哪一道门断了，去 设置 → 声音 按「检测为什么没声音」'); }
} }
};
}
async function _ckActiveTrial() {
const o = typeof currentContact === 'function' ? currentContact() : null;
const p = [];
let s = 'ok';
if (_ckCan('silentStatusText')) p.push(_ckCan('chatSilentOn') && o && chatSilentOn(o.id) ? '他在「不用他主动找我」那份名单里，所以不会自己冒出来（回你话不受影响）' : '名单：' + silentStatusText());
else return CK_NOHOST('silentStatusText');
if (o && _ckCan('chatProbOf') && chatProbOf(o.id) === 0) { s = 'warn'; p.push(' ∶ 这位的频率填的是 0＝从不'); }
if (_ckCan('nightOn') && _ckCan('nightStatusText')) {
if (nightOn()) { s = s === 'ok' ? 'warn' : s; p.push(' ∶ 此刻正卡在夜里那一档（23:00–07:00），这一段他不会自己来'); }
}
if (typeof chatProbOf === 'function' && o && chatProbOf(o.id) > 0) p.push(' ∶ 频率 ' + chatProbOf(o.id) + '%');
return { s: s, t: p };
}
async function _ckWordsTrial() {
const o = typeof currentContact === 'function' ? currentContact() : null;
if (!o) return _ckR('warn', '现在没选中谁——字卡是他一本你一本，得分开看');
if (o.kind === 'group') return _ckR('warn', '这是一个群：群里谁开口用谁那本字卡，点开那位本人的单聊才量得准');
if (!_ckCan('_cfStat') || !_ckCan('_cfItems')) return CK_NOHOST('字卡适应度那两把尺');
let items;
try { items = _cfItems(_cfStat(o.id)) || []; } catch (e) { return _ckR('bad', '这一行没跑完：', { k: 'w', v: String((e && e.message) || e) }); }
const bad = items.filter(x => x.lv === 0), mid = items.filter(x => x.lv === 1);
if (!bad.length && !mid.length) return _ckR('ok', '这位的 ' + items.length + ' 样内容现在都抽得出来');
const parts = [];
if (bad.length) parts.push(bad.length + ' 样一句都抽不出来（', { k: 'w', v: bad.map(x => x.k).join('∶') }, '）');
if (mid.length) parts.push((bad.length ? ' ∶ ' : '') + mid.length + ' 样翻来覆去就那几句（', { k: 'w', v: mid.map(x => x.k).join('∶') }, '）');
return _ckR(bad.length ? 'bad' : 'warn', ...parts, '——他说话就靠这些∶缺哪一类就少那一种');
}
async function _ckNotifyTrial() {
if (!_ckCan('nbPermState')) return CK_NOHOST('nbPermState');
const perm = nbPermState();
if (perm === 'unsupported') return _ckR('warn', '这样打开的网页没有通知这条路（要它就得部署成 https，或装到桌面从主屏幕打开）');
if (perm === 'denied') return _ckR('bad', '通知被拒过一次，浏览器不再问第二遍——得自己去系统或浏览器设置里放行');
if (perm === 'default') return _ckR('warn', '这台设备还没被问过要不要允许：先按 设置 → 通知 那一格里那枚开关，同意之后再来按一次');
if (typeof window.bgNotifyCheck !== 'function') return CK_NOHOST('bgNotifyCheck');
const ap = (typeof data !== 'undefined' && data && data.appearance) || {};
if (!ap.bgNotify) return _ckR('bad', '站里的通知开关没勾，这一发压根不会弹出去（不是这台设备不让）——先去 设置 → 通知 那一格勾上，再回来按一次');
const errBefore = String(window.__bgLastNotifyError || '');
const sentBefore = (typeof window.bgNotifyGateStats === 'function' ? (window.bgNotifyGateStats() || {}).sent : null);
window.bgNotifyCheck('这是一条测试通知', Date.now(), { force: true, late: true, name: '检测功能' });
await new Promise(res => setTimeout(res, 700));
const errAfter = String(window.__bgLastNotifyError || '');
const sentAfter = (typeof window.bgNotifyGateStats === 'function' ? (window.bgNotifyGateStats() || {}).sent : null);
if (errAfter && errAfter !== errBefore) {
return _ckR('bad', '弹不出来：', { k: 'w', v: errAfter.slice(0, 70) }, '（这台设备不让这样弹窗，或那一条路被系统压住了）');
}
if (sentBefore !== null && sentAfter !== null && sentAfter === sentBefore) {
return { s: 'warn', ask: true, t: ['这一发没报错，也没被记账那一栏算成「已发出」∶ 两条读数都摆在这儿', { k: 'b', v: '屏上有没有出现？' }] };
}
return { s: 'warn', ask: true, t: ['这一发没报错 ∶ 但能不能看见只有你自己知道', { k: 'b', v: '屏上有没有出现？' }] };
}
async function _ckNotifySeen(yes) {
if (yes) return _ckR('ok', '看得见——那这条链是通的');
return _ckR('bad', '看不见——多半是系统的省电把它压住了；那一段排障六步在 设置 → 通知 那一格里（下面那枚直接带你过去）');
}
function _ckBgDur(ms) {
ms = Number(ms) || 0;
if (ms < 1000) return ms ? '不到 1 秒' : '0 秒';
const sec = Math.round(ms / 1000);
if (sec < 60) return sec + ' 秒';
const min = Math.floor(sec / 60);
if (min < 60) return min + ' 分' + (sec % 60 ? ' ' + (sec % 60) + ' 秒' : '');
return Math.floor(min / 60) + ' 时' + (min % 60) + ' 分';
}
async function _ckBgTrial() {
const ap = (typeof data !== 'undefined' && data && data.appearance) || {};
if (!ap.bgKeepAlive) return _ckR('warn', '那枚开关没勾：切后台一整页就被冻住，那一段时间里的消息与通知都没有');
if (typeof window.__kaProbe !== 'function') return CK_NOHOST('__kaProbe');
const p = window.__kaProbe() || {};
if (!p.keep || !p.audio) return _ckR('bad', '开关开着，引擎却没起来（这一页此刻并没有在放那段声音）——把保活关一下再开，或回这一页点一下屏幕');
let s = 'ok';
const out = ['开关开着，引擎在跑'];
const paused = p.audio.paused !== false;
if (paused && p.music) out.push(' ∶ 这一刻没放＝', { k: 'b', v: '给播放器让位' }, '（歌那条声音就是页面还活着的凭据，一停它自动接上）');
else if (paused && p.fgHold) out.push(' ∶ 这一刻没放＝', { k: 'b', v: '你正在这一页上动手，它故意按住省电' }, '（手停 ' + Math.round((Number(p.fgIdleMs) || 15000) / 1000) + ' 秒或切后台自动接上——这不是坏了）');
else if (paused) { s = 'bad'; out.push(' ∶ ', { k: 'w', v: '这一刻音频停着：这一段后台不发消息、不弹通知' }, '（回这一页点一下就恢复；老是停在这儿的是别的 App 或系统把这条通道拿走了）'); }
else out.push(' ∶ 音频在放 ·', p.noduck ? '不占你正在听的那条声音' : '占着声音通道（通知栏有那条「后台保活」）');
const ev = p.ev || {};
if (Number(ev.maxHidden)) out.push(' ∶ 这一趟开页面以来，后台最长连续挂过 ', { k: 'b', v: _ckBgDur(ev.maxHidden) }, '（挂得住＝系统在后台留着这一页）');
else out.push(' ∶ 这一趟还没切到过后台，上面那句「挂得住」要切出去一会儿才量得出');
if (Number(ev.fb)) out.push(' ∶ 不占声音那条通道被系统挂起过 ', { k: 'b', v: ev.fb + ' 次' }, '（已经自动换成另一条）');
if (Number(ev.died)) { if (s === 'ok') s = 'warn'; out.push(' ∶ 这一页被系统整个收回去过 ', { k: 'w', v: ev.died + ' 次' }, '——那几段的后台消息是回来才补上的，通知当时弹不出'); }
out.push(' ∶ 页面开着时来消息', (ap.deskPopup === false ? '不会' : '会'), '在屏顶挂一条横幅');
return { s: s, t: out };
}
async function _ckCssTrial(which) {
const a = typeof _apView === 'function' ? (_apView() || {}) : null;
if (!a) return CK_NOHOST('_apView');
const raw = String(which === 'font' ? (a.customGlobalFontCss || a.customFontCss || '') : (a.customBubbleCss || '')).trim();
const who = (typeof currentContact === 'function' && currentContact()) ? (currentContact().name || '这位') : '全站';
if (!raw) return _ckR('ok', which === 'font' ? '你没写过自己的字体样式∶这一条没什么可查（现在用的是站点那一套）' : '你没写过自己的气泡样式∶这一条没什么可查（现在用的是站点那一套）');
const st = document.createElement('style');
st.textContent = raw;
document.head.appendChild(st);
let rules = [];
try { rules = st.sheet ? [...st.sheet.cssRules] : []; }
catch (e) { try { document.head.removeChild(st); } catch (x) {} return _ckR('bad', '这段样式浏览器整份读不了（', { k: 'w', v: String((e && e.message) || e).slice(0, 60) }, '）'); }
const blocks = (raw.match(/\{/g) || []).length;
const dropped = Math.max(0, blocks - rules.length);
const miss = [];
rules.forEach(r => {
const sel = r.selectorText;
if (!sel) return;
sel.split(',').forEach(one => {
let ok = true, hit = null;
try { hit = document.querySelector(one.trim()); } catch (e) { ok = false; }
if (!ok || !hit) miss.push((ok ? one.trim() : one.trim().slice(0, 24)) + (ok ? '' : '（这句写法看不懂）'));
});
});
let painted = null, deadVar = false;
if (which !== 'font') {
try { if (typeof _bubblePaintProbe === 'function') painted = _bubblePaintProbe(); } catch (e) {}
try {
const el = document.querySelector('.bubble');
if (el && typeof _bubblePaintDecl === 'function') deadVar = !!(_bubblePaintDecl(el) || {}).dead;
} catch (e) {}
}
try { document.head.removeChild(st); } catch (e) {}
const p = ['你这 ', { k: 'b', v: blocks + ' 条' }, ' ∶ ', { k: 'b', v: rules.length + ' 条被收下' }];
let s = 'ok';
if (dropped) { s = 'bad'; p.push(' ∶ ', { k: 'w', v: dropped + ' 条整条被丢掉' }, '（写法不合规矩，最常见是少一个右括号或那一行选择器打错）'); }
if (miss.length) { s = s === 'bad' ? 'bad' : 'warn'; p.push(' ∶ 没套上的 ', { k: 'w', v: miss.length + ' 处' }, '（', { k: 'w', v: miss.slice(0, 2).join('∶') }, '）——屏上没有这样东西：气泡是 .bubble，那些卡各有各的名字'); }
if (painted && painted.part && painted.part.bad) { s = 'bad'; p.push(' ∶ 现在这套下去气泡**画不出东西**（你写的这几条落到一个没有值的变量上）'); }
else if (deadVar) { s = 'warn'; p.push(' ∶ 有用到站点里没有的变量，那几条等于没写'); }
p.push(' ∶ 现在生效的是 ', { k: 'w', v: who }, ' 那一份');
return { s: s, t: p };
}
async function _ckBuildTrial() {
const here = typeof window.APP_VER === 'string' ? window.APP_VER : '';
const proto = String(location.protocol || '');
if (proto === 'file:') return _ckR('warn', '这样双击本地文件的：从来不比线上（这一页是 ', { k: 'w', v: here || '读不到' }, '）');
let online = '', manifest = '';
try { const j = await (await fetch('./version.json?ts=' + Date.now(), { cache: 'reload' })).json(); online = String(j.ver || ''); } catch (e) { return _ckR('bad', '问不到线上那一版（', { k: 'w', v: String((e && e.message) || e).slice(0, 40) }, '）'); }
try { const m = await (await fetch('./asset-manifest.json?ts=' + Date.now(), { cache: 'reload' })).json(); manifest = (m.files || []).join(' '); } catch (e) {}
const n = s => String(s || '').replace(/^v/, '');
const inName = n((manifest.match(/app\.v(\d+\.\d+\.\d+)/) || [])[1] || '');
const p = ['屏上 ', { k: 'b', v: here || '读不到' }, ' ∶ 线上 ', { k: 'b', v: online || '读不到' }];
if (inName) p.push(' ∶ 那两份文件叫 app.v' + inName);
if (n(here) && n(here) === n(online) && (!inName || inName === n(here))) {
p.push(' ∶ 是同一版');
if (window.__updChecked === undefined) p.push('（开屏那一次比版没跑完，这一发是当场重问的）');
return _ckR('ok', ...p);
}
return _ckR('bad', ...p, ' ∶ 对不上——彻底关掉浏览器再重开一次（缓存里那一版还在给你用）');
}
async function _ckFitTrial() {
if (!_ckCan('iosFitInp')) return CK_NOHOST('iosFitInp');
let inp = null;
try { inp = iosFitInp(); } catch (e) { return _ckR('bad', '这一行没跑完：', { k: 'w', v: String((e && e.message) || e) }); }
const wide = (inp && inp.wide) || [], small = (inp && inp.small) || [];
if (wide.length) return _ckR('bad', { k: 'b', v: wide.length + ' 枚超出屏幕右边' }, '（', { k: 'w', v: wide.join('∶') }, '）——这一族会把整页自动缩小');
if (small.length) return _ckR('warn', { k: 'b', v: small.length + ' 个输入框字不到 16px' }, '（', { k: 'w', v: small.join('∶') }, '）');
return _ckR('ok', '没有超出屏幕的东西 ∶ 看得见的输入框字都不小');
}
async function _ckNumTrial() {
if (!_ckCan('numInputText')) return CK_NOHOST('numInputText');
const cases = [['５０', '50'], ['１２３', '123'], ['2０', '20']];
const bad = cases.filter(c => { try { return numInputText(c[0]) !== c[1]; } catch (e) { return true; } });
const p = [];
let s = 'ok';
if (bad.length) {
s = 'bad';
p.push('全角键盘打的数认不出：' + bad.map(c => c[0]).join('∶') + '——填进去会被当成没填，格子自己弹回旧数');
} else {
p.push('全角键盘打的数认得出：５０→50 ∶ １２３→123 ∶ 混着打 2０→20');
}
if (typeof window.setNumSafe !== 'function') {
s = 'bad';
p.push(' ∶ 「你正敲着的那一格不被程序顶掉」的守卫也不在——想填 30 会被顶成 53');
} else if (s === 'ok') {
p.push(' ∶ 「你正敲着的那一格不被程序顶掉」的守卫也在');
}
p.push(' ∶ 填数的地方＝聊天设置∶信箱设置∶朋友圈设置∶收藏设置∶问问TA∶通话设置——哪一格填了照旧回弹，就按「反馈」报来');
return { s: s, t: p };
}
const CK_TRIALS = [
{ sec: '还能不能存住', rows: [
{ id: 'store', k: '存一条试试', idle: '还没当场试过：现在只看得见上一次写失败留下的标记', cost: '', run: _ckStoreTrial },
{ id: 'backup', k: '这份备份能不能用', idle: '还没验过手上那份备份：挑一份导出的文件（只读它，不会导进来）', pick: true, run: _ckBackupText, goLabel: '挑一份来验（不导入）' },
{ id: 'exp', k: '现在就导一份', idle: '还没导过（这一趟）', cost: '会在本机存一份文件', run: async () => _ckExportTrial(), free: false }
] },
{ sec: '东西还在不在', rows: [
{ id: 'img', k: '图片和头像能不能开', idle: '还没数：屏上有没有开不了的图 ∶ 存档里有没有断了一半的', run: _ckImgTrial },
{ id: 'space', k: '占多少 ∶ 会不会被自动清掉', idle: '还没量：要读一遍本机存储那一栏', run: _ckSpaceTrial,
do: { label: '去要那一句「不会被自动清掉」（会弹一次授权）', act: async () => {
if (typeof storageAct !== 'function') return CK_NOHOST('storageAct');
storageAct('persist');
return _ckR('warn', '已经问了：给没给要等浏览器答一句，再按一次上面那枚看结果');
} } }
] },
{ sec: '他现在说不说话', rows: [
{ id: 'reply', k: '真发一句，看他回不回', idle: '还没试过：会往这本聊天里落一条，测完可以撤', cost: '落一条（可撤）', run: _ckReplyTrial },
{ id: 'words', k: '他那本字卡抽不抽得出话', idle: '还没重放：按这一本抽一次看看缺哪一类', run: _ckWordsTrial,
go: { view: 'cardfit', label: '看逐项那一屏' } },
{ id: 'voice', k: '真念一句给你听', idle: '还没放：先查库里存过没（查库不花额度）', run: _ckVoiceTrial,
go: { tab: 'sound', fold: 'mx', hit: 'mxCheck', label: '去那一格查八道门' } },
{ id: 'active', k: '他会不会自己来找我', idle: '还没读这份名单与频率', run: _ckActiveTrial,
go: { view: 'silent', label: '去那份名单' } }
] },
{ sec: '消息能不能弹给你看', rows: [
{ id: 'notify', k: '真弹一条系统通知', idle: '还没弹：弹一条出来，看不看得见要你说一句', cost: '屏上会真出现一条', run: _ckNotifyTrial,
go: { tab: 'notify', fold: 'bg', hit: 'testNotify', label: '去那六步排障' } },
{ id: 'bg', k: '切后台还在不在跑', idle: '还没读这两枚开关', run: _ckBgTrial,
go: { tab: 'notify', fold: 'bg', hit: 'bgKeepAlive', label: '去这两枚开关' } }
] },
{ sec: '我改的样式为什么不生效', rows: [
{ id: 'css', k: '我改的气泡样式生没生效', idle: '还没真插一次：逐条量他收没收下 ∶套没套上 ∶算没算进去', run: () => _ckCssTrial('bubble'),
go: { view: 'apcss', label: '去改写那一段' } },
{ id: 'font', k: '我改的字体样式生没生效', idle: '还没真插一次：同上面那一发', run: () => _ckCssTrial('font'),
go: { view: 'fontcss', label: '去改写那一段' } }
] },
{ sec: '我填的数字怎么老变', rows: [
{ id: 'num', k: '全角数字认不认得', idle: '还没试过：把全角键盘打的几个数喂给站里那把解析尺', run: _ckNumTrial }
] },
{ sec: '用的到底是哪一版', rows: [
{ id: 'build', k: '是不是线上那一版', idle: '还没问过线上：要发两发（版号与那份文件清单）', cost: '发两发查版本', run: _ckBuildTrial },
{ id: 'fit', k: '屏上看看不看得见', idle: '还没量：越界与输入框字大小', run: _ckFitTrial }
] }
];
async function _ckExportTrial() {
const btn = document.getElementById('exportAll');
if (!btn) return CK_NOHOST('设置 → 数据 里那枚「导出全部数据」');
let last = 0;
try { last = Number(localStorage.getItem('lastBackupAt')) || 0; } catch (e) {}
btn.click();
await new Promise(res => setTimeout(res, 1200));
let now = 0;
try { now = Number(localStorage.getItem('lastBackupAt')) || 0; } catch (e) {}
if (now && now !== last) return _ckR('ok', '已经交出去了（这一刻起「多久没备份」那一笔重新起算）——文件名 言字卡-全部数据.json');
return _ckR('warn', '按下去了，但没看见「存下来了」那一笔：这台设备可能弹了一个保存框等你选地方');
}
function _ckPickFile() {
return new Promise(res => {
const inp = document.getElementById('ckFile');
if (!inp) { res({ raw: '' }); return; }
inp.onchange = () => {
const f = inp.files && inp.files[0];
if (!f) { res({ raw: '' }); return; }
const fr = new FileReader();
fr.onload = () => res({ raw: String(fr.result || ''), name: f.name });
fr.onerror = () => res({ raw: '' });
try { fr.readAsText(f); } catch (e) { res({ raw: '' }); }
};
inp.click();
});
}
async function _ckRun(row) {
if (_ckBusy[row.id]) return;
_ckBusy[row.id] = 1;
_ckNote = '';
renderCheckPage();
let r;
try {
const arg = row.pick ? await _ckPickFile() : undefined;
r = await row.run(arg);
} catch (e) { r = _ckR('bad', '这一行没跑完：', { k: 'w', v: String((e && e.message) || e).slice(0, 90) }); }
_ckBusy[row.id] = 0;
_ckRes[row.id] = r || _ckR('bad', '这一行什么都没回');
renderCheckPage();
}
async function _ckDo(row, spec) {
if (!spec || _ckBusy[row.id]) return;
_ckBusy[row.id] = 1;
_ckNote = '';
renderCheckPage();
let r;
try { r = await spec.act(); } catch (e) { r = _ckR('bad', '这一发没跑完：', { k: 'w', v: String((e && e.message) || e).slice(0, 90) }); }
_ckBusy[row.id] = 0;
_ckRes[row.id] = r || _ckR('ok', '按下去了');
renderCheckPage();
}
async function _ckRunAll() {
if (_ckBusy.__all) return;
_ckBusy.__all = 1;
_ckNote = '';
renderCheckPage();
const rows = CK_TRIALS.reduce((a, s) => a.concat(s.rows), []).filter(r => CK_FREE.indexOf(r.id) >= 0);
for (const row of rows) {
_ckBusy[row.id] = 1; renderCheckPage();
try { _ckRes[row.id] = (await row.run()) || _ckR('bad', '这一行什么都没回'); }
catch (e) { _ckRes[row.id] = _ckR('bad', '这一行没跑完：', { k: 'w', v: String((e && e.message) || e).slice(0, 90) }); }
_ckBusy[row.id] = 0; renderCheckPage();
}
_ckBusy.__all = 0;
_ckAt = Date.now();
const firstBad = CK_ALL().find(r => (_ckRes[r.id] || {}).s === 'bad');
_ckNote = firstBad ? '· 已翻到第一处不通' : '';
renderCheckPage();
if (firstBad) {
const el = document.querySelector('.ckx-row[data-ck-row="' + firstBad.id + '"]');
if (el) { try { el.scrollIntoView({ block: 'center' }); } catch (e) {} }
}
}
const CK_ALL = () => CK_TRIALS.reduce((a, s) => a.concat(s.rows), []);
function checkText() {
const rows = CK_ALL();
const bad = rows.filter(r => (_ckRes[r.id] || {}).s === 'bad').length, warn = rows.filter(r => (_ckRes[r.id] || {}).s === 'warn').length;
const untried = rows.filter(r => !_ckRes[r.id]).length;
const L = [];
L.push('=== 言字卡 · 检测功能 ===');
L.push('版号 ' + (window.APP_VER || '（读不到）') + ' · ' + new Date().toLocaleString('zh-CN'));
L.push('试过 ' + (rows.length - untried) + ' 发 ∶ 不通 ' + bad + ' ∶ 要看 ' + warn + ' ∶ 还没试 ' + untried + '（没试不等于没问题）');
const o = typeof currentContact === 'function' ? currentContact() : null;
L.push('现在这位：' + (o ? (o.name || o.id) : '（没选中会话）'));
L.push('机型：' + String(navigator.userAgent || ''));
CK_TRIALS.forEach(sec => {
L.push('');
L.push('【' + sec.sec + '】');
sec.rows.forEach(r => {
const x = _ckRes[r.id];
L.push(CK_MARK[x ? x.s : 'none'] + ' ' + r.k + '：' + (x ? _ckTxt(x.t) : r.idle));
});
});
return L.join('\n');
}
function _ckBtns(row) {
const out = [];
const r = _ckRes[row.id];
const busy = !!_ckBusy[row.id];
if (!row.pick) out.push({ k: 'run', label: busy ? '正在跑…' : (r ? '再试一次' : '试一下'), cost: row.cost || '', dis: busy });
if (row.pick) out.push({ k: 'file', label: row.goLabel || '挑一份来验', dis: busy });
if (!busy && row.do && (!r || r.s !== 'ok')) out.push({ k: 'do', label: row.do.label });
if (!busy && r && r.pay) out.push({ k: 'pay', label: r.pay.label });
if (!busy && r && r.undo) out.push({ k: 'undo', label: r.undo.label });
if (!busy && r && r.keep) out.push({ k: 'keep', label: r.keep.label });
if (!busy && r && r.ask) { out.push({ k: 'seen1', label: '看见了' }); out.push({ k: 'seen0', label: '没看见' }); }
if (!busy && row.go) out.push({ k: 'go', label: row.go.label });
return out;
}
function renderCheckPage() {
const host = document.getElementById('ckBody');
if (!host) return;
const rows = CK_ALL();
const untried = rows.filter(r => !_ckRes[r.id]).length;
const bad = rows.filter(r => (_ckRes[r.id] || {}).s === 'bad').length, warn = rows.filter(r => (_ckRes[r.id] || {}).s === 'warn').length;
const sum = document.getElementById('ckSum');
if (sum) sum.innerHTML = _ckBusy.__all
? '正在一发一发跑（不要代价的那几发，一两秒）…'
: (untried === rows.length
? '还没有一发跑过。下面每一行按「试一下」它才真去做那件事——没试过的行不算过了。'
: '跑过 ' + (rows.length - untried) + ' 发 ∶ ' + (bad ? '<b>' + bad + '</b> 发不通' : '没有不通的') + ' ∶ ' + warn + ' 发要看' + (untried ? ' ∶ 还有 ' + untried + ' 发没试' : '') + _ckNote);
const run = document.getElementById('ckRun');
if (run) { run.textContent = _ckBusy.__all ? '正在跑…' : '把不要代价的都跑一遍'; run.disabled = !!_ckBusy.__all; }
host.innerHTML = CK_TRIALS.map(sec => {
const b = sec.rows.filter(r => (_ckRes[r.id] || {}).s === 'bad').length;
return '<div class="fit-sec"><div class="fit-sec-h">' + escapeHTML(sec.sec)
+ '<span class="fit-sec-sub">' + (b ? b + ' 发不通' : sec.rows.length + ' 发') + '</span></div><div class="fit-items ckx-sec">'
+ sec.rows.map(row => {
const r = _ckRes[row.id];
const s = r ? (r.s || 'none') : 'none';
const txt = r ? _ckHtml(r.t) : '<span class="ckx-idle">' + escapeHTML(row.idle) + '</span>';
const btns = _ckBtns(row).map(x => '<button type="button" class="soft-btn ckx-btn' + (x.k === 'run' && s === 'bad' ? ' ckx-btn-warn' : '') + '" data-ck="' + escapeHTML(row.id) + '" data-ck-k="' + x.k + '"' + (x.dis ? ' disabled' : '') + '>' + escapeHTML(x.label) + (x.cost ? '<i>' + escapeHTML(x.cost) + '</i>' : '') + '</button>').join('');
return '<div class="ckx-row ckx-s-' + s + '" data-ck-row="' + escapeHTML(row.id) + '">'
+ '<div class="fit-item"><div class="ckx-head"><span class="fit-item-k">' + escapeHTML(row.k)
+ '</span><span class="fit-item-lv">' + (CK_LABEL[s] || '没试') + '</span></div>'
+ '<div class="fit-item-t">' + txt + '</div></div>'
+ (btns ? '<div class="ckx-btns">' + btns + '</div>' : '') + '</div>';
}).join('') + '</div></div>';
}).join('');
}
async function _ckClick(e) {
const btn = e.target.closest ? e.target.closest('.ckx-btn') : null;
if (!btn) return;
const id = btn.getAttribute('data-ck'), k = btn.getAttribute('data-ck-k');
const row = CK_ALL().find(r => r.id === id);
if (!row) return;
if (k === 'run' || k === 'file') { await _ckRun(row); return; }
if (k === 'do') { await _ckDo(row, row.do); return; }
const r = _ckRes[id] || {};
if (k === 'pay') { await _ckDo(row, r.pay); return; }
if (k === 'undo') { await _ckDo(row, r.undo); return; }
if (k === 'keep') { await _ckDo(row, r.keep); return; }
if (k === 'seen1' || k === 'seen0') { _ckRes[id] = await _ckNotifySeen(k === 'seen1'); renderCheckPage(); return; }
if (k === 'go') {
const g = row.go;
if (g.view) { try { showView(g.view); } catch (x) {} return; }
if (g.tab) { _ckGo(g.tab, g.fold, g.hit); return; }
}
}
async function _ckCopyNow() {
const txt = checkText();
const ok = await copyTextToClipboard(txt);
try { showToast(ok ? '已复制这一屏（没试过的行也一起抄走了）' : '没复制成：这台设备不给剪贴板·长按这一段选中复制，或去 设置 → 数据 → 诊断信息 导出一份'); } catch (e) {}
}
(function _ckBoot() {
const run = document.getElementById('ckRun'), cp = document.getElementById('ckCopy'), body = document.getElementById('ckBody');
if (run) run.addEventListener('click', _ckRunAll);
if (cp) cp.addEventListener('click', _ckCopyNow);
if (body) body.addEventListener('click', _ckClick);
})();
