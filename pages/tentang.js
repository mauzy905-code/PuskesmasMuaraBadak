  import { h } from "../lib/dom.js";

  function orgChart(settings) {
    const node = (title, name, role, imgSrc) =>
      h("div", { class: "org-node-wrap" }, [
        h("div", { class: "org-node" }, [
          h("div", { class: "org-node-img" }, [
            imgSrc 
              ? h("img", { src: imgSrc, alt: name, class: "org-node-img", style: "margin-bottom:0" }) 
              : h("i", { class: "bi bi-person-circle" })
          ]),
          h("div", { class: "org-node-title" }, title),
          h("div", { class: "org-node-name" }, name || "(Nama)"),
          h("div", { class: "org-node-role" }, role || "(Jabatan)"),
        ])
      ]);

    const hp = settings.headProfile || {};
    const defaultClusters = [
      { title: "Klaster 1", name: "", role: "Manajemen" },
      { title: "Klaster 2", name: "", role: "Ibu & Anak" },
      { title: "Klaster 3", name: "", role: "Usia Dewasa & Lansia" },
      { title: "Klaster 4", name: "", role: "Penanggulan Penyakit Menular" },
      { title: "Lintas Klaster", name: "", role: "Pelayanan Penunjang" },
    ];
    const clusters = settings.clusters && settings.clusters.length === 5 ? settings.clusters : defaultClusters;

    return h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Struktur Organisasi"),
        h("div", { class: "muted" }, "Bagan Kepemimpinan"),
      ]),
      h("div", { class: "org-wrapper" }, [
        h("div", { class: "org-tree" }, [
          // Top Level: Kepala Puskesmas
          node("Kepala Puskesmas", hp.name, hp.title, hp.image_url),
          h("div", { class: "org-line-down" }),
          // Row of 5 Clusters
          h("div", { class: "org-row" }, 
            clusters.map(c => node(c.title, c.name, c.role, c.image_url))
          )
        ])
      ]),
      h("div", { class: "help", style: "margin-top:10px" }, "Gunakan geser (scroll) ke kiri-kanan jika bagan tidak muat di layar."),
    ]);
  }

  function teamGrid(members) {
    return h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Tim Medis & Karyawan"),
        h("div", { class: "muted" }, "Nama dan jabatan dapat diubah melalui admin"),
      ]),
      h(
        "div",
        { class: "grid-3" },
        members.map((m) =>
          h("div", { class: "card" }, [
            h("div", { class: "slide-figure", style: "height:140px" }),
            h("div", { class: "card-title", style: "margin-top:12px" }, m.name),
            h("div", { class: "card-text" }, m.role),
          ])
        )
      ),
    ]);
  }

function staffDirectory({ staffGroups, fallbackMembers, headProfile, clusters }) {
    const groups = Array.isArray(staffGroups) ? staffGroups : [];
    const has = groups.some((g) => Array.isArray(g?.members) && g.members.length);
    if (!has) return teamGrid(fallbackMembers);

    const searchInput = h("input", {
      class: "input staff-search",
      type: "search",
      placeholder: "Cari nama pegawai...",
      autocomplete: "off",
      inputmode: "search",
      "aria-label": "Cari nama pegawai",
    });

    const memberCard = (m) =>
      h("div", { class: "card staff-member" }, [
        m.image_url
          ? h("img", {
              src: m.image_url,
              alt: m.name || "Foto pegawai",
              loading: "lazy",
              class: "staff-avatar",
            })
          : h("div", { class: "staff-avatar staff-avatar--empty" }, [
              h("i", { class: "bi bi-person-circle", "aria-hidden": "true" }),
            ]),
        h("div", { class: "card-title staff-name" }, m.name || "-"),
        h("div", { class: "card-text staff-role" }, m.role || "-"),
      ]);

  function normalizeText(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function isKasubbagTU(roleText) {
    const r = normalizeText(roleText);
    if (!r) return false;
    return r.includes("tata usaha") || r.includes("kasubbag") || r.includes("sub bagian tata usaha");
  }

  const raw = groups
    .map((g, idx) => ({
      name: String(g?.name || "").trim(),
      members: Array.isArray(g?.members) ? g.members.slice() : [],
      _idx: idx,
    }))
    .filter((g) => g.members.length);

  const kasubbagMembers = [];
  for (const g of raw) {
    const keep = [];
    for (const m of g.members) {
      if (isKasubbagTU(m?.role)) kasubbagMembers.push(m);
      else keep.push(m);
    }
    g.members = keep;
  }

  const groupBlocks = raw.filter((g) => g.members.length);

  const hp = headProfile || {};
  const hasKepala = groupBlocks.some((g) => normalizeText(g.name) === "kepala puskesmas");
  if (!hasKepala && (hp.name || hp.title || hp.image_url)) {
    groupBlocks.unshift({
      name: "Kepala Puskesmas",
      members: [
        {
          name: String(hp.name || "").trim() || "Kepala Puskesmas",
          role: String(hp.title || "").trim() || "Kepala Puskesmas",
          image_url: String(hp.image_url || ""),
        },
      ],
      _idx: -2,
    });
  }

  const hasKasubbag = groupBlocks.some((g) => normalizeText(g.name) === "kepala sub bagian tata usaha");
  if (!hasKasubbag && kasubbagMembers.length) {
    groupBlocks.unshift({
      name: "Kepala Sub Bagian Tata Usaha",
      members: kasubbagMembers,
      _idx: -1,
    });
  }

  const cluster1Img = Array.isArray(clusters) && clusters.length ? String(clusters[0]?.image_url || "") : "";
  if (cluster1Img) {
    for (const g of groupBlocks) {
      if (normalizeText(g.name) !== "kepala sub bagian tata usaha") continue;
      g.members = (g.members || []).map((m) => ({
        ...m,
        image_url: String(m?.image_url || "").trim() || cluster1Img,
      }));
    }
  }

  const priority = ["kepala puskesmas", "kepala sub bagian tata usaha", "dokter"];
  groupBlocks.sort((a, b) => {
    const ai = priority.indexOf(normalizeText(a.name));
    const bi = priority.indexOf(normalizeText(b.name));
    const ap = ai === -1 ? 999 : ai;
    const bp = bi === -1 ? 999 : bi;
    if (ap !== bp) return ap - bp;
    return (a._idx ?? 0) - (b._idx ?? 0);
  });

    const groupsWrap = h("div", { class: "staff-groups" }, []);
    const emptyWrap = h("div", { class: "muted", style: "display:none;margin-top:10px" }, "Nama tidak ditemukan.");
    const recapWrap = h("div", { class: "staff-recap", style: "margin-top:10px" }, "");

    const totalAll = groupBlocks.reduce((acc, g) => acc + g.members.length, 0);

    function renderGroups(q) {
      const query = normalizeText(q);
      groupsWrap.innerHTML = "";
      let shown = 0;
      let groupsShown = 0;

      for (const g of groupBlocks) {
        const members = query
          ? g.members.filter((m) => normalizeText(m?.name).includes(query))
          : g.members;
        if (!members.length) continue;
        shown += members.length;
        groupsShown += 1;
        groupsWrap.appendChild(
          h("div", { class: "card staff-group" }, [
            h("div", { class: "staff-group-head" }, [
              h("div", { class: "card-title staff-group-title" }, g.name || "Kelompok"),
              h("div", { class: "staff-count" }, `Total ${g.members.length} ${g.name || "Pegawai"}`),
            ]),
            h("div", { style: "height:10px" }),
            h("div", { class: "grid-3" }, members.map(memberCard)),
          ])
        );
      }

      emptyWrap.style.display = shown ? "none" : "block";
      recapWrap.innerHTML = "";
      recapWrap.appendChild(h("div", { class: "staff-recap-line" }, `Total ${totalAll} Pegawai`));
      if (query) {
        recapWrap.appendChild(h("div", { class: "staff-recap-line" }, `Menampilkan ${shown} pegawai dari ${groupsShown} kategori`));
      }
    }

    renderGroups("");
    searchInput.addEventListener("input", () => renderGroups(searchInput.value));

  return h("div", { class: "panel staff-directory", id: "tim-medis-karyawan" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Tim Medis & Karyawan"),
        h("div", { class: "muted" }, "Daftar pegawai Puskesmas Muara Badak"),
      ]),
      searchInput,
      recapWrap,
      emptyWrap,
      groupsWrap,
    ]);
  }

  export async function renderTentang({ settings }) {
    const p = settings.profile;
    const members = (settings.team || []).length
      ? settings.team
      : [
          { name: "Dr. (Nama)", role: "Kepala Puskesmas" },
          { name: "(Nama)", role: "Bidan" },
          { name: "(Nama)", role: "Perawat" },
          { name: "(Nama)", role: "Dokter Gigi" },
          { name: "(Nama)", role: "Analis Lab" },
          { name: "(Nama)", role: "Ahli Gizi" },
        ];

    return h("div", {}, [
      h("div", { class: "section-head" }, [
        h("h1", { class: "section-title" }, "Tentang Kami"),
        h("a", { class: "btn btn-primary", href: "/kontak" }, [
          h("i", { class: "bi bi-geo-alt", "aria-hidden": "true" }),
          "Lihat Lokasi",
        ]),
      ]),

      h("div", { class: "panel" }, [
        h("h2", { class: "section-title" }, p.welcomeTitle || "Sambutan Kepala Puskesmas"),
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
            h("p", { class: "card-text", style: "white-space: pre-wrap;" }, settings.headProfile?.message || p.welcomeText),
          ]),
        ]),
      ]),

      h("div", { class: "panel" }, [
        h("div", { class: "section-head" }, [
          h("h2", { class: "section-title" }, "Profil Puskesmas"),
          h("a", { class: "btn btn-primary", href: "/docs/PROFIL%20PKM%20MUARA%20BADAK.pdf", target: "_blank", rel: "noopener" }, [
            h("i", { class: "bi bi-file-earmark-pdf", "aria-hidden": "true" }),
            "Buka PDF",
          ]),
        ]),
        h("div", { class: "help" }, "Dokumen profil resmi Puskesmas Muara Badak dalam format PDF."),
        h("details", { style: "margin-top:10px" }, [
          h("summary", { class: "nav-link", style: "display:inline-flex;gap:10px;align-items:center;cursor:pointer" }, [
            h("i", { class: "bi bi-eye", "aria-hidden": "true" }),
            "Tampilkan PDF di halaman",
          ]),
          h("div", { style: "margin-top:12px" }, [
            h("iframe", {
              class: "pdf-frame",
              title: "Profil Puskesmas Muara Badak (PDF)",
              src: "/docs/PROFIL%20PKM%20MUARA%20BADAK.pdf",
              loading: "lazy",
              referrerpolicy: "no-referrer-when-downgrade",
            }),
          ]),
        ]),
      ]),

      h("div", { class: "panel" }, [
        h("h2", { class: "section-title" }, "Visi"),
        h("p", { class: "card-text" }, `“${p.vision}”`),
        h("h2", { class: "section-title", style: "margin-top:16px" }, "Misi"),
        h(
          "div",
          { class: "grid-2" },
          (p.missions || []).map((m) =>
            h("div", { class: "card" }, [
              h("div", { class: "card-icon" }, h("i", { class: "bi bi-check2-circle", "aria-hidden": "true" })),
              h("div", { class: "card-text" }, m),
            ])
          )
        ),
      ]),

      orgChart(settings),

    h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Sertifikat Akreditasi"),
        h(
          "a",
          { class: "btn btn-primary", href: "/docs/SERTIFIKAT%20AKREDITASI%20MUARA%20BADAK.pdf", target: "_blank", rel: "noopener" },
          [h("i", { class: "bi bi-file-earmark-pdf", "aria-hidden": "true" }), "Buka PDF"]
        ),
      ]),
      h("div", { class: "help" }, "Dokumen sertifikat akreditasi Puskesmas Muara Badak dalam format PDF."),
      h("details", { style: "margin-top:10px" }, [
        h("summary", { class: "nav-link", style: "display:inline-flex;gap:10px;align-items:center;cursor:pointer" }, [
          h("i", { class: "bi bi-eye", "aria-hidden": "true" }),
          "Tampilkan PDF di halaman",
        ]),
        h("div", { style: "margin-top:12px" }, [
          h("iframe", {
            class: "pdf-frame",
            title: "Sertifikat Akreditasi Puskesmas Muara Badak (PDF)",
            src: "/docs/SERTIFIKAT%20AKREDITASI%20MUARA%20BADAK.pdf",
            loading: "lazy",
            referrerpolicy: "no-referrer-when-downgrade",
          }),
        ]),
      ]),
    ]),

    staffDirectory({ staffGroups: settings.staffGroups, fallbackMembers: members, headProfile: settings.headProfile, clusters: settings.clusters }),

      h("div", { class: "panel" }, [
        h("div", { class: "section-head" }, [
          h("h2", { class: "section-title" }, "Data Puskesmas"),
          h("span", { class: "pill" }, "Kontak & Jam"),
        ]),
        h("div", { class: "grid-2" }, [
          h("div", { class: "card" }, [
            h("div", { class: "card-title" }, "Alamat"),
            h("div", { class: "card-text" }, p.address),
            h("div", { style: "height:12px" }),
            h("div", { class: "card-title" }, "Kontak"),
            h("div", { class: "card-text" }, `Telp: ${p.phone}`),
            h("div", { class: "card-text" }, `Email: ${p.email}`),
            h("div", { style: "height:12px" }),
            h("div", { class: "card-title" }, "Jam Operasional"),
            h("div", { class: "card-text" }, settings.hours.map((x) => `${x.day}: ${x.time}`).join(" | ")),
          ]),
          h("div", { class: "card" }, [
            h("div", { class: "card-title" }, "Google Maps"),
            h("iframe", {
              title: "Lokasi Puskesmas Muara Badak",
              src: p.mapsEmbedUrl,
              style: "width:100%;height:320px;border:0;border-radius:16px",
              loading: "lazy",
              referrerpolicy: "no-referrer-when-downgrade",
            }),
          ]),
        ]),
      ]),
    ]);
  }
