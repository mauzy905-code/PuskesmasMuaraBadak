import { h, qs } from "../lib/dom.js";
import { toast } from "../lib/toast.js";
import { getSupabase } from "../lib/supabaseClient.js";

function safeFileName(name) {
  return String(name || "")
    .trim()
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function tabButton(label, key, activeKey, onClick, { icon = "", tone = "slate" } = {}) {
  const active = key === activeKey;
  const inner = [
    icon ? h("i", { class: `bi ${icon}`, "aria-hidden": "true" }) : null,
    h("span", { class: "admin-tab-label" }, label),
  ].filter(Boolean);
  return h(
    "button",
    {
      type: "button",
      class: active
        ? `btn admin-tab-btn admin-tab-active admin-tab-tone-${tone}`
        : `btn btn-ghost admin-tab-btn admin-tab-tone-${tone}`,
      "aria-pressed": active ? "true" : "false",
      onclick: onClick,
    },
    inner
  );
}

export async function renderAdminPanel() {
  const sb = await getSupabase();
  if (!sb) {
    return h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h1", { class: "section-title" }, "Admin"),
        h("a", { class: "btn btn-ghost", href: "/" }, "Beranda"),
      ]),
      h("div", { class: "card-text" }, "Supabase belum dikonfigurasi."),
      h("a", { class: "btn btn-primary", href: "/admin/login" }, "Ke Login"),
    ]);
  }

  const { data: sessionData } = await sb.auth.getSession();
  const session = sessionData?.session;
  if (!session) {
    if (typeof window.__spaNavigate === "function") window.__spaNavigate("/admin/login", { replace: true });
    else location.assign("/admin/login");
    return h("div", {});
  }

  const { data: isAdmin, error: isAdminErr } = await sb.rpc("is_admin");
  if (isAdminErr || !isAdmin) {
    return h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h1", { class: "section-title" }, "Akses Ditolak"),
        h("a", { class: "btn btn-ghost", href: "/" }, "Beranda"),
      ]),
      h("div", { class: "card-text" }, "Akun ini tidak memiliki akses admin."),
      h(
        "button",
        {
          class: "btn btn-danger",
          type: "button",
          onclick: async () => {
            await sb.auth.signOut();
            if (typeof window.__spaNavigate === "function") window.__spaNavigate("/admin/login", { replace: true });
            else location.assign("/admin/login");
          },
        },
        "Logout"
      ),
    ]);
  }

  let activeTab = "announcements";

  const content = h("div", {});

  const header = h("div", { class: "section-head" }, [
    h("h1", { class: "section-title" }, "Panel Admin"),
    h("div", { style: "display:flex;gap:10px;flex-wrap:wrap" }, [
      h("a", { class: "btn btn-ghost", href: "/" }, "Lihat Website"),
      h(
        "button",
        {
          class: "btn btn-danger",
          type: "button",
          onclick: async () => {
            await sb.auth.signOut();
            if (typeof window.__spaNavigate === "function") window.__spaNavigate("/admin/login", { replace: true });
            else location.assign("/admin/login");
          },
        },
        "Logout"
      ),
    ]),
  ]);

  const tabBar = h("div", { class: "panel", style: "display:flex;gap:10px;flex-wrap:wrap" }, []);

  async function renderAnnouncements() {
    const wrap = h("div", {});
    const listPanel = h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Kelola Pengumuman"),
        h("button", { class: "btn btn-primary", type: "button", id: "btn-new" }, "Tambah"),
      ]),
      h("div", { class: "muted", id: "meta" }, "Memuat..."),
      h("div", { class: "grid-2", id: "list" }),
    ]);

    const formPanel = h("div", { class: "panel", id: "edit" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Editor Pengumuman"),
        h("div", { class: "muted" }, "Tambah / Edit"),
      ]),
      h("form", { id: "form-ann" }, [
        h("input", { type: "hidden", name: "id", id: "ann-id" }),
        h("input", { type: "hidden", name: "image_url", id: "ann-image-url" }),
        h("input", { type: "hidden", name: "image_path", id: "ann-image-path" }),
        h("div", { class: "form-grid" }, [
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "ann-title" }, "Judul"),
            h("input", { class: "input", id: "ann-title", name: "title", required: "true" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "ann-cat" }, "Kategori"),
            h(
              "select",
              { class: "select", id: "ann-cat", name: "category", required: "true" },
              ["Jadwal khusus", "Program kesehatan", "Edukasi Kesehatan", "Libur", "Lainnya"].map((x) =>
                h("option", { value: x }, x)
              )
            ),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "ann-date" }, "Tanggal"),
            h("input", { class: "input", id: "ann-date", name: "date", type: "date", required: "true" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Publikasikan"),
            h("label", { class: "radio" }, [
              h("input", { type: "checkbox", id: "ann-pub", name: "is_published", value: "true" }),
              "Tampilkan ke publik",
            ]),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label", for: "ann-excerpt" }, "Ringkasan"),
            h("textarea", { class: "textarea", id: "ann-excerpt", name: "excerpt", required: "true", placeholder: "Tempel ringkasan dari Word. Baris baru dan paragraf akan ditampilkan seperti artikel." }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label", for: "ann-content" }, "Isi"),
            h("div", { class: "rte-toolbar", "data-rte": "ann-content" }, [
              h(
                "button",
                { type: "button", class: "rte-btn", title: "Bold" },
                h("b", {}, "B")
              ),
              h(
                "button",
                { type: "button", class: "rte-btn", title: "Italic" },
                h("i", {}, "I")
              ),
            ]),
            h("textarea", { class: "textarea", id: "ann-content", name: "content", required: "true", style: "min-height:220px", placeholder: "Tempel isi dari Word. Pisahkan paragraf dengan 1 baris kosong agar tampilan rapi." }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Lampiran Gambar (opsional)"),
            h("div", { class: "help" }, "Gunakan JPG/PNG. Ukuran disarankan < 1 MB."),
            h("div", { style: "display:flex;gap:10px;align-items:center;flex-wrap:wrap" }, [
              h("input", { class: "input", id: "ann-image-file", type: "file", accept: "image/*" }),
              h("label", { class: "radio" }, [
                h("input", { type: "checkbox", id: "ann-image-remove" }),
                "Hapus gambar",
              ]),
            ]),
            h("div", { id: "ann-image-preview-wrap", style: "margin-top:10px;display:none" }, [
              h("img", {
                id: "ann-image-preview",
                alt: "Preview gambar pengumuman",
                style:
                  "width:100%;height:auto;max-height:320px;object-fit:contain;background:#f8fafc;border-radius:16px;border:1px solid rgba(226,232,240,.9);display:block",
              }),
            ]),
          ]),
        ]),
        h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:12px" }, [
          h("button", { class: "btn btn-ghost", type: "button", id: "btn-reset" }, "Reset"),
          h("button", { class: "btn btn-primary", type: "submit", id: "btn-save" }, "Simpan"),
        ]),
      ]),
    ]);

    wrap.appendChild(formPanel);
    wrap.appendChild(listPanel);

    const form = qs("#form-ann", wrap);

    function wrapSelection(textarea, before, after) {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const value = String(textarea.value || "");
      const selected = value.slice(start, end);
      const next = value.slice(0, start) + before + selected + after + value.slice(end);
      textarea.value = next;
      const nextStart = start + before.length;
      const nextEnd = nextStart + selected.length;
      textarea.focus();
      textarea.setSelectionRange(nextStart, nextEnd);
    }

    function attachRte(toolbarSel, textareaSel) {
      const toolbar = qs(toolbarSel, formPanel);
      const textarea = qs(textareaSel, formPanel);
      if (!toolbar || !textarea) return;
      const btns = Array.from(toolbar.querySelectorAll("button"));
      const [btnBold, btnItalic] = btns;
      if (btnBold) btnBold.addEventListener("click", () => wrapSelection(textarea, "**", "**"));
      if (btnItalic) btnItalic.addEventListener("click", () => wrapSelection(textarea, "*", "*"));
    }

    function fillForm(a) {
      qs("#ann-id", form).value = a?.id || "";
      qs("#ann-title", form).value = a?.title || "";
      qs("#ann-cat", form).value = a?.category || "Lainnya";
      qs("#ann-date", form).value = a?.date || todayISO();
      qs("#ann-pub", form).checked = Boolean(a?.is_published ?? true);
      qs("#ann-excerpt", form).value = a?.excerpt || "";
      qs("#ann-content", form).value = a?.content || "";
      qs("#ann-image-url", form).value = a?.image_url || "";
      qs("#ann-image-path", form).value = a?.image_path || "";

      qs("#ann-image-file", form).value = "";
      qs("#ann-image-remove", form).checked = false;

      const previewWrap = qs("#ann-image-preview-wrap", form);
      const preview = qs("#ann-image-preview", form);
      if (a?.image_url) {
        preview.src = a.image_url;
        previewWrap.style.display = "block";
      } else {
        preview.removeAttribute("src");
        previewWrap.style.display = "none";
      }
    }

    fillForm({ date: todayISO(), is_published: true });
    attachRte('[data-rte="ann-content"]', "#ann-content");

    qs("#ann-image-file", wrap).addEventListener("change", () => {
      const input = qs("#ann-image-file", form);
      const file = input.files?.[0];
      const previewWrap = qs("#ann-image-preview-wrap", form);
      const preview = qs("#ann-image-preview", form);
      if (!file) {
        if (!qs("#ann-image-url", form).value) {
          preview.removeAttribute("src");
          previewWrap.style.display = "none";
        }
        return;
      }
      const url = URL.createObjectURL(file);
      preview.src = url;
      previewWrap.style.display = "block";
      qs("#ann-image-remove", form).checked = false;
    });

    async function loadList() {
      const { data, error } = await sb
        .from("announcements")
        .select("id,title,category,date,excerpt,content,is_published,updated_at,image_url,image_path")
        .order("date", { ascending: false });
      if (error) {
        qs("#meta", wrap).textContent = "Gagal memuat data.";
        return;
      }
      qs("#meta", wrap).textContent = `${data.length} pengumuman`;
      const list = qs("#list", wrap);
      list.innerHTML = "";
      for (const a of data) {
        const card = h("div", { class: "card" }, [
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
            h("div", { class: "muted", style: "font-weight:800;font-size:12px" }, a.date),
          ]),
          h("div", { class: "card-text" }, a.excerpt),
          h("div", { style: "display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:10px" }, [
            h("div", { class: "muted", style: "font-weight:800;font-size:12px" }, a.is_published ? "Publik" : "Draft"),
            h("div", { style: "display:flex;gap:8px" }, [
              h(
                "button",
                {
                  class: "btn btn-ghost",
                  type: "button",
                  onclick: () => {
                    fillForm(a);
                    qs("#ann-title", form).focus();
                  },
                },
                "Edit"
              ),
              h(
                "button",
                {
                  class: "btn btn-danger",
                  type: "button",
                  onclick: async () => {
                    const ok = confirm("Hapus pengumuman ini?");
                    if (!ok) return;
                    if (a.image_path) {
                      await sb.storage.from("announcement-images").remove([a.image_path]);
                    }
                    const { error: delErr } = await sb.from("announcements").delete().eq("id", a.id);
                    if (delErr) {
                      toast({ title: "Gagal", message: "Tidak bisa menghapus pengumuman.", icon: "bi-exclamation-triangle" });
                      return;
                    }
                    toast({ title: "Terhapus", message: "Pengumuman berhasil dihapus.", icon: "bi-check-circle" });
                    await loadList();
                  },
                },
                "Hapus"
              ),
            ]),
          ]),
        ]);
        list.appendChild(card);
      }
    }

    qs("#btn-new", wrap).addEventListener("click", () => fillForm({ date: todayISO(), is_published: true }));
    qs("#btn-reset", wrap).addEventListener("click", () => fillForm({ date: todayISO(), is_published: true }));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const id = String(fd.get("id") || "").trim();
      const existingImageUrl = String(fd.get("image_url") || "").trim();
      const existingImagePath = String(fd.get("image_path") || "").trim();
      const removeImage = qs("#ann-image-remove", form).checked;
      const file = qs("#ann-image-file", form).files?.[0] || null;

      const payload = {
        title: String(fd.get("title") || "").trim(),
        category: String(fd.get("category") || "").trim(),
        date: String(fd.get("date") || "").trim(),
        excerpt: String(fd.get("excerpt") || "").trim(),
        content: String(fd.get("content") || "").trim(),
        is_published: qs("#ann-pub", form).checked,
        image_url: removeImage ? null : existingImageUrl || null,
        image_path: removeImage ? null : existingImagePath || null,
      };
      const btn = qs("#btn-save", form);
      btn.disabled = true;
      btn.textContent = "Menyimpan...";
      try {
        let annId = id;
        if (annId) {
          if (removeImage && existingImagePath) {
            await sb.storage.from("announcement-images").remove([existingImagePath]);
          }
          const { error } = await sb.from("announcements").update(payload).eq("id", annId);
          if (error) throw error;
        } else {
          const { data, error } = await sb.from("announcements").insert(payload).select("id").single();
          if (error) throw error;
          annId = data.id;
        }

        if (file) {
          const bucket = sb.storage.from("announcement-images");
          const fileName = safeFileName(file.name);
          const path = `announcements/${annId}/${Date.now()}-${fileName}`;

          const { error: upErr } = await bucket.upload(path, file, { upsert: true });
          if (upErr) throw upErr;

          const { data: pub } = bucket.getPublicUrl(path);
          const image_url = pub?.publicUrl || null;

          if (existingImagePath) {
            await bucket.remove([existingImagePath]);
          }

          const { error: imgErr } = await sb
            .from("announcements")
            .update({ image_url, image_path: path })
            .eq("id", annId);
          if (imgErr) throw imgErr;
        }

        toast({ title: "Tersimpan", message: "Pengumuman berhasil disimpan.", icon: "bi-check-circle" });
        fillForm({ date: todayISO(), is_published: true });
        await loadList();
      } catch {
        toast({ title: "Gagal", message: "Tidak bisa menyimpan pengumuman.", icon: "bi-exclamation-triangle" });
      } finally {
        btn.disabled = false;
        btn.textContent = "Simpan";
      }
    });

    await loadList();
    return wrap;
  }

  async function renderFeedbacks() {
    const wrap = h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Kritik & Saran Masuk"),
        h("div", { class: "muted", id: "meta-fb" }, "Memuat..."),
      ]),
      h("div", { class: "table-wrap" }, [
        h("table", {}, [
          h("thead", {}, [
            h("tr", {}, [
              h("th", {}, "Tanggal"),
              h("th", {}, "Kategori"),
              h("th", {}, "Rating"),
              h("th", {}, "Pesan"),
              h("th", {}, "Pengirim"),
              h("th", {}, "No HP/WA"),
            ]),
          ]),
          h("tbody", { id: "tbody-fb" }),
        ]),
      ]),
    ]);

    const { data, error } = await sb
      .from("feedbacks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      qs("#meta-fb", wrap).textContent = "Gagal memuat data.";
      return wrap;
    }
    
    qs("#meta-fb", wrap).textContent = `${data.length} masukan terbaru`;
    const tbody = qs("#tbody-fb", wrap);
    tbody.innerHTML = "";

    function extractAttachmentUrls(message) {
      const text = String(message || "");
      const urls = [];
      const re = /(https?:\/\/[^\s)]+)(?=\s|$)/g;
      let m;
      while ((m = re.exec(text))) urls.push(m[1]);
      const clean = text
        .split("\n")
        .filter((line) => {
          const t = line.trim();
          if (!t) return true;
          if (/^lampiran/i.test(t)) return false;
          if (/^-\s*https?:\/\//i.test(t)) return false;
          if (/^https?:\/\//i.test(t)) return false;
          return true;
        })
        .join("\n")
        .trim();
      return { clean, urls };
    }

    for (const r of data) {
      const { clean, urls } = extractAttachmentUrls(r.message);
      tbody.appendChild(
        h("tr", {}, [
          h("td", {}, new Date(r.created_at).toLocaleString("id-ID")),
          h("td", {}, r.category),
          h("td", {}, "⭐".repeat(r.rating || 0)),
          h("td", { style: "max-width: 340px; white-space: normal;" }, [
            h("div", {}, clean || "-"),
            urls.length
              ? h(
                  "div",
                  { class: "fb-attachments" },
                  urls.map((u) =>
                    h(
                      "a",
                      { class: "fb-attach", href: u, target: "_blank", rel: "noopener noreferrer" },
                      [h("img", { class: "fb-attach-img", src: u, alt: "Lampiran", loading: "lazy" })]
                    )
                  )
                )
              : null,
          ]),
          h("td", {}, r.name || "Anonim"),
          h("td", {}, r.phone || "-"),
        ])
      );
    }
    return wrap;
  }

  async function renderDailyServices() {
    const date = todayISO();
    const meta = h("div", { class: "muted", id: "svc-meta" }, "Memuat...");
    const list = h("div", { id: "svc-list", style: "display:grid;gap:12px;margin-top:10px" }, []);
    const note = h("textarea", { class: "textarea", id: "svc-note", style: "min-height:110px" }, "");
    const doctorNames = ["dr. Fatimah Hartina Faradillah", "dr. Raudah", "drg. Farikha Liqna Nailufar", "Nur Aisyah Almi, A.Md. Gz"];
    const poliNames = ["Poli Umum", "Poli Anak", "Pelayanan Gigi", "Pelayanan Gizi"];
    const poliClusters = {
      "poli umum": "Klaster 3 (Usia Dewasa & Lansia)",
      "poli anak": "Klaster 2 (Ibu & Anak)",
      "pelayanan gigi": "Klaster 2 & 3 (Ibu & Anak, Usia Dewasa & Lansia)",
      "pelayanan gizi": "Klaster 2 & 3 (Ibu & Anak, Usia Dewasa & Lansia)",
    };

    const defaultPoliByName = {
      "dr. fatimah hartina faradillah": "Poli Umum",
      "dr. raudah": "Poli Anak",
      "drg. farikha liqna nailufar": "Pelayanan Gigi",
      "nur aisyah almi, a.md. gz": "Pelayanan Gizi",
    };

    const wrap = h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Layanan Hari Ini"),
        h("span", { class: "pill" }, date),
      ]),
      meta,
      h("div", { class: "card", style: "margin-top:14px" }, [
        h("div", { class: "section-head" }, [
          h("div", { class: "card-title" }, "Dokter / Tenaga Bertugas"),
          h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end" }, doctorNames.map((n) =>
            h("button", { class: "btn btn-ghost", type: "button", "data-add-doctor": n }, [
              h("i", { class: "bi bi-plus-lg", "aria-hidden": "true" }),
              n,
            ])
          )),
        ]),
        h("div", { class: "help" }, "Klik nama dokter untuk menambahkan. Pilih poli tempat bertugas."),
        list,
      ]),
      h("div", { class: "card", style: "margin-top:14px" }, [
        h("div", { class: "card-title" }, "Catatan (Opsional)"),
        h("div", { class: "help" }, "Contoh: Poli gigi tutup karena kegiatan, atau dokter datang siang."),
        note,
      ]),
      h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:14px" }, [
        h("button", { class: "btn btn-primary", type: "button", id: "btn-svc-save" }, "Simpan"),
      ]),
    ]);

    let current = { date, doctors: [], note: "", updated_at: null };

    function doctorRow(item) {
      const nameChoices = doctorNames.slice();
      if (item?.name && !nameChoices.includes(item.name)) nameChoices.push(item.name);
      const poliChoices = poliNames.slice();
      if (item?.poli && !poliChoices.includes(item.poli)) poliChoices.push(item.poli);

      const row = h("div", { class: "panel", "data-svc": "1" }, [
        h("div", { class: "section-head" }, [
          h("div", { class: "pill" }, "Petugas"),
          h("button", { class: "btn btn-danger", type: "button" }, "Hapus"),
        ]),
        h("div", { class: "form-grid" }, [
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Nama"),
            h(
              "select",
              { class: "select", "data-name": "1" },
              nameChoices.map((n) => h("option", { value: n, selected: n === item.name ? "true" : null }, n))
            ),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Poli/Layanan"),
            h(
              "select",
              { class: "select", "data-poli": "1" },
              poliChoices.map((p) => {
                const k = String(p || "").toLowerCase();
                const c = poliClusters[k] || "";
                const label = c ? `${p} — ${c}` : p;
                return h("option", { value: p, selected: p === item.poli ? "true" : null }, label);
              })
            ),
          ]),
        ]),
      ]);
      row.querySelector(".btn-danger").addEventListener("click", () => row.remove());
      return row;
    }

    function renderList(items) {
      list.innerHTML = "";
      if (!items.length) {
        list.appendChild(h("div", { class: "muted" }, "Belum ada data. Klik Tambah untuk memasukkan dokter/tenaga bertugas."));
        return;
      }
      for (const it of items) list.appendChild(doctorRow(it));
    }

    async function load() {
      const { data, error } = await sb.from("daily_services").select("date,doctors,note,updated_at").eq("date", date).maybeSingle();
      if (error) {
        meta.textContent = "Gagal memuat data.";
        current = { date, doctors: [], note: "", updated_at: null };
        renderList([]);
        note.value = "";
        return;
      }
      current = data || { date, doctors: [], note: "", updated_at: null };
      meta.textContent = current?.updated_at ? `Terakhir update: ${new Date(current.updated_at).toLocaleString("id-ID")}` : "Belum ada data.";
      renderList(Array.isArray(current.doctors) ? current.doctors : []);
      note.value = current.note || "";
    }

    Array.from(wrap.querySelectorAll("[data-add-doctor]")).forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = String(btn.getAttribute("data-add-doctor") || "").trim();
        const defPoli = defaultPoliByName[String(name || "").toLowerCase()] || poliNames[0];
        const item = { name, poli: defPoli };
        const empty = list.querySelector(".muted");
        if (empty) list.innerHTML = "";
        const row = doctorRow(item);
        list.insertBefore(row, list.firstChild);
        row.querySelector("[data-poli]")?.focus();
      });
    });

    qs("#btn-svc-save", wrap).addEventListener("click", async () => {
      const rows = Array.from(list.querySelectorAll("[data-svc]"));
      const doctors = rows
        .map((r) => ({
          name: String(r.querySelector("[data-name]")?.value || "").trim(),
          poli: String(r.querySelector("[data-poli]")?.value || "").trim(),
        }))
        .filter((x) => x.name || x.poli);

      const payload = {
        date,
        doctors,
        note: String(note.value || "").trim() || null,
      };

      const btn = qs("#btn-svc-save", wrap);
      btn.disabled = true;
      btn.textContent = "Menyimpan...";
      try {
        const { error } = await sb.from("daily_services").upsert(payload);
        if (error) throw error;
        toast({ title: "Tersimpan", message: "Layanan hari ini berhasil diperbarui.", icon: "bi-check-circle" });
        await load();
      } catch {
        toast({ title: "Gagal", message: "Tidak bisa menyimpan layanan hari ini.", icon: "bi-exclamation-triangle" });
      } finally {
        btn.disabled = false;
        btn.textContent = "Simpan";
      }
    });

    await load();
    return wrap;
  }

  async function renderHeroSlider() {
    const wrap = h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Tampilan Utama"),
        h("div", { class: "muted" }, "Mengatur banner slider di halaman beranda"),
      ]),
      h("div", { class: "muted", id: "meta-hero" }, "Memuat..."),
    ]);

    const { data, error } = await sb.from("settings").select("value,updated_at").eq("key", "site").maybeSingle();
    if (error || !data?.value) {
      qs("#meta-hero", wrap).textContent = "Data settings belum ada.";
      return wrap;
    }

    let value = data.value;
    if (!Array.isArray(value.hero_slider)) value.hero_slider = [];
    qs("#meta-hero", wrap).textContent = `Terakhir update: ${new Date(data.updated_at).toLocaleString("id-ID")}`;

    const form = h("form", { id: "form-hero" }, [
      h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:14px;margin-bottom:14px" }, [
        h("button", { class: "btn btn-primary", type: "submit", id: "btn-save-hero" }, "Simpan Perubahan Banner"),
      ]),
      h("div", { class: "card" }, [
        h("div", { class: "section-head" }, [
          h("div", { class: "card-title" }, "Banner Slider"),
          h("button", { class: "btn btn-ghost", type: "button", id: "btn-slider-add" }, [
            h("i", { class: "bi bi-plus-lg", "aria-hidden": "true" }),
            "Tambah Slide",
          ]),
        ]),
        h("div", { class: "help" }, "Upload foto dan atur teks untuk banner besar di halaman beranda. Disarankan foto berukuran besar/landscape."),
        h("div", { id: "slider-list", style: "display:grid;gap:12px;margin-top:10px" }),
      ]),
    ]);

    const sliderList = qs("#slider-list", form);

    function sliderRow(s) {
      const previewWrap = h("div", { style: "margin-top:10px;display:none" }, [
        h("img", {
          alt: "Preview slider",
          style: "width:100%;height:auto;max-height:200px;object-fit:cover;background:#f8fafc;border-radius:16px;border:1px solid rgba(226,232,240,.9);display:block",
        }),
      ]);

      const row = h("div", { class: "panel", "data-sid": s.id }, [
        h("div", { class: "section-head" }, [
          h("div", { class: "pill" }, "Slide Banner"),
          h("button", { class: "btn btn-danger", type: "button" }, "Hapus"),
        ]),
        h("div", { class: "form-grid" }, [
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Judul Besar"),
            h("input", { class: "input", "data-s-title": "1", value: s.title || "" }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Subjudul (Teks Kecil)"),
            h("input", { class: "input", "data-s-sub": "1", value: s.subtitle || "" }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Tombol Utama (Label)"),
            h("input", { class: "input", "data-s-cta1-label": "1", value: s.cta_primary_label || "" }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Tombol Utama (Link)"),
            h("input", { class: "input", "data-s-cta1-url": "1", value: s.cta_primary_url || "", placeholder: "https://..." }),
            h("div", { class: "help" }, "Boleh link website Kemenkes atau link internal (contoh: /jadwal)."),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Tombol Kedua (Label)"),
            h("input", { class: "input", "data-s-cta2-label": "1", value: s.cta_secondary_label || "" }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Tombol Kedua (Link)"),
            h("input", { class: "input", "data-s-cta2-url": "1", value: s.cta_secondary_url || "", placeholder: "https://..." }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Foto Background (wajib agar terlihat bagus)"),
            h("input", { class: "input", type: "file", accept: "image/*", "data-s-file": "1" }),
            h("div", { style: "display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px" }, [
              h("label", { class: "radio" }, [
                h("input", { type: "checkbox", "data-s-remove": "1" }),
                "Hapus foto",
              ]),
            ]),
          ]),
        ]),
        h("input", { type: "hidden", "data-s-url": "1", value: s.image_url || "" }),
        h("input", { type: "hidden", "data-s-path": "1", value: s.image_path || "" }),
        previewWrap,
      ]);

      const btnDel = row.querySelector(".btn-danger");
      btnDel.addEventListener("click", () => {
        const ok = confirm("Hapus slide banner ini?");
        if (!ok) return;
        row.remove();
      });

      const fileInput = row.querySelector("[data-s-file]");
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        const img = previewWrap.querySelector("img");
        if (!file) return;
        img.src = URL.createObjectURL(file);
        previewWrap.style.display = "block";
        row.querySelector("[data-s-remove]").checked = false;
      });

      const urlVal = row.querySelector("[data-s-url]").value;
      if (urlVal) {
        previewWrap.querySelector("img").src = urlVal;
        previewWrap.style.display = "block";
      }

      return row;
    }

    function renderSliders() {
      sliderList.innerHTML = "";
      for (const s of value.hero_slider) sliderList.appendChild(sliderRow(s));
      if (value.hero_slider.length === 0) {
        sliderList.appendChild(
          h("div", { class: "muted" }, "Belum ada slide banner. Klik Tambah Slide untuk membuat banner baru.")
        );
      }
    }

    qs("#btn-slider-add", form).addEventListener("click", () => {
      const s = { id: `s-${Date.now()}-${Math.random().toString(16).slice(2)}`, title: "", subtitle: "", image_url: "", image_path: "" };
      value.hero_slider.unshift(s);
      renderSliders();
    });

    renderSliders();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const sliderRows = Array.from(form.querySelectorAll("[data-sid]"));
      const nextSliders = [];
      for (const row of sliderRows) {
        const sid = row.getAttribute("data-sid");
        const title = String(row.querySelector("[data-s-title]").value || "").trim();
        const subtitle = String(row.querySelector("[data-s-sub]").value || "").trim();
        const cta_primary_label = String(row.querySelector("[data-s-cta1-label]")?.value || "").trim();
        const cta_primary_url = String(row.querySelector("[data-s-cta1-url]")?.value || "").trim();
        const cta_secondary_label = String(row.querySelector("[data-s-cta2-label]")?.value || "").trim();
        const cta_secondary_url = String(row.querySelector("[data-s-cta2-url]")?.value || "").trim();
        const existingUrl = String(row.querySelector("[data-s-url]").value || "").trim();
        const existingPath = String(row.querySelector("[data-s-path]").value || "").trim();
        const remove = Boolean(row.querySelector("[data-s-remove]")?.checked);
        const file = row.querySelector("[data-s-file]")?.files?.[0] || null;
        nextSliders.push({
          id: sid,
          title,
          subtitle,
          cta_primary_label,
          cta_primary_url,
          cta_secondary_label,
          cta_secondary_url,
          image_url: existingUrl,
          image_path: existingPath,
          _remove: remove,
          _file: file,
        });
      }

      const btn = qs("#btn-save-hero", form);
      btn.disabled = true;
      btn.textContent = "Menyimpan...";
      try {
        const bucketGallery = sb.storage.from("site-gallery");

        for (const s of nextSliders) {
          if (s._remove && s.image_path) {
            await bucketGallery.remove([s.image_path]);
            s.image_url = "";
            s.image_path = "";
          }
          if (s._file) {
            const fileName = safeFileName(s._file.name);
            const path = `slider/${s.id}/${Date.now()}-${fileName}`;
            const { error: upErr } = await bucketGallery.upload(path, s._file, { upsert: true });
            if (upErr) throw upErr;
            const { data: pub } = bucketGallery.getPublicUrl(path);
            const newUrl = pub?.publicUrl || "";
            if (s.image_path) {
              await bucketGallery.remove([s.image_path]);
            }
            s.image_url = newUrl;
            s.image_path = path;
          }
        }

        value.hero_slider = nextSliders
          .map((s) => ({
            id: s.id,
            title: s.title,
            subtitle: s.subtitle,
            cta_primary_label: s.cta_primary_label || "",
            cta_primary_url: s.cta_primary_url || "",
            cta_secondary_label: s.cta_secondary_label || "",
            cta_secondary_url: s.cta_secondary_url || "",
            image_url: s.image_url || "",
            image_path: s.image_path || "",
          }))
          .filter((s) => s.title || s.subtitle || s.image_url || s.cta_primary_url || s.cta_secondary_url);

        const { error: upErr } = await sb.from("settings").upsert({ key: "site", value });
        if (upErr) throw upErr;
        toast({ title: "Tersimpan", message: "Banner slider berhasil diperbarui.", icon: "bi-check-circle" });
      } catch {
        toast({ title: "Gagal", message: "Tidak bisa menyimpan banner.", icon: "bi-exclamation-triangle" });
      } finally {
        btn.disabled = false;
        btn.textContent = "Simpan Perubahan Banner";
      }
    });

    wrap.appendChild(form);
    return wrap;
  }

  async function renderProfileKami() {
    const wrap = h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Profil Kami"),
        h("div", { class: "muted" }, "Mengatur sambutan kepala puskesmas, visi, dan misi"),
      ]),
      h("div", { class: "muted", id: "meta-profile" }, "Memuat..."),
    ]);

    const { data, error } = await sb.from("settings").select("value,updated_at").eq("key", "site").maybeSingle();
    if (error || !data?.value) {
      qs("#meta-profile", wrap).textContent = "Data settings belum ada. Jalankan seed.sql atau buat row key=site.";
      return wrap;
    }

    let value = data.value;
    if (!value.profile) value.profile = { name: "", location: "", address: "", phone: "", email: "", mapsEmbedUrl: "", vision: "", missions: [], welcomeTitle: "", welcomeText: "" };
    if (!value.headProfile) value.headProfile = { name: "", title: "Kepala Puskesmas", message: "", image_url: "", image_path: "" };
    if (!value.clusters || value.clusters.length !== 5) {
      value.clusters = [
        { id: "c1", title: "Klaster 1", name: "", role: "Manajemen", image_url: "", image_path: "" },
        { id: "c2", title: "Klaster 2", name: "", role: "Ibu & Anak", image_url: "", image_path: "" },
        { id: "c3", title: "Klaster 3", name: "", role: "Usia Dewasa & Lansia", image_url: "", image_path: "" },
        { id: "c4", title: "Klaster 4", name: "", role: "Penanggulan Penyakit Menular", image_url: "", image_path: "" },
        { id: "c5", title: "Lintas Klaster", name: "", role: "Pelayanan Penunjang", image_url: "", image_path: "" },
      ];
    }
    if (!Array.isArray(value.staffGroups) || value.staffGroups.length === 0) {
      value.staffGroups = [
        { id: "g-dokter", name: "Dokter", members: [] },
        { id: "g-perawat", name: "Perawat", members: [] },
        { id: "g-bidan", name: "Bidan", members: [] },
        { id: "g-promkes", name: "Promkes", members: [] },
        { id: "g-gizi", name: "Gizi", members: [] },
        { id: "g-apoteker", name: "Apoteker", members: [] },
        { id: "g-lab", name: "Laboratorium", members: [] },
        { id: "g-it", name: "IT", members: [] },
        { id: "g-keuangan", name: "Keuangan", members: [] },
        { id: "g-lainnya", name: "Lainnya", members: [] },
      ];
    }
    value.staffGroups = value.staffGroups
      .map((g) => ({
        id: g?.id || `g-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: String(g?.name || "").trim() || "Kelompok",
        members: Array.isArray(g?.members) ? g.members : [],
      }))
      .map((g) => ({
        ...g,
        members: g.members.map((m) => ({
          id: m?.id || `m-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: String(m?.name || ""),
          role: String(m?.role || ""),
          image_url: String(m?.image_url || ""),
          image_path: String(m?.image_path || ""),
        })),
      }));

    qs("#meta-profile", wrap).textContent = `Terakhir update: ${new Date(data.updated_at).toLocaleString("id-ID")}`;

    const sectionWelcome = h("div", { id: "profile-sub-welcome" }, [
      h("div", { class: "card", style: "margin-top:14px" }, [
        h("div", { class: "card-title" }, "Sambutan Kepala Puskesmas"),
        h("div", { class: "form-grid" }, [
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label" }, "Nama Lengkap & Gelar"),
            h("input", { class: "input", id: "pk-name", value: value.headProfile.name || "" }),
          ]),
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label" }, "Jabatan"),
            h("input", { class: "input", id: "pk-title", value: value.headProfile.title || "Kepala Puskesmas" }),
          ]),
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label" }, "Kata Sambutan"),
            h("textarea", { class: "textarea", id: "pk-message", style: "min-height:120px" }, value.headProfile.message || ""),
          ]),
          h("div", { class: "field", style: "grid-column: 1 / -1" }, [
            h("label", { class: "label" }, "Foto Kepala Puskesmas"),
            h("input", { class: "input", type: "file", accept: "image/*", id: "pk-file" }),
            h("div", { style: "display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px" }, [
              h("label", { class: "radio" }, [
                h("input", { type: "checkbox", id: "pk-remove" }),
                "Hapus foto",
              ]),
            ]),
            h("div", { id: "pk-preview-wrap", style: "margin-top:10px;display:none" }, [
              h("img", {
                id: "pk-preview",
                alt: "Preview foto kepala",
                style: "width:120px;height:160px;object-fit:cover;background:#f8fafc;border-radius:12px;border:1px solid rgba(226,232,240,.9);display:block",
              }),
            ]),
          ]),
        ]),
      ]),
      h("div", { class: "grid-2", style: "margin-top:14px" }, [
        h("div", { class: "card" }, [
          h("div", { class: "card-title" }, "Visi & Misi"),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "pk-vision" }, "Visi"),
            h("input", { class: "input", id: "pk-vision", value: value.profile.vision || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "pk-missions" }, "Misi (1 baris = 1 poin)"),
            h("textarea", { class: "textarea", id: "pk-missions" }, (value.profile.missions || []).join("\n")),
          ]),
        ]),
      ]),
      h("div", { class: "card", style: "margin-top:14px" }, [
        h("div", { class: "card-title" }, "Struktur Organisasi (Klaster)"),
        h("div", { class: "help" }, "Isi nama, jabatan, dan foto untuk masing-masing penanggung jawab klaster."),
        h(
          "div",
          { class: "grid-2", style: "margin-top:12px" },
          value.clusters.map((c, i) =>
            h("div", { class: "panel", "data-c-idx": i }, [
              h("div", { class: "card-title" }, c.title),
              h("div", { class: "form-grid" }, [
                h("div", { class: "field" }, [
                  h("label", { class: "label" }, "Nama Lengkap"),
                  h("input", { class: "input", "data-c-name": "1", value: c.name || "" }),
                ]),
                h("div", { class: "field" }, [
                  h("label", { class: "label" }, "Jabatan"),
                  h("input", { class: "input", "data-c-role": "1", value: c.role || "" }),
                ]),
                h("div", { class: "field", style: "grid-column: 1/-1" }, [
                  h("label", { class: "label" }, "Foto (opsional)"),
                  h("input", { class: "input", type: "file", accept: "image/*", "data-c-file": "1" }),
                  h("div", { style: "display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px" }, [
                    h("label", { class: "radio" }, [h("input", { type: "checkbox", "data-c-remove": "1" }), "Hapus foto"]),
                  ]),
                  h(
                    "div",
                    { "data-c-preview-wrap": "1", style: c.image_url ? "margin-top:10px;display:block" : "margin-top:10px;display:none" },
                    [h("img", { "data-c-preview": "1", src: c.image_url || "", style: "width:60px;height:60px;object-fit:cover;border-radius:50%;border:1px solid rgba(226,232,240,.9);display:block" })]
                  ),
                ]),
              ]),
            ])
          )
        ),
      ]),
    ]);

    const sectionStaff = h("div", { id: "profile-sub-staff", style: "display:none" }, [
      h("div", { class: "card", style: "margin-top:14px" }, [
        h("div", { class: "card-title" }, "Tim Medis & Karyawan"),
        h("div", { class: "help" }, "Tambahkan semua pegawai, staf, dan tim medis. Kelompokkan sesuai unit/bagian."),
        h("div", { id: "staff-groups", style: "display:grid;gap:12px;margin-top:12px" }, []),
      ]),
    ]);

    const form = h("form", { id: "form-profile" }, [
      h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:14px;margin-bottom:14px" }, [
        h("button", { class: "btn btn-primary", type: "submit", id: "btn-save-profile" }, "Simpan Perubahan Profil"),
      ]),
      h("div", { class: "admin-subtabs" }, [
        h("button", { class: "btn btn-ghost admin-subtab-btn", type: "button", id: "btn-prof-sub-1", "data-active": "true" }, [
          h("i", { class: "bi bi-person-badge", "aria-hidden": "true" }),
          "Sambutan Kepala Puskesmas",
        ]),
        h("button", { class: "btn btn-ghost admin-subtab-btn", type: "button", id: "btn-prof-sub-2", "data-active": "false" }, [
          h("i", { class: "bi bi-people", "aria-hidden": "true" }),
          "Tim Medis & Karyawan",
        ]),
      ]),
      sectionWelcome,
      sectionStaff,
    ]);

    const pkPreviewWrap = qs("#pk-preview-wrap", form);
    const pkPreview = qs("#pk-preview", form);
    const pkFile = qs("#pk-file", form);

    if (value.headProfile.image_url) {
      pkPreview.src = value.headProfile.image_url;
      pkPreviewWrap.style.display = "block";
    }

    pkFile.addEventListener("change", () => {
      const file = pkFile.files?.[0];
      if (!file) return;
      pkPreview.src = URL.createObjectURL(file);
      pkPreviewWrap.style.display = "block";
      qs("#pk-remove", form).checked = false;
    });

    const btnSub1 = qs("#btn-prof-sub-1", form);
    const btnSub2 = qs("#btn-prof-sub-2", form);
    const subWelcome = qs("#profile-sub-welcome", form);
    const subStaff = qs("#profile-sub-staff", form);

    function setSub(key) {
      const isWelcome = key === "welcome";
      btnSub1.setAttribute("data-active", isWelcome ? "true" : "false");
      btnSub2.setAttribute("data-active", isWelcome ? "false" : "true");
      subWelcome.style.display = isWelcome ? "block" : "none";
      subStaff.style.display = isWelcome ? "none" : "block";
    }

    btnSub1.addEventListener("click", () => setSub("welcome"));
    btnSub2.addEventListener("click", () => setSub("staff"));

    const clusterPanels = Array.from(form.querySelectorAll("[data-c-idx]"));
    clusterPanels.forEach(p => {
      const fileInput = p.querySelector("[data-c-file]");
      const removeCb = p.querySelector("[data-c-remove]");
      const previewWrap = p.querySelector("[data-c-preview-wrap]");
      const previewImg = p.querySelector("[data-c-preview]");
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        previewImg.src = URL.createObjectURL(file);
        previewWrap.style.display = "block";
        removeCb.checked = false;
      });
    });

    const staffGroupsWrap = qs("#staff-groups", form);

    function staffMemberRow(groupId, member) {
      const row = h("div", { class: "panel", "data-staff": "1", "data-gid": groupId, "data-mid": member.id }, [
        h("div", { class: "section-head" }, [
          h("div", { class: "pill" }, "Pegawai"),
          h("button", { class: "btn btn-danger", type: "button" }, "Hapus"),
        ]),
        h("div", { class: "form-grid" }, [
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Nama"),
            h("input", { class: "input", "data-m-name": "1", value: member.name || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Jabatan"),
            h("input", { class: "input", "data-m-role": "1", value: member.role || "" }),
          ]),
          h("div", { class: "field", style: "grid-column: 1/-1" }, [
            h("label", { class: "label" }, "Foto (opsional)"),
            h("input", { class: "input", type: "file", accept: "image/*", "data-m-file": "1" }),
            h("div", { style: "display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px" }, [
              h("label", { class: "radio" }, [
                h("input", { type: "checkbox", "data-m-remove": "1" }),
                "Hapus foto",
              ]),
            ]),
            h("div", { "data-m-preview-wrap": "1", style: member.image_url ? "margin-top:10px;display:block" : "margin-top:10px;display:none" }, [
              h("img", {
                "data-m-preview": "1",
                src: member.image_url || "",
                style: "width:76px;height:76px;object-fit:cover;border-radius:999px;border:1px solid rgba(226,232,240,.9);display:block;background:#f8fafc",
              }),
            ]),
          ]),
        ]),
        h("input", { type: "hidden", "data-m-url": "1", value: member.image_url || "" }),
        h("input", { type: "hidden", "data-m-path": "1", value: member.image_path || "" }),
      ]);

      row.querySelector(".btn-danger").addEventListener("click", () => row.remove());

      const fileInput = row.querySelector("[data-m-file]");
      const removeCb = row.querySelector("[data-m-remove]");
      const previewWrap = row.querySelector("[data-m-preview-wrap]");
      const previewImg = row.querySelector("[data-m-preview]");
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        previewImg.src = URL.createObjectURL(file);
        previewWrap.style.display = "block";
        removeCb.checked = false;
      });
      removeCb.addEventListener("change", () => {
        if (removeCb.checked) previewWrap.style.display = "none";
      });

      return row;
    }

    function renderStaffGroups() {
      staffGroupsWrap.innerHTML = "";
      const bar = h("div", { class: "admin-staff-groups-bar" }, [
        h("button", { class: "btn btn-ghost", type: "button", id: "btn-add-group" }, [
          h("i", { class: "bi bi-plus-lg", "aria-hidden": "true" }),
          "Tambah Kelompok",
        ]),
      ]);
      staffGroupsWrap.appendChild(bar);

      function updateMoveButtons() {
        const els = Array.from(staffGroupsWrap.querySelectorAll("[data-staff-group]"));
        for (let i = 0; i < els.length; i += 1) {
          const up = els[i].querySelector("[data-move-up]");
          const down = els[i].querySelector("[data-move-down]");
          if (up) up.disabled = i === 0;
          if (down) down.disabled = i === els.length - 1;
        }
      }

      function buildGroupEl(g) {
        const list = h("div", { "data-staff-list": "1", style: "display:grid;gap:12px;margin-top:12px" }, []);
        const empty = h("div", { class: "muted", "data-staff-empty": "1" }, "Belum ada pegawai. Klik Tambah Pegawai untuk menambahkan.");
        const members = Array.isArray(g.members) ? g.members : [];
        if (!members.length) list.appendChild(empty);
        else for (const m of members) list.appendChild(staffMemberRow(g.id, m));

        const groupEl = h("div", { class: "panel", "data-staff-group": "1", "data-gid": g.id }, [
          h("div", { class: "section-head" }, [
            h("div", { class: "pill" }, "Kelompok"),
            h("div", { class: "admin-staff-group-actions" }, [
              h("button", { class: "btn btn-ghost", type: "button", "data-move-up": "1" }, [
                h("i", { class: "bi bi-arrow-up", "aria-hidden": "true" }),
                "Naik",
              ]),
              h("button", { class: "btn btn-ghost", type: "button", "data-move-down": "1" }, [
                h("i", { class: "bi bi-arrow-down", "aria-hidden": "true" }),
                "Turun",
              ]),
              h("button", { class: "btn btn-ghost", type: "button", "data-add-member": "1" }, [
                h("i", { class: "bi bi-plus-lg", "aria-hidden": "true" }),
                "Tambah Pegawai",
              ]),
            ]),
          ]),
          h("div", { class: "form-grid" }, [
            h("div", { class: "field", style: "grid-column: 1/-1" }, [
              h("label", { class: "label" }, "Nama Kelompok"),
              h("input", { class: "input", "data-g-name": "1", value: g.name || "" }),
            ]),
          ]),
          list,
        ]);

        groupEl.querySelector("[data-add-member]").addEventListener("click", () => {
          const mid = `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const row = staffMemberRow(g.id, { id: mid, name: "", role: "", image_url: "", image_path: "" });
          const listEl = groupEl.querySelector("[data-staff-list]");
          const emptyEl = listEl.querySelector("[data-staff-empty]");
          if (emptyEl) emptyEl.remove();
          listEl.insertBefore(row, listEl.firstChild);
        });

        groupEl.querySelector("[data-move-up]").addEventListener("click", () => {
          const prev = groupEl.previousElementSibling;
          if (!prev || !prev.hasAttribute("data-staff-group")) return;
          staffGroupsWrap.insertBefore(groupEl, prev);
          updateMoveButtons();
        });
        groupEl.querySelector("[data-move-down]").addEventListener("click", () => {
          const next = groupEl.nextElementSibling;
          if (!next || !next.hasAttribute("data-staff-group")) return;
          staffGroupsWrap.insertBefore(next, groupEl);
          updateMoveButtons();
        });

        return groupEl;
      }

      const groups = Array.isArray(value.staffGroups) ? value.staffGroups : [];
      for (const g of groups) staffGroupsWrap.appendChild(buildGroupEl(g));

      qs("#btn-add-group", staffGroupsWrap).addEventListener("click", () => {
        const gid = `g-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const groupEl = buildGroupEl({ id: gid, name: "Kelompok Baru", members: [] });
        staffGroupsWrap.appendChild(groupEl);
        updateMoveButtons();
        groupEl.querySelector("[data-g-name]")?.focus();
      });

      updateMoveButtons();
    }

    renderStaffGroups();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      value.headProfile.name = String(qs("#pk-name", form).value || "").trim();
      value.headProfile.title = String(qs("#pk-title", form).value || "").trim();
      value.headProfile.message = String(qs("#pk-message", form).value || "").trim();
      const pkRemove = qs("#pk-remove", form).checked;
      const headFile = pkFile.files?.[0] || null;
      value.profile.vision = String(qs("#pk-vision", form).value || "").trim();
      value.profile.missions = String(qs("#pk-missions", form).value || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

      const clusterPanels = Array.from(form.querySelectorAll("[data-c-idx]"));
      const clusterFiles = [];
      const clusterRemoves = [];
      clusterPanels.forEach((p, i) => {
        value.clusters[i].name = String(p.querySelector("[data-c-name]")?.value || "").trim();
        value.clusters[i].role = String(p.querySelector("[data-c-role]")?.value || "").trim();
        clusterFiles[i] = p.querySelector("[data-c-file]")?.files?.[0] || null;
        clusterRemoves[i] = p.querySelector("[data-c-remove]")?.checked || false;
      });

      const staffGroupEls = Array.from(form.querySelectorAll("[data-staff-group]"));
      const nextStaffGroups = staffGroupEls.map((gel) => {
        const gid = String(gel.getAttribute("data-gid") || "");
        const gname = String(gel.querySelector("[data-g-name]")?.value || "").trim();
        const memberEls = Array.from(gel.querySelectorAll("[data-staff]"));
        const members = memberEls.map((mel) => ({
          id: String(mel.getAttribute("data-mid") || `m-${Date.now()}-${Math.random().toString(16).slice(2)}`),
          name: String(mel.querySelector("[data-m-name]")?.value || "").trim(),
          role: String(mel.querySelector("[data-m-role]")?.value || "").trim(),
          image_url: String(mel.querySelector("[data-m-url]")?.value || "").trim(),
          image_path: String(mel.querySelector("[data-m-path]")?.value || "").trim(),
          _file: mel.querySelector("[data-m-file]")?.files?.[0] || null,
          _remove: Boolean(mel.querySelector("[data-m-remove]")?.checked),
        }));
        return { id: gid, name: gname || "Kelompok", members };
      });

      const btn = qs("#btn-save-profile", form);
      btn.disabled = true;
      btn.textContent = "Menyimpan...";
      try {
        const bucketGallery = sb.storage.from("site-gallery");

        if (pkRemove && value.headProfile.image_path) {
          await bucketGallery.remove([value.headProfile.image_path]);
          value.headProfile.image_url = "";
          value.headProfile.image_path = "";
        }
        if (headFile) {
          const fileName = safeFileName(headFile.name);
          const path = `profile/${Date.now()}-${fileName}`;
          const { error: upErr } = await bucketGallery.upload(path, headFile, { upsert: true });
          if (upErr) throw upErr;
          const { data: pub } = bucketGallery.getPublicUrl(path);
          if (value.headProfile.image_path) {
            await bucketGallery.remove([value.headProfile.image_path]);
          }
          value.headProfile.image_url = pub?.publicUrl || "";
          value.headProfile.image_path = path;
        }

        for (let i = 0; i < 5; i++) {
          const c = value.clusters[i];
          if (clusterRemoves[i] && c.image_path) {
            await bucketGallery.remove([c.image_path]);
            c.image_url = "";
            c.image_path = "";
          }
          if (clusterFiles[i]) {
            const fileName = safeFileName(clusterFiles[i].name);
            const path = `clusters/${c.id}-${Date.now()}-${fileName}`;
            const { error: upErr } = await bucketGallery.upload(path, clusterFiles[i], { upsert: true });
            if (upErr) throw upErr;
            const { data: pub } = bucketGallery.getPublicUrl(path);
            if (c.image_path) {
              await bucketGallery.remove([c.image_path]);
            }
            c.image_url = pub?.publicUrl || "";
            c.image_path = path;
          }
        }

        for (const g of nextStaffGroups) {
          for (const m of g.members) {
            if (m._remove && m.image_path) {
              await bucketGallery.remove([m.image_path]);
              m.image_url = "";
              m.image_path = "";
            }
            if (m._file) {
              const fileName = safeFileName(m._file.name);
              const path = `staff/${g.id}/${m.id}/${Date.now()}-${fileName}`;
              const { error: upErr } = await bucketGallery.upload(path, m._file, { upsert: true });
              if (upErr) throw upErr;
              const { data: pub } = bucketGallery.getPublicUrl(path);
              if (m.image_path) {
                await bucketGallery.remove([m.image_path]);
              }
              m.image_url = pub?.publicUrl || "";
              m.image_path = path;
            }
          }
        }

        value.staffGroups = nextStaffGroups.map((g) => ({
          id: g.id,
          name: String(g.name || "").trim() || "Kelompok",
          members: g.members
            .map((m) => ({
              id: m.id,
              name: String(m.name || "").trim(),
              role: String(m.role || "").trim(),
              image_url: String(m.image_url || ""),
              image_path: String(m.image_path || ""),
            }))
            .filter((m) => m.name || m.role || m.image_url),
        }));
        value.team = value.staffGroups
          .flatMap((g) => g.members.map((m) => ({ name: m.name, role: m.role })))
          .filter((m) => m.name && m.role);

        const { error: upErr } = await sb.from("settings").upsert({ key: "site", value });
        if (upErr) throw upErr;
        toast({ title: "Tersimpan", message: "Profil berhasil diperbarui.", icon: "bi-check-circle" });
      } catch {
        toast({ title: "Gagal", message: "Tidak bisa menyimpan profil.", icon: "bi-exclamation-triangle" });
      } finally {
        btn.disabled = false;
        btn.textContent = "Simpan Perubahan Profil";
      }
    });

    wrap.appendChild(form);
    return wrap;
  }

  async function renderGalleryAdmin() {
    const wrap = h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Galeri"),
        h("div", { class: "muted" }, "Kelola dokumentasi kegiatan/pelayanan"),
      ]),
      h("div", { class: "muted", id: "meta-gallery" }, "Memuat..."),
    ]);

    const { data, error } = await sb.from("settings").select("value,updated_at").eq("key", "site").maybeSingle();
    if (error || !data?.value) {
      qs("#meta-gallery", wrap).textContent = "Data settings belum ada. Jalankan seed.sql atau buat row key=site.";
      return wrap;
    }

    let value = data.value;
    if (!Array.isArray(value.gallery)) value.gallery = [];
    value.gallery = value.gallery.map((g) => {
      const id = g.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const legacyUrl = g.image_url || g.src || "";
      const legacyPath = g.image_path || "";
      const imgs = Array.isArray(g.images) ? g.images : [];
      const images = imgs
        .map((x) => (typeof x === "string" ? { url: x, path: "" } : { url: x?.url || "", path: x?.path || "" }))
        .filter((x) => x.url);
      if (!images.length && legacyUrl) images.push({ url: legacyUrl, path: legacyPath });
      return {
        ...g,
        id,
        location: g.location || "",
        date: g.date || "",
        images,
      };
    });

    qs("#meta-gallery", wrap).textContent = `Terakhir update: ${new Date(data.updated_at).toLocaleString("id-ID")}`;

    const form = h("form", { id: "form-gallery" }, [
      h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:14px;margin-bottom:14px" }, [
        h("button", { class: "btn btn-primary", type: "submit", id: "btn-save-gallery" }, "Simpan Perubahan Galeri"),
      ]),
      h("div", { class: "card" }, [
        h("div", { class: "section-head" }, [
          h("div", { class: "card-title" }, "Dokumentasi"),
          h("button", { class: "btn btn-ghost", type: "button", id: "btn-gallery-add" }, [
            h("i", { class: "bi bi-plus-lg", "aria-hidden": "true" }),
            "Tambah",
          ]),
        ]),
        h("div", { class: "help" }, "Upload foto dokumentasi agar mudah diupdate tanpa ubah assets/repo."),
        h("div", { id: "gallery-list", style: "display:grid;gap:12px;margin-top:10px" }),
      ]),
    ]);

    const galleryList = qs("#gallery-list", form);

    function galleryRow(g, { open = false } = {}) {
      const imagesVal = Array.isArray(g.images) ? g.images : [];
      const existingUrls = imagesVal.map((x) => x?.url).filter(Boolean);
      const thumbUrl = existingUrls[0] || "";

      const titleView = h("div", { class: "admin-gallery-title" }, g.title || "Dokumentasi");
      const subView = h("div", { class: "admin-gallery-sub" }, g.subtitle || "");
      const metaView = h("div", { class: "admin-gallery-info" }, [
        g.date ? h("span", { class: "admin-gallery-chip" }, [h("i", { class: "bi bi-calendar3", "aria-hidden": "true" }), g.date]) : null,
        g.location
          ? h("span", { class: "admin-gallery-chip" }, [h("i", { class: "bi bi-geo-alt", "aria-hidden": "true" }), g.location])
          : null,
      ]);

      const thumb = thumbUrl
        ? h("img", {
            class: "admin-gallery-thumb",
            src: thumbUrl,
            alt: "Thumbnail dokumentasi",
            loading: "lazy",
          })
        : h("div", { class: "admin-gallery-thumb admin-gallery-thumb--empty" }, [
            h("i", { class: "bi bi-image", "aria-hidden": "true" }),
          ]);

      const btnEdit = h("button", { class: "btn btn-primary", type: "button", "data-g-edit": "1" }, "Edit");
      const btnDel = h("button", { class: "btn btn-danger", type: "button", "data-g-del": "1" }, "Hapus");

      const previewWrap = h("div", { class: "admin-gallery-previews", style: "display:none" }, [
        h("div", { "data-g-previews": "1", style: "display:grid;grid-template-columns:repeat(3,1fr);gap:10px" }),
      ]);

      const details = h("div", { class: "admin-gallery-details", style: "display:none" }, [
        h("div", { class: "form-grid" }, [
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Judul"),
            h("input", { class: "input", "data-g-title": "1", value: g.title || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Subjudul"),
            h("input", { class: "input", "data-g-sub": "1", value: g.subtitle || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Lokasi (Opsional)"),
            h("input", { class: "input", "data-g-location": "1", value: g.location || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label" }, "Tanggal (Opsional)"),
            h("input", { class: "input", type: "date", "data-g-date": "1", value: g.date || "" }),
          ]),
          h("div", { class: "field", style: "grid-column:1/-1" }, [
            h("label", { class: "label" }, "Foto (bisa lebih dari satu)"),
            h("input", { class: "input", type: "file", accept: "image/*", multiple: "true", "data-g-files": "1" }),
            h("div", { style: "display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px" }, [
              h("label", { class: "radio" }, [
                h("input", { type: "checkbox", "data-g-removeall": "1" }),
                "Hapus semua foto",
              ]),
            ]),
          ]),
        ]),
        h("input", { type: "hidden", "data-g-images": "1", value: JSON.stringify(g.images || []) }),
        previewWrap,
      ]);

      const row = h("div", { class: "panel admin-gallery-item", "data-gid": g.id, "data-open": open ? "true" : "false" }, [
        h("div", { class: "admin-gallery-summary" }, [
          thumb,
          h("div", { class: "admin-gallery-meta" }, [titleView, subView, metaView]),
          h("div", { class: "admin-gallery-actions" }, [btnEdit, btnDel]),
        ]),
        details,
      ]);

      function renderPreviews(urls) {
        const box = previewWrap.querySelector('[data-g-previews="1"]');
        box.innerHTML = "";
        if (!urls.length) {
          previewWrap.style.display = "none";
          return;
        }
        previewWrap.style.display = "block";
        for (const u of urls.slice(0, 9)) {
          box.appendChild(
            h("img", {
              alt: "Preview dokumentasi",
              src: u,
              loading: "lazy",
              style: "width:100%;height:90px;object-fit:cover;background:#f8fafc;border-radius:14px;border:1px solid rgba(226,232,240,.9);display:block",
            })
          );
        }
      }

      let previewsReady = false;
      function syncSummary() {
        const title = String(row.querySelector("[data-g-title]")?.value || "").trim();
        const sub = String(row.querySelector("[data-g-sub]")?.value || "").trim();
        const date = String(row.querySelector("[data-g-date]")?.value || "").trim();
        const loc = String(row.querySelector("[data-g-location]")?.value || "").trim();
        titleView.textContent = title || "Dokumentasi";
        subView.textContent = sub;
        metaView.innerHTML = "";
        if (date) metaView.appendChild(h("span", { class: "admin-gallery-chip" }, [h("i", { class: "bi bi-calendar3", "aria-hidden": "true" }), date]));
        if (loc) metaView.appendChild(h("span", { class: "admin-gallery-chip" }, [h("i", { class: "bi bi-geo-alt", "aria-hidden": "true" }), loc]));
      }

      function setOpen(next) {
        const on = Boolean(next);
        row.setAttribute("data-open", on ? "true" : "false");
        details.style.display = on ? "block" : "none";
        btnEdit.textContent = on ? "Tutup" : "Edit";
        if (on && !previewsReady) {
          renderPreviews(existingUrls);
          previewsReady = true;
        }
      }

      btnEdit.addEventListener("click", () => setOpen(row.getAttribute("data-open") !== "true"));
      btnDel.addEventListener("click", () => {
        const ok = confirm("Hapus item dokumentasi ini?");
        if (!ok) return;
        row.remove();
      });

      const fileInput = details.querySelector("[data-g-files]");
      fileInput.addEventListener("change", () => {
        const files = Array.from(fileInput.files || []);
        if (!files.length) return;
        const urls = files.map((f) => URL.createObjectURL(f));
        renderPreviews(urls);
        previewsReady = true;
        details.querySelector("[data-g-removeall]").checked = false;
        setOpen(true);
      });

      details.querySelector("[data-g-title]").addEventListener("input", syncSummary);
      details.querySelector("[data-g-sub]").addEventListener("input", syncSummary);
      details.querySelector("[data-g-date]").addEventListener("change", syncSummary);
      details.querySelector("[data-g-location]").addEventListener("input", syncSummary);

      setOpen(open);
      return row;
    }

    function renderGallery() {
      galleryList.innerHTML = "";
      for (const g of value.gallery) galleryList.appendChild(galleryRow(g));
      if (value.gallery.length === 0) {
        galleryList.appendChild(
          h("div", { class: "muted" }, "Belum ada dokumentasi. Klik Tambah untuk membuat item baru.")
        );
      }
    }

    qs("#btn-gallery-add", form).addEventListener("click", () => {
      const g = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, title: "", subtitle: "", image_url: "", image_path: "" };
      value.gallery.unshift(g);
      galleryList.innerHTML = "";
      galleryList.appendChild(galleryRow(g, { open: true }));
      for (const it of value.gallery.slice(1)) galleryList.appendChild(galleryRow(it));
    });

    renderGallery();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const galleryRows = Array.from(form.querySelectorAll("[data-gid]"));
      const nextGallery = [];
      for (const row of galleryRows) {
        const gid = row.getAttribute("data-gid");
        const title = String(row.querySelector("[data-g-title]").value || "").trim();
        const subtitle = String(row.querySelector("[data-g-sub]").value || "").trim();
        const location = String(row.querySelector("[data-g-location]")?.value || "").trim();
        const date = String(row.querySelector("[data-g-date]")?.value || "").trim();
        const removeAll = Boolean(row.querySelector("[data-g-removeall]")?.checked);
        const files = Array.from(row.querySelector("[data-g-files]")?.files || []);
        let images = [];
        try {
          const v = JSON.parse(String(row.querySelector("[data-g-images]")?.value || "[]"));
          if (Array.isArray(v)) {
            images = v
              .map((x) => (typeof x === "string" ? { url: x, path: "" } : { url: x?.url || "", path: x?.path || "" }))
              .filter((x) => x.url);
          }
        } catch {}
        nextGallery.push({ id: gid, title, subtitle, location, date, images, _removeAll: removeAll, _files: files });
      }

      const btn = qs("#btn-save-gallery", form);
      btn.disabled = true;
      btn.textContent = "Menyimpan...";
      try {
        const bucketGallery = sb.storage.from("site-gallery");

        for (const g of nextGallery) {
          const oldPaths = (Array.isArray(g.images) ? g.images : []).map((x) => x?.path).filter(Boolean);
          const needReplace = g._files.length > 0;
          if ((g._removeAll || needReplace) && oldPaths.length) {
            await bucketGallery.remove(oldPaths);
            g.images = [];
          }
          if (needReplace) {
            const uploaded = [];
            for (let i = 0; i < g._files.length; i += 1) {
              const f = g._files[i];
              const fileName = safeFileName(f.name);
              const path = `gallery/${g.id}/${Date.now()}-${i + 1}-${fileName}`;
              const { error: upErr } = await bucketGallery.upload(path, f, { upsert: true });
              if (upErr) throw upErr;
              const { data: pub } = bucketGallery.getPublicUrl(path);
              uploaded.push({ url: pub?.publicUrl || "", path });
            }
            g.images = uploaded.filter((x) => x.url);
          }
        }

        value.gallery = nextGallery
          .map((g) => ({
            id: g.id,
            title: g.title,
            subtitle: g.subtitle,
            location: g.location || "",
            date: g.date || "",
            images: (Array.isArray(g.images) ? g.images : []).map((x) => ({ url: x.url || "", path: x.path || "" })).filter((x) => x.url),
          }))
          .filter((g) => g.title || g.subtitle || g.location || g.date || (g.images && g.images.length));

        const { error: upErr } = await sb.from("settings").upsert({ key: "site", value });
        if (upErr) throw upErr;
        toast({ title: "Tersimpan", message: "Galeri berhasil diperbarui.", icon: "bi-check-circle" });
      } catch {
        toast({ title: "Gagal", message: "Tidak bisa menyimpan galeri.", icon: "bi-exclamation-triangle" });
      } finally {
        btn.disabled = false;
        btn.textContent = "Simpan Perubahan Galeri";
      }
    });

    wrap.appendChild(form);
    return wrap;
  }

  async function renderSettings() {
    const wrap = h("div", { class: "panel" }, [
      h("div", { class: "section-head" }, [
        h("h2", { class: "section-title" }, "Jam Pelayanan"),
        h("div", { class: "muted" }, "Mengatur jam dan jadwal poli"),
      ]),
      h("div", { class: "muted", id: "meta-settings" }, "Memuat..."),
    ]);

    const { data, error } = await sb.from("settings").select("value,updated_at").eq("key", "site").maybeSingle();
    if (error || !data?.value) {
      qs("#meta-settings", wrap).textContent = "Data settings belum ada. Jalankan seed.sql atau buat row key=site.";
      return wrap;
    }

    let value = data.value;
    if (!value.profile) value.profile = { name: "", location: "", address: "", phone: "", email: "", mapsEmbedUrl: "", vision: "", missions: [], welcomeTitle: "", welcomeText: "" };
    if (!value.emergency) value.emergency = { callCenter: "", waSms: "", email: "" };
    if (!value.complaintHours) value.complaintHours = "Senin–Jumat 08.00–13.00";
    value.polies = (value.polies || []).filter((p) => !["lansia", "imunisasi"].includes(String(p?.key || "").toLowerCase()));

    qs("#meta-settings", wrap).textContent = `Terakhir update: ${new Date(data.updated_at).toLocaleString("id-ID")}`;

    const form = h("form", { id: "form-settings" }, [
      h("div", { class: "grid-2" }, [
        h("div", { class: "card" }, [
          h("div", { class: "card-title" }, "Profil Singkat"),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-phone" }, "Telepon"),
            h("input", { class: "input", id: "s-phone", value: value.profile.phone || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-email" }, "Email"),
            h("input", { class: "input", id: "s-email", value: value.profile.email || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-address" }, "Alamat"),
            h("textarea", { class: "textarea", id: "s-address" }, value.profile.address || ""),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-maps" }, "Google Maps Embed URL"),
            h("textarea", { class: "textarea", id: "s-maps" }, value.profile.mapsEmbedUrl || ""),
          ]),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-title" }, "Kontak Darurat & Pengaduan"),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-em-call" }, "Call Center"),
            h("input", { class: "input", id: "s-em-call", value: value.emergency.callCenter || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-em-wa" }, "WA/SMS"),
            h("input", { class: "input", id: "s-em-wa", value: value.emergency.waSms || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-em-email" }, "Email Darurat"),
            h("input", { class: "input", id: "s-em-email", value: value.emergency.email || "" }),
          ]),
          h("div", { class: "field" }, [
            h("label", { class: "label", for: "s-complaint-hours" }, "Jam layanan pengaduan"),
            h("input", { class: "input", id: "s-complaint-hours", value: value.complaintHours || "" }),
            h("div", { class: "help" }, "Contoh: Senin–Jumat 08.00–13.00"),
          ]),
        ]),
      ]),
      h("div", { class: "card", style: "margin-top:14px" }, [
        h("div", { class: "card-title" }, "Jam Pelayanan"),
        h(
          "div",
          { class: "grid-2", id: "hours-grid" },
          (value.hours || []).map((row, idx) =>
            h("div", { class: "field" }, [
              h("label", { class: "label" }, row.day),
              h("input", { class: "input", "data-hours-idx": String(idx), value: row.time || "" }),
            ])
          )
        ),
      ]),
      h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:14px" }, [
        h("button", { class: "btn btn-primary", type: "submit", id: "btn-save-settings" }, "Simpan Perubahan"),
      ]),
    ]);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      value.profile.phone = String(qs("#s-phone", form).value || "").trim();
      value.profile.email = String(qs("#s-email", form).value || "").trim();
      value.profile.address = String(qs("#s-address", form).value || "").trim();
      value.profile.mapsEmbedUrl = String(qs("#s-maps", form).value || "").trim();

      value.emergency.callCenter = String(qs("#s-em-call", form).value || "").trim();
      value.emergency.waSms = String(qs("#s-em-wa", form).value || "").trim();
      value.emergency.email = String(qs("#s-em-email", form).value || "").trim();
      value.complaintHours = String(qs("#s-complaint-hours", form).value || "").trim();

      const hourInputs = Array.from(form.querySelectorAll("[data-hours-idx]"));
      for (const inp of hourInputs) {
        const idx = Number(inp.getAttribute("data-hours-idx"));
        if (!Number.isFinite(idx)) continue;
        value.hours[idx].time = String(inp.value || "").trim();
      }

      const btn = qs("#btn-save-settings", form);
      btn.disabled = true;
      btn.textContent = "Menyimpan...";
      try {
        const { error: upErr } = await sb.from("settings").upsert({ key: "site", value });
        if (upErr) throw upErr;
        toast({ title: "Tersimpan", message: "Konten berhasil diperbarui.", icon: "bi-check-circle" });
      } catch {
        toast({ title: "Gagal", message: "Tidak bisa menyimpan konten.", icon: "bi-exclamation-triangle" });
      } finally {
        btn.disabled = false;
        btn.textContent = "Simpan Perubahan";
      }
    });

    wrap.appendChild(form);
    return wrap;
  }

  async function renderActive() {
    content.innerHTML = "";
    if (activeTab === "announcements") content.appendChild(await renderAnnouncements());
    else if (activeTab === "feedbacks") content.appendChild(await renderFeedbacks());
    else if (activeTab === "dailyServices") content.appendChild(await renderDailyServices());
    else if (activeTab === "hero") content.appendChild(await renderHeroSlider());
    else if (activeTab === "gallery") content.appendChild(await renderGalleryAdmin());
    else if (activeTab === "profile") content.appendChild(await renderProfileKami());
    else if (activeTab === "settings") content.appendChild(await renderSettings());
  }

  function rebuildTabs() {
    tabBar.innerHTML = "";
    tabBar.appendChild(tabButton("Pengumuman", "announcements", activeTab, async () => {
      activeTab = "announcements";
      rebuildTabs();
      await renderActive();
    }, { icon: "bi-megaphone", tone: "orange" }));
    tabBar.appendChild(tabButton("Kritik & Saran", "feedbacks", activeTab, async () => {
      activeTab = "feedbacks";
      rebuildTabs();
      await renderActive();
    }, { icon: "bi-chat-left-text", tone: "teal" }));
    tabBar.appendChild(tabButton("Layanan Hari Ini", "dailyServices", activeTab, async () => {
      activeTab = "dailyServices";
      rebuildTabs();
      await renderActive();
    }, { icon: "bi-calendar2-check", tone: "emerald" }));
    tabBar.appendChild(tabButton("Banner Slider", "hero", activeTab, async () => {
      activeTab = "hero";
      rebuildTabs();
      await renderActive();
    }, { icon: "bi-images", tone: "indigo" }));
    tabBar.appendChild(tabButton("Galeri", "gallery", activeTab, async () => {
      activeTab = "gallery";
      rebuildTabs();
      await renderActive();
    }, { icon: "bi-image", tone: "blue" }));
    tabBar.appendChild(tabButton("Profil Kami", "profile", activeTab, async () => {
      activeTab = "profile";
      rebuildTabs();
      await renderActive();
    }, { icon: "bi-people", tone: "violet" }));
    tabBar.appendChild(tabButton("Jam Pelayanan", "settings", activeTab, async () => {
      activeTab = "settings";
      rebuildTabs();
      await renderActive();
    }, { icon: "bi-clock-history", tone: "slate" }));
  }

  const root = h("div", {}, [header, tabBar, content]);
  rebuildTabs();
  await renderActive();
  return root;
}
