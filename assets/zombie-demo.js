/* ゾンビタイピングの、ほんのさわりだけをページの中で試せるようにする。
 *
 * なぜ置くか:
 * 「タイピングゲームです」と書いても、面白いかどうかは打ってみないと分からない。
 * 遊びに行く前に、1体だけ倒せるようにしておく。
 * ゲーム本体とは別の、ここだけの簡単な作り（本体は canvas と自作のローマ字判定エンジン）。
 */
(function () {
  const stage = document.querySelector('[data-zdemo]');
  if (!stage || !window.matchMedia('(pointer: fine)').matches) return;   // キーボードのある機械だけ

  /* ── かな → ローマ字。打ち方の揺れ（si / shi など）を許す ── */
  const T = {
    あ:['a'],い:['i'],う:['u'],え:['e'],お:['o'],
    か:['ka'],き:['ki'],く:['ku'],け:['ke'],こ:['ko'],
    が:['ga'],ぎ:['gi'],ぐ:['gu'],げ:['ge'],ご:['go'],
    さ:['sa'],し:['si','shi'],す:['su'],せ:['se'],そ:['so'],
    ざ:['za'],じ:['ji','zi'],ず:['zu'],ぜ:['ze'],ぞ:['zo'],
    た:['ta'],ち:['ti','chi'],つ:['tu','tsu'],て:['te'],と:['to'],
    だ:['da'],ぢ:['di'],づ:['du'],で:['de'],ど:['do'],
    な:['na'],に:['ni'],ぬ:['nu'],ね:['ne'],の:['no'],
    は:['ha'],ひ:['hi'],ふ:['fu','hu'],へ:['he'],ほ:['ho'],
    ば:['ba'],び:['bi'],ぶ:['bu'],べ:['be'],ぼ:['bo'],
    ぱ:['pa'],ぴ:['pi'],ぷ:['pu'],ぺ:['pe'],ぽ:['po'],
    ま:['ma'],み:['mi'],む:['mu'],め:['me'],も:['mo'],
    や:['ya'],ゆ:['yu'],よ:['yo'],
    ら:['ra'],り:['ri'],る:['ru'],れ:['re'],ろ:['ro'],
    わ:['wa'],を:['wo'],ん:['nn','n'],
    ー:['-'],
    きゃ:['kya'],きゅ:['kyu'],きょ:['kyo'],
    しゃ:['sya','sha'],しゅ:['syu','shu'],しょ:['syo','sho'],
    ちゃ:['tya','cha'],ちゅ:['tyu','chu'],ちょ:['tyo','cho'],
    にゃ:['nya'],にゅ:['nyu'],にょ:['nyo'],
    ひゃ:['hya'],ひゅ:['hyu'],ひょ:['hyo'],
    みゃ:['mya'],みゅ:['myu'],みょ:['myo'],
    りゃ:['rya'],りゅ:['ryu'],りょ:['ryo'],
    ぎゃ:['gya'],ぎゅ:['gyu'],ぎょ:['gyo'],
    じゃ:['ja','jya','zya'],じゅ:['ju','jyu','zyu'],じょ:['jo','jyo','zyo'],
    びゃ:['bya'],びゅ:['byu'],びょ:['byo'],
    ぴゃ:['pya'],ぴゅ:['pyu'],ぴょ:['pyo'],
  };

  /* かなを、打つ単位に切る（拗音はまとめて1つ、「っ」は次の子音を重ねる印） */
  function units(kana) {
    const out = [];
    for (let i = 0; i < kana.length; i++) {
      const two = kana.slice(i, i + 2);
      if (T[two]) { out.push({ kana: two, cands: T[two] }); i++; continue; }
      const c = kana[i];
      if (c === 'っ') { out.push({ kana: c, sokuon: true, cands: [] }); continue; }
      out.push({ kana: c, cands: T[c] || [c] });
    }
    // 「っ」の打ち方は、次の文字の子音を重ねる
    out.forEach((u, i) => {
      if (!u.sokuon) return;
      const next = out[i + 1];
      const heads = next ? [...new Set(next.cands.map((r) => r[0]))].filter((ch) => !'aiueo'.includes(ch)) : [];
      u.cands = heads.length ? heads : ['tu'];
    });
    return out;
  }

  const WORDS = [
    { display: '夜明け', kana: 'よあけ' },
    { display: '停電', kana: 'ていでん' },
    { display: '崖っぷち', kana: 'がけっぷち' },
    { display: '銀河', kana: 'ぎんが' },
    { display: '待ち伏せ', kana: 'まちぶせ' },
    { display: '茶色', kana: 'ちゃいろ' },
    { display: '通学路', kana: 'つうがくろ' },
    { display: '生き延びろ', kana: 'いきのびろ' },
  ];

  /* ── 画面をつくる ── */
  stage.innerHTML =
    '<div class="zd__field">' +
      '<img class="zd__soldier" src="/assets/img/zombie/soldier.png" alt="" aria-hidden="true">' +
      '<div class="zd__laser"></div>' +
      '<div class="zd__enemy">' +
        '<div class="zd__word">' +
          '<span class="zd__display"></span>' +
          '<span class="zd__kana"></span>' +
          '<span class="zd__romaji"></span>' +
        '</div>' +
        '<img class="zd__zombie" src="/assets/img/zombie/z1.png" alt="" aria-hidden="true">' +
      '</div>' +
    '</div>';

  const $status = document.createElement('p');
  $status.className = 'zd__status';
  $status.setAttribute('role', 'status');
  stage.after($status);

  const el = (s) => stage.querySelector(s);
  const enemy = el('.zd__enemy'), zombie = el('.zd__zombie'), laser = el('.zd__laser');
  const $display = el('.zd__display'), $kana = el('.zd__kana'), $romaji = el('.zd__romaji');

  const START_X = 88;                     // 右端で見切れないところから歩かせる
  let word, us, ui, buf, killed = 0, live = false, x = START_X, frame = 0, last = 0, raf = 0;

  function pick() {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
    us = units(word.kana); ui = 0; buf = '';
    x = START_X;
    $display.textContent = word.display;
    draw();
  }

  function draw() {
    $kana.innerHTML = us.map((u, i) =>
      `<b class="${i < ui ? 'is-done' : i === ui ? 'is-now' : ''}">${u.kana}</b>`).join('');
    const done = us.slice(0, ui).map((u) => u.cands[0]).join('');
    const rest = us.slice(ui).map((u) => u.cands[0]).join('').slice(buf.length);
    $romaji.innerHTML = `<i class="is-done">${done}${buf}</i>${rest}`;
    enemy.style.setProperty('--x', x + '%');
  }

  function shoot() {
    laser.classList.add('is-on');
    zombie.classList.add('is-hit');
    setTimeout(() => { laser.classList.remove('is-on'); zombie.classList.remove('is-hit'); }, 320);
  }

  function key(e) {
    if (!live) return;
    if (e.key === 'Escape') { stop(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const ch = e.key.toLowerCase();
    if (!/^[a-z-]$/.test(ch)) return;
    e.preventDefault();

    const u = us[ui];
    const next = buf + ch;
    const hit = u.cands.filter((c) => c.startsWith(next));
    if (!hit.length) { flash(); return; }
    buf = next;
    if (hit.some((c) => c === buf)) {
      // 「ん」は、次が母音や な行 のときだけ n ひとつでは終われない
      if (u.kana === 'ん' && buf === 'n') {
        const nx = us[ui + 1];
        if (!nx || /^[aiueony]/.test(nx.cands[0])) { draw(); return; }
      }
      ui++; buf = '';
      if (ui >= us.length) { shoot(); killed++; setTimeout(pick, 340); tell(); return; }
    }
    draw();
  }

  function flash() {
    $romaji.classList.add('is-miss');
    setTimeout(() => $romaji.classList.remove('is-miss'), 180);
  }

  function tell() {
    $status.textContent = killed === 0
      ? 'キーボードのローマ字で打つ。Esc でやめる。'
      : `${killed}体。本編は1,200語以上、6つの難易度で待っている。`;
  }

  /* 近づいてくる。防衛ラインまで来たら、最初からやり直し（ここでは死なない） */
  function tick(t) {
    if (!live) return;
    const dt = last ? Math.min(50, t - last) : 16; last = t;
    x -= dt * 0.0062;                       // 1秒でおよそ6%ぶん近づく
    if (x < 18) { pick(); }                 // ここでは死なない。もう一度出てくるだけ
    frame += dt;
    zombie.src = `/assets/img/zombie/z${(Math.floor(frame / 170) % 4) + 1}.png`;
    draw();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (live) return;
    live = true; last = 0; killed = 0;
    stage.classList.add('is-live');
    pick(); tell();
    addEventListener('keydown', key);
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    live = false; cancelAnimationFrame(raf);
    stage.classList.remove('is-live');
    removeEventListener('keydown', key);
    $status.textContent = killed ? `${killed}体たおした。続きは本編で。` : '';
  }

  stage.addEventListener('click', start);
  stage.addEventListener('focus', start);
  stage.tabIndex = 0;
  stage.setAttribute('role', 'application');
  stage.setAttribute('aria-label', 'ゾンビタイピングのお試し。押すとはじまります');
  $display.textContent = '';
  $status.textContent = '';
})();
