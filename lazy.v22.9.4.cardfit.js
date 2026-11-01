// 本件由 tools/assemble.py 生成·勿手改：首屏 JS 分片（进这一页那一刻才取），源＝js/ 那些拆分件
let _cfWho = '';
let _cfLive = false;
function _cfSingles() { return (data.contacts || []).filter(x => x.kind !== 'group'); }
function _cfName(cid) { const c = (data.contacts || []).find(x => x.id === cid); return fixedNameOf(c) || 'TA'; }
function _cfBh(cid) {
const s = data.chatSettings && data.chatSettings[cid];
return s && typeof s === 'object' ? s : (data.behavior || defaults.behavior || {});
}
function _cfImgPool(cid) { return typeof partnerStickerPool === 'function' ? partnerStickerPool(cid) : []; }
function _cfVoicePool(cid) {
const out = [];
(data.groups || []).forEach(g => {
if ((g.category || '主字卡') !== '语音' || cardScope(g) === 'public' || (g.contactId || '') !== cid) return;
(g.cards || []).forEach(c => { if (cardIsOff(g, c)) return; const v = voiceCardParts(c); if (v && v.data) out.push(v); });
});
return out;
}
function _cfMainGroups(cid) {
const out = [];
(data.groups || []).forEach(g => {
if ((g.category || '主字卡') !== '主字卡' || !groupUsableFor(g, cid)) return;
const cs = (g.cards || []).filter(c => !cardIsOff(g, c)).map(cardText).filter(t => t && !voiceCardParts(t));
if (cs.length) out.push({ name: g.name || '（无名）', scope: cardScope(g), cs });
});
return out;
}
function _cfNotSpeech(t) { return !/[A-Za-z一-鿿]/.test(t); }
function _cfStat(cid) {
const bh = _cfBh(cid);
const main = _cfMainGroups(cid);
const texts = [];
main.forEach(x => texts.push.apply(texts, x.cs));
const own = main.filter(x => x.scope !== 'public');
const pub = main.filter(x => x.scope === 'public');
const ownTexts = [];
own.forEach(x => ownTexts.push.apply(ownTexts, x.cs));
const pubTexts = [];
pub.forEach(x => pubTexts.push.apply(pubTexts, x.cs));
const pool = _cfImgPool(cid);
const imgs = pool.filter(p => p.kind === 'image');
const sticks = pool.filter(p => p.kind !== 'image');
const voice = _cfVoicePool(cid);
const ttsReady = typeof mmTtsReady === 'function' && mmTtsReady((data.contacts || []).find(x => x && x.id === cid));
let catImgs = 0;
(data.groups || []).forEach(g => {
const cat = g.category || '主字卡';
if (cat !== '表情包' && cat !== '图片') return;
if (!groupUsableFor(g, cid)) return;
(g.cards || []).forEach(c => { if (cardImage(c) && !cardIsOff(g, c)) catImgs++; });
});
const uniq = new Set(texts);
const short = texts.filter(t => t.trim().length <= 4).length;
const junk = texts.filter(_cfNotSpeech).length;
const need = Math.max(bh.pyEnabled ? (Number(bh.pyMax) || 1) : 1, Number(bh.replyMax) || 1);
let ttsN = 0;
if (ttsReady && typeof mmSpeakable === 'function') {
for (const t of texts) { if (ttsN >= 6) break; if (mmSpeakable(t)) ttsN++; }
}
return {
cid, bh, texts, need, main, ttsReady, ttsN,
kinds: uniq.size,
pubN: pubTexts.length, ownN: ownTexts.length,
ownGroups: own.map(x => ({ name: x.name, n: x.cs.length })),
rec: voice.length, img: imgs.length, sticker: sticks.length,
poke: _categoryCards('拍一拍', cid).length,
kao: _categoryCards('颜文字', cid).length,
emoji: _categoryCards('emoji', cid).length,
catImgs, borrow: !!pool.length && !catImgs,
short, junk, dup: texts.length - uniq.size
};
}
const CF_LV = ['难', '中', '易'];
function _cfPct(v) { return Math.max(0, Math.min(100, Number(v) || 0)); }
function _cfItems(s) {
const bh = s.bh || {};
const out = [];
const add = (k, lv, txt) => out.push({ k, lv, txt });
if (!s.kinds) add('主字卡', 0, '一句能说的都没有');
else if (s.kinds < s.need) add('主字卡', 0, `${s.kinds} 种说法，一次回话最多抽 ${s.need} 张——凑不齐`);
else if (s.kinds < s.need * 3) add('主字卡', 1, `${s.kinds} 种说法，一次回话最多抽 ${s.need} 张——够说，但翻来覆去就那几句`);
else add('主字卡', 2, `${s.kinds} 种说法，一次回话最多抽 ${s.need} 张——够抽开`);
const vp = _cfPct(bh.voiceProb);
if (!s.rec && !s.ttsReady) add('语音', 0, '一段录音都没有，也没绑音色——发不出声音');
else if (!vp) add('语音', 0, '有货，但语音概率调成了 0%');
else if (!s.rec) add('语音', 1, `没有录音，绑了音色：文字卡会念成语音发（语音概率 ${vp}%）`);
else add('语音', 2, `${s.rec} 段录音，语音概率 ${vp}%${s.ttsReady ? '（文字卡也会念成语音）' : ''}`);
const ip = _cfPct(bh.imageProb);
if (!s.img) add('图', 0, '一张都没有');
else if (!ip) add('图', 0, `${s.img} 张，但发图概率调成了 0%`);
else add('图', 2, `${s.img} 张，发图概率 ${ip}%`);
const sp = _cfPct(bh.stickerProb);
if (!s.sticker) add('表情包', 0, '一张都没有');
else if (!sp) add('表情包', 0, `${s.sticker} 张，但表情包概率调成了 0%`);
else add('表情包', 2, `${s.sticker} 张，表情包概率 ${sp}%${s.borrow ? '（借的是你自己的表情池）' : ''}`);
const tp = _cfPct(bh.touchProb);
if (s.poke && !tp) add('拍一拍', 0, `${s.poke} 张，但概率调成了 0%`);
else if (s.poke) add('拍一拍', 2, `${s.poke} 张，概率 ${tp}%`);
else add('拍一拍', 1, '没有拍一拍的卡，只会发固定的那一句');
const kp = _cfPct(bh.kaomojiProb);
if (!s.kao) add('颜文字', 0, '一张都没有，句尾不会出现');
else if (!kp) add('颜文字', 0, `${s.kao} 张，但概率调成了 0%`);
else add('颜文字', 2, `${s.kao} 张，${kp}% 挂在句尾`);
const ep = _cfPct(bh.emojiProb);
if (!s.emoji) add('emoji', 0, '一张都没有，句尾不会出现');
else if (!ep) add('emoji', 0, `${s.emoji} 张，但概率调成了 0%`);
else add('emoji', 2, `${s.emoji} 张，${ep}% 挂在句尾`);
const g = _cfPresetGaps();
if (!g.miss.length && !g.thin.length) add('系统自带的话', 2, `${g.total} 组都在`);
else if (g.miss.length) {
const feats = [];
g.miss.forEach(x => { if (feats.indexOf(x.feat) < 0) feats.push(x.feat); });
add('系统自带的话', 0, `${g.total} 组里缺 ${g.miss.length} 组——${feats.slice(0, 3).join('、')}${feats.length > 3 ? ' 等' : ''}这些功能会没话说`);
} else add('系统自带的话', 1, `${g.thin.length} 组只剩一两张——偏薄`);
return out;
}
function _cfGrade(s, items) {
const main = items[0] ? items[0].lv : 0;
const forms = [1, 2, 3].filter(i => items[i] && items[i].lv > 0);
if (main === 0) {
const ft = forms.map(i => ['语音', '图', '表情包'][i - 1]).join('、');
return { lv: 0, why: ft
? `凑不出一次回话的量：文字那句抽不够，能发出来的只有 ${ft}——撑不起一句像样的话。`
: '凑不出一次回话的量——一句能说的都没有，语音、图、表情包也一样都没有，TA 主动开口只会沉默。' };
}
if (main === 1) return { lv: 1, why: '说得出口，但翻来覆去就那几句；这一本还撑不住一段像样的对话。' };
if (!forms.length) return { lv: 1, why: '说得出，但只有文字一种形态：不会发语音、不会发图，也不会发表情包。' };
return { lv: 2, why: `说得出也说得开：${s.kinds} 种说法，另外还有 ${forms.map(x => x.k).join('、')}。` };
}
const CF_SIM_MIN_ROUNDS = 12;
const CF_SIM_MAX_ROUNDS = 3000;
const CF_SIM_BASE_ROUNDS = 30;
const CF_SAMPLE_N = 8;
function _cfPushSample(out, k, t, src) {
if (out.samples.length < CF_SAMPLE_N) out.samples.push({ k, t: t || '', src: src || '' });
}
let _cfSimCache = null;
function _cfRng(seed) {
let a = seed >>> 0;
return function () {
a = (a + 0x6D2B79F5) | 0;
let t = Math.imul(a ^ (a >>> 15), 1 | a);
t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
}
function _cfSimRounds(bh) {
let est = CF_SIM_BASE_ROUNDS;
let basis = '按每周 ' + CF_SIM_BASE_ROUNDS + ' 句的基准，';
if (bh.asEnabled) {
const lo = Math.max(1, Number(bh.asMin) || 1);
const hi = Math.max(lo, Number(bh.asMax) || lo || 5);
const avgMin = (lo + hi) / 2;
const prob = Math.max(0, Math.min(100, Number(bh.asProb) || 0)) / 100;
const clo = Math.max(1, Number(bh.asCountMin) || 1);
const chi = Math.max(clo, Number(bh.asCountMax) || clo || 1);
est = (1440 / avgMin) * prob * 7 * ((clo + chi) / 2);
basis = '按 TA 的主动发送节奏，';
}
return { rounds: Math.max(CF_SIM_MIN_ROUNDS, Math.min(CF_SIM_MAX_ROUNDS, Math.round(est))), basis };
}
function _cfSim(cid, stat, liveRnd) {
const entries = [];
let hash = 0;
stat.main.forEach((g, gi) => g.cs.forEach(t => {
entries.push({ t, gi });
hash = (hash + t.charCodeAt(0) * 31 + t.length) >>> 0;
}));
const P = entries.length;
const kindsAll = new Set(entries.map(e => e.t));
const bh = stat.bh;
const imgPool = _cfImgPool(cid);
const images = imgPool.filter(p => p.kind === 'image');
const stickers = imgPool.filter(p => p.kind !== 'image');
const voices = _cfVoicePool(cid);
const shapes = { voices: voices.length, images: images.length, stickers: stickers.length, main: P, tts: stat.ttsN };
const rr = _cfSimRounds(bh);
const out = { rounds: rr.rounds, basis: rr.basis, live: !!liveRnd, draws: 0, poolKinds: kindsAll.size,
reached: 0, reachRate: 0, drownedKinds: 0, dropped: 0,
msgKinds: { text: 0, voice: 0, image: 0, sticker: 0 }, samples: [],
imgKinds: new Set(imgPool.map(p => p.src)).size, imgReached: 0, voiceKinds: voices.length, voiceReached: 0 };
if (!P && !shapes.voices && !shapes.images && !shapes.stickers) return out;
const sig = [cid, out.rounds, P, kindsAll.size, hash, shapes.voices, shapes.images, shapes.stickers, shapes.tts,
Number(bh.voiceProb) || 0, Number(bh.imageProb) || 0, Number(bh.stickerProb) || 0].join('|');
if (!liveRnd && _cfSimCache && _cfSimCache.sig === sig) return _cfSimCache.out;
const rnd = liveRnd || _cfRng(20261015);
const roll = p => rnd() * 100 < (p === undefined ? 0 : (Number(p) || 0));
const hit = {}, imgHit = new Set(), voiceHit = new Set();
let draws = 0;
const mk = out.msgKinds;
for (let r = 0; r < out.rounds; r++) {
const kind = _asShapeKind(bh, shapes, roll);
if (kind === 'voice') { mk.voice++; const v = voices.length ? voices[Math.floor(rnd() * voices.length)] : null; if (v) voiceHit.add(v.data); _cfPushSample(out, '语音', v ? v.name : ''); continue; }
if (kind === 'image') { mk.image++; const im = images.length ? images[Math.floor(rnd() * images.length)] : null; if (im) imgHit.add(im.src); _cfPushSample(out, '图片', '', im ? im.src : ''); continue; }
if (kind === 'sticker') { mk.sticker++; const st = stickers.length ? stickers[Math.floor(rnd() * stickers.length)] : null; if (st) imgHit.add(st.src); _cfPushSample(out, '表情包', '', st ? st.src : ''); continue; }
if (kind !== 'text') continue;
mk.text++;
if (!P) continue;
const e = entries[Math.floor(rnd() * P)];
hit[e.t] = (hit[e.t] || 0) + 1;
draws++;
_cfPushSample(out, '文字', e.t);
}
out.draws = draws;
out.imgReached = imgHit.size; out.voiceReached = voiceHit.size;
Object.keys(hit).forEach(t => { out.reached++; });
kindsAll.forEach(t => { if (!hit[t]) out.dropped++; });
out.drownedKinds = out.dropped;
out.reachRate = out.poolKinds ? Math.round(out.reached * 100 / out.poolKinds) : 0;
if (!liveRnd) _cfSimCache = { sig, out };
return out;
}
function _cfPresetGaps() {
const have = {};
(data.groups || []).forEach(g => {
if ((g.category || '主字卡') !== 'TA心里话') return;
if (Array.isArray(g.cards) && g.cards.length) have[g.name] = (have[g.name] || 0) + g.cards.length;
});
const miss = [], thin = [];
Object.keys(PRESET_FEATURE_OF).forEach(name => {
const n = have[name] || 0;
if (!n) miss.push({ name, feat: PRESET_FEATURE_OF[name] });
else if (n <= 2) thin.push({ name, feat: PRESET_FEATURE_OF[name], n });
});
return { total: Object.keys(PRESET_FEATURE_OF).length, miss, thin };
}
function cfRender() {
const box = $('#cfList');
if (!box) return;
const singles = _cfSingles();
if (_cfWho && !singles.some(c => c.id === _cfWho)) _cfWho = '';
const tt = $('#topbarTitleText');
if (tt) tt.textContent = '字卡适应度';
const bar = $('#cfOwners');
if (!singles.length) {
if (bar) bar.innerHTML = '';
box.innerHTML = '<div class="fit-empty">还没有联系人，先去首页加一个 TA。</div>';
return;
}
if (!_cfWho) _cfWho = (singles.find(c => c.id === data.activeChat) || singles[0]).id;
if (bar) {
bar.innerHTML = singles.map(c =>
`<button type="button" class="av-chip cj-ow${c.id === _cfWho ? ' on' : ''}" data-cf-who="${escapeHTML(c.id)}"><span class="av-chip-name">${escapeHTML(_cfName(c.id))}</span></button>`
).join('');
const on = bar.querySelector('.cj-ow.on');
if (on) bar.scrollLeft = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;
}
const cid = _cfWho, stat = _cfStat(cid), sim = _cfSim(cid, stat, _cfLive ? Math.random : null);
const items = _cfItems(stat), grade = _cfGrade(stat, items);
box.innerHTML = _cfGradeHTML(grade) + _cfIntroHTML(stat, sim, grade) + _cfItemsHTML(items) + _cfSampleHTML(sim);
if (typeof initLazyImages === 'function') { try { initLazyImages(); } catch (e) {} }
}
function _cfGradeHTML(g) {
const row = CF_LV.map((t, i) => `<div class="fit-lv${i === g.lv ? ' on' : ''}"><span class="fit-lv-n">${t}</span><i class="fit-lv-bar"></i></div>`).join('');
return `<div class="fit-grade"><div class="fit-grade-k">档位</div><div class="fit-grade-row">${row}</div>`
+ `<p class="fit-grade-why">${escapeHTML(g.why)}</p></div>`;
}
function _cfIntroHTML(s, sim, g) {
const bh = s.bh || {};
const formTxt = `语音 ${_cfPct(bh.voiceProb)}% · 图 ${_cfPct(bh.imageProb)}% · 表情包 ${_cfPct(bh.stickerProb)}%`;
const mk = sim.msgKinds;
const mkTxt = [['文字', mk.text], ['语音', mk.voice], ['图', mk.image], ['表情包', mk.sticker]]
.filter(x => x[1]).map(x => x[0] + ' ' + x[1] + ' 条').join(' · ');
let h = '<div class="fit-sec"><div class="fit-sec-h">详细介绍</div><div class="fit-facts">';
h += `<div>TA 不自己造句：主动开口时先按你调的概率掷一次形态（${formTxt}），掷不中就从主字卡里抽，一次回话最多 <b>${s.need}</b> 张；世界感知这些功能自带的话，是按组名从系统预设里取的。</div>`;
h += `<div>这一本里现在有：主字卡 <b>${s.kinds}</b> 种说法（<b>${s.main.length}</b> 组，其中 <b>${s.ownN}</b> 句是专门写给 TA 的）、录音 <b>${s.rec}</b> 段、图 <b>${s.img}</b> 张、表情包 <b>${s.sticker}</b> 张、拍一拍 <b>${s.poke}</b> 张、颜文字 <b>${s.kao}</b> 张、emoji <b>${s.emoji}</b> 张。</div>`;
const anyPool = s.kinds || s.img || s.sticker || s.rec || s.ttsReady;
if (!anyPool) {
h += '<div>这一本现在一样也抽不出来：主字卡∶图∶表情包∶语音都是空的，TA 主动开口只会沉默。</div>';
} else {
h += `<div>${sim.basis}摇 <b>${sim.rounds}</b> 次：`
+ (sim.draws
? `抽了 <b>${sim.draws}</b> 张主字卡，轮到 <b>${sim.reached}</b> 种`
+ (sim.drownedKinds ? `，另有 <b>${sim.drownedKinds}</b> 种一次没轮到（随机挑时它们少见，不等于说不出口）` : '，每一种都轮到过')
: '一句文字也没抽到（主字卡是空的）')
+ (mkTxt ? `；这些次里 ${mkTxt}` : '') + '。</div>';
h += '<div>所以这一档只看一件事：现在抽不抽得出一句说得出口的话——难＝凑不齐一次回话的量，中＝抽得出但翻来覆去就那几句、或只有文字一种形态，易＝说得出也说得开。</div>';
}
h += '</div></div>';
return h;
}
function _cfItemsHTML(items) {
const okN = items.filter(x => x.lv > 0).length;
return '<div class="fit-sec"><div class="fit-sec-h">现有内容逐项检测<span class="fit-sec-sub">' + okN + ' / ' + items.length + ' 项发得出</span></div>'
+ '<div class="fit-items">'
+ items.map(x => `<div class="fit-item fit-item-lv${x.lv}"><span class="fit-item-k">${escapeHTML(x.k)}</span><span class="fit-item-t">${escapeHTML(x.txt)}</span><span class="fit-item-lv">${CF_LV[x.lv]}</span></div>`).join('')
+ '</div><div class="fit-note">这一页只读：你的一张字卡都不动，库也不写；某一项是「难」，多半只是那一类还没存东西。</div></div>';
}
function _cfSampleHTML(sim) {
if (!sim.samples || !sim.samples.length) return '';
let h = `<div class="fit-sec"><div class="fit-sec-h">随机抽 ${sim.samples.length} 句 · TA 现在会这么说<span class="fit-sec-sub">${sim.live ? '这一次真随机' : '按现在的设置'}</span></div><div class="fit-samples">`;
h += sim.samples.map(x => x.k === '文字'
? `<div class="fit-sample"><span class="fit-sample-t">${escapeHTML(x.t || '（空）')}</span></div>`
: `<div class="fit-sample fit-sample-media">${x.src ? `<img class="fit-sample-img" data-src="${escapeHTML(x.src)}" alt="${escapeHTML(x.k)}" data-lazy-img="true">` : ''}<span class="fit-sample-tag">【${x.k}${x.t ? ' · ' + escapeHTML(x.t.slice(0, 12)) : ''}】</span></div>`).join('');
h += `</div><div class="fit-note">这几条是拿 TA 这一本卡按线上那条链现摇的——这就是随机机制真会吐出来的东西。</div>`;
h += `<div class="fit-adv-go"><button type="button" class="fit-adv-btn" data-cf-reroll="1">换一批</button></div>`;
return h + '</div>';
}
function _cfGoCards(scope, tab, kw) {
currentCardsScope = scope;
if (typeof saveCardsScope === 'function') saveCardsScope();
if (CARD_CATEGORIES.includes(tab)) currentCardsTab = tab;
cardsSelectGroup(-1, '');
groupSearch = kw || '';
saveCardsWho('all');
showView('cards');
}
document.addEventListener('click', e => {
const t = e.target;
if (!t.closest) return;
const rr = t.closest('[data-cf-reroll]');
if (rr) { _cfLive = true; cfRender(); return; }
const who = t.closest('[data-cf-who]');
if (who) { if (_cfWho !== who.dataset.cfWho) _cfLive = false; _cfWho = who.dataset.cfWho; cfRender(); return; }
});
