import { h } from "../lib/dom.js";

export async function renderAlur({ settings }) {
  const steps = [
    {
      title: "Mengambil Nomor Antrean",
      desc: "Pasien datang dan mengambil nomor antrean di mesin/petugas yang tersedia di depan pintu masuk, bagi pasien bpjs bisa menggunakan mobile jkn.",
      img: "/assets/alur/01-antrean.png",
      alt: "Alur 1: Mengambil Nomor Antrean",
    },
    {
      title: "Loket Pendaftaran",
      desc: "Menunggu panggilan loket, menyerahkan dokumen persyaratan (KTP/KK/BPJS/Buku KIA), menunggu arahan ke ruang pemeriksaan.",
      img: "/assets/alur/02-loket.png",
      alt: "Alur 2: Loket Pendaftaran",
    },
    {
      title: "Ruang Pemeriksaan (Poli)",
      desc: "Pasien menuju poli tujuan (Umum/Gigi/KIA/dll) dan menunggu panggilan pemeriksaan oleh dokter/bidan/perawat.",
      img: "/assets/alur/03-poli.png",
      alt: "Alur 3: Ruang Pemeriksaan (Poli)",
    },
    {
      title: "Laboratorium / Tindakan (Jika Perlu)",
      desc: "Jika dokter merekomendasikan, pasien akan diarahkan ke laboratorium untuk cek darah/urin atau ke ruang tindakan.",
      img: "/assets/alur/04-lab.png",
      alt: "Alur 4: Laboratorium atau Tindakan",
    },
    {
      title: "Kasir (Bagi Pasien Umum)",
      desc: "Bagi pasien non-BPJS atau di luar wilayah FKTP, melakukan pembayaran retribusi di kasir.",
      img: "/assets/alur/05-kasir.png",
      alt: "Alur 5: Kasir",
    },
    {
      title: "Ruang Farmasi (Apotek)",
      desc: "Menyerahkan resep dokter, menunggu obat diracik/disiapkan, dan menerima edukasi cara minum obat. Pasien pulang.",
      img: "/assets/alur/06-apotek.png",
      alt: "Alur 6: Ruang Farmasi (Apotek)",
    },
  ];

  return h("div", {}, [
    h("div", { class: "section-head" }, [
      h("h1", { class: "section-title" }, "Panduan & Persyaratan Berobat"),
      h("div", { class: "muted" }, "Informasi lengkap mengenai alur dan syarat pelayanan di Puskesmas"),
    ]),

    h("section", { class: "section", style: "margin-top: 40px" }, [
      h("h2", { class: "section-title" }, "Alur Pelayanan Puskesmas"),
      h("div", { class: "panel" }, [
        h("ol", { class: "alur-list" }, [
          ...steps.map((s, idx) =>
            h("li", { class: "alur-item" }, [
              h("div", { class: "alur-media" }, [
                  h("img", {
                    class: "alur-img",
                    src: s.img,
                    alt: s.alt,
                    loading: "lazy",
                    decoding: "async",
                    onerror: (e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const media = img.closest(".alur-media");
                      if (media) media.classList.add("alur-media--missing");
                    },
                  }),
                  h("div", { class: "alur-badge" }, String(idx + 1)),
              ]),
              h("div", { class: "alur-body" }, [
                h("div", { class: "alur-title" }, s.title),
                h("div", { class: "alur-desc" }, s.desc),
              ]),
            ])
          ),
        ]),
      ]),
    ]),

    h("div", { class: "panel" }, [
      h("h2", { class: "section-title" }, "Persyaratan Berobat"),
      h("div", { class: "grid-2" }, [
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-journal-check", "aria-hidden": "true" })),
          h("h3", { class: "card-title" }, "Syarat Umum"),
          h("ul", { style: "padding-left: 20px; color: var(--muted); margin: 0;" }, [
            h("li", {}, "Membawa Kartu Tanda Penduduk (KTP) asli/fotokopi"),
            h("li", {}, "Membawa Kartu Keluarga (KK) /  Kartu Identitas Anak (KIA) Jika pasien anak"),
            h("li", {}, "Membawa Kartu Berobat Puskesmas (jika sudah punya)"),
          ]),
        ]),
        h("div", { class: "card" }, [
          h("div", { class: "card-icon" }, h("i", { class: "bi bi-people", "aria-hidden": "true" })),
          h("h3", { class: "card-title" }, "Khusus Pasien Ibu Hamil & Anak"),
          h("ul", { style: "padding-left: 20px; color: var(--muted); margin: 0;" }, [
            h("li", {}, "Membawa Buku KIA/Buku Pink (Kesehatan Ibu dan Anak)"),
            h("li", {}, "KTP Suami/Istri (untuk pemeriksaan kehamilan pertama)"),
          ]),
        ]),
      ]),
    ]),

    h("div", { class: "panel" }, [
      h("h2", { class: "section-title" }, "Biaya / Tarif Layanan"),
      h("ul", { style: "padding-left: 20px; color: var(--muted); margin: 0; line-height: 1.6;" }, [
        h("li", {}, "Pasien BPJS/JKN dengan Faskes Puskesmas Muara Badak: GRATIS (Ditanggung BPJS)"),
        h("li", {}, "Pasien Umum (Non-BPJS): Dikenakan tarif retribusi sesuai Peraturan Daerah (Perda) Kabupaten Kutai Kartanegara."),
        h("li", {}, "Pasien Gawat Darurat: Pelayanan akan diutamakan keselamatan pasien terlebih dahulu, administrasi dapat menyusul."),
      ]),
    ]),
  ]);
}
