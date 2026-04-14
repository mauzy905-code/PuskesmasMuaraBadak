function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === "") el.removeAttribute(k);
    else el.setAttribute(k, String(v));
  }
  return el;
}

function upsertLink(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === "") el.removeAttribute(k);
    else el.setAttribute(k, String(v));
  }
  return el;
}

export function setTitle(title) {
  document.title = String(title || "");
}

export function setDescription(description) {
  upsertMeta('meta[name="description"]', { name: "description", content: String(description || "") });
}

export function setCanonical(url) {
  upsertLink('link[rel="canonical"]', { rel: "canonical", href: String(url || "") });
}

export function setOgTags({ title, description, url, image, type } = {}) {
  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "Puskesmas Muara Badak" });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title || "" });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description || "" });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: url || "" });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: type || "website" });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: image || "" });
}

export function setTwitterTags({ title, description, image } = {}) {
  const card = image ? "summary_large_image" : "summary";
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: card });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title || "" });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description || "" });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image || "" });
}

export function setJsonLd(key, obj) {
  const id = `seo-jsonld-${String(key || "page")}`;
  let el = document.head.querySelector(`script[type="application/ld+json"][data-seo="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(obj || {});
}

export function clearJsonLd(key) {
  const id = `seo-jsonld-${String(key || "page")}`;
  const el = document.head.querySelector(`script[type="application/ld+json"][data-seo="${id}"]`);
  if (el) el.remove();
}

export function summarizeText(input, maxLen = 160) {
  const text = String(input || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1).trimEnd() + "…";
}

