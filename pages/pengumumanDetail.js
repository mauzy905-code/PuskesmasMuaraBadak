import { h, textToRichParagraphs } from "../lib/dom.js";
import { setCanonical, setDescription, setJsonLd, setOgTags, setTitle, setTwitterTags, summarizeText } from "../lib/seo.js";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "2-digit" });
  } catch {
    return iso || "-";
  }
}

export async function renderPengumumanDetail({ id, getAnnouncement }) {
  const a = await getAnnouncement(id);
  if (!a) {
    return h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h1", { class: "section-title" }, "Pengumuman tidak ditemukan"),
        h("a", { class: "btn btn-ghost", href: "/pengumuman" }, "Kembali"),
      ]),
      h("div", { class: "card-text" }, "Pengumuman mungkin sudah dihapus atau tautan tidak valid."),
    ]);
  }

  const path = `/pengumuman/${encodeURIComponent(a.id)}`;
  const url = `${location.origin}${path}`;
  const title = `${a.title} | Puskesmas Muara Badak`;
  const description = summarizeText(a.excerpt || a.content || "");
  const image = a.image_url || "";

  setTitle(title);
  setDescription(description);
  setCanonical(url);
  setOgTags({ title, description, url, image, type: "article" });
  setTwitterTags({ title, description, image });
  setJsonLd("article", {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description,
    datePublished: a.date,
    image: image ? [image] : undefined,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Puskesmas Muara Badak" },
    publisher: {
      "@type": "Organization",
      name: "Puskesmas Muara Badak",
      logo: { "@type": "ImageObject", url: `${location.origin}/favicon.svg` },
    },
    url,
  });

  return h("div", {}, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Detail Pengumuman"),
      h("a", { class: "btn btn-ghost", href: "/pengumuman" }, [
        h("i", { class: "bi bi-arrow-left", "aria-hidden": "true" }),
        "Kembali",
      ]),
    ]),
    h("div", { class: "panel" }, [
      h("div", { style: "display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap" }, [
        h("div", {}, [
          h("div", { class: "pill" }, a.category),
          h("h2", { class: "section-title", style: "margin:10px 0 0" }, a.title),
        ]),
        h("div", { class: "muted", style: "font-weight:800" }, formatDate(a.date)),
      ]),
      a.image_url
        ? h("img", {
            src: a.image_url,
            alt: `Gambar pengumuman: ${a.title}`,
            loading: "lazy",
            style:
              "width:100%;height:auto;max-height:520px;object-fit:contain;background:#f8fafc;border-radius:16px;border:1px solid rgba(226,232,240,.9);margin-top:12px;margin-bottom:12px;display:block",
          })
        : null,
      textToRichParagraphs(a.content),
    ]),
  ]);
}
