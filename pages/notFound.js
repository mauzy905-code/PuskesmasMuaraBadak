import { h } from "../lib/dom.js";

export async function renderNotFound() {
  return h("div", { class: "panel" }, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Halaman tidak ditemukan"),
      h("a", { class: "btn btn-primary", href: "/" }, "Kembali ke Beranda"),
    ]),
    h("p", { class: "card-text" }, "Periksa kembali tautan atau gunakan menu untuk navigasi."),
  ]);
}
