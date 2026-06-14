/* =========================================
   Connect Profile — script.js
   ========================================= */

// ───────────────────────────────────────────
// 顔写真プレビュー（登録ページ）
// ───────────────────────────────────────────
(function setupPhotoPreview() {
  const fileInput = document.getElementById("photoFile");
  if (!fileInput) return;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.getElementById("photoImg");
      const placeholder = document.querySelector(".photo-preview .placeholder");
      img.src = ev.target.result;
      img.style.display = "block";
      if (placeholder) placeholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  });
})();

// ───────────────────────────────────────────
// 画像を Base64 → データURL として取得
// ───────────────────────────────────────────
function getPhotoDataUrl() {
  const img = document.getElementById("photoImg");
  if (!img || !img.src || img.style.display === "none") return "";
  return img.src; // すでに DataURL
}

// ───────────────────────────────────────────
// プロフィール送信
// ───────────────────────────────────────────
async function submitProfile() {
  const btn      = document.getElementById("submitBtn");
  const alertOk  = document.getElementById("alertSuccess");
  const alertErr = document.getElementById("alertError");

  // 前の表示をリセット
  alertOk.classList.remove("show");
  alertErr.classList.remove("show");

  const name     = document.getElementById("name").value.trim();
  const nickname = document.getElementById("nickname").value.trim();
  const email    = document.getElementById("email").value.trim();
  const company  = document.getElementById("company").value.trim();
  const referrer = document.getElementById("referrer").value.trim();

  if (!name || !nickname || !email || !company || !referrer) {
    showAlert(alertErr, "氏名・ニックネーム・メールアドレス・所属・紹介者名は必須です。");
    return;
  }

  const payload = {
    name,
    nickname,
    email,
    company,
    area:      document.getElementById("area").value.trim(),
    lineId:    document.getElementById("lineId").value.trim(),
    instagram: document.getElementById("instagram").value.trim(),
    seeking:   document.getElementById("seeking").value.trim(),
    offering:  document.getElementById("offering").value.trim(),
    hobbies:   document.getElementById("hobbies").value.trim(),
    goals:     document.getElementById("goals").value.trim(),
    source:    document.getElementById("source").value.trim(),
    referrer,
    photoUrl: "",
  };

  btn.disabled = true;
  btn.textContent = "送信中...";

  try {
    const res  = await fetch("/.netlify/functions/add-profile", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json.error || "エラーが発生しました");

    showAlert(alertOk, null); // success
    resetForm();
  } catch (err) {
    showAlert(alertErr, err.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = "登録する";
  }
}

function showAlert(el, message) {
  if (message) el.textContent = "⚠ " + message;
  el.classList.add("show");
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function resetForm() {
  ["name", "nickname", "email", "company", "area", "lineId", "instagram",
   "seeking", "offering", "hobbies", "goals", "source", "referrer"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const img = document.getElementById("photoImg");
  if (img) { img.src = ""; img.style.display = "none"; }
  const ph = document.querySelector(".photo-preview .placeholder");
  if (ph) ph.style.display = "";
}

// ───────────────────────────────────────────
// パスワード認証（閲覧ページ）
// ───────────────────────────────────────────
async function checkPassword() {
  const input   = document.getElementById("passwordInput");
  const errEl   = document.getElementById("pwError");
  const password = input ? input.value : "";

  errEl.classList.remove("show");

  // テスト用リクエスト
  try {
    const res  = await fetch(`/.netlify/functions/get-profiles?password=${encodeURIComponent(password)}`);
    const json = await res.json();

    if (!res.ok) {
      showAlert(errEl, json.error || "パスワードが違います");
      return;
    }

    // 認証成功
    document.getElementById("passwordGate").style.display = "none";
    document.getElementById("profiles-section").style.display = "block";

    renderProfiles(json.profiles);
  } catch (err) {
    showAlert(errEl, "通信エラーが発生しました");
  }
}

// ───────────────────────────────────────────
// プロフィール描画
// ───────────────────────────────────────────
function renderProfiles(profiles) {
  const grid    = document.getElementById("profilesGrid");
  const countEl = document.getElementById("profilesCount");

  if (!profiles || profiles.length === 0) {
    grid.innerHTML = "<p style='color:var(--gray-400);'>まだ登録がありません。</p>";
    countEl.textContent = "0 名";
    return;
  }

  countEl.textContent = `${profiles.length} 名`;

  grid.innerHTML = profiles
    .map((p) => {
      const avatarHtml = p.photoUrl
        ? `<img src="${escHtml(p.photoUrl)}" alt="${escHtml(p.name)}" />`
        : `<span>👤</span>`;

      const rows = [
        p.company   && `<div class="profile-meta-row">🏢 ${escHtml(p.company)}</div>`,
        p.area      && `<div class="profile-meta-row">📍 ${escHtml(p.area)}</div>`,
        p.email     && `<div class="profile-meta-row"><a class="profile-link" href="mailto:${escHtml(p.email)}">✉ ${escHtml(p.email)}</a></div>`,
        p.lineId    && `<div class="profile-meta-row">💬 LINE: ${escHtml(p.lineId)}</div>`,
        p.instagram && `<div class="profile-meta-row">📸 ${escHtml(p.instagram)}</div>`,
      ].filter(Boolean).join("");

      const sections = [
        p.seeking  && `<div class="profile-section"><span class="profile-section-label">🔍 得たいこと</span><p>${escHtml(p.seeking)}</p></div>`,
        p.offering && `<div class="profile-section"><span class="profile-section-label">💡 提供できること</span><p>${escHtml(p.offering)}</p></div>`,
        p.hobbies  && `<div class="profile-section"><span class="profile-section-label">🎯 趣味・ハマっていること</span><p>${escHtml(p.hobbies)}</p></div>`,
        p.goals    && `<div class="profile-section"><span class="profile-section-label">🚀 やりたいこと</span><p>${escHtml(p.goals)}</p></div>`,
      ].filter(Boolean).join("");

      return `
        <div class="profile-card">
          <div class="profile-card-top">
            <div class="profile-avatar">${avatarHtml}</div>
            <div>
              <div class="profile-name">${escHtml(p.name)}</div>
              <div class="profile-role-company">${escHtml(p.nickname)}</div>
            </div>
          </div>
          ${rows ? `<div class="profile-meta">${rows}</div>` : ""}
          ${sections}
        </div>
      `;
    })
    .join("");
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
