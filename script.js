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

  const name  = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!name || !email) {
    showAlert(alertErr, "氏名とメールアドレスは必須です。");
    return;
  }

  const payload = {
    name,
    company:  document.getElementById("company").value.trim(),
    role:     document.getElementById("role").value.trim(),
    email,
    phone:    document.getElementById("phone").value.trim(),
    sns:      document.getElementById("sns").value.trim(),
    bio:      document.getElementById("bio").value.trim(),
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
  ["name", "company", "role", "email", "phone", "sns", "bio"].forEach((id) => {
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

      const roleCompany = [p.role, p.company].filter(Boolean).join(" / ");

      const links = [];
      if (p.email) links.push(`<a class="profile-link" href="mailto:${escHtml(p.email)}">✉ ${escHtml(p.email)}</a>`);
      if (p.phone) links.push(`<a class="profile-link" href="tel:${escHtml(p.phone)}">📞 ${escHtml(p.phone)}</a>`);
      if (p.sns)   links.push(`<a class="profile-link" href="${escHtml(p.sns)}" target="_blank" rel="noopener">🔗 SNS</a>`);

      return `
        <div class="profile-card">
          <div class="profile-card-top">
            <div class="profile-avatar">${avatarHtml}</div>
            <div>
              <div class="profile-name">${escHtml(p.name)}</div>
              ${roleCompany ? `<div class="profile-role-company">${escHtml(roleCompany)}</div>` : ""}
            </div>
          </div>
          ${p.bio ? `<div class="profile-bio">${escHtml(p.bio)}</div>` : ""}
          ${links.length ? `<div class="profile-links">${links.join("")}</div>` : ""}
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
