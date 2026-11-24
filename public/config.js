/*
  SI A 25 — konfigurasi aset.
  Isi path setelah file foto, QR, dan musik sudah tersedia.
  Isi path aset tanpa garis miring di depan agar bisa dibuka lokal dan online.
*/
window.SIA25_CONFIG = {
  photoPath: '', // contoh: 'assets/si-a25-last-frame.jpg'
  mentimeterImagePath: '', // isi: 'assets/si-a25-mentimeter.png'
  qrImagePath: 'assets/image/mentimeterqr.png', // QR Mentimeter kelas
  messageCollectionUrl: '', // tempel link Mentimeter Word Cloud di sini
  musicTracks: {
    opening: 'assets/audio/lagu_awal.mp3',
    story: 'assets/audio/lagu_awal.mp3',
    classroom: 'assets/audio/lagu_awal.mp3',
    teachquest: 'assets/audio/lagu_awal.mp3',
    learning: 'assets/audio/lagu_awal.mp3',
    people: 'assets/audio/lagu_awal.mp3',
    rollcall: 'assets/audio/lagu_awal.mp3',
    messages: 'assets/audio/lagu_awal.mp3',
    finale: 'assets/audio/lagu.mp3'
  }
};
