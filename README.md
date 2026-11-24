# SI A 25 — The Last Chapter

Website perpisahan SI A 25. Dibuat dengan HTML, CSS, dan JavaScript biasa.

## Menjalankan di komputer

1. Install Node.js.
2. Buka terminal di folder project.
3. Jalankan `npm run dev`.
4. Buka `http://localhost:3000`.

Password masuk: `SIA25PAP`.

Website tidak membutuhkan instalasi package tambahan atau file `.env`.

## Mengubah isi website

- `public/index.html` dan `public/story.html` — halaman website.
- `public/styles.css` — tampilan.
- `public/gate.js` — password halaman masuk.
- `public/content.js` — nama mahasiswa, profil, dan pesan.
- `public/config.js` — path foto, QR, link pengumpulan pesan, dan musik.

Ganti foto, QR, atau musik dengan file di `public/assets/`, lalu isi path relatifnya di `public/config.js`, misalnya `assets/foto-kelas.jpg`.

Password sederhana ini hanya menyembunyikan tampilan dari pengunjung biasa. Karena website statis, password bisa ditemukan di file JavaScript oleh orang yang memeriksa source website.
