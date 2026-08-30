/* サイト全体の細かい動き。
 *
 * 方針: なくても困らないものだけを入れる。
 * JavaScriptが止まっても、ページは普通に読めて、リンクは普通に押せる。
 */

/* ── いちばん上の帯。少しでもスクロールしたら下に線を出す ── */
(function stickyNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('nav--stuck', window.scrollY > 8);
  update();
  addEventListener('scroll', update, { passive: true });
})();

/* ── 下から出てくる動き。動きが苦手な人には出さない ── */
(function reveal() {
  const targets = document.querySelectorAll('.rise');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      // 並んでいるものは、ほんの少しずつ遅らせる
      const siblings = [...e.target.parentElement.children].filter((c) => c.classList.contains('rise'));
      e.target.style.transitionDelay = Math.min(siblings.indexOf(e.target), 4) * 70 + 'ms';
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  targets.forEach((el) => io.observe(el));
})();

/* ── スクリーンショットを大きく見る ──
 * 画像は小さく並べたい。でも文字は読みたい。押したら原寸で開く。 */
(function lightbox() {
  const shots = document.querySelectorAll('[data-zoom]');
  if (!shots.length) return;

  const box = document.createElement('div');
  box.className = 'lightbox';
  box.innerHTML = '<button class="lightbox__close" type="button" aria-label="閉じる">✕</button><img alt="">';
  document.body.append(box);
  const img = box.querySelector('img');
  let opener = null;

  const open = (src, alt) => {
    img.src = src; img.alt = alt || '';
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    box.querySelector('.lightbox__close').focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    if (opener) opener.focus();
  };

  shots.forEach((s) => {
    s.addEventListener('click', () => {
      opener = s;
      const i = s.querySelector('img');
      open(i.dataset.full || i.src, i.alt);
    });
  });
  box.addEventListener('click', (e) => { if (e.target !== img) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-open')) close(); });
})();

/* ── 横に並んだスクリーンショットを、掴んで動かせるように ──
 * setPointerCapture は使わない。掴んだ先の button に click が届かなくなるため。 */
(function dragStrip() {
  document.querySelectorAll('.gallery__strip').forEach((strip) => {
    let down = false, startX = 0, startLeft = 0, moved = 0;

    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;      // 指はブラウザに任せる
      down = true; moved = 0;
      startX = e.clientX; startLeft = strip.scrollLeft;
      strip.style.cursor = 'grabbing';
    });

    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) { strip.scrollLeft = startLeft - dx; e.preventDefault(); }
    });

    addEventListener('pointerup', () => { down = false; strip.style.cursor = ''; });
    addEventListener('pointercancel', () => { down = false; strip.style.cursor = ''; });

    // 掴んで動かしただけのときは、拡大を開かない
    strip.addEventListener('click', (e) => {
      if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; }
    }, true);
  });
})();
