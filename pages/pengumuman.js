import { h, qs, textToRichParagraphs } from "../lib/dom.js";

const categories = ["Jadwal khusus", "Program kesehatan", "Edukasi Kesehatan", "Libur", "Lainnya"];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "2-digit" });
  } catch {
    return iso || "-";
  }
}

function announcementCard(a) {
  return h("div", { class: "card" }, [
    a.image_url
      ? h("img", {
          src: a.image_url,
          alt: `Gambar pengumuman: ${a.title}`,
          loading: "lazy",
          style:
            "width:100%;height:180px;object-fit:contain;background:#f8fafc;border-radius:16px;border:1px solid rgba(226,232,240,.9);margin-bottom:10px;display:block",
        })
      : null,
    h("div", { style: "display:flex;justify-content:space-between;gap:10px;align-items:flex-start" }, [
      h("div", {}, [
        h("div", { class: "pill" }, a.category),
        h("div", { class: "card-title", style: "margin-top:8px" }, a.title),
      ]),
      h("div", { class: "muted", style: "font-weight:700;font-size:12px;white-space:nowrap" }, formatDate(a.date)),
    ]),
    textToRichParagraphs(a.excerpt, { compact: true }),
    h("div", { style: "display:flex;justify-content:flex-end" }, [
      h("a", { class: "btn btn-ghost", href: `/pengumuman/${encodeURIComponent(a.id)}` }, [
        h("i", { class: "bi bi-arrow-right", "aria-hidden": "true" }),
        "Baca",
      ]),
    ]),
  ]);
}

export async function renderPengumuman({ listAnnouncements }) {
  const root = h("div", {}, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Informasi & Pengumuman"),
      h("div", { class: "muted" }, "Cari dan baca pengumuman terbaru"),
    ]),
  ]);

  const controls = h("div", { class: "panel" }, [
    h("div", { class: "form-grid" }, [
      h("div", { class: "field" }, [
        h("label", { class: "label", for: "q" }, "Search"),
        h("input", { class: "input", id: "q", placeholder: "Cari judul atau kata kunci..." }),
      ]),
      h("div", { class: "field" }, [
        h("label", { class: "label", for: "cat" }, "Kategori"),
        h(
          "select",
          { class: "select", id: "cat" },
          [h("option", { value: "" }, "Semua")].concat(categories.map((c) => h("option", { value: c }, c)))
        ),
      ]),
    ]),
    h("div", { class: "help" }, "Tip: gunakan filter kategori untuk menemukan jadwal khusus atau informasi libur."),
  ]);

  const listWrap = h("div", { class: "panel" }, [
    h("div", { class: "muted", id: "list-meta" }, "Memuat pengumuman..."),
    h("div", { class: "grid-2", id: "list" }),
  ]);

  root.appendChild(controls);
  root.appendChild(listWrap);

  async function load() {
    const q = String(qs("#q", root).value || "");
    const category = String(qs("#cat", root).value || "");
    const items = await listAnnouncements({ q, category });
    const meta = qs("#list-meta", root);
    meta.textContent = `${items.length} pengumuman ditemukan`;
    const list = qs("#list", root);
    list.innerHTML = "";
    if (items.length === 0) {
      list.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-title" }, "Tidak ada hasil"),
        h("div", { class: "card-text" }, "Coba ubah kata kunci pencarian atau kategori."),
      ]));
      return;
    }
    for (const a of items) list.appendChild(announcementCard(a));
  }

  qs("#q", root).addEventListener("input", () => load());
  qs("#cat", root).addEventListener("change", () => load());
  await load();
  return root;
}
