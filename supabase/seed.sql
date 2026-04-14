insert into public.settings (key, value)
values (
  'site',
  '{
    "profile": {
      "name": "Puskesmas Muara Badak",
      "location": "Muara Badak, Kabupaten Kutai Kartanegara, Kalimantan Timur",
      "welcomeTitle": "Sambutan Kepala Puskesmas",
      "welcomeText": "Selamat datang di website resmi Puskesmas Muara Badak. Kami berkomitmen memberikan pelayanan kesehatan yang profesional, ramah, dan responsif demi terwujudnya masyarakat Muara Badak yang mandiri dan sehat.",
      "vision": "Terwujudnya masyarakat Muara Badak yang mandiri dan sehat",
      "missions": [
        "Meningkatkan mutu pelayanan kesehatan yang aman dan bermutu",
        "Meningkatkan upaya promotif dan preventif berbasis masyarakat",
        "Meningkatkan cakupan layanan kesehatan ibu, anak, dan lansia",
        "Menguatkan tata kelola puskesmas yang transparan dan akuntabel"
      ],
      "address": "Muara Badak, Kabupaten Kutai Kartanegara, Kalimantan Timur",
      "phone": "(0541) 123456",
      "email": "puskesmas.muarabadak@kukar.go.id",
      "mapsEmbedUrl": "https://www.google.com/maps?q=Muara%20Badak%20Kutai%20Kartanegara&output=embed"
    },
    "hours": [
      { "day": "Senin–Kamis", "time": "08.00 - 14.00 WITA" },
      { "day": "Jumat", "time": "08.00 - 11.00 WITA, 14.00 - 16.00 WITA" },
      { "day": "Sabtu", "time": "08.00 - 12.00 WITA" },
      { "day": "Minggu & Hari Libur", "time": "Tutup" }
    ],
    "polies": [
      { "key": "umum", "name": "Poli Umum", "schedule": "" },
      { "key": "kia", "name": "Poli KIA (Kesehatan Ibu dan Anak)", "schedule": "" },
      { "key": "gigi", "name": "Poli Gigi", "schedule": "" },
      { "key": "lansia", "name": "Poli Lansia", "schedule": "" },
      { "key": "tb", "name": "Poli TB/DOTS", "schedule": "" },
      { "key": "imunisasi", "name": "Imunisasi", "schedule": "" },
      { "key": "gizi", "name": "Gizi", "schedule": "" },
      { "key": "lab", "name": "Laboratorium", "schedule": "" }
    ],
    "complaintHours": "Senin–Jumat 08.00–13.00",
    "emergency": {
      "callCenter": "(0541) 123456",
      "waSms": "0812-3456-7890",
      "email": "puskesmas.muarabadak@kukar.go.id"
    },
    "fees": {
      "freeText": "Pelayanan tertentu dapat ditanggung oleh JKN/BPJS sesuai ketentuan. Silakan konfirmasi ke loket untuk validasi kepesertaan dan rujukan bila diperlukan.",
      "paidText": "Beberapa layanan penunjang (mis. pemeriksaan laboratorium tertentu) dapat dikenakan biaya sesuai peraturan daerah dan ketentuan yang berlaku."
    },
    "team": [
      { "name": "Dr. (Nama)", "role": "Kepala Puskesmas" },
      { "name": "(Nama)", "role": "Bidan" },
      { "name": "(Nama)", "role": "Perawat" },
      { "name": "(Nama)", "role": "Dokter Gigi" },
      { "name": "(Nama)", "role": "Analis Lab" },
      { "name": "(Nama)", "role": "Ahli Gizi" }
    ],
    "hero_slider": [
      {
        "id": "s1",
        "title": "Selamat Datang di Puskesmas Muara Badak",
        "subtitle": "Pelayanan Kesehatan Prima untuk Masyarakat.",
        "image_url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1600",
        "image_path": ""
      },
      {
        "id": "s2",
        "title": "Fasilitas dan Pelayanan Terbaik",
        "subtitle": "Informasi layanan, jadwal, dan edukasi kesehatan dalam satu tempat.",
        "image_url": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=1600",
        "image_path": ""
      },
      {
        "id": "s3",
        "title": "Tim Medis Profesional",
        "subtitle": "Pelayanan ramah, cepat, dan berorientasi pada keselamatan serta kenyamanan pasien.",
        "image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1600",
        "image_path": ""
      }
    ]
  }'::jsonb
)
on conflict (key) do update
set value = excluded.value;

insert into public.daily_services (date, doctors, note)
values (
  current_date,
  '[
    {"name":"Dr. (Nama)","poli":"Poli Umum","time":"08.00–12.00"},
    {"name":"(Nama)","poli":"Poli KIA/KB","time":"08.00–11.00"}
  ]'::jsonb,
  null
)
on conflict (date) do update
set doctors = excluded.doctors,
    note = excluded.note;

insert into public.announcements (title, category, date, excerpt, content, is_published)
values
  (
    'Jadwal Imunisasi Bulan Ini',
    'Program kesehatan',
    current_date,
    'Informasi jadwal imunisasi rutin dan layanan posyandu untuk wilayah Muara Badak.',
    'Imunisasi rutin tersedia pada jam pelayanan. Untuk kegiatan posyandu, silakan pantau pengumuman kelurahan/desa setempat atau hubungi puskesmas.',
    true
  ),
  (
    'Informasi Libur Nasional',
    'Libur',
    current_date,
    'Pelayanan tutup pada hari libur nasional dan tetap melayani sesuai ketentuan darurat.',
    'Pelayanan rutin tutup pada hari libur nasional. Untuk keadaan darurat, silakan menghubungi kontak yang tersedia atau fasilitas terdekat.',
    true
  );
