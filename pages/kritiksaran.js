import { h, qs } from "../lib/dom.js";
import { toast } from "../lib/toast.js";

export function renderKritikSaran({ submitFeedback, uploadFeedbackPhotos }) {
  const root = h("div", { class: "feedback-page" }, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Kritik & Saran"),
      h("div", { class: "muted" }, "Suara Anda sangat berarti untuk kemajuan pelayanan Puskesmas Muara Badak."),
    ]),

    h("div", { class: "panel" }, [
      h("form", { id: "form-feedback" }, [
        h("div", { class: "form-grid" }, [
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label", for: "fb-category" }, "Layanan yang dinilai *"),
            h("select", { class: "select", id: "fb-category", required: "true" }, [
              h("option", { value: "" }, "Pilih layanan..."),
              h("option", { value: "Pendaftaran / Loket" }, "Pendaftaran / Loket"),
              h("option", { value: "Poli Umum" }, "Poli Umum"),
              h("option", { value: "Poli Gigi" }, "Poli Gigi"),
              h("option", { value: "Poli KIA / KB" }, "Poli KIA / KB"),
              h("option", { value: "Apotek / Obat" }, "Apotek / Obat"),
              h("option", { value: "Gizi" }, "Gizi"),
              h("option", { value: "Laboratorium" }, "Laboratorium"),
              h("option", { value: "Fasilitas & Kebersihan" }, "Fasilitas & Kebersihan"),
              h("option", { value: "Sikap Petugas" }, "Sikap Petugas"),
              h("option", { value: "Lainnya" }, "Lainnya"),
            ]),
          ]),
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label", for: "fb-rating" }, "Penilaian Kepuasan (Rating 1-5) *"),
            h("select", { class: "select", id: "fb-rating", required: "true" }, [
              h("option", { value: "" }, "Pilih bintang..."),
              h("option", { value: "5" }, "⭐⭐⭐⭐⭐ (Sangat Puas)"),
              h("option", { value: "4" }, "⭐⭐⭐⭐ (Puas)"),
              h("option", { value: "3" }, "⭐⭐⭐ (Cukup)"),
              h("option", { value: "2" }, "⭐⭐ (Kurang Puas)"),
              h("option", { value: "1" }, "⭐ (Sangat Kecewa)"),
            ]),
          ]),
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label", for: "fb-message" }, "Kritik / Saran Anda *"),
            h("textarea", { class: "textarea", id: "fb-message", required: "true", style: "min-height: 120px" }),
          ]),
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label", for: "fb-photos" }, "Lampiran Foto (Opsional)"),
            h("input", {
              class: "input",
              id: "fb-photos",
              type: "file",
              accept: "image/*",
              multiple: "true",
            }),
            h(
              "div",
              { class: "help" },
              "Maksimal 3 foto. Ukuran tiap foto maks. 2MB. Jangan unggah data pribadi (mis. KTP)."
            ),
            h("div", { class: "fb-previews", id: "fb-previews", style: "display:none" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "fb-name" }, "Nama (Opsional)"),
            h("input", { class: "input", id: "fb-name", placeholder: "Boleh dikosongkan (Anonim)", autocomplete: "name" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "fb-phone" }, "No HP/WA (Opsional)"),
            h("input", { class: "input", id: "fb-phone", placeholder: "Boleh dikosongkan", type: "tel", inputmode: "tel", autocomplete: "tel" }),
            h("div", { class: "help" }, "Isi jika Anda ingin dihubungi kembali terkait saran ini."),
          ]),
        ]),
        h("div", { style: "display:flex;justify-content:flex-end;margin-top: 18px" }, [
          h("button", { class: "btn btn-primary", type: "submit", id: "btn-submit" }, [
            h("i", { class: "bi bi-send", "aria-hidden": "true" }),
            "Kirim Saran",
          ]),
        ]),
      ]),
      h("div", { id: "feedback-success", style: "display:none; text-align:center; padding: 40px 20px;" }, [
        h("div", { style: "font-size: 48px; color: var(--brand); margin-bottom: 16px;" }, h("i", { class: "bi bi-check-circle" })),
        h("h2", { style: "margin: 0 0 8px;" }, "Terima Kasih!"),
        h("p", { class: "muted" }, "Kritik dan saran Anda telah berhasil dikirim dan akan menjadi bahan evaluasi kami."),
        h("button", { class: "btn btn-ghost", style: "margin-top: 20px;", onclick: () => location.reload() }, "Kirim Saran Lain"),
      ]),
    ]),
  ]);

  const form = qs("#form-feedback", root);
  const btnSubmit = qs("#btn-submit", form);
  const successDiv = qs("#feedback-success", root);
  const inputPhotos = qs("#fb-photos", form);
  const previews = qs("#fb-previews", form);
  let selected = [];
  const previewUrls = new Map();

  function clearPreviewUrls() {
    for (const url of previewUrls.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
    previewUrls.clear();
  }

  function syncInputFiles() {
    try {
      const dt = new DataTransfer();
      for (const f of selected) dt.items.add(f);
      inputPhotos.files = dt.files;
    } catch {}
  }

  function renderPreviews() {
    previews.innerHTML = "";
    if (!selected.length) {
      previews.style.display = "none";
      return;
    }
    previews.style.display = "grid";
    for (const file of selected) {
      const url = previewUrls.get(file) || URL.createObjectURL(file);
      previewUrls.set(file, url);
      previews.appendChild(
        h("div", { class: "fb-preview" }, [
          h("img", { class: "fb-preview-img", src: url, alt: file.name || "Lampiran foto", loading: "lazy" }),
          h("button", { class: "fb-preview-remove", type: "button", "aria-label": "Hapus foto" }, [
            h("i", { class: "bi bi-x-lg", "aria-hidden": "true" }),
          ]),
        ])
      );
      previews.lastChild.querySelector(".fb-preview-remove").addEventListener("click", () => {
        selected = selected.filter((x) => x !== file);
        const u = previewUrls.get(file);
        if (u) {
          try {
            URL.revokeObjectURL(u);
          } catch {}
          previewUrls.delete(file);
        }
        syncInputFiles();
        renderPreviews();
      });
    }
  }

  inputPhotos.addEventListener("change", () => {
    const incoming = Array.from(inputPhotos.files || []);
    const next = [...selected, ...incoming].slice(0, 3);

    const filtered = [];
    for (const f of next) {
      const okType = String(f.type || "").startsWith("image/");
      const okSize = f.size <= 2 * 1024 * 1024;
      if (!okType) {
        toast({ title: "Lampiran ditolak", message: "Hanya file gambar yang diperbolehkan.", icon: "bi-exclamation-triangle" });
        continue;
      }
      if (!okSize) {
        toast({ title: "Terlalu besar", message: "Ukuran foto maksimal 2MB per file.", icon: "bi-exclamation-triangle" });
        continue;
      }
      filtered.push(f);
      if (filtered.length >= 3) break;
    }

    selected = filtered;
    syncInputFiles();
    renderPreviews();
  });

  function openQrWelcome() {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const badge = (text, icon) =>
      h("span", { class: "qr-welcome-badge" }, [
        icon ? h("i", { class: `bi ${icon}`, "aria-hidden": "true" }) : null,
        text,
      ].filter(Boolean));

    const overlay = h("div", { class: "lightbox qr-welcome", role: "dialog", "aria-modal": "true" }, [
      h("button", { class: "lightbox-backdrop", type: "button", "aria-label": "Tutup" }),
      h("div", { class: "lightbox-card qr-welcome-card" }, [
        h("div", { class: "qr-welcome-hero" }, [
          h("div", { class: "qr-welcome-icon" }, h("i", { class: "bi bi-heart-pulse", "aria-hidden": "true" })),
          h("div", { class: "qr-welcome-title" }, "Terima Kasih"),
          h(
            "div",
            { class: "qr-welcome-sub" },
            "Terima kasih telah berkunjung. Suara Anda sangat berarti bagi kemajuan Puskesmas Muara Badak. Silakan sampaikan masukan Anda sebagai bahan evaluasi kami"
          ),
          h("div", { class: "qr-welcome-badges" }, [
            badge("Cepat", "bi-lightning-charge"),
            badge("Anonim", "bi-shield-check"),
            badge("Mudah", "bi-hand-thumbs-up"),
          ]),
        ]),
        h("div", { class: "qr-welcome-actions" }, [
          h(
            "button",
            { class: "btn btn-primary", type: "button", id: "qr-go" },
            [h("i", { class: "bi bi-chat-left-text", "aria-hidden": "true" }), "Isi Kritik & Saran"]
          ),
          h(
            "button",
            { class: "btn btn-ghost", type: "button", id: "qr-close" },
            [h("i", { class: "bi bi-x-lg", "aria-hidden": "true" }), "Tutup"]
          ),
        ]),
      ]),
    ]);

    function cleanup() {
      window.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      document.body.style.overflow = prevOverflow;
    }

    function close({ keepParam = false } = {}) {
      try {
        sessionStorage.setItem("qr_welcome_dismissed", "1");
      } catch {}
      if (!keepParam) {
        try {
          const url = new URL(location.href);
          url.searchParams.delete("qr");
          url.searchParams.delete("source");
          url.searchParams.delete("utm_source");
          history.replaceState(null, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""));
        } catch {}
      }
      cleanup();
    }

    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }

    overlay.querySelector("#qr-close").addEventListener("click", () => close());
    overlay.querySelector(".lightbox-backdrop").addEventListener("click", () => close());
    overlay.querySelector("#qr-go").addEventListener("click", () => {
      close({ keepParam: true });
      qs("#fb-category", form)?.focus();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
  }

  function openSubmitThanks({ imageSrc = "/thanks.png" } = {}) {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const overlay = h("div", { class: "lightbox qr-thanks", role: "dialog", "aria-modal": "true" }, [
      h("button", { class: "lightbox-backdrop", type: "button", "aria-label": "Tutup" }),
      h("div", { class: "lightbox-card qr-welcome-card qr-thanks-card" }, [
        h("div", { class: "qr-welcome-hero" }, [
          h("div", { class: "qr-welcome-icon" }, h("i", { class: "bi bi-check2-circle", "aria-hidden": "true" })),
          h("div", { class: "qr-welcome-title" }, "Terima Kasih!"),
          h("div", { class: "qr-welcome-sub" }, "Masukan Anda berhasil dikirim. Kami akan gunakan untuk evaluasi pelayanan."),
        ]),
        h("div", { class: "qr-thanks-media" }, [
          h("img", { class: "qr-thanks-img", src: imageSrc, alt: "Terima kasih", loading: "lazy" }),
        ]),
        h("div", { class: "qr-welcome-actions" }, [
          h(
            "button",
            { class: "btn btn-primary", type: "button", id: "thanks-home" },
            [h("i", { class: "bi bi-house", "aria-hidden": "true" }), "Ke Beranda"]
          ),
          h(
            "button",
            { class: "btn btn-ghost", type: "button", id: "thanks-close" },
            [h("i", { class: "bi bi-x-lg", "aria-hidden": "true" }), "Tutup"]
          ),
        ]),
      ]),
    ]);

    function cleanup() {
      window.removeEventListener("keydown", onKeyDown);
      overlay.remove();
      document.body.style.overflow = prevOverflow;
    }

    function close() {
      cleanup();
    }

    function goHome() {
      cleanup();
      if (typeof window.__spaNavigate === "function") window.__spaNavigate("/", { replace: true });
      else location.assign("/");
    }

    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }

    overlay.querySelector("#thanks-close").addEventListener("click", close);
    overlay.querySelector(".lightbox-backdrop").addEventListener("click", close);
    overlay.querySelector("#thanks-home").addEventListener("click", goHome);
    window.addEventListener("keydown", onKeyDown);
    document.body.appendChild(overlay);
  }

  try {
    const params = new URLSearchParams(location.search || "");
    const fromQr = params.get("qr") === "1" || params.get("source") === "qr" || params.get("utm_source") === "qr";
    const dismissed = sessionStorage.getItem("qr_welcome_dismissed") === "1";
    if (fromQr && !dismissed) openQrWelcome();
  } catch {}

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      category: qs("#fb-category", form).value,
      rating: parseInt(qs("#fb-rating", form).value, 10),
      message: qs("#fb-message", form).value.trim(),
      name: qs("#fb-name", form).value.trim(),
      phone: qs("#fb-phone", form).value.trim(),
    };

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Mengirim...";

    try {
      if (selected.length) {
        if (typeof uploadFeedbackPhotos !== "function") {
          toast({ title: "Belum siap", message: "Lampiran foto belum aktif. Silakan coba lagi nanti.", icon: "bi-exclamation-triangle" });
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Kirim Saran";
          return;
        }
        const urls = await uploadFeedbackPhotos(selected);
        const cleanUrls = Array.isArray(urls) ? urls.filter(Boolean) : [];
        if (!cleanUrls.length) {
          toast({ title: "Gagal upload", message: "Lampiran foto tidak berhasil diunggah. Silakan coba lagi.", icon: "bi-exclamation-triangle" });
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Kirim Saran";
          return;
        }
        payload.message = `${payload.message}\n\nLampiran Foto:\n${cleanUrls.map((u) => `- ${u}`).join("\n")}`;
      }
      await submitFeedback(payload);
      form.style.display = "none";
      successDiv.style.display = "block";
      openSubmitThanks();
      clearPreviewUrls();
    } catch (err) {
      console.error(err);
      toast({ title: "Gagal", message: "Maaf, terjadi kesalahan. Silakan coba lagi.", icon: "bi-exclamation-triangle" });
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Kirim Saran";
    }
  });

  return root;
}
