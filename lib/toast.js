import { h } from "./dom.js";

let wrap = null;

function ensureWrap() {
  if (wrap) return wrap;
  wrap = h("div", { class: "toast-wrap", id: "toast-wrap", "aria-live": "polite" });
  document.body.appendChild(wrap);
  return wrap;
}

export function toast({ title, message, icon = "bi-info-circle", timeoutMs = 4200 }) {
  const host = ensureWrap();
  const node = h("div", { class: "toast", role: "status" }, [
    h("i", { class: `bi ${icon}`, "aria-hidden": "true" }),
    h("div", {}, [
      h("div", { class: "toast-title" }, title || "Info"),
      h("div", { class: "toast-text" }, message || ""),
    ]),
  ]);
  host.appendChild(node);
  window.setTimeout(() => {
    node.remove();
    if (host.childElementCount === 0) host.remove();
    if (host.childElementCount === 0) wrap = null;
  }, timeoutMs);
}
