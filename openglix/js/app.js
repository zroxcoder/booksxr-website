const state = {
  apps: [],
  posts: [],
  activeTag: "All Topics",
  currentPost: null
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (ch) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
  });
}

function absoluteUrl(path) {
  try { return new URL(path, window.location.href).href; }
  catch (_) { return path; }
}

async function loadJSON(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load " + path + " (" + response.status + ")");
  return response.json();
}

function showPage(pageId) {
  document.querySelectorAll(".page-view").forEach(function (page) {
    page.classList.remove("active");
  });
  const page = document.getElementById("page-" + pageId);
  if (page) page.classList.add("active");

  document.body.classList.toggle("blog-mode", pageId === "blog");

  document.querySelectorAll(".main-nav a[data-page], .more-menu a[data-page]").forEach(function (link) {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  if (pageId === "blog") closePost();

  const nav = document.getElementById("mainNav");
  if (nav) nav.classList.remove("open");
  const moreMenu = document.getElementById("moreMenu");
  if (moreMenu) moreMenu.classList.remove("open");

  window.scrollTo(0, 0);
}

function renderHomePosts() {
  const container = document.getElementById("home-posts");
  if (!container) return;
  if (!state.posts.length) {
    container.innerHTML = '<p class="loading">No updates yet.</p>';
    return;
  }
  container.innerHTML = state.posts.slice(0, 3).map(function (post) {
    return '<article class="recent-item" data-post-id="' + esc(post.id) + '">' +
      '<div class="recent-date">' + esc(post.dateLabel || post.date) + '</div>' +
      '<div class="recent-title">' + esc(post.title) + '</div>' +
      '<div class="recent-snippet">' + esc(post.excerpt) + '</div>' +
    '</article>';
  }).join("");
}

function allTags() {
  const tags = new Set();
  state.posts.forEach(function (post) {
    (post.tags || []).forEach(function (tag) { tags.add(tag); });
  });
  return ["All Topics"].concat(Array.from(tags));
}

function renderBlogFilters() {
  const container = document.getElementById("blog-filters");
  if (!container) return;
  container.innerHTML = allTags().map(function (tag) {
    return '<button class="tag-chip ' + (tag === state.activeTag ? "active" : "") + '" data-tag="' + esc(tag) + '" type="button">' + esc(tag) + '</button>';
  }).join("");

  container.querySelectorAll(".tag-chip").forEach(function (button) {
    button.addEventListener("click", function () {
      state.activeTag = button.dataset.tag;
      renderBlogFilters();
      renderBlogList();
    });
  });
}

function filteredPosts() {
  if (state.activeTag === "All Topics") return state.posts;
  return state.posts.filter(function (post) {
    return (post.tags || []).includes(state.activeTag);
  });
}

function renderBlogList() {
  const container = document.getElementById("blog-list");
  if (!container) return;
  const posts = filteredPosts();
  if (!posts.length) {
    container.innerHTML = '<p class="loading">No posts in this topic yet.</p>';
    return;
  }
  container.innerHTML = posts.map(function (post) {
    const tag = (post.tags || [])[0] || "BLOG";
    return '<article class="blog-card" data-post-id="' + esc(post.id) + '">' +
      '<div class="blog-card-top">' +
        '<span class="blog-tag">' + esc(tag) + '</span>' +
        '<span class="blog-read">⏱ ' + esc(post.readTime || "3 min read") + '</span>' +
      '</div>' +
      '<h3>' + esc(post.title) + '</h3>' +
      '<p>' + esc(post.excerpt) + '</p>' +
      '<div class="blog-card-bottom">' +
        '<span>' + esc(post.dateLabel || post.date) + '</span>' +
        '<span class="read-guide">READ GUIDE →</span>' +
      '</div>' +
    '</article>';
  }).join("");
}

function openPost(postId) {
  const post = state.posts.find(function (item) { return item.id === postId; });
  if (!post) return;
  state.currentPost = postId;

  const listView = document.getElementById("blog-list-view");
  const detail = document.getElementById("blog-detail");
  if (!detail) return;

  if (listView) listView.classList.add("hidden");
  detail.classList.remove("hidden");

  const tags = post.tags || [];
  const content = (post.content || []).map(function (paragraph) {
    return "<p>" + esc(paragraph) + "</p>";
  }).join("");

  detail.innerHTML =
    '<button class="back-btn" id="blogBackBtn" type="button">← Back to blog</button>' +
    '<div class="blog-detail-meta">' +
      '<span class="blog-tag">' + esc(tags[0] || "BLOG") + '</span>' +
      '<span>' + esc(post.dateLabel || post.date) + '</span>' +
      '<span>⏱ ' + esc(post.readTime || "3 min read") + '</span>' +
    '</div>' +
    '<h1>' + esc(post.title) + '</h1>' +
    '<p class="blog-detail-excerpt">' + esc(post.excerpt) + '</p>' +
    '<div class="author-line">Written by <strong>' + esc(post.author || "openglix Team") + '</strong></div>' +
    '<div class="blog-content">' + content + '</div>';

  const back = document.getElementById("blogBackBtn");
  if (back) back.addEventListener("click", closePost);
  window.scrollTo(0, 0);
}

function closePost() {
  state.currentPost = null;
  const listView = document.getElementById("blog-list-view");
  const detail = document.getElementById("blog-detail");
  if (listView) listView.classList.remove("hidden");
  if (detail) {
    detail.classList.add("hidden");
    detail.innerHTML = "";
  }
}

function renderApps(containerId, withQr) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!state.apps.length) {
    container.innerHTML = '<p class="loading">No apps listed yet.</p>';
    return;
  }

  container.innerHTML = state.apps.map(function (app) {
    const qr = withQr ? '<div class="qr-box" data-app-id="' + esc(app.id) + '"></div>' : "";
    const changelog = (app.changelog || []).map(function (item) {
      return "<li>" + esc(item) + "</li>";
    }).join("");
    return '<article class="app-card">' +
      qr +
      '<h3>' + esc(app.name) + ' <span class="version-badge">v' + esc(app.version) + '</span></h3>' +
      '<p>' + esc(app.description) + '</p>' +
      '<div class="app-meta"><span>' + esc(app.size) + '</span><span>' + esc(app.date) + '</span></div>' +
      '<a class="btn-download" href="' + esc(app.apkFile) + '" download>Download APK</a>' +
      '<details><summary>Changelog</summary><ul>' + changelog + '</ul></details>' +
    '</article>';
  }).join("");

  if (withQr) {
    container.querySelectorAll(".qr-box").forEach(function (box) {
      const app = state.apps.find(function (item) { return item.id === box.dataset.appId; });
      if (!app) return;
      if (typeof QRCode !== "undefined") {
        new QRCode(box, {
          text: absoluteUrl(app.apkFile),
          width: 120,
          height: 120,
          colorDark: "#1A1C1A",
          colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        box.innerHTML = '<span class="qr-fallback">QR library missing</span>';
      }
    });
  }
}

async function init() {
  try {
    const results = await Promise.all([
      loadJSON("data/apps.json"),
      loadJSON("data/updates.json")
    ]);
    const appsData = results[0];
    const updatesData = results[1];

    state.apps = Array.isArray(appsData.apps) ? appsData.apps : [];
    state.posts = (Array.isArray(updatesData.posts) ? updatesData.posts : []).slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    renderHomePosts();
    renderBlogFilters();
    renderBlogList();
    renderApps("downloads-apps", true);
    renderApps("faq-apps", false);
  } catch (error) {
    console.error(error);
    const message = '<div class="data-error">Could not load JSON data. Open this site through a local server or static host, not directly as a file. Example: <code>python -m http.server 8080</code>.</div>';
    ["home-posts", "blog-list", "downloads-apps", "faq-apps"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = message;
    });
  }
}

document.addEventListener("click", function (event) {
  const pageLink = event.target.closest("[data-page]");
  if (pageLink) {
    event.preventDefault();
    showPage(pageLink.dataset.page);
    return;
  }

  const postCard = event.target.closest("[data-post-id]");
  if (postCard) {
    showPage("blog");
    openPost(postCard.dataset.postId);
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const moreBtn = document.getElementById("moreBtn");
  const moreMenu = document.getElementById("moreMenu");
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      moreMenu.classList.toggle("open");
    });
    document.addEventListener("click", function () {
      moreMenu.classList.remove("open");
    });
  }

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      mainNav.classList.toggle("open");
    });
  }

  showPage("home");
  init();
});