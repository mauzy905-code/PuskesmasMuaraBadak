export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function escapeHtml(input) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function setAriaCurrent(navRoot, href) {
  const links = qsa("a.nav-link", navRoot);
  for (const a of links) {
    if (a.getAttribute("href") === href) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

export function mount(root, node) {
  root.innerHTML = "";
  root.appendChild(node);
}

export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (v === false || v === null || v === undefined) continue;
    else el.setAttribute(k, String(v));
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c === null || c === undefined) continue;
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  }
  return el;
}

export function textToParagraphs(input, { wrapperClass = "prose", paragraphClass = "card-text", compact = false } = {}) {
  const text = String(input || "").replace(/\r\n/g, "\n").trim();
  const wrap = h("div", { class: compact ? `${wrapperClass} prose-compact` : wrapperClass });
  if (!text) return wrap;

  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    const lines = p.split("\n");
    const kids = [];
    for (let i = 0; i < lines.length; i += 1) {
      kids.push(lines[i]);
      if (i < lines.length - 1) kids.push(h("br"));
    }
    wrap.appendChild(h("p", { class: paragraphClass }, kids));
  }
  return wrap;
}

function inlineMarkdownToSafeHtml(input) {
  const escaped = escapeHtml(input);
  const strong = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return strong.replace(/\*(?!\*)([^*\n]+?)\*(?!\*)/g, "<em>$1</em>");
}

export function textToRichParagraphs(input, { wrapperClass = "prose", paragraphClass = "card-text", compact = false } = {}) {
  const text = String(input || "").replace(/\r\n/g, "\n").trim();
  const wrap = h("div", { class: compact ? `${wrapperClass} prose-compact` : wrapperClass });
  if (!text) return wrap;

  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    const html = inlineMarkdownToSafeHtml(p).replace(/\n/g, "<br>");
    wrap.appendChild(h("p", { class: paragraphClass, html }));
  }
  return wrap;
}
