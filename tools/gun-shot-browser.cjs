const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const URL = process.env.ZC_QA_URL || 'http://localhost:8768/index.html';
const GUNS = [
  ['beretta', 'burst', 2], ['model10', 'fan', 3], ['mp5', 'auto5', 5], ['model500', null, 1], ['r870', null, 1],
  ['sbshot', null, 1], ['fal', 'burst3', 3], ['model70', null, 1], ['r700', null, 1]
];

async function setup(b, w, h, broken) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true });
  const p = await ctx.newPage();
  const errors = [];
  for (const x of broken || []) await ctx.route('**/' + x, r => r.abort());
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('zc5-meta', JSON.stringify({ shards: 0, unlocked: ['maggie', 'liao'], runs: 0, clears: 0, got: [] }));
    localStorage.setItem('zc5-ui', JSON.stringify({ snd: 0, bgm: 0, spd: .3, orient: 'auto' }));
    setInterval(() => { for (const id of ['dice', 'lvcard', 'enc']) { const e = document.getElementById(id); if (e && !e.hidden) e.click(); } }, 50);
  });
  await p.goto(URL);
  await p.click('#gateNo');
  await p.click('[data-cat="story"]');
  await p.click('[data-rsel="maggie"]');
  await p.click('[data-m="rpick"]');
  await p.click('[data-m="cdone"]');
  await p.click('[data-m="solo"]');
  await p.click('[data-m="go"]');
  await p.waitForFunction(() => G && G.phase === 'node' && !busy, null, { timeout: 60000 });
  await p.evaluate(() => { me().st = { STR: 2, AGI: 2, CON: 2, PER: 4, INT: 1, CHA: 0 }; startFight({ n: 2, types: ['infected'], noMut: 1, mode: 'first' }); });
  await p.waitForFunction(() => G && G.fight && myTurn() && !busy && !G.busy, null, { timeout: 60000 });
  await p.evaluate(() => {
    UI.partyCards = 0; UI.snd = 1; audio();
    Object.assign(window, { __sounds: [], __frames: [], __updates: [], __events: [], __outs: [] });
    const e0 = E; E = (t, d) => { __events.push({ t, d, at: performance.now() }); return e0(t, d); };
    const o0 = out; out = (...a) => { __outs.push(String(a[0])); return o0(...a); };
    const s0 = sfx; sfx = (k, ...a) => { __sounds.push({ k, at: performance.now() }); return s0(k, ...a); };
    const r0 = renderGunVfx;
    renderGunVfx = fx => {
      r0(fx);
      const c = fx.cv, card = c && c.parentElement, pic = card && card.querySelector('.fpic');
      let ink = false;
      if (c && pic && c.width) {
        const pw = Math.floor(pic.offsetWidth * c.width / card.clientWidth);
        const data = c.getContext('2d').getImageData(0, 0, Math.max(1, pw), c.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) { ink = true; break; }
      }
      __frames.push({ f: fx.frame, at: performance.now() - fx.t, id: fx.id, wid: fx.wid, ox: fx.ox, oy: fx.oy, miss: !!fx.miss, ox0: fx.ox0, oy0: fx.oy0, ink });
    };
    const p0 = push; push = (...a) => { __updates.push(performance.now()); return p0(...a); };
  });
  await p.evaluate(() => Promise.all([loadSounds(), loadGunVfx('beretta'), loadGunVfx('r870')]));
  return { ctx, p, errors };
}

async function arm(p, id, roll = 18, stun = 99) {
  await p.evaluate(([id, roll, stun]) => {
    const p = me(); p.gear = []; p.hand = { R: null, L: null };
    const g = newGear(id); g.mag = 30; p.gear.push(g); equip(p, g.u, 'R'); p.aimed = 0; G.fight.sneak = 0;
    for (const f of G.fight.foes) { f.hp = f.max = 200; f.dead = 0; f.stun = stun; f.prone = 0; }
    r2 = () => ({ a: roll, b: roll, s: roll });
    Object.assign(window, { __sounds: [], __frames: [], __updates: [], __events: [], __outs: [] });
    draw();
  }, [id, roll, stun]);
}
const snapSt = p => p.evaluate(() => ({
  hp: G.fight.foes.map(f => f.hp), mag: me().gear[0].mag, frames: __frames, sounds: __sounds, outs: __outs,
  events: __events.map(e => ({ t: e.t, at: e.at, d: e.t === 'gun' ? { wid: e.d.wid, ox: e.d.ox, oy: e.d.oy, shot: e.d.shot, shots: e.d.shots, miss: e.d.miss } : e.t === 'd' ? { label: e.d.label, n: e.d.dice && e.d.dice.length, keys: Object.keys(e.d) } : null })),
  clean: GUN_VFX.list.size === 0 && !document.querySelector('.zc-gun-fx') && !document.querySelector('.zc-gun-react')
}));

(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const table = [];
  try {
    for (const [w, h] of [[844, 390], [393, 690]]) {
      const tag = w + 'x' + h;
      const { ctx, p, errors } = await setup(b, w, h);
      assert.ok(await p.evaluate(() => ['fx/gun-bullet-24.webp', 'fx/gun-pellet-24.webp'].every(k => GUN_VFX.images[k].naturalWidth === 1856 && GUN_VFX.images[k].naturalHeight === 2160)), tag + ' sheets decoded');
      for (const [gid, sk, n] of GUNS) {
        const cfg = await p.evaluate(g => { const c = GUN_VFX_CFG[g]; return { snd: c.snd, gap: c.gap, impact: c.impact, after: c.after, sheet: c.sheet }; }, gid);
        for (const [skill, shots] of sk ? [[null, 1], [sk, n]] : [[null, 1]]) {
          await arm(p, gid);
          await p.evaluate(s => attack(me(), 'R', s, 0), skill);
          await p.waitForFunction(() => GUN_VFX.list.size === 0, null, { timeout: 8000 });
          await p.waitForTimeout(cfg.after ? cfg.after[1] + 50 : 80);
          const st = await snapSt(p);
          const name = tag + ' ' + gid + (skill ? '/' + skill : '');
          const ge = st.events.filter(e => e.t === 'gun' && e.d.wid === gid);
          assert.equal(ge.length, shots, name + ' gun events = shots');
          assert.equal(30 - st.mag, shots, name + ' mag');
          assert.ok(st.hp[0] < 200, name + ' hit');
          assert.ok(ge.every(e => !e.d.miss), name + ' all hits');
          const de = st.events.filter(e => e.t === 'd');
          const dmgLines = st.outs.filter(o => /傷害/.test(o)).length;
          if (shots > 1) {
            assert.equal(de.length, 1, name + ' exactly one dice popup');
            assert.equal(de[0].d.n, shots, name + ' combined dice has one die per shot ' + JSON.stringify(de));
            assert.equal(st.outs.filter(o => /擲骰/.test(o) && /連發/.test(o)).length, 1, name + ' one combined 擲骰 line');
            assert.equal(st.outs.filter(o => /擲骰/.test(o) && /d20/.test(o) && !/連發/.test(o)).length, 0, name + ' no per-shot to-hit lines');
            assert.ok(dmgLines >= shots, name + ' per-shot damage resolution (' + dmgLines + ')');
            assert.ok(new Set(ge.map(e => e.d.ox)).size >= 2, name + ' spread');
            const gaps = ge.slice(1).map((e, i) => e.at - ge[i].at);
            assert.ok(gaps.every(g => Math.abs(g - cfg.gap) < 70), name + ' cadence ' + gaps.map(Math.round) + ' vs ' + cfg.gap);
            table.push({ tag, gun: gid, skill, gaps: gaps.map(Math.round) });
          }
          const fr = st.frames.filter(x => x.wid === gid && x.f >= 0);
          assert.ok(fr.length > 0, name + ' frames drawn');
          assert.ok(!st.frames.some(x => x.ink), name + ' no portrait ink');
          const o0 = fr.map(x => Math.round(x.ox0) + ',' + Math.round(x.oy0));
          assert.equal(new Set(o0).size, 1, name + ' single tracer origin ' + [...new Set(o0)]);
          assert.equal(st.sounds.filter(s => s.k === cfg.snd).length, shots, name + ' ' + cfg.snd + ' sound per shot');
          if (cfg.after) assert.equal(st.sounds.filter(s => s.k === cfg.after[0]).length, shots, name + ' after sound ' + cfg.after[0]);
          assert.ok(st.clean, name + ' cleanup');
        }
      }
      // misses: tracer-only
      for (const gid of ['beretta', 'r870']) {
        await arm(p, gid, 2, 0);
        await p.evaluate(() => attack(me(), 'R', null, 0));
        await p.waitForFunction(() => GUN_VFX.list.size === 0, null, { timeout: 8000 });
        const st = await snapSt(p);
        const ge = st.events.filter(e => e.t === 'gun');
        assert.ok(ge.length === 1 && ge[0].d.miss && st.hp[0] === 200, tag + ' ' + gid + ' miss event');
        assert.ok(st.frames.some(x => x.miss && x.f >= 0 && x.f <= 2), tag + ' ' + gid + ' miss tracer drawn');
        await p.waitForFunction(() => myTurn() && !busy && !G.busy, null, { timeout: 60000 });
      }
      // remote: exact ox/oy, multi-shot, stale seq
      await arm(p, 'fal');
      await p.evaluate(() => {
        const base = SLASH_VFX.stateSeq + 10;
        for (let i = 0; i < 3; i++) { const s = snap(); s.fight.foes[0].hp = 150 - i * 10; enqueue({ t: 'gun', seq: base + i, d: { id: 0, wid: 'fal', head: false, shot: i, shots: 3, ox: [-0.64, 0.5, 0.1][i], oy: [0.31, -0.2, 0][i], state: s } }); }
        window.__base = base;
      });
      await p.waitForFunction(() => !qRun && GUN_VFX.list.size === 0, null, { timeout: 10000 });
      let st = await p.evaluate(() => ({ hp: G.fight.foes[0].hp, f: __frames.filter(x => x.wid === 'fal' && x.f >= 0) }));
      assert.equal(st.hp, 130, tag + ' remote 3-shot applied');
      for (const [ox, oy] of [[-0.64, 0.31], [0.5, -0.2], [0.1, 0]]) assert.ok(st.f.some(x => Math.abs(x.ox - ox) < 1e-9 && Math.abs(x.oy - oy) < 1e-9), tag + ' remote ox/oy exact ' + ox);
      await p.evaluate(() => { const s = snap(); s.fight.foes[0].hp = 10; enqueue({ t: 'gun', seq: __base, d: { id: 0, wid: 'mp5', state: s } }); });
      await p.waitForFunction(() => !qRun);
      assert.equal(await p.evaluate(() => G.fight.foes[0].hp), 130, tag + ' stale seq rejected');
      // fight replaced mid-shot -> cleanup
      await arm(p, 'r870');
      await p.evaluate(() => { playGunShot({ id: 0, wid: 'r870', ox: 0, oy: 0, state: snap() }); });
      await p.waitForFunction(() => GUN_VFX.list.size > 0 && document.querySelector('.zc-gun-fx'), null, { timeout: 3000 });
      await p.evaluate(() => { window.__oldF = G.fight; G.fight = Object.assign({}, G.fight); });
      await p.waitForFunction(() => GUN_VFX.list.size === 0 && !document.querySelector('.zc-gun-fx'), null, { timeout: 3000 });
      await p.evaluate(() => { G.fight = __oldF; clearGunVfx(); draw(); });
      // reduced motion
      await p.emulateMedia({ reducedMotion: 'reduce' });
      for (const gid of ['mp5', 'r870']) {
        await arm(p, gid);
        await p.evaluate(() => { UI.snd = 0; return attack(me(), 'R', null, 0); });
        await p.waitForFunction(() => GUN_VFX.list.size === 0);
        assert.ok(await p.evaluate(() => __frames.length > 0 && __frames.filter(x => x.f >= 0).every(x => x.f === 3)), tag + ' reduced motion ' + gid);
      }
      await p.emulateMedia({ reducedMotion: 'no-preference' });
      assert.equal(errors.length, 0, tag + ' zero page errors: ' + errors.join(' | '));
      console.log('QA PASS:', tag);
      await ctx.close();
    }
    const { ctx, p, errors } = await setup(b, 844, 390, ['fx/gun-bullet-24.webp', 'fx/gun-pellet-24.webp']);
    for (const [gid, sk, n] of [['mp5', 'auto5', 5], ['r870', null, 1]]) {
      await arm(p, gid);
      await p.evaluate(s => attack(me(), 'R', s, 0), sk);
      const st = await p.evaluate(() => ({ hp: G.fight.foes[0].hp, mag: me().gear[0].mag, n: GUN_VFX.list.size, cv: !!document.querySelector('.zc-gun-fx') }));
      assert.ok(st.hp < 200 && st.mag === 30 - n && st.n === 0 && !st.cv, 'broken sheet fallback ' + gid);
    }
    assert.equal(errors.length, 0, 'broken: ' + errors.join(' | '));
    console.log('QA PASS: broken sheet fallback');
    await ctx.close();
    console.log(JSON.stringify(table));
  } finally { await b.close(); }
})();
