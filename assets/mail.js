/* メールアドレスを HTML に直接書かず、表示のときに組み立てる。
 *
 * 何のためか: ページを機械が読みに来て、アドレスを集めていく（スパムの元）。
 * ここで組み立てれば、HTMLをそのまま読んだだけでは拾えない。
 * 完全には防げないが、いちばん雑な収集は避けられる。
 *
 * 使い方: <span class="mail" data-user="…" data-domain="…"></span>
 */
document.querySelectorAll(".mail").forEach((el) => {
  const address = `${el.dataset.user}@${el.dataset.domain}`;
  const link = document.createElement("a");
  link.href = `mailto:${address}`;
  link.textContent = address;
  el.replaceWith(link);
});
