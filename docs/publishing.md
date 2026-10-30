# Menulis artikel di blog

Panduan ini untuk siapa pun yang punya akun admin: cara menulis, menyimpan, dan
menerbitkan artikel di `hopeless-labs.com/blog` lewat panel `/admin`.

Tidak perlu menyentuh kode, Git, atau repository. Semua dilakukan dari browser.

---

## 1. Masuk ke panel

1. Buka **https://hopeless-labs.com/admin**
2. Isi **Email** dan **Password**, klik **Sign in**.

Kalau muncul **"This account is not an admin"**, artinya akun itu ada tapi belum
diberi hak admin — minta admin lain menaikkan role-nya.

Kalau lupa password, minta admin lain mereset dari dashboard Supabase
(Authentication → Users → pilih akun → Reset password). Belum ada halaman ganti
password sendiri di panel.

---

## 2. Membuat artikel baru

Setelah login, klik **New post** di kanan atas. Ada beberapa kolom:

### Judul

Judul utama artikel. Muncul di halaman `/blog`, di judul tab browser, dan di
kartu media sosial (OpenGraph).

Slug akan terisi otomatis dari judul (huruf kecil, spasi jadi tanda hubung).
Biarkan saja kecuali ada alasan khusus.

### Slug

Alamat URL artikel: `/blog/<slug>`. Contoh slug `inside-the-bytecode` → URL
`https://hopeless-labs.com/blog/inside-the-bytecode/`.

Ketentuan:

- hanya huruf kecil, angka, dan tanda hubung
- harus unik — tidak boleh sama dengan artikel lain
- diubah setelah artikel terbit bikin URL lama mati, jadi pikir dulu sebelum publish

Di bawah kolom slug ada pratinjau URL kecil supaya kelihatan hasil akhirnya.

### Ringkasan (Summary)

Satu sampai dua kalimat. Muncul di daftar `/blog`, di deskripsi Google, dan di
RSS feed. Anggap ini "iklan" artikelnya — tulis kenapa orang perlu baca.

Kalau dikosongkan, kartu artikel tampil tanpa ringkasan (tetap jalan, tapi
kurang enak dilihat).

### Badan artikel (Markdown)

Isi artikelnya, ditulis dengan format Markdown. Lihat bagian
[Format Markdown](#4-format-markdown-yang-didukung) di bawah.

Di sebelahnya ada panel **Preview** yang memperbarui langsung saat mengetik, jadi
kelihatan hasil akhirnya sebelum disimpan.

### Author

Nama yang muncul sebagai penulis artikel. Bawaannya `Hopeless Labs`. Bisa diisi
nama sendiri (misal `Kenji Subagja`).

### Tags

Kata kunci, dipisah koma. Contoh: `rsl, tutorial`. Muncul sebagai chip kecil di
kartu dan halaman artikel. Maksimal 3–4 tag sudah cukup; kalau kepanjangan jadi
berantakan.

### Gambar sampul (Cover image)

Klik kotak **Choose file** sebelah "Cover image", pilih file gambar.

- format PNG / JPEG / WebP
- tampil di kartu `/blog` (dipotong ukuran 160px) dan sebagai gambar besar di atas
  artikel
- kalau mau muncul di kartu media sosial, ukurannya sebaiknya lebar (misal 1200×630)
- klik **Remove cover** untuk membatalkan

Catatan: gambar di **dalam badan artikel** belum bisa di-upload dari panel. Untuk
itu pakai URL gambar yang sudah online, dengan cara menulis di badan artikel:

```markdown
![Keterangan gambar](https://contoh.com/gambar.png)
```

### Status

Dua pilihan:

| Status | Artinya |
| --- | --- |
| `draft` | Tersimpan di database, **tidak muncul** di situs |
| `published` | Muncul di `/blog`, sitemap, dan RSS feed pada build berikutnya |

---

## 3. Menyimpan

Klik **Save** di kanan atas.

- Tombol **Save** mati kalau belum ada perubahan — jadi kalau tidak bisa diklik,
  memang belum ada yang perlu disimpan.
- Kalau ada perubahan belum tersimpan, muncul label **unsaved** di samping judul.
- Ada penghitung kata dan estimasi waktu baca di sebelah kanan (formatnya
  `18 words · ~1 min`), ikut berubah saat mengetik.
- **Split view** (khusus layar lebar) menampilkan editor dan preview berdampingan.
- Kalau menutup tab saat masih ada perubahan, browser akan memperingatkan dulu.

Setelah tersimpan, kembali ke daftar artikel, dan statistik di atas daftar
(**Total / Published / Drafts / Last update**) ikut berubah.

---

## 4. Format Markdown yang didukung

Buka **https://www.hopeless-labs.com/docs/markdown-cheatsheet.html** — di sana
setiap format diperlihatkan berdampingan: apa yang diketik dan hasilnya di
situs. File-nya juga ada di `public/docs/markdown-cheatsheet.html`, jadi bisa
dibuka langsung dari disk tanpa internet.

Yang paling sering dipakai:

| Kebutuhan | Tulis |
| --- | --- |
| Sub-judul | `## Sub judul` (jangan `#`) |
| Sub-sub-judul | `### Lebih dalam` |
| Tebal / miring / coret | `**tebal**` / `*miring*` / `~~coret~~` |
| Daftar | `- item` atau `1. item` |
| Tautan | `[teks](https://contoh.com)` |
| Gambar | `![keterangan](https://contoh.com/gambar.png)` |
| Kode singkat | `` `npm run build` `` |
| Blok kode | tiga backtick, nama bahasa setelah pembuka |
| Tabel | baris judul, baris `\| --- \|`, lalu isi |
| Kutipan | `> pernyataan` |
| Garis pemisah | `---` (dengan baris kosong di atas-bawahnya) |

Tiga kesalahan yang paling sering terjadi:

1. memakai `#` untuk judul — tidak digayakan, tampil sebagai teks biasa
2. tidak memberi baris kosong antar blok — semuanya menempel jadi satu paragraf
3. tabel tanpa baris pemisah `| --- |` — tampil sebagai teks dengan garis tegak

## 5. Setelah menekan Save

**Bagian ini penting.** Situs ini situs statis: halaman blognya sudah jadi
("dibakar") saat build, bukan diambil dari database tiap kali ada yang buka.

Artinya:

- artikel yang baru **disimpan dan di-publish** masih **belum langsung muncul**
  di `hopeless-labs.com`
- perubahan baru terlihat setelah situs di-build ulang di Vercel
- build ulang terjadi saat ada perubahan yang di-push ke GitHub, atau saat admin
  memicu Redeploy manual di dashboard Vercel (Deployments → ⋯ → Redeploy)

Jadi alurnya: **tulis dan publish di panel → beri tahu admin untuk trigger
build → artikel live.** Kalau lu sendiri yang pegang Vercel, tinggal klik
Redeploy.

Panel admin sudah mengingatkan hal ini di bawah daftar artikel: *"Published posts
appear on the site, its sitemap, and its RSS feed on the next build."*

Kalau setelah build ulang artikelnya tetap tidak muncul, cek log build Vercel —
baris yang diawali `[blog]` menunjukkan penyebabnya (misalnya environment
variable Supabase bermasalah).

---

## 6. Mengedit dan menghapus

Dari daftar artikel:

- **View** — buka artikelnya di situs (tab baru). Hanya muncul untuk artikel
  berstatus `published`
- **Edit** — buka di editor, ubah apa saja, lalu **Save**
- **Delete** — hapus artikel. Akan muncul konfirmasi, dan setelah dihapus **tidak
  bisa dikembalikan**. Artikelnya hilang dari situs pada build berikutnya

File gambar sampul yang sudah di-upload **tidak** ikut terhapus otomatis saat
artikel dihapus. Kalau perlu bersih-bersih, minta admin menghapusnya dari
Supabase Storage.

Kalau dua orang membuka artikel yang sama dan sama-sama menekan Save, yang
terakhir menekan itu yang menang. Tidak ada penguncian — sebaiknya koordinasi
kalau sedang mengedit artikel yang sama.

---

## 7. Masalah yang sering muncul

| Gejala | Penyebab dan solusinya |
| --- | --- |
| "This account is not an admin" | Akun ada tapi role-nya bukan admin. Minta admin lain menaikkan role-nya |
| Tombol Save tidak bisa diklik | Tidak ada perubahan. Kalau sudah diubah tapi tetap mati, cek label `unsaved` di samping judul |
| "new row violates row-level security policy" | Akun kehilangan hak admin, atau sesi sudah kedaluwarsa. Coba Sign out lalu masuk lagi |
| "duplicate key value violates unique constraint" | Slug sudah dipakai artikel lain. Ganti slug-nya |
| Artikel sudah di-publish tapi tidak muncul di situs | Situs belum di-build ulang (lihat bagian 5) |
| Gambar sampul tidak muncul | Pastikan file berformat gambar dan proses Save berhasil. Coba buka preview-nya dari tab **View** |
| Lupa password | Minta admin lain mereset dari dashboard Supabase |
| Keluar sendiri / diminta login lagi | Sesi kedaluwarsa setelah 1 jam. Masuk lagi |

---

## 8. Referensi cepat

| Kolom | Wajib | Isi | Muncul di mana |
| --- | --- | --- | --- |
| Title | Ya | Judul artikel | Kartu `/blog`, judul tab, kartu sosial |
| Slug | Ya | Alamat URL, huruf kecil + tanda hubung, unik | `/blog/<slug>` |
| Summary | Sebaiknya | 1–2 kalimat | Kartu `/blog`, deskripsi Google, RSS |
| Body | Ya | Isi artikel, Markdown | Halaman artikel |
| Author | Tidak | Nama penulis (bawaan `Hopeless Labs`) | Kartu dan halaman artikel |
| Tags | Tidak | Kata kunci, dipisah koma | Chip di kartu dan artikel |
| Cover image | Tidak | Gambar sampul | Kartu `/blog` dan atas artikel |
| Status | Ya | `draft` atau `published` | Menentukan muncul/tidak di situs |

---

## Untuk pengembang

- Halaman panel: `app/admin/page.tsx`, komponen di `components/admin/`
- Tabel database: `public.posts` (schema: `supabase/migrations/`)
- Hak akses: `profiles.role = 'admin'`, ditegakkan Row Level Security — panel
  hanya mengatur tampilan, penolakan tetap datang dari database
- Artikel dibaca saat build di `lib/blog.ts`; setelah publish, situs perlu
  di-build ulang
- Membuat akun admin baru: lihat README, bagian "First admin"
- Referensi format: `public/docs/markdown-cheatsheet.html`, tersaji di
  `/docs/markdown-cheatsheet.html` (berdiri sendiri, tanpa build).
  Pratinjau di dokumen itu memakai gaya dari `app/globals.css`, dan isinya
  dicocokkan dengan `node scripts/check-markdown.mjs` — jalankan ulang kalau
  ada format baru yang mau didokumentasikan.
