export function createHashRouter({ routes, onNotFound }) {
  function normalize(hash) {
    const raw = (hash || "").replace(/^#/, "");
    if (!raw) return "/";
    return raw.startsWith("/") ? raw : `/${raw}`;
  }

  function splitPath(path) {
    return path.replace(/\/+$/, "").split("/").filter(Boolean);
  }

  function match(pattern, path) {
    const pParts = splitPath(pattern);
    const aParts = splitPath(path);
    if (pParts.length !== aParts.length) return null;
    const params = {};
    for (let i = 0; i < pParts.length; i += 1) {
      const pp = pParts[i];
      const ap = aParts[i];
      if (pp.startsWith(":")) {
        params[pp.slice(1)] = decodeURIComponent(ap);
        continue;
      }
      if (pp !== ap) return null;
    }
    return params;
  }

  async function resolve() {
    const path = normalize(location.hash);
    for (const r of routes) {
      const params = match(r.path, path);
      if (!params) continue;
      await r.handler({ path, params });
      return;
    }
    if (onNotFound) await onNotFound({ path, params: {} });
  }

  function start() {
    window.addEventListener("hashchange", resolve);
    resolve();
  }

  return { start, resolve };
}

export function createBrowserRouter({ routes, onNotFound }) {
  function normalize(pathname) {
    const raw = String(pathname || "");
    if (!raw || raw === "/") return "/";
    const trimmed = raw.replace(/\/+$/, "");
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  function splitPath(path) {
    return path.replace(/\/+$/, "").split("/").filter(Boolean);
  }

  function match(pattern, path) {
    const pParts = splitPath(pattern);
    const aParts = splitPath(path);
    if (pParts.length !== aParts.length) return null;
    const params = {};
    for (let i = 0; i < pParts.length; i += 1) {
      const pp = pParts[i];
      const ap = aParts[i];
      if (pp.startsWith(":")) {
        params[pp.slice(1)] = decodeURIComponent(ap);
        continue;
      }
      if (pp !== ap) return null;
    }
    return params;
  }

  async function resolve() {
    const path = normalize(location.pathname);
    const loader = window.__topLoader;
    if (loader && typeof loader.start === "function") loader.start();
    try {
      for (const r of routes) {
        const params = match(r.path, path);
        if (!params) continue;
        await r.handler({ path, params });
        return;
      }
      if (onNotFound) await onNotFound({ path, params: {} });
    } finally {
      if (loader && typeof loader.done === "function") loader.done();
    }
  }

  function navigate(to, { replace = false } = {}) {
    const url = String(to || "/");
    if (replace) history.replaceState(null, "", url);
    else history.pushState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function handleClick(e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (!href) return;
    if (href.startsWith("#")) return;
    if (a.hasAttribute("download")) return;
    const target = (a.getAttribute("target") || "").toLowerCase();
    if (target && target !== "_self") return;

    let url;
    try {
      url = new URL(href, location.href);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;

    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  }

  function start() {
    window.addEventListener("popstate", resolve);
    document.addEventListener("click", handleClick);
    resolve();
  }

  return { start, resolve, navigate };
}
