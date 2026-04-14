import { h } from "../lib/dom.js";

function formatDateId(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function normalizeImages(item) {
  const imgs = Array.isArray(item?.images) ? item.images : [];
  const urls = imgs
    .map((x) => (typeof x === "string" ? x : x?.url))
    .filter((x) => typeof x === "string" && x.trim());
  if (urls.length) return urls;
  const legacy = item?.image_url || item?.src;
  return legacy ? [legacy] : [];
}

function openLightbox({ title, subtitle, location, date, images }) {
  const urls = Array.isArray(images) ? images.filter(Boolean) : [];
  if (!urls.length) return;
  let active = 0;

  const img = h("img", {
    class: "lightbox-img",
    src: urls[0],
    alt: title ? `Dokumentasi: ${title}` : "Dokumentasi kegiatan",
    loading: "lazy",
  });

  const metaText = [subtitle, location, date ? formatDateId(date) : ""].filter(Boolean).join(" • ");

  const dots = urls.map((_, idx) =>
    h("button", { class: "lightbox-dot", type: "button", "data-active": idx === 0 ? "true" : "false", "aria-label": `Foto ${idx + 1}` })
  );

  const prevBtn = h("button", { class: "lightbox-nav lightbox-nav-prev", type: "button", "aria-label": "Sebelumnya" }, [
    h("i", { class: "bi bi-chevron-left", "aria-hidden": "true" }),
  ]);
  const nextBtn = h("button", { class: "lightbox-nav lightbox-nav-next", type: "button", "aria-label": "Berikutnya" }, [
    h("i", { class: "bi bi-chevron-right", "aria-hidden": "true" }),
  ]);

  const overlay = h("div", { class: "lightbox", role: "dialog", "aria-modal": "true" }, [
    h("button", { class: "lightbox-backdrop", type: "button", "aria-label": "Tutup" }),
    h("div", { class: "lightbox-card" }, [
      h("div", { class: "lightbox-head" }, [
        h("div", {}, [
          h("div", { class: "lightbox-title" }, title || "Dokumentasi"),
          h("div", { class: "lightbox-sub" }, metaText),
        ]),
        h("button", { class: "btn btn-ghost", type: "button", id: "lightbox-close" }, [
          h("i", { class: "bi bi-x-lg", "aria-hidden": "true" }),
          "Tutup",
        ]),
      ]),
      h("div", { style: "position:relative" }, [img, urls.length > 1 ? prevBtn : null, urls.length > 1 ? nextBtn : null]),
      urls.length > 1 ? h("div", { class: "lightbox-dots" }, dots) : null,
    ]),
  ]);

  function close() {
    window.removeEventListener("keydown", onKeyDown);
    overlay.remove();
  }

  function setActive(next) {
    active = (next + urls.length) % urls.length;
    img.src = urls[active];
    for (let i = 0; i < dots.length; i += 1) {
      dots[i].setAttribute("data-active", i === active ? "true" : "false");
    }
  }

  function onKeyDown(e) {
    if (e.key === "Escape") close();
    if (urls.length > 1 && e.key === "ArrowLeft") setActive(active - 1);
    if (urls.length > 1 && e.key === "ArrowRight") setActive(active + 1);
  }

  overlay.querySelector("#lightbox-close").addEventListener("click", close);
  overlay.querySelector(".lightbox-backdrop").addEventListener("click", close);
  if (urls.length > 1) {
    prevBtn.addEventListener("click", () => setActive(active - 1));
    nextBtn.addEventListener("click", () => setActive(active + 1));
    dots.forEach((d, idx) => d.addEventListener("click", () => setActive(idx)));
  }
  window.addEventListener("keydown", onKeyDown);
  document.body.appendChild(overlay);
}

export async function renderGaleri({ settings }) {
  const items = Array.isArray(settings?.gallery) ? settings.gallery : [];

  return h("div", {}, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Galeri Dokumentasi"),
      h("div", { class: "muted" }, "Dokumentasi pelayanan dan kegiatan Puskesmas Muara Badak"),
    ]),

    items.length
      ? h(
          "div",
          { class: "gallery-grid" },
          items.map((it) => {
            const images = normalizeImages(it);
            const src = images[0] || "";
            const title = it.title || "Dokumentasi";
            const subtitle = it.subtitle || "";
            const location = it.location || "";
            const date = it.date || "";
            return h(
              "button",
              {
                class: "gallery-item",
                type: "button",
                disabled: src ? null : "true",
                onclick: () => openLightbox({ title, subtitle, location, date, images }),
              },
              [
                h("div", { class: "gallery-media", "data-fallback": src ? null : "true" }, [
                  src
                    ? h("img", {
                        class: "gallery-img",
                        src,
                        alt: title,
                        loading: "lazy",
                        onerror: (e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.closest(".gallery-media").setAttribute("data-fallback", "true");
                        },
                      })
                    : null,
                ]),
                h("div", { class: "gallery-meta" }, [
                  h("div", { class: "gallery-title" }, title),
                  h("div", { class: "gallery-sub" }, subtitle),
                  location || date
                    ? h("div", { class: "gallery-info" }, [
                        location ? h("span", { class: "gallery-chip" }, [h("i", { class: "bi bi-geo-alt", "aria-hidden": "true" }), location]) : null,
                        date ? h("span", { class: "gallery-chip" }, [h("i", { class: "bi bi-calendar3", "aria-hidden": "true" }), formatDateId(date)]) : null,
                      ])
                    : null,
                ]),
              ]
            );
          })
        )
      : h("div", { class: "panel" }, [
          h("div", { class: "card-title" }, "Belum ada dokumentasi"),
          h("div", { class: "card-text" }, "Dokumentasi dapat ditambahkan oleh admin melalui panel admin."),
        ]),
  ]);
}
