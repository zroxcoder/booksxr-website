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
let _appsCache = null;
async function loadApps() {
  if (_appsCache) return _appsCache;
  try { const d = await loadJSON("data/apps.json"); _appsCache = Array.isArray(d.apps) ? d.apps : []; }
  catch (e) { console.error(e); _appsCache = []; }
  return _appsCache;
}
let _postsCache = null;
async function loadPosts() {
  if (_postsCache) return _postsCache;
  try {
    const d = await loadJSON("data/updates.json");
    _postsCache = (Array.isArray(d.posts) ? d.posts : []).slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  } catch (e) { console.error(e); _postsCache = []; }
  return _postsCache;
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
/* === Status page (data/status.json driven) === */
var STATUS_META = {
  operational: { cls: "ok",   label: "Operational",          overall: "All systems operational" },
  degraded:    { cls: "warn", label: "Degraded performance", overall: "Partial outage — some services degraded" },
  outage:      { cls: "bad",  label: "Outage",               overall: "Major outage" },
  maintenance: { cls: "info", label: "Maintenance",          overall: "Scheduled maintenance in progress" }
};

function statusMeta(s) {
  return STATUS_META[String(s || "").toLowerCase()] || STATUS_META.operational;
}

function relativeTime(date) {
  var diff = Date.now() - date.getTime();
  var abs = Math.abs(diff);
  var rel;
  if (abs < 45000) rel = "just now";
  else if (abs < 3600000) {
    var m = Math.round(abs / 60000);
    rel = m + " min" + (m === 1 ? "" : "s") + " ago";
  } else if (abs < 86400000) {
    var h = Math.round(abs / 3600000);
    rel = h + " hour" + (h === 1 ? "" : "s") + " ago";
  } else if (abs < 2592000000) {
    var d = Math.round(abs / 86400000);
    rel = d + " day" + (d === 1 ? "" : "s") + " ago";
  } else {
    rel = Math.round(abs / 2592000000) + " months ago";
  }
  if (diff < 0) rel = "in " + rel.replace(" ago", "");
  return rel;
}

function formatStamp(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  if (isNaN(d.getTime())) return 'Last updated: <strong>' + esc(iso) + '</strong>';

  var localStr = d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short'
  });

  var utcStr = d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  var rel = relativeTime(d);

  return 'Last updated: <strong>' + localStr + '</strong> &middot; ' + rel +
         ' <span class="status-updated-utc" title="Stored as ' + utcStr + '">' + utcStr + '</span>';
}

function latestContentDate(apps, posts) {
  var ts = [];
  (apps || []).forEach(function (a) {
    var t = new Date(a && a.date).getTime();
    if (!isNaN(t)) ts.push(t);
  });
  (posts || []).forEach(function (p) {
    var t = new Date(p && p.date).getTime();
    if (!isNaN(t)) ts.push(t);
  });
  if (!ts.length) return null;
  return new Date(Math.max.apply(null, ts)).toISOString();
}

function applyServiceStatus(el, status, note) {
  if (!el) return;
  var meta = statusMeta(status);
  el.classList.remove("ok", "warn", "bad", "info");
  el.classList.add(meta.cls);

  var valueEl = el.querySelector(".value");
  if (valueEl) valueEl.innerHTML = '<span class="status-dot"></span>' + meta.label;

  var oldNote = el.querySelector(".service-note");
  if (oldNote) oldNote.remove();
  if (note) {
    var n = document.createElement("div");
    n.className = "service-note";
    n.textContent = note;
    el.appendChild(n);
  }
}

function computeOverall(services, forced) {
  if (forced && String(forced).toLowerCase() !== "auto") return String(forced).toLowerCase();
  var statuses = Object.keys(services || {}).map(function (k) {
    return String((services[k] && services[k].status) || "operational").toLowerCase();
  });
  if (statuses.indexOf("outage") !== -1) return "outage";
  if (statuses.indexOf("degraded") !== -1) return "degraded";
  if (statuses.indexOf("maintenance") !== -1) return "maintenance";
  return "operational";
}

function applyOverall(el, overall, updatedIso) {
  if (!el) return;
  var meta = statusMeta(overall);
  el.classList.remove("ok", "warn", "bad", "info");
  el.classList.add(meta.cls);
  var span = el.querySelector("span:last-child");
  if (span) span.textContent = meta.overall;

  var stamp = document.getElementById("status-updated");
  if (!stamp) {
    stamp = document.createElement("div");
    stamp.id = "status-updated";
    stamp.className = "status-updated";
    var hero = el.closest(".status-hero");
    if (hero && hero.parentNode) hero.parentNode.insertBefore(stamp, hero.nextSibling);
    else el.parentNode.appendChild(stamp);
  }

  stamp.innerHTML = updatedIso ? formatStamp(updatedIso) : "";
}

async function initStatus(force) {
  var versionsBox = document.getElementById("status-versions");
  var releasesBox = document.getElementById("status-releases");
  var overallEl = document.getElementById("status-overall");
  if (!versionsBox && !releasesBox && !overallEl) return;

  if (force) { _appsCache = null; _postsCache = null; }

  var apps = await loadApps();
  var posts = await loadPosts();

  var statusData = { overall: "auto", services: {}, updated: "" };
  try {
    var loaded = await loadJSON("data/status.json");
    if (loaded && typeof loaded === "object") statusData = loaded;
  } catch (_) { /* status.json optional */ }

  var services = statusData.services || {};

  var dlStatus = String((services.downloads && services.downloads.status) || "operational").toLowerCase();
  if (apps.length === 0 && dlStatus === "operational") {
    services.downloads = Object.assign({}, services.downloads, {
      status: "degraded",
      note: "No apps are currently published."
    });
  }

  ["site", "downloads", "qr", "blog"].forEach(function (id) {
    var svc = services[id];
    var el = document.getElementById("svc-" + id);
    if (el) applyServiceStatus(el, svc && svc.status, svc && svc.note);
  });

  // Timestamp: manual value wins. If empty or "auto", derive from latest content.
  var stampValue = statusData.updated;
  if (!stampValue || String(stampValue).toLowerCase() === "auto") {
    stampValue = latestContentDate(apps, posts);
  }

  applyOverall(overallEl, computeOverall(services, statusData.overall), stampValue);

  if (versionsBox) {
    if (!apps.length) {
      versionsBox.innerHTML = '<p class="loading">No app versions available.</p>';
    } else {
      versionsBox.innerHTML =
        '<table class="version-table">' +
          '<thead><tr><th>App</th><th>Version</th><th>Size</th><th>Released</th><th></th></tr></thead>' +
          '<tbody>' +
            apps.map(function (a) {
              return '<tr>' +
                '<td data-label="App"><span class="app-name">' + esc(a.name) + '</span></td>' +
                '<td data-label="Version"><span class="app-version">v' + esc(a.version) + '</span></td>' +
                '<td data-label="Size">' + esc(a.size) + '</td>' +
                '<td data-label="Released">' + esc(a.date) + '</td>' +
                '<td data-label="Download"><a class="download-mini" href="' + esc(a.apkFile) + '" download>Download</a></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>';
    }
  }

  if (releasesBox) {
    var updates = posts.filter(function (p) {
      return String(p.type || "").toLowerCase() === "update";
    }).slice(0, 5);
    if (!updates.length) {
      releasesBox.innerHTML = '<p class="loading">No release notes yet.</p>';
    } else {
      releasesBox.innerHTML = updates.map(function (p) {
        return '<div class="release-item">' +
          '<div class="release-date">' + esc(p.dateLabel || p.date) + '</div>' +
          '<div class="release-body">' +
            '<div class="release-title">' + esc(p.title) + '</div>' +
            '<div class="release-text">' + esc(p.excerpt) + '</div>' +
          '</div>' +
        '</div>';
      }).join("");
    }
  }
}

function attachStatusRefresh() {
  var btn = document.getElementById("status-refresh");
  if (!btn) return;
  btn.addEventListener("click", async function () {
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Refreshing…";
    try { await initStatus(true); }
    finally { btn.disabled = false; btn.textContent = original; }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initStatus();
  attachStatusRefresh();
});