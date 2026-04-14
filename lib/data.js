function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

import { getSupabase } from "./supabaseClient.js";

const defaultSettings = {
  profile: {
    name: "Puskesmas Muara Badak",
    location: "Muara Badak, Kabupaten Kutai Kartanegara, Kalimantan Timur",
    welcomeTitle: "Sambutan Kepala Puskesmas",
    welcomeText:
      "Selamat datang di website resmi Puskesmas Muara Badak. Kami berkomitmen memberikan pelayanan kesehatan yang profesional, ramah, dan responsif demi terwujudnya masyarakat Muara Badak yang mandiri dan sehat.",
    vision: "Terwujudnya masyarakat Muara Badak yang mandiri dan sehat",
    missions: [
      "Meningkatkan mutu pelayanan kesehatan yang aman dan bermutu",
      "Meningkatkan upaya promotif dan preventif berbasis masyarakat",
      "Meningkatkan cakupan layanan kesehatan ibu, anak, dan lansia",
      "Menguatkan tata kelola puskesmas yang transparan dan akuntabel",
    ],
    address: "Jl. Contoh No. 1, Muara Badak, Kutai Kartanegara, Kalimantan Timur",
    phone: "(0541) 123456",
    email: "puskesmas.muarabadak@kukar.go.id",
    mapsEmbedUrl:
      "https://www.google.com/maps?q=Muara%20Badak%20Kutai%20Kartanegara&output=embed",
  },
  hours: [
    { day: "Senin–Kamis", time: "08.00 - 14.00 WITA" },
    { day: "Jumat", time: "08.00 - 11.00 WITA, 14.00 - 16.00 WITA" },
    { day: "Sabtu", time: "08.00 - 12.00 WITA" },
    { day: "Minggu & Hari Libur", time: "Tutup" },
  ],
  polies: [
    { key: "umum", name: "Poli Umum", schedule: "" },
    { key: "kia", name: "Poli KIA (Kesehatan Ibu dan Anak)", schedule: "" },
    { key: "gigi", name: "Poli Gigi", schedule: "" },
    { key: "tb", name: "Poli TB/DOTS", schedule: "" },
    { key: "gizi", name: "Gizi", schedule: "" },
    { key: "lab", name: "Laboratorium", schedule: "" },
  ],
  complaintHours: "Senin–Jumat 08.00–13.00",
  emergency: {
    callCenter: "(0541) 123456",
    waSms: "0812-3456-7890",
    email: "puskesmas.muarabadak@kukar.go.id",
  },
  fees: {
    freeText:
      "Pelayanan tertentu dapat ditanggung oleh JKN/BPJS sesuai ketentuan. Silakan konfirmasi ke loket untuk validasi kepesertaan dan rujukan bila diperlukan.",
    paidText:
      "Beberapa layanan penunjang (mis. pemeriksaan laboratorium tertentu) dapat dikenakan biaya sesuai peraturan daerah dan ketentuan yang berlaku.",
  },
  team: [
    { name: "Dr. (Nama)", role: "Kepala Puskesmas" },
    { name: "(Nama)", role: "Bidan" },
    { name: "(Nama)", role: "Perawat" },
    { name: "(Nama)", role: "Dokter Gigi" },
    { name: "(Nama)", role: "Analis Lab" },
    { name: "(Nama)", role: "Ahli Gizi" },
  ],
  staffGroups: [
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
  ],
  gallery: [],
};

const defaultAnnouncements = [
  {
    id: "a1",
    title: "Jadwal Imunisasi Bulan Ini",
    category: "Program kesehatan",
    date: "2026-03-01",
    excerpt: "Informasi jadwal imunisasi rutin dan layanan posyandu untuk wilayah Muara Badak.",
    content:
      "Imunisasi rutin tersedia pada jam pelayanan. Untuk kegiatan posyandu, silakan pantau pengumuman kelurahan/desa setempat atau hubungi puskesmas.",
  },
  {
    id: "a2",
    title: "Informasi Libur Nasional",
    category: "Libur",
    date: "2026-03-20",
    excerpt: "Pelayanan tutup pada hari libur nasional dan tetap melayani sesuai ketentuan darurat.",
    content:
      "Pelayanan rutin tutup pada hari libur nasional. Untuk keadaan darurat, silakan menghubungi kontak yang tersedia atau fasilitas terdekat.",
  },
  {
    id: "a3",
    title: "Jadwal Poli Gigi (Sementara)",
    category: "Jadwal khusus",
    date: "2026-03-22",
    excerpt: "Penyesuaian jadwal Poli Gigi karena kegiatan internal.",
    content:
      "Poli Gigi dapat mengalami penyesuaian jadwal. Silakan konfirmasi melalui loket atau WA puskesmas sebelum datang.",
  },
];

const mem = {
  settings: structuredClone(defaultSettings),
  announcements: structuredClone(defaultAnnouncements),
  dailyServices: {
    date: todayISO(),
    doctors: [
      { name: "Dr. (Nama)", poli: "Poli Umum", time: "08.00–12.00" },
      { name: "(Nama)", poli: "Poli KIA/KB", time: "08.00–11.00" },
    ],
    note: "",
    updatedAt: new Date().toISOString(),
  },
};

export async function getSettings() {
  const sb = await getSupabase();
  if (!sb) return structuredClone(mem.settings);

  const { data, error } = await sb.from("settings").select("value").eq("key", "site").maybeSingle();
  if (error) return structuredClone(mem.settings);
  if (!data?.value) return structuredClone(mem.settings);
  return data.value;
}

export async function listAnnouncements({ q = "", category = "" } = {}) {
  const sb = await getSupabase();
  const query = q.trim().toLowerCase();
  if (!sb) {
    const items = mem.announcements
      .filter((a) => (category ? a.category === category : true))
      .filter((a) => {
        if (!query) return true;
        return (
          a.title.toLowerCase().includes(query) ||
          a.excerpt.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return structuredClone(items);
  }

  let qy = sb
    .from("announcements")
    .select("id,title,category,date,excerpt,content,is_published,image_url")
    .eq("is_published", true)
    .order("date", { ascending: false });

  if (category) qy = qy.eq("category", category);
  if (query) qy = qy.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`);

  const { data, error } = await qy;
  if (error) return [];
  return data.map((x) => ({
    id: x.id,
    title: x.title,
    category: x.category,
    date: x.date,
    excerpt: x.excerpt,
    content: x.content,
    image_url: x.image_url || "",
  }));
}

export async function listLatestAnnouncements(limit = 3) {
  const sb = await getSupabase();
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(0, Math.min(10, Number(limit))) : 3;
  if (!sb) {
    return structuredClone(mem.announcements)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, safeLimit);
  }

  const { data, error } = await sb
    .from("announcements")
    .select("id,title,category,date,excerpt,content,is_published,image_url")
    .eq("is_published", true)
    .order("date", { ascending: false })
    .limit(safeLimit);
  if (error) return [];
  return data.map((x) => ({
    id: x.id,
    title: x.title,
    category: x.category,
    date: x.date,
    excerpt: x.excerpt,
    content: x.content,
    image_url: x.image_url || "",
  }));
}

export async function getAnnouncement(id) {
  const sb = await getSupabase();
  if (!sb) {
    const found = mem.announcements.find((a) => a.id === id);
    return found ? structuredClone(found) : null;
  }

  const { data, error } = await sb
    .from("announcements")
    .select("id,title,category,date,excerpt,content,is_published,image_url")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    category: data.category,
    date: data.date,
    excerpt: data.excerpt,
    content: data.content,
    image_url: data.image_url || "",
  };
}

export async function getDailyServicesToday() {
  const sb = await getSupabase();
  const date = todayISO();
  if (!sb) {
    if (mem.dailyServices.date !== date) {
      mem.dailyServices = { date, doctors: [], note: "", updatedAt: new Date().toISOString() };
    }
    return structuredClone(mem.dailyServices);
  }

  const { data, error } = await sb.from("daily_services").select("date,doctors,note,updated_at").eq("date", date).maybeSingle();
  if (error || !data) return { date, doctors: [], note: "", updatedAt: new Date().toISOString() };
  return {
    date: data.date,
    doctors: Array.isArray(data.doctors) ? data.doctors : [],
    note: data.note || "",
    updatedAt: data.updated_at || new Date().toISOString(),
  };
}

export async function submitFeedback(payload) {
  const sb = await getSupabase();
  if (!sb) return { ok: true };
  const { error } = await sb.from("feedbacks").insert({
    name: payload.name || "Anonim",
    phone: payload.phone || null,
    category: payload.category,
    message: payload.message,
    rating: payload.rating || null,
  });
  if (error) throw error;
  return { ok: true };
}

function safeRandomId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getExtFromFile(file) {
  const n = String(file?.name || "");
  const i = n.lastIndexOf(".");
  const ext = i >= 0 ? n.slice(i + 1) : "";
  const safe = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return safe || "jpg";
}

export async function uploadFeedbackPhotos(files, { bucket = "feedback-attachments" } = {}) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Supabase belum tersedia.");
  const list = Array.isArray(files) ? files : [];
  if (!list.length) return [];

  const bucketRef = sb.storage.from(bucket);
  const urls = [];
  for (const f of list.slice(0, 3)) {
    const id = safeRandomId();
    const ext = getExtFromFile(f);
    const path = `feedback/${todayISO()}/${id}.${ext}`;
    const { error } = await bucketRef.upload(path, f, {
      cacheControl: "3600",
      upsert: false,
      contentType: f.type || undefined,
    });
    if (error) throw error;
    const { data } = bucketRef.getPublicUrl(path);
    const url = data?.publicUrl || "";
    if (url) urls.push(url);
  }
  return urls;
}

export async function submitContact(payload) {
  const sb = await getSupabase();
  if (!sb) return { ok: true };
  const { error } = await sb.from("contact_messages").insert({
    name: payload.name,
    email: payload.email,
    phone: payload.phone || null,
    subject: payload.subject,
    message: payload.message,
  });
  if (error) throw error;
  return { ok: true };
}

export async function subscribeDailyServicesToday(onChange) {
  const sb = await getSupabase();
  if (!sb) return () => {};
  const date = todayISO();
  const channel = sb
    .channel(`daily_services:${date}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "daily_services", filter: `date=eq.${date}` },
      (payload) => onChange(payload)
    )
    .subscribe();
  return () => {
    sb.removeChannel(channel);
  };
}
