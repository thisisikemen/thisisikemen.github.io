/* お問い合わせ先を、ここ1か所だけで決める。
 *
 * なぜこうしたか:
 * 問い合わせ先はページごとに書くと、変えるときに全部直すことになる。
 * 実際「メモるんです」のフォームは、どのアカウントで作ったか分からなくなり、
 * 届いた問い合わせに誰も気づけない状態になっていた。
 * ここを1行変えれば、サイト全部の窓口がいっぺんに切り替わるようにしておく。
 *
 * 使い方: 置きたいところに <div data-contact></div> と書くだけ。
 */

/* ★ここにGoogleフォームのURLを貼ると、全ページがフォームに切り替わる。
      空のままなら、下のメールアドレスが出る。
      （フォームは kawabatakoshiro@gmail.com のアカウントで作ること） */
const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe5sUGp54AknWcp4vD-0AHGFacikkQ5RBelwEyZx2nKLoZsHQ/viewform";

/* フォームが無いときの連絡先。HTMLに直接書かないことで、機械的な収集を避ける */
const MAIL_USER = "ikemenkk.1129";
const MAIL_DOMAIN = "gmail.com";

document.querySelectorAll("[data-contact]").forEach((slot) => {
  const box = document.createElement("section");
  box.className = "note";

  const title = document.createElement("strong");
  title.textContent = "お問い合わせ";
  box.append(title, document.createElement("br"));

  box.append(
    document.createTextNode(
      "使い方で困ったこと、うまく動かないこと、こうしてほしいという要望。なんでも送ってください。"
    ),
    document.createElement("br")
  );

  if (FORM_URL) {
    const button = document.createElement("a");
    button.className = "cta";
    button.href = FORM_URL;
    button.target = "_blank";
    button.rel = "noopener";
    button.textContent = "お問い合わせフォームを開く";
    button.style.marginTop = ".75rem";
    box.append(button);
  } else {
    const address = `${MAIL_USER}@${MAIL_DOMAIN}`;
    const link = document.createElement("a");
    link.href = `mailto:${address}`;
    link.textContent = address;
    box.append(link);
  }

  slot.replaceWith(box);
});
