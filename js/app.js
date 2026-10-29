const PAGE = (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'index';

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function absoluteUrl(p) { try { return new URL(p, location.href).href; } catch(_) { return p; } }

async function loadJSON(path) {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load " + path + " (" + r.status + ")");
  return r.json();
}
async function loadApps() {
  try { const d = await loadJSON("data/apps.json"); return Array.isArray(d.apps) ? d.apps : []; }
  catch (e) { console.error(e); return []; }
}
async function loadPosts() {
  try {
    const d = await loadJSON("data/updates.json");
    return (Array.isArray(d.posts) ? d.posts : []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  } catch (e) { console.error(e); return []; }
}

/* nav active + mobile menu */
function initNav() {
  document.querySelectorAll("[data-nav]").forEach(el => {
    el.classList.toggle("active", el.dataset.nav === PAGE || (PAGE === "index" && el.dataset.nav === "index"));
  });
  const moreBtn = document.getElementById("moreBtn");
  const moreMenu = document.getElementById("moreMenu");
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener("click", e => { e.stopPropagation(); moreMenu.classList.toggle("open"); });
    document.addEventListener("click", () => moreMenu.classList.remove("open"));
  }
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

/* HOME — 3 recent posts */
async function initHome() {
  const box = document.getElementById("home-posts");
  if (!box) return;
  const posts = await loadPosts();
  if (!posts.length) { box.innerHTML = '<p class="loading">No posts yet.</p>'; return; }
  box.innerHTML = posts.slice(0,3).map(p =>
    '<a class="recent-item" href="updates.html#' + esc(p.id) + '">' +
      '<div class="recent-date">' + esc(p.dateLabel || p.date) + '</div>' +
      '<div class="recent-title">' + esc(p.title) + '</div>' +
      '<div class="recent-snippet">' + esc(p.excerpt) + '</div>' +
    '</a>'
  ).join("");
}

/* UPDATES PAGE */
let _posts = [];
function allTags(posts) {
  const s = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => s.add(t)));
  return ["All Topics", ...s];
}
let _activeTag = "All Topics";

function renderFilters() {
  const box = document.getElementById("blog-filters");
  if (!box) return;
  box.innerHTML = allTags(_posts).map(t =>
    '<button class="tag-chip ' + (t === _activeTag ? "active" : "") + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>'
  ).join("");
  box.querySelectorAll(".tag-chip").forEach(b => b.addEventListener("click", () => {
    _activeTag = b.dataset.tag; renderFilters(); renderList();
  }));
}

function filtered() {
  if (_activeTag === "All Topics") return _posts;
  return _posts.filter(p => (p.tags || []).includes(_activeTag));
}

function renderList() {
  const box = document.getElementById("blog-list");
  if (!box) return;
  const list = filtered();
  if (!list.length) { box.innerHTML = '<p class="loading">No posts in this topic yet.</p>'; return; }
  box.innerHTML = list.map(p => {
    const tag = (p.tags || [])[0] || "BLOG";
    return '<article class="blog-card" data-post-id="' + esc(p.id) + '">' +
      '<div class="blog-card-top">' +
        '<span class="blog-tag">' + esc(tag) + '</span>' +
        '<span class="blog-read">⏱ ' + esc(p.readTime || "3 min read") + '</span>' +
      '</div>' +
      '<h3>' + esc(p.title) + '</h3>' +
      '<p>' + esc(p.excerpt) + '</p>' +
      '<div class="blog-card-bottom">' +
        '<span>' + esc(p.dateLabel || p.date) + '</span>' +
        '<span class="read-guide">READ GUIDE →</span>' +
      '</div>' +
    '</article>';
  }).join("");
  box.querySelectorAll(".blog-card").forEach(c => c.addEventListener("click", () => {
    location.hash = c.dataset.postId;
  }));
}

function showDetail(id) {
  const post = _posts.find(p => p.id === id);
  if (!post) return;
  const list = document.getElementById("blog-list-view");
  const det = document.getElementById("blog-detail");
  if (!list || !det) return;
  list.classList.add("hidden");
  det.classList.remove("hidden");
  const tags = post.tags || [];
  const body = (post.content || []).map(x => "<p>" + esc(x) + "</p>").join("");
  det.innerHTML =
    '<button class="back-btn" id="blogBackBtn">← Back to blog</button>' +
    '<div class="blog-detail-meta">' +
      '<span class="blog-tag">' + esc(tags[0] || "BLOG") + '</span>' +
      '<span>' + esc(post.dateLabel || post.date) + '</span>' +
      '<span>⏱ ' + esc(post.readTime || "3 min read") + '</span>' +
    '</div>' +
    '<h1>' + esc(post.title) + '</h1>' +
    '<p class="blog-detail-excerpt">' + esc(post.excerpt) + '</p>' +
    '<div class="author-line">Written by <strong>' + esc(post.author || "openglix Team") + '</strong></div>' +
    '<div class="blog-content">' + body + '</div>';
  document.getElementById("blogBackBtn").addEventListener("click", () => { location.hash = ""; });
  window.scrollTo(0,0);
}

function hideDetail() {
  const list = document.getElementById("blog-list-view");
  const det = document.getElementById("blog-detail");
  if (!list || !det) return;
  list.classList.remove("hidden");
  det.classList.add("hidden");
  det.innerHTML = "";
}

async function initUpdates() {
  if (!document.getElementById("blog-list")) return;
  _posts = await loadPosts();
  if (!_posts.length) {
    document.getElementById("blog-list").innerHTML = '<p class="loading">No posts yet.</p>';
    return;
  }
  renderFilters();
  renderList();
  const id = location.hash.slice(1);
  if (id) showDetail(id);
  window.addEventListener("hashchange", () => {
    const newId = location.hash.slice(1);
    if (newId) showDetail(newId); else hideDetail();
  });
}

/* APP CARDS (downloads + faq) */
function renderApps(containerId, withQr, apps) {
  const box = document.getElementById(containerId);
  if (!box) return;
  if (!apps.length) { box.innerHTML = '<p class="loading">No apps listed yet.</p>'; return; }
  box.innerHTML = apps.map(app => {
    const qr = withQr ? '<div class="qr-box" data-app-id="' + esc(app.id) + '"></div>' : "";
    const changes = (app.changelog || []).map(x => "<li>" + esc(x) + "</li>").join("");
    return '<article class="app-card">' +
      qr +
      '<h3>' + esc(app.name) + ' <span class="version-badge">v' + esc(app.version) + '</span></h3>' +
      '<p>' + esc(app.description) + '</p>' +
      '<div class="app-meta"><span>' + esc(app.size) + '</span><span>' + esc(app.date) + '</span></div>' +
      '<a class="btn-download" href="' + esc(app.apkFile) + '" download>Download APK</a>' +
      '<details><summary>Changelog</summary><ul>' + changes + '</ul></details>' +
    '</article>';
  }).join("");
  if (withQr) {
    box.querySelectorAll(".qr-box").forEach(el => {
      const app = apps.find(a => a.id === el.dataset.appId);
      if (!app) return;
      if (typeof QRCode !== "undefined") {
        new QRCode(el, {
          text: absoluteUrl(app.apkFile),
          width: 120, height: 120,
          colorDark: "#1A1C1A", colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        el.innerHTML = '<span class="qr-fallback">QR library missing</span>';
      }
    });
  }
}

async function initDownloads() { renderApps("downloads-apps", true, await loadApps()); }
async function initFaq() { renderApps("faq-apps", false, await loadApps()); }

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHome();
  initUpdates();
  initDownloads();
  initFaq();
});