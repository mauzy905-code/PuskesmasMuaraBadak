import { createBrowserRouter } from "./lib/router.js";
import { mount, qs, setAriaCurrent } from "./lib/dom.js";
import {
  getSettings,
  listAnnouncements,
  listLatestAnnouncements,
  getAnnouncement,
  getDailyServicesToday,
  subscribeDailyServicesToday,
  submitFeedback,
  uploadFeedbackPhotos,
} from "./lib/data.js";
import { renderHome } from "./pages/home.js";
import { renderJadwal } from "./pages/jadwal.js";
import { renderKritikSaran } from "./pages/kritiksaran.js";
import { renderAlur } from "./pages/alur.js";
import { renderGaleri } from "./pages/galeri.js";
import { renderPengumuman } from "./pages/pengumuman.js";
import { renderPengumumanDetail } from "./pages/pengumumanDetail.js";
import { renderTentang } from "./pages/tentang.js";
import { renderKontak } from "./pages/kontak.js";
import { renderNotFound } from "./pages/notFound.js";
import { renderAdminLogin } from "./pages/adminLogin.js";
import { renderAdminPanel } from "./pages/adminPanel.js";
import { clearJsonLd, setCanonical, setDescription, setOgTags, setTitle, setTwitterTags } from "./lib/seo.js";

const appRoot = qs("#app");
const nav = document.querySelector("nav.nav");
const btnMenu = qs("#btn-menu");
const navLinks = qs("#nav-links");

function closeMenu() {
  navLinks.setAttribute("data-open", "false");
  btnMenu.setAttribute("aria-expanded", "false");
  Array.from(navLinks.querySelectorAll("[data-nav-dropdown]")).forEach((el) => {
    el.setAttribute("data-open", "false");
    const btn = el.querySelector(".nav-drop-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
  });
}

btnMenu.addEventListener("click", () => {
  const open = navLinks.getAttribute("data-open") === "true";
  navLinks.setAttribute("data-open", open ? "false" : "true");
  btnMenu.setAttribute("aria-expanded", open ? "false" : "true");
});

try {
  const mq = window.matchMedia("(min-width: 841px)");
  const onChange = () => {
    if (mq.matches) closeMenu();
  };
  if (typeof mq.addEventListener === "function") mq.addEventListener("change", onChange);
  else if (typeof mq.addListener === "function") mq.addListener(onChange);
} catch {}

navLinks.addEventListener("click", (e) => {
  const dropBtn = e.target.closest(".nav-drop-btn");
  if (dropBtn) {
    e.preventDefault();
    e.stopPropagation();
    const wrap = dropBtn.closest("[data-nav-dropdown]");
    if (!wrap) return;
    const open = wrap.getAttribute("data-open") === "true";
    wrap.setAttribute("data-open", open ? "false" : "true");
    dropBtn.setAttribute("aria-expanded", open ? "false" : "true");
    return;
  }

  const a = e.target.closest("a");
  if (!a) return;
  const parentDropdown = a.closest("[data-nav-dropdown]");
  if (parentDropdown) {
    parentDropdown.setAttribute("data-open", "false");
    const btn = parentDropdown.querySelector(".nav-drop-btn");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }
  closeMenu();
});

document.addEventListener("click", (e) => {
  if (nav.contains(e.target)) return;
  closeMenu();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

qs("#year").textContent = String(new Date().getFullYear());

function initTopLoader() {
  const el = document.createElement("div");
  el.id = "top-loader";
  el.setAttribute("data-active", "false");
  const bar = document.createElement("div");
  bar.id = "top-loader-bar";
  el.appendChild(bar);
  document.body.appendChild(el);

  let activeCount = 0;
  let showTimer = null;
  let incTimer = null;
  let progress = 0;

  function setWidth(pct) {
    const next = Math.max(0, Math.min(100, pct));
    progress = next;
    bar.style.width = `${next}%`;
  }

  function start() {
    activeCount += 1;
    if (activeCount > 1) return;

    if (showTimer) window.clearTimeout(showTimer);
    showTimer = window.setTimeout(() => {
      el.setAttribute("data-active", "true");
      setWidth(12);
      if (incTimer) window.clearInterval(incTimer);
      incTimer = window.setInterval(() => {
        if (progress >= 85) return;
        const step = 2 + Math.random() * 6;
        setWidth(progress + step);
      }, 220);
    }, 120);
  }

  function done() {
    activeCount = Math.max(0, activeCount - 1);
    if (activeCount !== 0) return;

    if (showTimer) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
    if (incTimer) {
      window.clearInterval(incTimer);
      incTimer = null;
    }
    el.setAttribute("data-active", "true");
    setWidth(100);
    window.setTimeout(() => {
      el.setAttribute("data-active", "false");
      setWidth(0);
    }, 260);
  }

  return { start, done };
}

window.__topLoader = initTopLoader();

let settings = await getSettings();
const siteOrigin = location.origin;

function setPageMeta({ title, description, path, type = "website", image = "" }) {
  const t = String(title || "Puskesmas Muara Badak");
  const d = String(description || "");
  const url = `${siteOrigin}${path || "/"}`;
  setTitle(t);
  setDescription(d);
  setCanonical(url);
  setOgTags({ title: t, description: d, url, image, type });
  setTwitterTags({ title: t, description: d, image });
  clearJsonLd("article");
}

function hydrateFooter() {
  const contact = qs("#footer-contact");
  contact.innerHTML = `<div>Telp: ${settings.profile.phone || "-"}</div><div>Email: ${settings.profile.email || "-"}</div>`;
  const hours = qs("#footer-hours");
  hours.innerHTML = settings.hours
    .map(
      (x) =>
        `<div class="footer-hours-row"><span class="footer-hours-day">${x.day}</span><span class="footer-hours-time">${x.time}</span></div>`
    )
    .join("");
}

hydrateFooter();

let cleanup = null;

async function refreshSettings() {
  settings = await getSettings();
  hydrateFooter();
}

async function renderRoute(href, nodePromise) {
  setAriaCurrent(navLinks, href);
  if (typeof cleanup === "function") cleanup();
  const node = await nodePromise;
  mount(appRoot, node);
  cleanup = typeof node?._cleanup === "function" ? node._cleanup : null;
  const main = qs("#main");
  main.focus();
  try {
    const hash = String(location.hash || "");
    if (hash && hash.startsWith("#")) {
      const id = decodeURIComponent(hash.slice(1));
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  } catch {}
}

const router = createBrowserRouter({
  routes: [
    {
      path: "/",
      handler: async () => {
        setPageMeta({
          title: "Puskesmas Muara Badak",
          description:
            "Website resmi Puskesmas Muara Badak. Informasi layanan, jadwal, edukasi, galeri, pengumuman, dan kritik & saran.",
          path: "/",
        });
        await refreshSettings();
        const dailyServices = await getDailyServicesToday();
        const latestAnnouncements = await listLatestAnnouncements(3);
        await renderRoute("/", renderHome({ settings, dailyServices, latestAnnouncements, subscribeDailyServicesToday }));
      },
    },
    {
      path: "/jadwal",
      handler: async () => {
        setPageMeta({
          title: "Layanan & Jadwal | Puskesmas Muara Badak",
          description: "Informasi jam pelayanan, poli tersedia, dan layanan hari ini.",
          path: "/jadwal",
        });
        await refreshSettings();
        const dailyServices = await getDailyServicesToday();
        await renderRoute(
          "/jadwal",
          renderJadwal({ settings, dailyServices, subscribeDailyServicesToday })
        );
      },
    },
    {
      path: "/kritik-saran",
      handler: async () => {
        setPageMeta({
          title: "Kritik & Saran | Puskesmas Muara Badak",
          description: "Sampaikan kritik dan saran untuk meningkatkan kualitas pelayanan.",
          path: "/kritik-saran",
        });
        await refreshSettings();
        await renderRoute(
          "/kritik-saran",
          renderKritikSaran({
            submitFeedback,
            uploadFeedbackPhotos,
          })
        );
      },
    },
    {
      path: "/alur",
      handler: async () => {
        setPageMeta({
          title: "Panduan Berobat | Puskesmas Muara Badak",
          description: "Panduan alur berobat di Puskesmas Muara Badak.",
          path: "/alur",
        });
        await refreshSettings();
        await renderRoute("/alur", renderAlur({ settings }));
      },
    },
    {
      path: "/pengumuman",
      handler: async () => {
        setPageMeta({
          title: "Edukasi & Info | Puskesmas Muara Badak",
          description: "Kumpulan informasi, edukasi kesehatan, dan pengumuman terbaru.",
          path: "/pengumuman",
        });
        await refreshSettings();
        await renderRoute(
          "/pengumuman",
          renderPengumuman({
            listAnnouncements,
          })
        );
      },
    },
    {
      path: "/pengumuman/:id",
      handler: async ({ params }) => {
        setPageMeta({
          title: "Detail Pengumuman | Puskesmas Muara Badak",
          description: "Detail informasi dan pengumuman.",
          path: `/pengumuman/${encodeURIComponent(params.id)}`,
          type: "article",
        });
        await refreshSettings();
        await renderRoute(
          "/pengumuman",
          renderPengumumanDetail({
            id: params.id,
            getAnnouncement,
          })
        );
      },
    },
    {
      path: "/galeri",
      handler: async () => {
        setPageMeta({
          title: "Galeri | Puskesmas Muara Badak",
          description: "Dokumentasi kegiatan dan pelayanan Puskesmas Muara Badak.",
          path: "/galeri",
        });
        await refreshSettings();
        await renderRoute("/galeri", renderGaleri({ settings }));
      },
    },
    {
      path: "/tentang",
      handler: async () => {
        setPageMeta({
          title: "Profil Kami | Puskesmas Muara Badak",
          description: "Profil Puskesmas, visi misi, struktur organisasi, dan tim.",
          path: "/tentang",
        });
        await refreshSettings();
        await renderRoute("/tentang", renderTentang({ settings }));
      },
    },
    {
      path: "/kontak",
      handler: async () => {
        setPageMeta({
          title: "Hubungi | Puskesmas Muara Badak",
          description: "Informasi kontak umum, darurat, dan lokasi Puskesmas Muara Badak.",
          path: "/kontak",
        });
        await refreshSettings();
        await renderRoute(
          "/kontak",
          renderKontak({
            settings,
          })
        );
      },
    },
    {
      path: "/admin/login",
      handler: async () => {
        setPageMeta({
          title: "Login Admin | Puskesmas Muara Badak",
          description: "Halaman login admin.",
          path: "/admin/login",
        });
        await renderRoute("/admin/login", renderAdminLogin());
      },
    },
    {
      path: "/admin",
      handler: async () => {
        setPageMeta({
          title: "Panel Admin | Puskesmas Muara Badak",
          description: "Panel admin untuk mengelola konten website.",
          path: "/admin",
        });
        await renderRoute("/admin/login", renderAdminPanel());
      },
    },
  ],
  onNotFound: async () => {
    setPageMeta({
      title: "Halaman Tidak Ditemukan | Puskesmas Muara Badak",
      description: "Halaman tidak ditemukan.",
      path: location.pathname || "/",
    });
    setAriaCurrent(navLinks, "");
    if (typeof cleanup === "function") cleanup();
    mount(appRoot, await renderNotFound());
    cleanup = null;
  },
});

window.__spaNavigate = (to, { replace = false } = {}) => router.navigate(to, { replace });

if (location.hash && location.hash.startsWith("#/")) {
  const next = location.hash.replace(/^#/, "");
  history.replaceState(null, "", next);
}

router.start();
