  import { h } from "../lib/dom.js";
  import { isServiceOpenNowWita } from "../lib/hours.js";

  export async function renderJadwal({ settings, dailyServices, subscribeDailyServicesToday }) {
    const rows = settings.hours;
    const polies = (settings.polies || []).filter((p) => !["lansia", "imunisasi"].includes(String(p?.key || "").toLowerCase()));

    const listWrap = h("div", { id: "today-doctors" }, []);
    const noteWrap = h("div", { class: "card-text", id: "today-note" }, "");
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

    function clusterForPoliName(poli) {
      const s = String(poli || "").toLowerCase();
      if (s.includes("umum")) return { key: "c3", label: "Klaster 3 (Usia Dewasa & Lansia)" };
      if (s.includes("anak") || s.includes("kia")) return { key: "c2", label: "Klaster 2 (Ibu & Anak)" };
      if (s.includes("tb") || s.includes("dots") || s.includes("menular")) return { key: "c4", label: "Klaster 4 (Penyakit Menular)" };
      if (s.includes("gigi") || s.includes("gizi")) return { key: "c23", label: "Klaster 2 & 3 (Ibu & Anak, Usia Dewasa & Lansia)" };
      if (s.includes("lab")) return { key: "lintas", label: "Lintas Klaster" };
      return null;
    }

    function clusterForPoliItem(p) {
      const key = String(p?.key || "").toLowerCase();
      if (key === "umum") return { key: "c3", label: "Klaster 3 (Usia Dewasa & Lansia)" };
      if (key === "kia") return { key: "c2", label: "Klaster 2 (Ibu & Anak)" };
      if (key === "tb") return { key: "c4", label: "Klaster 4 (Penyakit Menular)" };
      if (["gigi", "gizi"].includes(key)) return { key: "c23", label: "Klaster 2 & 3 (Ibu & Anak, Usia Dewasa & Lansia)" };
      if (key === "lab") return { key: "lintas", label: "Lintas Klaster" };
      return null;
    }

    function renderDoctors(next) {
      listWrap.innerHTML = "";
      const doctors = Array.isArray(next?.doctors) ? next.doctors : [];
      if (!doctors.length) {
        listWrap.appendChild(h("div", { class: "muted" }, "Belum ada informasi dokter bertugas hari ini."));
        return;
      }
      listWrap.appendChild(
        h(
          "div",
          { class: "grid-2" },
          doctors.map((d) =>
            h("div", { class: "card duty-card" }, [
              h("div", { class: "card-icon duty-icon" }, h("i", { class: "bi bi-person-badge", "aria-hidden": "true" })),
              h("div", { class: "card-title" }, d.name || "-"),
              h("div", { class: "duty-meta" }, (() => {
                const poli = d.poli || "-";
                const c = clusterForPoliName(d.poli);
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

    function applyOpenState() {
      const open = isServiceOpenNowWita(rows);
      state.open = open;
      if (open) {
        closedWrap.style.display = "none";
        listWrap.style.display = "block";
        renderDoctors(state.doctors);
        const note = String(state.note || "").trim();
        if (note) {
          noteLabel.style.display = "block";
          noteWrap.style.display = "block";
          noteWrap.textContent = note;
        } else {
          noteLabel.style.display = "none";
          noteWrap.style.display = "none";
          noteWrap.textContent = "";
        }
      } else {
        listWrap.style.display = "none";
        noteLabel.style.display = "none";
        noteWrap.style.display = "none";
        noteWrap.textContent = "";
        closedWrap.style.display = "block";
      }
    }

    const root = h("div", {}, [
      h("div", { class: "section-head" }, [
        h("h1", { class: "section-title" }, "Layanan & Jadwal"),
        h("a", { class: "btn btn-primary", href: "/alur" }, [
          h("i", { class: "bi bi-journal-text", "aria-hidden": "true" }),
          "Panduan Berobat",
        ]),
      ]),

      h("div", { class: "panel" }, [
        h("div", { class: "section-head" }, [
          h("h2", { class: "section-title" }, "Layanan Hari Ini"),
          h("span", { class: "pill" }, dailyServices?.date || "-"),
        ]),
        h("div", { class: "help" }, "Informasi dokter/tenaga yang bertugas hari ini. Jika kosong, silakan hubungi puskesmas."),
        closedWrap,
        listWrap,
        noteLabel,
        noteWrap,
      ]),

      h("div", { class: "panel" }, [
        h("div", { class: "section-head" }, [
          h("h2", { class: "section-title" }, "Jam Pelayanan"),
          h("div", { class: "muted" }, "WITA"),
        ]),
        h("div", { class: "table-wrap" }, [
          h("table", {}, [
            h("thead", {}, [h("tr", {}, [h("th", {}, "Hari"), h("th", {}, "Jam")])]),
            h("tbody", {}, rows.map((r) => h("tr", {}, [h("td", {}, r.day), h("td", {}, r.time)]))),
          ]),
        ]),
        h("div", { class: "ugds-note" }, [
          h("i", { class: "bi bi-exclamation-triangle-fill", "aria-hidden": "true" }),
          h("span", {}, "Layanan UGD & Persalinan Buka 24 Jam"),
        ]),
      ]),

      h("div", { class: "panel" }, [
        h("div", { class: "section-head" }, [
          h("h2", { class: "section-title" }, "Poli Tersedia"),
          h("div", { class: "muted" }, "Jadwal khusus ditampilkan jika ada"),
        ]),
        h(
          "div",
          { class: "grid-2" },
          polies.map((p) =>
            h("div", { class: "card" }, [
              h("div", { class: "card-icon" }, h("i", { class: "bi bi-hospital", "aria-hidden": "true" })),
              h("div", { class: "card-title" }, p.name),
              (() => {
              const c = clusterForPoliItem(p);
              return c
                ? h("div", { class: `duty-pill duty-pill--cluster duty-pill--${c.key}`, style: "margin-top:8px;display:inline-flex;width:max-content" }, [
                    h("i", { class: "bi bi-diagram-3", "aria-hidden": "true" }),
                    c.label,
                  ])
                : null;
              })(),
              h(
                "div",
                { class: "card-text" },
                p.schedule && p.schedule.trim() ? `Jadwal khusus: ${p.schedule}` : "Mengikuti jam pelayanan."
              ),
            ])
          )
        ),
      ]),

      h("div", { class: "panel" }, [
        h("div", { class: "section-head" }, [
          h("h2", { class: "section-title" }, "Dokumen Layanan (PDF)"),
          h("a", { class: "btn btn-primary", href: "/docs/jenis-layanan-puskesmas.pdf", target: "_blank", rel: "noopener" }, [
            h("i", { class: "bi bi-file-earmark-pdf", "aria-hidden": "true" }),
            "Buka PDF",
          ]),
        ]),
        h("div", { class: "help" }, "PDF ini berisi penjelasan lebih rinci mengenai jenis-jenis layanan yang tersedia di Puskesmas."),
        h("details", { style: "margin-top:10px" }, [
          h("summary", { class: "nav-link", style: "display:inline-flex;gap:10px;align-items:center;cursor:pointer" }, [
            h("i", { class: "bi bi-eye", "aria-hidden": "true" }),
            "Tampilkan PDF di halaman",
          ]),
          h("div", { style: "margin-top:12px" }, [
            h("iframe", {
              class: "pdf-frame",
              title: "Dokumen layanan Puskesmas (PDF)",
              src: "/docs/jenis-layanan-puskesmas.pdf",
              loading: "lazy",
              referrerpolicy: "no-referrer-when-downgrade",
            }),
          ]),
        ]),
      ]),
    ]);

    applyOpenState();
    state.timer = window.setInterval(applyOpenState, 60 * 1000);

    if (typeof subscribeDailyServicesToday === "function") {
      const unsub = await subscribeDailyServicesToday((payload) => {
        const next = payload?.new;
        if (!next) return;
        state.doctors = { doctors: next.doctors };
        state.note = next.note || "";
        if (state.open) {
          renderDoctors(state.doctors);
          applyOpenState();
        }
      });
      root._cleanup = () => {
        unsub();
        if (state.timer) window.clearInterval(state.timer);
      };
    } else {
      root._cleanup = () => {
        if (state.timer) window.clearInterval(state.timer);
      };
    }

    return root;
  }
