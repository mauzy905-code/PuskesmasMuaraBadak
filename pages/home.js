import { h, textToRichParagraphs } from "../lib/dom.js";
import { isServiceOpenNowWita } from "../lib/hours.js";

function createFullWidthSlider(settings) {
  // Use data from settings or fallback to default
  const defaultSlides = [
    {
      title: "Selamat Datang di Puskesmas Muara Badak",
      sub: "Pelayanan Kesehatan Prima untuk Masyarakat.",
      bg: "linear-gradient(135deg, rgba(44,125,160,0.8), rgba(31,111,139,0.8))",
    },
    {
      title: "Fasilitas dan Pelayanan Terbaik",
      sub: "Informasi layanan, jadwal, dan edukasi kesehatan dalam satu tempat.",
      bg: "linear-gradient(135deg, rgba(31,111,139,0.8), rgba(63,184,180,0.8))",
    }
  ];

  let slidesData =
    Array.isArray(settings?.hero_slider) && settings.hero_slider.length > 0
      ? settings.hero_slider.map((s, idx) => ({
          title: s.title || defaultSlides[idx % defaultSlides.length].title,
          sub: s.subtitle || defaultSlides[idx % defaultSlides.length].sub,
          bg: s.image_url
            ? `linear-gradient(to top, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.2) 50%, rgba(15,23,42,0) 100%), url('${s.image_url}')`
            : defaultSlides[idx % defaultSlides.length].bg,
          ctaPrimaryLabel: s.cta_primary_label || "",
          ctaPrimaryUrl: s.cta_primary_url || "",
          ctaSecondaryLabel: s.cta_secondary_label || "",
          ctaSecondaryUrl: s.cta_secondary_url || "",
        }))
      : defaultSlides.map((s) => ({
          title: s.title,
          sub: s.sub,
          bg: s.bg,
          ctaPrimaryLabel: "",
          ctaPrimaryUrl: "",
          ctaSecondaryLabel: "",
          ctaSecondaryUrl: "",
        }));

  let active = 0;
  
  const slideNodes = slidesData.map((s, idx) => {
    return h("div", { 
      class: "hero-slide", 
      "data-active": idx === 0 ? "true" : "false",
      style: `background-image: ${s.bg};`
    }, [
      h("div", { class: "hero-slide-overlay" }),
      h("div", { class: "hero-slide-content" }, [
        h("h1", { class: "hero-slide-title" }, s.title),
        h("p", { class: "hero-slide-sub" }, s.sub),
        h("div", { class: "hero-actions" }, [
          s.ctaPrimaryUrl
            ? h(
                "a",
                {
                  class: "btn btn-primary",
                  href: s.ctaPrimaryUrl,
                  target: /^https?:\/\//i.test(s.ctaPrimaryUrl) ? "_blank" : undefined,
                  rel: /^https?:\/\//i.test(s.ctaPrimaryUrl) ? "noopener noreferrer" : undefined,
                },
                [h("i", { class: "bi bi-link-45deg", "aria-hidden": "true" }), s.ctaPrimaryLabel || "Selengkapnya"]
              )
            : h("a", { class: "btn btn-primary", href: "/alur" }, [
                h("i", { class: "bi bi-journal-text", "aria-hidden": "true" }),
                "Panduan Berobat",
              ]),
          s.ctaSecondaryUrl
            ? h(
                "a",
                {
                  class: "btn btn-ghost",
                  href: s.ctaSecondaryUrl,
                  style: "background:rgba(255,255,255,0.15);color:#fff;border-color:transparent;",
                  target: /^https?:\/\//i.test(s.ctaSecondaryUrl) ? "_blank" : undefined,
                  rel: /^https?:\/\//i.test(s.ctaSecondaryUrl) ? "noopener noreferrer" : undefined,
                },
                [h("i", { class: "bi bi-arrow-up-right-square", "aria-hidden": "true" }), s.ctaSecondaryLabel || "Buka"]
              )
            : h("a", { class: "btn btn-ghost", href: "/pengumuman", style: "background:rgba(255,255,255,0.15);color:#fff;border-color:transparent;" }, [
                h("i", { class: "bi bi-book", "aria-hidden": "true" }),
                "Edukasi Kesehatan",
              ]),
        ]),
        idx === 0
          ? h("div", { class: "hero-badges" }, [
              h("div", { class: "hero-badge" }, [h("i", { class: "bi bi-shield-check", "aria-hidden": "true" }), "Profesional"]),
              h("div", { class: "hero-badge" }, [h("i", { class: "bi bi-heart-pulse", "aria-hidden": "true" }), "Melayani dengan Hati"]),
            ])
          : null
      ])
    ]);
  });

  const dots = slidesData.map((_, idx) =>
    h("button", { class: "hero-dot", type: "button", "data-active": idx === 0 ? "true" : "false", "aria-label": `Slide ${idx + 1}` })
  );

  const prevBtn = h("button", { class: "hero-nav hero-nav-prev", type: "button", "aria-label": "Previous slide" }, [
    h("i", { class: "bi bi-chevron-left" })
  ]);
  
  const nextBtn = h("button", { class: "hero-nav hero-nav-next", type: "button", "aria-label": "Next slide" }, [
    h("i", { class: "bi bi-chevron-right" })
  ]);

  function setActive(next) {
    active = (next + slidesData.length) % slidesData.length;
    for (let i = 0; i < slideNodes.length; i++) {
      slideNodes[i].setAttribute("data-active", i === active ? "true" : "false");
      dots[i].setAttribute("data-active", i === active ? "true" : "false");
    }
  }

  dots.forEach((d, idx) => d.addEventListener("click", () => setActive(idx)));
  prevBtn.addEventListener("click", () => setActive(active - 1));
  nextBtn.addEventListener("click", () => setActive(active + 1));

  // Auto slide every 5 seconds
  let interval = window.setInterval(() => setActive(active + 1), 5000);

  const root = h("section", { class: "hero-full" }, [
    h("div", { class: "hero-slider" }, slideNodes),
    prevBtn,
    nextBtn,
    h("div", { class: "hero-dots" }, dots)
  ]);

  // Pause on hover
  root.addEventListener("mouseenter", () => window.clearInterval(interval));
  root.addEventListener("mouseleave", () => {
    window.clearInterval(interval);
    interval = window.setInterval(() => setActive(active + 1), 5000);
  });

  return root;
}

function createDailyServicesSection({ dailyServices, hoursRows }) {
  const listWrap = h("div", { id: "home-today-doctors" }, []);
  const noteWrap = h("div", { class: "card-text", id: "home-today-note" }, "");
  const noteLabel = h("div", { class: "help", style: "margin-top:10px;display:none" }, "Catatan");
  noteWrap.style.display = "none";
  const closedWrap = h("div", { class: "today-closed", style: "display:none" }, [
    h("div", { class: "today-closed-title" }, [
      h("i", { class: "bi bi-clock-history", "aria-hidden": "true" }),
      h("span", {}, "Layanan pendaftaran hari ini sudah ditutup. Kami kembali melayani pada hari kerja berikutnya"),
    ]),
    h("div", { class: "ugds-note", style: "margin-top:12px" }, [
      h("i", { class: "bi bi-exclamation-triangle-fill", "aria-hidden": "true" }),
      h("span", {}, "Layanan UGD & Persalinan Buka 24 Jam"),
    ]),
  ]);

  const state = {
    doctors: dailyServices,
    note: dailyServices?.note || "",
    open: true,
    timer: null,
  };

  function clusterForPoli(poli) {
    const s = String(poli || "").toLowerCase();
    if (s.includes("umum")) return { key: "c3", label: "Klaster 3 (Usia Dewasa & Lansia)" };
    if (s.includes("anak") || s.includes("kia")) return { key: "c2", label: "Klaster 2 (Ibu & Anak)" };
    if (s.includes("tb") || s.includes("dots") || s.includes("menular")) return { key: "c4", label: "Klaster 4 (Penyakit Menular)" };
    if (s.includes("gigi") || s.includes("gizi")) return { key: "c23", label: "Klaster 2 & 3 (Ibu & Anak, Usia Dewasa & Lansia)" };
    if (s.includes("lab")) return { key: "lintas", label: "Lintas Klaster" };
    return null;
  }

  function setDoctors(next) {
    state.doctors = next;
    listWrap.innerHTML = "";
    const doctors = Array.isArray(next?.doctors) ? next.doctors : [];
    if (!doctors.length) {
      listWrap.appendChild(h("div", { class: "muted" }, "Belum ada informasi dokter/tenaga bertugas hari ini."));
      return;
    }
    listWrap.appendChild(
      h(
        "div",
        { class: "grid-2" },
        doctors.map((d) =>
          h("div", { class: "card duty-card" }, [
            h("div", { class: "card-icon duty-icon" }, h("i", { class: "bi bi-person-badge", "aria-hidden": "true" })),
            h("h3", { class: "card-title" }, d.name || "-"),
            h("div", { class: "duty-meta" }, (() => {
              const poli = d.poli || "-";
              const c = clusterForPoli(d.poli);
              const chips = [
                h("span", { class: "duty-pill duty-pill--service" }, [
                  h("i", { class: "bi bi-hospital", "aria-hidden": "true" }),
                  poli,
                ]),
              ];
              if (c) {
                chips.push(
                  h("span", { class: `duty-pill duty-pill--cluster duty-pill--${c.key}` }, [
                    h("i", { class: "bi bi-diagram-3", "aria-hidden": "true" }),
                    c.label,
                  ])
                );
              }
              return chips;
            })()),
          ])
        )
      )
    );
  }

  function setNote(note) {
    state.note = note;
    const val = String(note || "").trim();
    if (!val) {
      noteLabel.style.display = "none";
      noteWrap.style.display = "none";
      noteWrap.textContent = "";
      return;
    }
    noteLabel.style.display = "block";
    noteWrap.style.display = "block";
    noteWrap.textContent = val;
  }

  function applyOpenState() {
    const open = isServiceOpenNowWita(hoursRows);
    state.open = open;
    if (open) {
      closedWrap.style.display = "none";
      listWrap.style.display = "block";
      setDoctors(state.doctors);
      setNote(state.note);
    } else {
      listWrap.style.display = "none";
      noteLabel.style.display = "none";
      noteWrap.style.display = "none";
      closedWrap.style.display = "block";
    }
  }

  const node = h("section", { class: "section" }, [
    h("div", { class: "section-head" }, [
      h("h2", { class: "section-title" }, "Layanan Hari Ini"),
      h("div", { class: "muted" }, dailyServices?.date || "-"),
    ]),
    h("div", { class: "panel" }, [
      h("div", { class: "help" }, "Informasi dokter/tenaga yang bertugas hari ini. Jika kosong, silakan hubungi puskesmas."),
      closedWrap,
      listWrap,
      noteLabel,
      noteWrap,
    ]),
  ]);

  applyOpenState();
  state.timer = window.setInterval(applyOpenState, 60 * 1000);
  node._cleanup = () => {
    if (state.timer) window.clearInterval(state.timer);
  };

  return {
    node,
    setDoctors: (next) => {
      state.doctors = next;
      if (state.open) setDoctors(next);
    },
    setNote: (note) => {
      state.note = note;
      if (state.open) setNote(note);
    },
  };
}

function openLightbox({ title, subtitle, src }) {
  const urls = Array.isArray(src) ? src.filter(Boolean) : src ? [src] : [];
  if (!urls.length) return;
  let active = 0;

  const img = h("img", {
    class: "lightbox-img",
    src: urls[0],
    alt: title ? `Dokumentasi: ${title}` : "Dokumentasi kegiatan",
    loading: "lazy",
  });

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
          h("div", { class: "lightbox-sub" }, subtitle || ""),
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

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "2-digit" });
  } catch {
    return iso || "-";
  }
}

function createLatestPostsSection({ announcements }) {
  const items = Array.isArray(announcements) ? announcements : [];
  const top = items
    .filter((a) => a && a.id)
    .slice(0, 3);

  return h("section", { class: "section" }, [
    h("div", { class: "section-head" }, [
      h("h2", { class: "section-title" }, "Postingan Terbaru"),
      h("a", { class: "nav-link", href: "/pengumuman" }, "Lihat semua"),
    ]),
    top.length
      ? h(
          "div",
          { class: "gallery-grid" },
          top.map((a) =>
            h(
              "a",
              { class: "gallery-item", href: `/pengumuman/${encodeURIComponent(a.id)}` },
              [
                h("div", { class: "gallery-media", "data-fallback": a.image_url ? null : "true" }, [
                  a.image_url
                    ? h("img", {
                        class: "gallery-img",
                        src: a.image_url,
                        alt: a.title || "Gambar pengumuman",
                        loading: "lazy",
                        onerror: (e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.closest(".gallery-media").setAttribute("data-fallback", "true");
                        },
                      })
                    : null,
                ]),
                h("div", { class: "gallery-meta" }, [
                  h("div", { class: "gallery-title" }, a.title || "-"),
                  a.excerpt ? h("div", { class: "gallery-sub" }, a.excerpt) : null,
                  h("div", { class: "gallery-info" }, [
                    h("span", { class: "gallery-chip" }, [h("i", { class: "bi bi-tag", "aria-hidden": "true" }), a.category || "Edukasi & Info"]),
                    h("span", { class: "gallery-chip" }, [h("i", { class: "bi bi-calendar3", "aria-hidden": "true" }), formatDate(a.date)]),
                  ]),
                ]),
              ]
            )
          )
        )
      : h("div", { class: "panel" }, [
          h("div", { class: "card-title" }, "Belum ada postingan"),
          h("div", { class: "card-text" }, "Postingan edukasi dan informasi akan tampil otomatis setelah dipublikasikan oleh admin."),
        ]),
  ]);
}

function createDocumentationSection({ settings }) {
  const items = Array.isArray(settings?.gallery) ? settings.gallery : [];
  const normalized = items
    .map((it) => {
      const imgs = Array.isArray(it?.images) ? it.images : [];
      const urls = imgs
        .map((x) => (typeof x === "string" ? x : x?.url))
        .filter((x) => typeof x === "string" && x.trim());
      const src = urls[0] || it.image_url || it.src || "";
      const title = it.title || "Dokumentasi";
      const subtitle = it.subtitle || "";
      const location = it.location || "";
      const date = it.date || "";
      return { it, urls, src, title, subtitle, location, date };
    })
    .filter((x) => x.src)
    .sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return bd - ad;
    })
    .slice(0, 3);

  return h("section", { class: "section" }, [
    h("div", { class: "section-head" }, [
      h("h2", { class: "section-title" }, "Dokumentasi Pelayanan & Kegiatan"),
      h("a", { class: "nav-link", href: "/galeri" }, "Lihat semua"),
    ]),
    normalized.length
      ? h(
          "div",
          { class: "gallery-grid" },
          normalized.map(({ urls, src, title, subtitle, location, date }) => {
            const dateText = date ? new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "";
            return h(
              "button",
              {
                class: "gallery-item",
                type: "button",
                disabled: src ? null : "true",
                onclick: () => openLightbox({ title, subtitle, src: urls.length ? urls : src }),
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
                  location || dateText
                    ? h("div", { class: "gallery-info" }, [
                        location ? h("span", { class: "gallery-chip" }, [h("i", { class: "bi bi-geo-alt", "aria-hidden": "true" }), location]) : null,
                        dateText ? h("span", { class: "gallery-chip" }, [h("i", { class: "bi bi-calendar3", "aria-hidden": "true" }), dateText]) : null,
                      ])
                    : null,
                ]),
              ]
            );
          })
        )
      : h("div", { class: "panel" }, [
          h("div", { class: "card-title" }, "Belum ada dokumentasi"),
          h("div", { class: "card-text" }, "Admin dapat menambahkan foto dokumentasi melalui panel admin."),
        ]),
  ]);
}

export async function renderHome({ settings, dailyServices, latestAnnouncements, subscribeDailyServicesToday }) {
  const profile = settings.profile;
  const today = createDailyServicesSection({ dailyServices, hoursRows: settings.hours });
  const featuredClusters = {
    umum: { key: "c3", label: "Klaster 3 (Usia Dewasa & Lansia)" },
    kia: { key: "c2", label: "Klaster 2 (Ibu & Anak)" },
    gigi: { key: "c23", label: "Klaster 2 & 3 (Ibu & Anak, Usia Dewasa & Lansia)" },
  };

  const root = h("div", {}, [
    createFullWidthSlider(settings),

    h("section", { class: "section" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, profile.welcomeTitle || "Sambutan Kepala Puskesmas"),
        h("a", { class: "nav-link", href: "/tentang" }, "Profil Puskesmas"),
      ]),
      h("div", { class: "panel" }, [
        h("div", { class: "head-profile-float" }, [
          settings.headProfile?.image_url
            ? h("img", {
                class: "head-profile-img head-profile-img-float",
                src: settings.headProfile.image_url,
                alt: settings.headProfile.name || "Kepala Puskesmas",
                loading: "lazy",
              })
            : null,
          h("div", { class: "head-profile-body" }, [
            h("h3", { style: "margin: 0 0 4px; font-size: 20px;" }, settings.headProfile?.name || "Nama Kepala Puskesmas"),
            h("div", { class: "muted", style: "margin-bottom: 16px; font-weight: 600;" }, settings.headProfile?.title || "Kepala Puskesmas"),
            (() => {
              const full = String(settings.headProfile?.message || profile.welcomeText || "").replace(/\r\n/g, "\n").trim();
              const paragraphs = full
                .split(/\n\s*\n+/)
                .map((x) => x.trim())
                .filter(Boolean);
              const snippet = paragraphs.slice(0, 3).join("\n\n");
              return textToRichParagraphs(snippet || "-", { wrapperClass: "home-welcome-snippet", compact: true });
            })(),
            h("div", { style: "margin-top:12px;display:flex;justify-content:flex-end" }, [
              h("a", { class: "btn btn-ghost", href: "/tentang" }, [
                h("i", { class: "bi bi-arrow-right-circle", "aria-hidden": "true" }),
                "Baca selengkapnya",
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),

    today.node,

    h("section", { class: "section" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Layanan Unggulan"),
        h("a", { class: "nav-link", href: "/jadwal" }, "Semua Poli"),
      ]),
      h("div", { class: "grid-3" }, [
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-person-check", "aria-hidden": "true" })),
          h("h3", { class: "card-title" }, "Poli Umum"),
          h(
            "div",
            { class: `duty-pill duty-pill--cluster duty-pill--${featuredClusters.umum.key}`, style: "margin-top:8px;display:inline-flex;width:max-content" },
            [h("i", { class: "bi bi-diagram-3", "aria-hidden": "true" }), featuredClusters.umum.label]
          ),
          h("p", { class: "card-text" }, "Pemeriksaan dan penanganan keluhan umum untuk semua usia."),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-people", "aria-hidden": "true" })),
          h("h3", { class: "card-title" }, "KIA"),
          h(
            "div",
            { class: `duty-pill duty-pill--cluster duty-pill--${featuredClusters.kia.key}`, style: "margin-top:8px;display:inline-flex;width:max-content" },
            [h("i", { class: "bi bi-diagram-3", "aria-hidden": "true" }), featuredClusters.kia.label]
          ),
          h("p", { class: "card-text" }, "Layanan kesehatan ibu, bayi, balita, dan keluarga berencana."),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-emoji-smile", "aria-hidden": "true" })),
          h("h3", { class: "card-title" }, "Poli Gigi"),
          h(
            "div",
            { class: `duty-pill duty-pill--cluster duty-pill--${featuredClusters.gigi.key}`, style: "margin-top:8px;display:inline-flex;width:max-content" },
            [h("i", { class: "bi bi-diagram-3", "aria-hidden": "true" }), featuredClusters.gigi.label]
          ),
          h("p", { class: "card-text" }, "Pemeriksaan, perawatan, dan edukasi kesehatan gigi dan mulut."),
        ]),
      ]),
    ]),

    createLatestPostsSection({ announcements: latestAnnouncements }),

    createDocumentationSection({ settings }),
  ]);

  let unsub = null;
  if (typeof subscribeDailyServicesToday === "function") {
    unsub = await subscribeDailyServicesToday((payload) => {
      const next = payload?.new;
      if (!next) return;
      today.setDoctors({ doctors: next.doctors });
      today.setNote(next.note);
    });
  }

  root._cleanup = () => {
    if (typeof unsub === "function") unsub();
    if (typeof today.node?._cleanup === "function") today.node._cleanup();
  };

  return root;
}
