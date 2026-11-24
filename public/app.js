(() => {
  'use strict';

  const CONFIG = window.SIA25_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const scenes = $$('.scene');
  const audio = $('#background-audio');
  const musicToggle = $('#music-toggle');
  const volumeSlider = $('#music-volume');
  const volumeValue = $('#music-volume-value');
  const toast = $('#toast');

  let content = null;
  let activeScene = -1;
  let musicEnabled = false;
  let toastTimer = null;
  let rollTimer = null;
  let rollStarted = false;
  const savedVolume = localStorage.getItem('sia25-music-volume');
  let musicVolume = savedVolume === null ? 0.35 : Math.min(1, Math.max(0, Number(savedVolume)));
  if (!Number.isFinite(musicVolume)) musicVolume = 0.35;
  audio.volume = musicVolume;
  volumeSlider.value = String(Math.round(musicVolume * 100));
  volumeValue.value = `${Math.round(musicVolume * 100)}%`;
  volumeSlider.addEventListener('input', () => {
    musicVolume = Number(volumeSlider.value) / 100;
    audio.volume = musicVolume;
    volumeValue.value = `${volumeSlider.value}%`;
    volumeSlider.setAttribute('aria-valuetext', `${volumeSlider.value}%`);
    localStorage.setItem('sia25-music-volume', String(musicVolume));
  });

  const trackMap = {
    opening: 'opening', story: 'story', classroom: 'classroom', teachquest: 'teachquest',
    learning: 'learning', people: 'people', rollcall: 'rollcall', messages: 'messages', finale: 'finale'
  };

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3100);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function loadContent() { return window.SIA25_CONTENT || null; }

  function renderContent() {
    if (!content) return;
    $('#lecturer-name').textContent = content.lecturer || 'Dosen Pengampu';

    const profileRoot = $('#assistant-profiles');
    profileRoot.innerHTML = (content.assistants || []).map((person, index) => {
      const initials = person.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('');
      return `
      <article class="assistant-profile">
        <div class="profile-medallion profile-medallion-${index + 1}" aria-hidden="true"><span>${escapeHtml(initials)}</span><i></i><b>SI A · 25</b></div>
        <span class="note-index">0${index + 1} / ${escapeHtml(person.role || 'ASISTEN DOSEN')}</span>
        <h3>${escapeHtml(person.name)}</h3>
        <p>${escapeHtml(person.description)}</p>
      </article>
    `;
    }).join('');

    const rosterRoot = $('#rollcall-list');
    rosterRoot.innerHTML = (content.roster || []).map(([nim, name], index) => `
      <div class="rollcall-entry" data-roll-index="${index}">
        <span class="nim">${escapeHtml(nim)}</span>
        <span class="student-name">${escapeHtml(name)}</span>
      </div>
    `).join('');

    renderMessage('#francesco-message', content.messages?.francesco, 'Ruang untuk pesan Francesco.');
    renderMessage('#cathrine-message', content.messages?.cathrine, 'Ruang untuk pesan Cathrine.');
    renderClassMessages(content.classMessages || []);
    configureImage('#final-photo', '#photo-placeholder', CONFIG.photoPath);
    configureImage('#mentimeter-photo', '#mentimeter-placeholder', CONFIG.mentimeterImagePath);
    configureQr();
    buildSceneDots();
  }

  function renderMessage(selector, message, fallback) {
    const node = $(selector);
    if (!node) return;
    if (message && String(message).trim()) {
      node.textContent = message;
      node.classList.add('has-message');
    } else {
      node.innerHTML = `<span>${escapeHtml(fallback)}</span>`;
      node.classList.remove('has-message');
    }
  }

  function renderClassMessages(messages) {
    const wall = $('#class-message-wall');
    if (!wall) return;
    const entries = (messages || []).map((entry) => typeof entry === 'string'
      ? { name: 'SI A 25', text: entry }
      : { name: entry?.name || 'SI A 25', text: String(entry?.text || '') }
    ).filter((entry) => entry.text.trim());
    if (!entries.length) {
      wall.innerHTML = '<article class="class-message-empty"><span class="quote-mark">“</span><p>Ruang untuk kesan dan pesan dari teman-teman SI A 25.</p><span>WORDS TO KEEP</span></article><article class="class-message-empty"><span class="quote-mark">“</span><p>Satu cerita kecil tentang kelas kita akan ditaruh di sini.</p><span>MEMORIES FROM THE CLASS</span></article>';
      return;
    }
    wall.innerHTML = entries.map((entry) => `<article class="class-message-card"><span class="quote-mark">“</span><p>${escapeHtml(entry.text)}</p><span class="class-message-author">${escapeHtml(entry.name)}</span></article>`).join('');
  }

  function configureImage(imageSelector, placeholderSelector, path) {
    const image = $(imageSelector);
    const placeholder = $(placeholderSelector);
    if (!path) return;
    image.addEventListener('load', () => {
      image.hidden = false;
      placeholder.hidden = true;
    }, { once: true });
    image.addEventListener('error', () => {
      image.hidden = true;
      placeholder.hidden = false;
      showToast('File gambar belum ditemukan. Periksa path di config.js.');
    }, { once: true });
    image.src = path;
  }

  function configureQr() {
    const image = $('#qr-image');
    const placeholder = $('#qr-placeholder');
    const frameLink = $('#qr-frame-link');
    const collectionLink = $('#message-collection-link');
    const url = String(CONFIG.messageCollectionUrl || '').trim();

    if (CONFIG.qrImagePath) {
      image.addEventListener('load', () => {
        image.hidden = false;
        placeholder.hidden = true;
      }, { once: true });
      image.addEventListener('error', () => {
        image.hidden = true;
        placeholder.hidden = false;
      }, { once: true });
      image.src = CONFIG.qrImagePath;
    }

    if (url) {
      frameLink.href = url;
      frameLink.removeAttribute('aria-disabled');
      collectionLink.href = url;
      collectionLink.classList.remove('is-disabled');
    } else {
      frameLink.addEventListener('click', (event) => {
        event.preventDefault();
        showToast('Link pengumpulan pesan belum diatur di config.js.');
      });
      collectionLink.addEventListener('click', (event) => {
        event.preventDefault();
        showToast('Link pengumpulan pesan belum diatur di config.js.');
      });
    }
  }

  function buildSceneDots() {
    const root = $('#scene-dots');
    root.innerHTML = scenes.map((_, index) => `<button class="scene-dot${index === activeScene ? ' is-current' : ''}" type="button" data-go-scene="${index}" aria-label="Buka scene ${index + 1}"></button>`).join('');
    $$('[data-go-scene]', root).forEach((button) => {
      button.addEventListener('click', () => setScene(Number(button.dataset.goScene)));
    });
  }

  function updateNavigation() {
    $('#scene-counter').textContent = `${String(activeScene + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`;
    $('#progress-fill').style.width = `${((activeScene + 1) / scenes.length) * 100}%`;
    $('#previous-button').disabled = activeScene === 0;
    $('#next-button').disabled = activeScene === scenes.length - 1;
    $('#next-button').textContent = activeScene === scenes.length - 2 ? 'Lihat frame terakhir →' : 'Selanjutnya →';
    $$('.scene-dot').forEach((dot, index) => dot.classList.toggle('is-current', index === activeScene));
  }

  function setScene(index, options = {}) {
    const nextIndex = Math.max(0, Math.min(scenes.length - 1, index));
    if (nextIndex === activeScene && scenes[nextIndex].classList.contains('is-active')) return;
    clearInterval(rollTimer);
    activeScene = nextIndex;

    scenes.forEach((scene, sceneIndex) => {
      const isActive = sceneIndex === activeScene;
      scene.hidden = !isActive;
      scene.classList.toggle('is-active', isActive);
      if (isActive) {
        scene.style.animation = 'none';
        void scene.offsetHeight;
        scene.style.animation = '';
      }
    });

    updateNavigation();
    if (options.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    switchSceneMusic();

    if (activeScene === 6 && !rollStarted) startRollcall(false);
    if (activeScene !== 6) $('#rollcall-status').textContent = 'SIAP UNTUK MULAI';
  }

  $('#previous-button').addEventListener('click', () => setScene(activeScene - 1));
  $('#next-button').addEventListener('click', () => setScene(activeScene + 1));
  $$('[data-next]').forEach((button) => button.addEventListener('click', () => setScene(activeScene + 1)));
  $('#replay-button').addEventListener('click', () => {
    rollStarted = false;
    setScene(0);
  });

  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input, textarea, button, a') || !$('#photo-lightbox').hidden) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') setScene(activeScene + 1);
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') setScene(activeScene - 1);
  });

  function startRollcall(replay = true) {
    clearInterval(rollTimer);
    const entries = $$('.rollcall-entry');
    if (replay) entries.forEach((entry) => entry.classList.remove('is-visible', 'is-current'));
    if (!entries.length) return;
    const listWrap = $('#rollcall-list').parentElement;
    if (replay) listWrap.scrollTo({ top: 0, behavior: 'smooth' });

    rollStarted = true;
    $('#rollcall-end').classList.remove('is-visible');
    $('#rollcall-status').textContent = `0 / ${entries.length} NAMA DITAMPILKAN`;
    $('#rollcall-start').innerHTML = '⤨ &nbsp; Putar Ulang <span>→</span>';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      entries.forEach((entry) => entry.classList.add('is-visible'));
      finishRollcall(entries.length);
      return;
    }

    let index = replay ? 0 : entries.findIndex((entry) => !entry.classList.contains('is-visible'));
    if (index < 0) index = 0;
    const revealNext = () => {
      if (index >= entries.length) {
        clearInterval(rollTimer);
        finishRollcall(entries.length);
        return;
      }
      const entry = entries[index];
      entries.forEach((item) => item.classList.remove('is-current'));
      entry.classList.add('is-visible');
      entry.classList.add('is-current');
      $('#rollcall-status').textContent = `${index + 1} / ${entries.length} NAMA DITAMPILKAN`;
      const nextScrollTop = Math.max(0, entry.offsetTop - listWrap.clientHeight * 0.68);
      if (nextScrollTop > listWrap.scrollTop) listWrap.scrollTo({ top: nextScrollTop, behavior: 'smooth' });
      index += 1;
      if (index >= entries.length) {
        clearInterval(rollTimer);
        setTimeout(() => finishRollcall(entries.length), 350);
      }
    };
    revealNext();
    rollTimer = setInterval(revealNext, 1200);
  }

  function finishRollcall(total) {
    $('#rollcall-status').textContent = `${total} / ${total} SELESAI`;
    $('#rollcall-end').classList.add('is-visible');
  }

  $('#rollcall-start').addEventListener('click', () => startRollcall(true));
  $('#rollcall-skip').addEventListener('click', () => {
    clearInterval(rollTimer);
    const entries = $$('.rollcall-entry');
    entries.forEach((entry) => {
      entry.classList.add('is-visible');
      entry.classList.remove('is-current');
    });
    rollStarted = true;
    finishRollcall(entries.length);
  });

  function currentTrackPath() {
    const key = trackMap[scenes[activeScene].dataset.track];
    const configuredTrack = key && CONFIG.musicTracks ? CONFIG.musicTracks[key] : '';
    return String(configuredTrack || 'assets/audio/lagu.mp3').trim();
  }

  function updateMusicButton() {
    musicToggle.classList.toggle('music-is-playing', musicEnabled);
    musicToggle.setAttribute('aria-label', musicEnabled ? 'Matikan musik' : 'Putar musik');
    $('.music-label', musicToggle).textContent = musicEnabled ? 'MUSIC ON' : 'MUSIC OFF';
  }

  function stopMusic() {
    musicEnabled = false;
    audio.pause();
    updateMusicButton();
  }

  async function switchSceneMusic() {
    if (!musicEnabled) return;
    const source = currentTrackPath();
    if (!source) {
      stopMusic();
      showToast('Musik untuk scene ini belum ditambahkan. Cek folder assets/audio dan config.js.');
      return;
    }
    if (audio.dataset.currentSource !== source) {
      audio.src = source;
      audio.dataset.currentSource = source;
      audio.load();
    }
    try {
      await audio.play();
      updateMusicButton();
    } catch {
      stopMusic();
      showToast('Browser belum bisa memutar audio. Coba tekan tombol musik lagi.');
    }
  }

  musicToggle.addEventListener('click', async () => {
    if (musicEnabled) {
      stopMusic();
      return;
    }
    const source = currentTrackPath();
    if (!source) {
      showToast('File musik belum dipasang. Tambahkan track di public/assets/audio dan atur config.js.');
      return;
    }
    musicEnabled = true;
    if (audio.dataset.currentSource !== source) {
      audio.src = source;
      audio.dataset.currentSource = source;
      audio.load();
    }
    try {
      await audio.play();
      updateMusicButton();
    } catch {
      stopMusic();
      showToast('Audio belum dapat diputar. Pastikan file musik tersedia.');
    }
  });

  $('#logout-button').addEventListener('click', async () => {
    stopMusic();
    localStorage.removeItem('sia25-access');
    window.location.replace('index.html');
  });


  const finalPhoto = $('#final-photo');
  const lightbox = $('#photo-lightbox');
  const lightboxImage = $('#lightbox-image');
  const lightboxCounter = $('#lightbox-counter');
  const lightboxPrevious = $('#lightbox-prev');
  const lightboxNext = $('#lightbox-next');
  let lightboxItems = [];
  let lightboxIndex = 0;

  function renderLightboxItem() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCounter.textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
    lightboxPrevious.hidden = lightboxItems.length < 2;
    lightboxNext.hidden = lightboxItems.length < 2;
  }

  function openLightbox(items, index = 0) {
    lightboxItems = items;
    lightboxIndex = index;
    renderLightboxItem();
    lightbox.hidden = false;
    $('#lightbox-close').focus();
  }

  function moveLightbox(direction) {
    if (lightboxItems.length < 2) return;
    lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
    renderLightboxItem();
  }

  const chatPhotoButtons = $$('[data-chat-photo]');
  const chatPhotoItems = chatPhotoButtons.map((button) => {
    const photo = $('img', button);
    return { src: photo.src, alt: photo.alt };
  });
  chatPhotoButtons.forEach((button) => {
    button.addEventListener('click', () => openLightbox(chatPhotoItems, Number(button.dataset.chatPhoto)));
  });

  finalPhoto.addEventListener('click', () => {
    if (finalPhoto.hidden || !finalPhoto.src) return;
    openLightbox([{ src: finalPhoto.src, alt: finalPhoto.alt }]);
  });
  $('#lightbox-close').addEventListener('click', () => { lightbox.hidden = true; });
  lightboxPrevious.addEventListener('click', () => moveLightbox(-1));
  lightboxNext.addEventListener('click', () => moveLightbox(1));
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.hidden = true;
  });
  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') lightbox.hidden = true;
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });

  function initializeArchive() {
    if (localStorage.getItem('sia25-access') !== 'yes') {
      window.location.replace('index.html');
      return;
    }
    content = loadContent();
    renderContent();
    setScene(0, { scroll: false });
  }

  initializeArchive();
})();
