import { h, qs } from "../lib/dom.js";
import { toast } from "../lib/toast.js";
import { getSupabase } from "../lib/supabaseClient.js";
import { ADMIN_LOGIN } from "../supabase.config.js";

export async function renderAdminLogin() {
  const sb = await getSupabase();

  const root = h("div", {}, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Login Admin"),
      h("a", { class: "btn btn-ghost", href: "/" }, "Beranda"),
    ]),
  ]);

  if (!sb) {
    root.appendChild(
      h("div", { class: "panel" }, [
        h("div", { class: "card-title" }, "Supabase belum dikonfigurasi"),
        h("div", { class: "card-text" }, "Isi SUPABASE_URL dan SUPABASE_ANON_KEY pada file supabase.config.js."),
      ])
    );
    return root;
  }

  const form = h("form", { class: "panel", id: "admin-login-form" }, [
    h("div", { class: "form-grid" }, [
      h("div", { class: "field" }, [
        h("label", { class: "label", for: "username" }, "Username"),
        h("input", { class: "input", id: "username", name: "username", autocomplete: "username" }),
      ]),
      h("div", { class: "field" }, [
        h("label", { class: "label", for: "password" }, "Password"),
        h("input", { class: "input", id: "password", name: "password", type: "password", autocomplete: "current-password" }),
      ]),
    ]),
    h("div", { style: "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap" }, [
      h("button", { class: "btn btn-primary", type: "submit", id: "btn-login" }, [
        h("i", { class: "bi bi-box-arrow-in-right", "aria-hidden": "true" }),
        "Login",
      ]),
    ]),
  ]);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const username = String(fd.get("username") || "").trim();
    const password = String(fd.get("password") || "").trim();

    if (username !== ADMIN_LOGIN.username) {
      toast({ title: "Login gagal", message: "Username tidak dikenali.", icon: "bi-exclamation-triangle" });
      return;
    }

    const btn = qs("#btn-login", form);
    btn.disabled = true;
    btn.textContent = "Memproses...";
    try {
      const { error } = await sb.auth.signInWithPassword({ email: ADMIN_LOGIN.email, password });
      if (error) throw error;
      if (typeof window.__spaNavigate === "function") window.__spaNavigate("/admin");
      else location.assign("/admin");
    } catch {
      toast({ title: "Login gagal", message: "Username atau password salah.", icon: "bi-exclamation-triangle" });
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-box-arrow-in-right" aria-hidden="true"></i>Login`;
    }
  });

  root.appendChild(
    h("div", { class: "panel" }, [
      h("div", { class: "card-title" }, "Catatan"),
      h("div", { class: "card-text" }, `Login menggunakan email internal: ${ADMIN_LOGIN.email}.`),
    ])
  );
  root.appendChild(form);
  return root;
}
