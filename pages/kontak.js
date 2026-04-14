import { h } from "../lib/dom.js";

export async function renderKontak({ settings }) {
  const p = settings.profile;

  return h("div", {}, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Hubungi Kami"),
      h("div", { class: "pill" }, "Respon Cepat"),
    ]),

    h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Kritik & Saran"),
        h("div", { class: "muted" }, "Masukan untuk peningkatan pelayanan"),
      ]),
      h(
        "p",
        { class: "card-text" },
        "Untuk kritik dan saran layanan, silakan gunakan menu Kritik & Saran agar tercatat dan dapat direkap setiap bulan."
      ),
      h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:12px" }, [
        h("a", { class: "btn btn-primary", href: "/kritik-saran" }, [
          h("i", { class: "bi bi-chat-left-text", "aria-hidden": "true" }),
          "Kirim Kritik & Saran",
        ]),
      ]),
      h("div", { class: "help" }, `Jam layanan pengaduan: ${settings.complaintHours}`),
    ]),

    h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Kontak Umum"),
        h("div", { class: "muted" }, "Informasi resmi puskesmas"),
      ]),
      h("div", { class: "grid-3" }, [
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-telephone", "aria-hidden": "true" })),
          h("div", { class: "card-title" }, "Telepon"),
          h("div", { class: "card-text" }, p.phone || "-"),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-envelope", "aria-hidden": "true" })),
          h("div", { class: "card-title" }, "Email"),
          h("div", { class: "card-text" }, p.email || "-"),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-geo-alt", "aria-hidden": "true" })),
          h("div", { class: "card-title" }, "Alamat"),
          h("div", { class: "card-text" }, p.address || "-"),
        ]),
      ]),
    ]),

    h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Kontak Darurat"),
        h("div", { class: "muted" }, "Gunakan saat keadaan mendesak"),
      ]),
      h("div", { class: "grid-3" }, [
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-telephone", "aria-hidden": "true" })),
          h("div", { class: "card-title" }, "Call Center"),
          h("div", { class: "card-text" }, settings.emergency.callCenter),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-whatsapp", "aria-hidden": "true" })),
          h("div", { class: "card-title" }, "WA/SMS"),
          h("div", { class: "card-text" }, settings.emergency.waSms),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-envelope", "aria-hidden": "true" })),
          h("div", { class: "card-title" }, "Email"),
          h("div", { class: "card-text" }, settings.emergency.email),
        ]),
      ]),
    ]),

    h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Lokasi"),
        h("div", { class: "muted" }, p.location),
      ]),
      h("iframe", {
        title: "Lokasi Puskesmas Muara Badak",
        src: p.mapsEmbedUrl,
        style: "width:100%;height:380px;border:0;border-radius:16px",
        loading: "lazy",
        referrerpolicy: "no-referrer-when-downgrade",
      }),
    ]),
  ]);
}
