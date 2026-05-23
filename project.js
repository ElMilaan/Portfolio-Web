const grid = document.getElementById("bento-grid");
const items = grid.querySelectorAll(".bento__item");
const n = items.length;
grid.setAttribute("data-count", n >= 9 ? "9" : n >= 7 ? "7" : String(n));

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img");
const lbClose = document.getElementById("lightbox-close");

// ============ LIGHTBOX HANDLER ============

items.forEach((item) => {
  item.addEventListener("click", openLightbox);
});

lbClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

function openLightbox(event) {
  const item = event.currentTarget;
  const src = item.dataset.src || item.querySelector("img").src;
  lbImg.src = src;
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

// ============ INJECT DATA FROM JSON INTO PROJECT PAGE ============

(async function loadProject() {
  try {
    const res = await fetch("infos.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Determine project id from current HTML filename (e.g. "project-01.html" -> "project-01")
    const pathname = window.location.pathname || window.location.href;
    const fileName = pathname.split("/").pop().split("?")[0] || "";
    const pageId = fileName.replace(/\.html$/i, "");

    let project = null;
    if (pageId) {
      project = (data.projects || []).find((p) => p.id === pageId) || null;
    }
    // fallback to first project if no matching id found
    if (!project) project = data.projects && data.projects[0];
    if (!project) return;

    // document title
    document.title = `Milan Junges - ${project.title}`;

    // Banner image
    const bannerImg = document.querySelector(".project-banner__img");
    if (bannerImg && project.coverImage) {
      bannerImg.src = project.coverImage;
      bannerImg.alt = `Couverture du projet ${project.title}`;
    }

    // Category / format
    const categoryEl = document.querySelector(".project-banner__category");
    if (categoryEl)
      categoryEl.textContent = project.format || project.context || "";

    // Title: wrap last word in <em> if there are multiple words
    const titleEl = document.querySelector(".project-banner__title");
    if (titleEl && project.title) {
      const t = project.title.trim();
      titleEl.innerHTML = t.includes(" ")
        ? t.replace(/\s+(\S+)$/, " <em>$1</em>")
        : t;
    }

    // Meta values (Année, Rôle, Durée, Contexte)
    document.querySelectorAll(".project-banner__meta-item").forEach((item) => {
      const label = item.querySelector(".project-banner__meta-label");
      const value = item.querySelector(".project-banner__meta-value");
      if (!label || !value) return;
      const key = label.textContent.trim().toLowerCase();
      if (key.includes("année") && project.year)
        value.textContent = project.year;
      else if (key.includes("rôle") && project.roles)
        value.textContent = Object.values(project.roles).join(", ");
      else if (key.includes("durée") && project.duration)
        value.textContent = project.duration;
      else if (key.includes("contexte") && project.context)
        value.textContent = project.context;
    });

    // Overview headline & tech tags
    const overviewHeadline = document.querySelector(".overview__headline");
    if (overviewHeadline && project.description)
      overviewHeadline.innerHTML = project.description;

    const techTags = document.querySelector(".tech-tags");
    if (techTags && project.technos) {
      techTags.innerHTML = "";
      const techList = Object.values(project.technos || {});
      techList.forEach((t) => {
        const span = document.createElement("span");
        span.className = "tech-tag";
        span.textContent = t;
        techTags.appendChild(span);
      });
    }

    // Overview headline & tech tags
    const target = document.querySelector(".target");
    const format = document.querySelector(".format");
    const deliverables = document.querySelector(".deliverables");
    const team = document.querySelector(".team");

    if (target && project.target)
      target.querySelector(".stat-cell__value").textContent = project.target;

    if (format && project.format)
      format.querySelector(".stat-cell__value").textContent = project.format;

    if (deliverables && project.deliverables) {
      deliverables.querySelector(".stat-cell__value").textContent = Object.keys(
        project.deliverables,
      ).length;
      deliverables.querySelector(".stat-cell__sub").textContent = Object.values(
        project.deliverables,
      ).join(" · ");
    }
    if (team && project.teamSize)
      team.querySelector(".stat-cell__value").textContent = project.teamSize;

    // Overview description
    const desc = document.querySelector(".overview__desc");
    if (desc && project.content) {
      desc.innerHTML = "";
      const contents = Object.values(project.content || {});
      for (let i = 0; i < contents.length; i++) {
        const p = document.createElement("p");
        p.textContent = contents[i];
        desc.appendChild(p);
      }
    }
    if (desc && project.link) {
      const a = document.createElement("a");
      a.href = project.link["url"];
      a.textContent = project.link["label"];
      a.target = "_blank";
      desc.appendChild(a);
    }

    // Project YouTube embed in overview
    function getYoutubeEmbedUrl(value) {
      if (!value) return "";
      const trimmed = value.trim();
      const idMatch = trimmed.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|.*\?v=))([\w-]{11})/,
      );
      if (idMatch)
        return `https://www.youtube.com/embed/${idMatch[1]}?rel=0&showinfo=0`;
      if (/^[\w-]{11}$/.test(trimmed))
        return `https://www.youtube.com/embed/${trimmed}?rel=0&showinfo=0`;
      return "";
    }

    const playerWrapper = document.querySelector(".project-player");
    const playerEmbed = document.querySelector(".project-player__embed");
    const youtubeSource =
      project.youtubeId ||
      project.youtube ||
      project.youtubeUrl ||
      project.youtube_link ||
      (project.videos ? Object.values(project.videos)[0] : "");

    if (playerWrapper) {
      const embedUrl = getYoutubeEmbedUrl(youtubeSource);
      if (embedUrl && playerEmbed) {
        playerEmbed.innerHTML = `<iframe src="${embedUrl}" title="Vidéo du projet ${project.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else {
        playerWrapper.style.display = "none";
      }
    }

    // Gallery: replace bento items
    const bento = document.getElementById("bento-grid");
    if (bento && project.images) {
      bento.innerHTML = "";
      const imgs = Object.values(project.images || {});
      imgs.forEach((src, idx) => {
        const div = document.createElement("div");
        div.className = `bento__item item-${idx + 1}`;
        div.dataset.src = src;

        const img = document.createElement("img");
        img.src = src;
        img.alt = `Visuel ${idx + 1}`;
        div.appendChild(img);

        const applyOrientationClass = () => {
          if (!img.naturalWidth || !img.naturalHeight) return;
          const isLandscape = img.naturalWidth >= img.naturalHeight;
          div.classList.toggle("bento__item--landscape", isLandscape);
          div.classList.toggle("bento__item--portrait", !isLandscape);
        };

        img.addEventListener("load", applyOrientationClass);
        if (img.complete) applyOrientationClass();

        const overlay = document.createElement("div");
        overlay.className = "bento__item__overlay";
        div.appendChild(overlay);

        // const span = document.createElement("span");
        // span.className = "bento__caption";
        // span.textContent = `Visuel ${idx + 1}`;
        // div.appendChild(span);

        bento.appendChild(div);
      });

      // re-init lightbox handlers for new items
      const items = bento.querySelectorAll(".bento__item");
      const count = items.length;
      bento.setAttribute(
        "data-count",
        count >= 9 ? "9" : count >= 7 ? "7" : String(count),
      );
      items.forEach((item) => {
        item.addEventListener("click", () => {
          const src = item.dataset.src || item.querySelector("img").src;
          lbImg.src = src;
          lightbox.classList.add("open");
          document.body.style.overflow = "hidden";
        });
      });
    }

    // Details: unicite aspects -> three detail-card blocks
    const detailCards = document.querySelectorAll(".detail-card");
    const unic = project.unicite || {};
    const aspects = [unic.aspect1, unic.aspect2, unic.aspect3];
    detailCards.forEach((card, i) => {
      const aspect = aspects[i];
      if (!aspect) return;
      const title = card.querySelector(".detail-card__title");
      const text = card.querySelector(".detail-card__text");
      const tags = card.querySelector(".detail-card__tags");
      if (title) title.textContent = aspect.title || "";
      if (text) text.textContent = aspect.description || "";
      if (tags) {
        tags.innerHTML = "";
        const tools = Object.values(aspect.tools || {});
        tools.forEach((t) => {
          const s = document.createElement("span");
          s.className = "tech-tag";
          s.textContent = t;
          tags.appendChild(s);
        });
      }
    });

    // Results / conclusion
    const resultsText = document.querySelector(".results__text");
    if (resultsText && project.conclusion)
      resultsText.innerHTML = `<p>${project.conclusion}</p>`;
  } catch (e) {
    console.error("Erreur chargement projet:", e);
  }
})();
