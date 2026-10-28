(function() {
  console.log('ADMIN LOGIC VERSION: 1.0.9 - 17:53');
  console.log('--- ADMIN LOGIC STARTING ---');

  // 1. Creazione del Modal HTML via JS
  const modalHTML = `
    <div id="memberEditModal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);align-items:center;justify-content:center">
      <div style="background:var(--surface);border:1px solid var(--border-bright);padding:2.5rem;max-width:520px;width:90%;max-height:85vh;overflow-y:auto;position:relative">
        <button onclick="closeMemberEdit()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text-muted);font-size:1.1rem;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">✕</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.3rem" id="memberEditTitle">Modifica Membro</div>
        <div id="memberEditName" style="font-size:0.85rem;color:var(--text-dim);margin-bottom:1.2rem"></div>
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.6rem">Nome</div>
        <input id="memberEditNameInput" type="text" style="width:100%;background:var(--black2);border:1px solid var(--border);color:var(--text);font-size:0.85rem;padding:0.9rem;font-family:inherit;outline:none;transition:border-color 0.2s;box-sizing:border-box;margin-bottom:1.5rem">
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.6rem">World Competitor (opzionale)</div>
        <input id="memberEditWorld" type="text" maxlength="60" placeholder="es. World Competitor 2025" style="width:100%;background:var(--black2);border:1px solid var(--border);color:var(--text);font-size:0.85rem;padding:0.9rem;font-family:inherit;outline:none;transition:border-color 0.2s;box-sizing:border-box;margin-bottom:1.5rem">
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.6rem">Ruolo</div>
        <input id="memberEditRole" type="text" placeholder="es. Player" style="width:100%;background:var(--black2);border:1px solid var(--border);color:var(--text);font-size:0.85rem;padding:0.9rem;font-family:inherit;outline:none;transition:border-color 0.2s;box-sizing:border-box;margin-bottom:1.5rem">
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.6rem">Data di nascita</div>
        <input id="memberEditBirth" type="text" placeholder="es. 15/03/2001" style="width:100%;background:var(--black2);border:1px solid var(--border);color:var(--text);font-size:0.85rem;padding:0.9rem;font-family:inherit;outline:none;transition:border-color 0.2s;box-sizing:border-box">
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin:1.5rem 0 0.6rem">Top Risultati (uno per riga)</div>
        <textarea id="memberEditTops" style="width:100%;background:var(--black2);border:1px solid var(--border);color:var(--text);font-size:0.85rem;line-height:1.7;padding:0.9rem;resize:vertical;min-height:90px;font-family:inherit;outline:none;transition:border-color 0.2s"></textarea>
        <div style="display:flex;gap:1rem;margin-top:2rem">
          <button onclick="closeMemberEdit()" style="flex:1; padding:10px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer;">Annulla</button>
          <button onclick="saveMemberEdit()" style="flex:1; padding:10px; background:var(--gold); color:var(--black); border:none; cursor:pointer; font-weight:bold;">Salva</button>
        </div>
      </div>
    </div>
  `;
  
  const adminContainer = document.createElement('div');
  adminContainer.id = 'admin-injected-container';
  adminContainer.innerHTML = modalHTML;
  document.body.appendChild(adminContainer);

  // 2. Logica Admin
  window.openMemberEdit = function(id) {
    const m = [...membersData.founders, ...membersData.players].find(x => x.id === id);
    if (!m) return;
    window.currentEditingMemberId = id;
    document.getElementById('memberEditTitle').textContent = 'Modifica Membro';
    document.getElementById('memberEditName').textContent = m.name;
    document.getElementById('memberEditNameInput').value = m.name;
    document.getElementById('memberEditRole').value = m.role || '';
    document.getElementById('memberEditBirth').value = m.birth || '';
    document.getElementById('memberEditWorld').value = m.world || '';
    document.getElementById('memberEditTops').value = m.tops.join('\n');
    document.getElementById('memberEditModal').style.display = 'flex';
  };

  window.openCreateMemberModal = function() {
    window.currentEditingMemberId = null;
    document.getElementById('memberEditTitle').textContent = 'Nuovo Membro';
    document.getElementById('memberEditName').textContent = '';
    document.getElementById('memberEditNameInput').value = '';
    document.getElementById('memberEditRole').value = 'Pro Player';
    document.getElementById('memberEditBirth').value = '';
    document.getElementById('memberEditWorld').value = '';
    document.getElementById('memberEditTops').value = '';
    document.getElementById('memberEditModal').style.display = 'flex';
  };

  window.closeMemberEdit = function() {
    document.getElementById('memberEditModal').style.display = 'none';
  };

  async function postContent(data) {
    return fetch('/api/save-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('wet_admin_token')
      },
      body: JSON.stringify(data)
    });
  }

  async function fetchContent() {
    try { return await fetch('/api/get-content?t=' + Date.now()).then(r => r.json()); } catch(e) { return {}; }
  }

  window.saveMemberEdit = async function() {
    const name = document.getElementById('memberEditNameInput').value.trim();
    const role = document.getElementById('memberEditRole').value.trim();
    const birth = document.getElementById('memberEditBirth').value;
    const world = document.getElementById('memberEditWorld').value.replace(/\s+/g, ' ').trim();
    const tops = document.getElementById('memberEditTops').value.split('\n').filter(t => t.trim() !== '');
    const isNew = !window.currentEditingMemberId;
    let m;

    if (isNew) {
      if (!name) { showToast('Inserisci un nome'); return; }
      const initials = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      m = { id: 'm-' + Date.now(), initials, name, role: role || 'Pro Player', birth, world, tops, photo: null };
    } else {
      m = [...membersData.founders, ...membersData.players].find(x => x.id === window.currentEditingMemberId);
      if (!m) return;
      Object.assign(m, { name, birth, world, tops });
      if (role) m.role = role;
    }

    try {
      const data = await fetchContent();
      if (isNew) {
        data.addedMembers = (data.addedMembers || []).concat([{ id: m.id, initials: m.initials, name: m.name, role: m.role, birth: m.birth, world: m.world, tops: m.tops }]);
      } else {
        [...membersData.founders, ...membersData.players].forEach(x => {
          data[x.id] = { name: x.name, role: x.role, birth: x.birth, world: x.world || '', tops: x.tops };
        });
        // i membri aggiunti vivono anche in addedMembers: tienili allineati
        if (Array.isArray(data.addedMembers)) {
          data.addedMembers = data.addedMembers.map(a => a.id === m.id ? Object.assign({}, a, { name: m.name, role: m.role, birth: m.birth, world: m.world, tops: m.tops }) : a);
        }
      }
      const res = await postContent(data);
      if (res.ok) {
        if (isNew) membersData.players.push(m);
        showToast(isNew ? 'Membro aggiunto' : 'Modifiche salvate con successo. Saranno disponibili tra qualche minuto.');
        renderMembers();
        closeMemberEdit();
      } else {
        showToast('Errore durante il salvataggio');
      }
    } catch(e) {
      showToast('Errore durante il salvataggio');
    }
  };

  window.deleteMember = async function(id) {
    const m = membersData.players.find(x => x.id === id) || membersData.founders.find(x => x.id === id);
    if (!m || !confirm('Eliminare ' + m.name + '?')) return;
    try {
      const data = await fetchContent();
      const wasAdded = (data.addedMembers || []).some(a => a.id === id);
      if (wasAdded) {
        data.addedMembers = data.addedMembers.filter(a => a.id !== id);
      } else {
        data.removedMembers = (data.removedMembers || []).concat([id]);
      }
      delete data[id];
      const res = await postContent(data);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      membersData.players = membersData.players.filter(x => x.id !== id);
      membersData.founders = membersData.founders.filter(x => x.id !== id);
      renderMembers();
    } catch(e) { showToast('Errore eliminazione'); }
  };

  window.injectAdminButtons = function() {
    console.log('Injecting admin buttons...');
    const allMembers = [...membersData.founders, ...membersData.players];
    allMembers.forEach(m => {
      const card = document.querySelector('[data-id="' + m.id + '"]');
      if (card && !card.querySelector('.admin-edit-btn')) {
        const editBtn = document.createElement('button');
        editBtn.className = 'admin-edit-btn';
        editBtn.innerHTML = '✎';
        editBtn.style.cssText = 'position:absolute; top:10px; right:10px; z-index:100; background:rgba(212,175,55,0.9); color:black; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(0,0,0,0.5);';
        editBtn.onclick = (e) => { e.stopPropagation(); openMemberEdit(m.id); };
        card.appendChild(editBtn);
        const delBtn = document.createElement('button');
        delBtn.className = 'admin-delete-btn';
        delBtn.textContent = '✕';
        delBtn.style.cssText = 'position:absolute; top:10px; right:48px; z-index:100; background:rgba(180,0,0,0.9); color:#fff; border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(0,0,0,0.5);';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteMember(m.id); };
        card.appendChild(delBtn);
      }
    });
  };

  window.injectMemberAvatarOverlay = function() {
    const allMembers = [...membersData.founders, ...membersData.players];
    allMembers.forEach(m => {
      const avatarEl = document.getElementById('avatar-' + m.id);
      if (avatarEl && !avatarEl.querySelector('.avatar-upload-btn')) {
        const uploadBtn = document.createElement('div');
        uploadBtn.className = 'avatar-upload-btn';
        uploadBtn.innerHTML = '📷';
        uploadBtn.title = 'Cambia foto';
        uploadBtn.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);color:#fff;font-size:1.3rem;opacity:0;transition:opacity 0.2s;cursor:pointer;z-index:50;';
        uploadBtn.onmouseover = () => { uploadBtn.style.opacity = '1'; };
        uploadBtn.onmouseout = () => { uploadBtn.style.opacity = '0'; };
        uploadBtn.onclick = (e) => {
          e.stopPropagation();
          window._currentAvatarMemberId = m.id;
          document.getElementById('avatarFileInput').click();
        };
        avatarEl.appendChild(uploadBtn);
      }
    });

    const fileInput = document.getElementById('avatarFileInput');
    if (fileInput && !fileInput._wired) {
      fileInput._wired = true;
      fileInput.onchange = function() {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
          window._cropSourceDataUrl = e.target.result;
          openCropModalForMember();
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
      };
    }
  };

  // Override render
  const originalRenderMembers = window.renderMembers;
  window.renderMembers = function() {
    if (originalRenderMembers) originalRenderMembers();
    setTimeout(injectAdminButtons, 100);
    setTimeout(injectMemberAvatarOverlay, 100);
  };

  // Logout button
  if (!document.getElementById('admin-logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'admin-logout-btn';
    logoutBtn.textContent = 'Exit Admin';
    logoutBtn.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:1000; background:var(--gold); color:black; border:none; padding:10px 20px; font-family:Orbitron; font-weight:bold; cursor:pointer; border-radius:4px;';
    logoutBtn.onclick = logoutAdmin;
    document.body.appendChild(logoutBtn);
  }

  function heroEditorRefreshInteractive() {
    document.getElementById('hero-canvas').querySelectorAll('.hero-img-wrapper').forEach(function(w) {
      w.classList.add('admin-active');
      addHandlesToWrapper(w);
      heroEditorMakeInteractive(w);
    });
  }
  window.heroEditorRefreshInteractive = heroEditorRefreshInteractive;

  function injectHeroEditor() {
    if (document.getElementById('adminHeroPanel')) {
      heroEditorRefreshInteractive();
      return;
    }

    // CSS per il debug (bordo rosso in modalità admin)
    const style = document.createElement('style');
    style.innerHTML = '.hero-img-wrapper.admin-active { border: 2px solid rgba(255,0,0,0.5) !important; }';
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'adminHeroPanel';
    panel.style.cssText = 'position:fixed;top:72px;right:20px;z-index:10000;background:#111;border:1px solid #c9a84c;border-radius:8px;width:220px;font-family:inherit;box-shadow:0 8px 32px rgba(0,0,0,0.7);';
    panel.innerHTML = '<div onclick="var b=document.getElementById(\'heroEditorBody\');b.style.display=b.style.display===\'none\'?\'block\':\'none\'" style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;border-bottom:1px solid #2a2a2a;cursor:pointer;user-select:none"><span style="font-size:0.7rem;color:#c9a84c;letter-spacing:0.15em;text-transform:uppercase;font-family:\'Orbitron\',sans-serif">Hero Editor (v1.0.9)</span><span style="color:#555;font-size:0.8rem">v</span></div><div id="heroEditorBody" style="padding:1rem;display:none"><input type="file" id="heroFileInput" accept="image/*" style="display:none" onchange="heroEditorAddImage(this)"><button onclick="document.getElementById(\'heroFileInput\').click()" style="display:block;width:100%;background:#222;border:1px solid #444;color:#c9a84c;padding:0.5rem;font-size:0.75rem;cursor:pointer;border-radius:4px;text-align:center;margin-bottom:0.75rem">Aggiungi immagine</button><button onclick="heroEditorSave()" style="width:100%;background:#c9a84c;color:#000;border:none;padding:0.5rem;font-weight:bold;font-size:0.75rem;border-radius:4px;cursor:pointer">Salva posizioni</button><div id="heroEditorStatus" style="text-align:center;font-size:0.72rem;color:#555;margin-top:0.5rem;min-height:1.2em"></div></div>';
    document.body.appendChild(panel);

    heroEditorRefreshInteractive();
  }

  function addHandlesToWrapper(wrapper) {
    if (!wrapper.querySelector('.hero-img-handle')) {
      var r = document.createElement('div'); r.className = 'hero-img-handle resize'; r.title = 'Ridimensiona';
      var rot = document.createElement('div'); rot.className = 'hero-img-handle rotate'; rot.title = 'Ruota';
      var d = document.createElement('div'); d.className = 'hero-img-handle del'; d.title = 'Elimina'; d.textContent = 'x';
      var lu = document.createElement('div'); lu.className = 'hero-img-handle layer-up'; lu.title = 'Porta avanti'; lu.textContent = '+';
      var ld = document.createElement('div'); ld.className = 'hero-img-handle layer-down'; ld.title = 'Manda indietro'; ld.textContent = '-';
      wrapper.appendChild(r); wrapper.appendChild(rot); wrapper.appendChild(d); wrapper.appendChild(lu); wrapper.appendChild(ld);
    }
  }

  var _heroActive = null;
  var _heroAction = null;
  var _heroSX, _heroSY, _heroSLeft, _heroSTop, _heroSWidth;

  if (!window._heroGlobalListeners) {
    window._heroGlobalListeners = true;
    document.addEventListener('mousemove', function(e) {
      if (!_heroActive || !_heroAction) return;
      var hero = document.getElementById('hero-canvas');
      var hRect = hero.getBoundingClientRect();
      if (_heroAction === 'drag') {
        var dx = (e.clientX - _heroSX) / hRect.width * 100;
        var dy = (e.clientY - _heroSY) / hRect.height * 100;
        _heroActive.style.left = (_heroSLeft + dx) + '%';
        _heroActive.style.top = (_heroSTop + dy) + '%';
      } else if (_heroAction === 'resize') {
        var newW = Math.max(50, _heroSWidth + (e.clientX - _heroSX));
        _heroActive.style.width = (newW / hRect.width * 100) + '%';
      } else if (_heroAction === 'rotate') {
        var rect = _heroActive.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
        _heroActive.style.transform = 'rotate(' + angle + 'deg)';
        _heroActive._rotation = angle;
      }
    });
    document.addEventListener('mouseup', function() {
      _heroActive = null; _heroAction = null;
    });
  }

  function heroEditorMakeInteractive(wrapper) {
    wrapper.addEventListener('mousedown', function(e) {
      if (e.target.classList.contains('hero-img-handle')) return;
      _heroActive = wrapper; _heroAction = 'drag';
      _heroSX = e.clientX; _heroSY = e.clientY;
      _heroSLeft = parseFloat(wrapper.style.left) || 35;
      _heroSTop = parseFloat(wrapper.style.top) || 20;
      e.preventDefault();
    });
    var rh = wrapper.querySelector('.hero-img-handle.resize');
    if (rh) rh.addEventListener('mousedown', function(e) {
      _heroActive = wrapper; _heroAction = 'resize';
      _heroSX = e.clientX;
      var hero = document.getElementById('hero-canvas');
      _heroSWidth = (parseFloat(wrapper.style.width) || 25) / 100 * hero.getBoundingClientRect().width;
      e.stopPropagation(); e.preventDefault();
    });
    var roth = wrapper.querySelector('.hero-img-handle.rotate');
    if (roth) roth.addEventListener('mousedown', function(e) {
      _heroActive = wrapper; _heroAction = 'rotate';
      e.stopPropagation(); e.preventDefault();
    });
    var dh = wrapper.querySelector('.hero-img-handle.del');
    if (dh) dh.addEventListener('click', async function(e) {
      e.stopPropagation();
      var imgEl = wrapper.querySelector('img');
      var imgUrl = imgEl ? imgEl.getAttribute('src') : null;
      var token = localStorage.getItem('wet_admin_token');
      if (imgUrl && imgUrl.includes('blob.vercel-storage.com')) {
        try {
          var cleanUrl = imgUrl.split('?')[0];
          await fetch('/api/delete-blob', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ url: cleanUrl })
          });
        } catch(err) {}
      }
      wrapper.remove();
      if (typeof window.heroEditorSave === 'function') await window.heroEditorSave();
    });
    var luh = wrapper.querySelector('.hero-img-handle.layer-up');
    if (luh) luh.addEventListener('click', function(e) {
      e.stopPropagation();
      wrapper.style.zIndex = (parseInt(wrapper.style.zIndex) || 5) + 1;
    });
    var ldh = wrapper.querySelector('.hero-img-handle.layer-down');
    if (ldh) ldh.addEventListener('click', function(e) {
      e.stopPropagation();
      wrapper.style.zIndex = Math.max(1, (parseInt(wrapper.style.zIndex) || 5) - 1);
    });
  }

  window.heroEditorInsertImage = function(url) {
    var photoKey = 'hi-' + Date.now();
    var wrapper = document.createElement('div');
    wrapper.className = 'hero-img-wrapper admin-active';
    wrapper.dataset.id = photoKey;
    wrapper.dataset.photoKey = photoKey;
    var existingZ = Array.from(document.getElementById('hero-canvas').querySelectorAll('.hero-img-wrapper')).map(function(w) { return parseInt(w.style.zIndex) || 5; });
    var newZ = existingZ.length ? Math.max.apply(null, existingZ) + 1 : 5;
    var hero = document.getElementById('hero-canvas');
    var widthPct = (200 / hero.offsetWidth) * 100;
    wrapper.style.left = '35%'; wrapper.style.top = '20%';
    wrapper.style.width = widthPct + '%';
    wrapper.style.transform = 'rotate(0deg)'; wrapper.style.zIndex = newZ;
    wrapper._rotation = 0;
    wrapper.innerHTML = '<img src="' + url + '" alt="">';
    hero.appendChild(wrapper);
    addHandlesToWrapper(wrapper);
    heroEditorMakeInteractive(wrapper);
    var picker = document.getElementById('heroAssetPicker');
    if (picker) picker.style.display = 'none';
    var status = document.getElementById('heroEditorStatus');
    if (status) { status.textContent = 'Immagine aggiunta'; setTimeout(function() { status.textContent = ''; }, 2000); }
  };

  window.heroEditorAddImage = async function(input) {
    var file = input.files[0];
    if (!file) return;
    var token = localStorage.getItem('wet_admin_token');
    var status = document.getElementById('heroEditorStatus');
    if (status) status.textContent = 'Caricamento...';
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var photoKey = 'heroimg-' + Date.now();
        var res = await fetch('/api/save-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ memberId: photoKey, dataUrl: e.target.result })
        });
        var data = await res.json();
        if (data.url) {
          heroEditorInsertImage(data.url);
        } else {
          if (status) { status.textContent = 'Errore: ' + (data.error || 'upload fallito'); }
        }
      } catch(err) {
        if (status) status.textContent = 'Errore upload';
      }
      input.value = '';
    };
    reader.readAsDataURL(file);
  };

  window.heroEditorSave = async function() {
    var status = document.getElementById('heroEditorStatus');
    if (status) status.textContent = 'Salvataggio...';
    var token = localStorage.getItem('wet_admin_token');
    var hero = document.getElementById('hero-canvas');
    var elements = Array.from(hero.querySelectorAll('.hero-img-wrapper'));
    console.log('[SAVE DEBUG] Elements found:', elements.length);
    var heroImages = elements.map(function(w) {
      var wVal = w.style.width;
      var widthPct = wVal.endsWith('%') ? parseFloat(wVal) : (parseFloat(wVal) / hero.offsetWidth) * 100;
      var obj = {
        id: w.dataset.id,
        photoKey: w.dataset.photoKey,
        src: (w.querySelector('img') ? (w.querySelector('img').getAttribute('src') || w.querySelector('img').src) : ''),
        xPct: parseFloat(w.style.left) || 0,
        yPct: parseFloat(w.style.top) || 0,
        widthPct: widthPct,
        rotation: w._rotation || 0,
        zIndex: parseInt(w.style.zIndex) || 9999
      };
      console.log('[SAVE DEBUG] Image object:', obj);
      return obj;
    });
    try {
      var existing = await fetch('/api/get-content?t=' + Date.now()).then(function(r) { return r.json(); }).catch(function() { return {}; });
      existing.heroImages = heroImages;
      console.log('[SAVE DEBUG] Full Payload:', existing);
      var res = await fetch('/api/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(existing)
      });
      if (!res.ok) {
        var errData = await res.json().catch(function() { return {}; });
        if (status) status.textContent = 'Errore: ' + (errData.error || res.status);
        return;
      }
      if (status) status.textContent = 'Salvato! Disponibile tra qualche minuto.';
      heroEditorRefreshInteractive();
      setTimeout(function() { if (status) status.textContent = ''; }, 4000);
    } catch(e) {
      if (status) status.textContent = 'Errore salvataggio';
    }
  };
  // ── MEMBER AVATAR/CROP EDITOR ───────────────────────────────────────────────
  window._cropState = {
    avatar: { zoom: 1, x: 0, y: 0 },
    hero:   { zoom: 1, x: 0, y: 0 }
  };
  window._cropTab = 'avatar';

  function applyCropTransform() {
    const img = document.getElementById('cropImg');
    const viewport = document.getElementById('cropViewport');
    const st = window._cropState[window._cropTab];
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const natW = img.naturalWidth || 1, natH = img.naturalHeight || 1;
    const coverScale = Math.max(vw / natW, vh / natH) * st.zoom;
    const dispW = natW * coverScale, dispH = natH * coverScale;
    img.style.width = dispW + 'px';
    img.style.height = dispH + 'px';
    img.style.left = ((vw - dispW) / 2 + st.x) + 'px';
    img.style.top = ((vh - dispH) / 2 + st.y) + 'px';
  }

  function wireCropDrag() {
    const viewport = document.getElementById('cropViewport');
    if (viewport._dragWired) return;
    viewport._dragWired = true;
    let dragging = false, sx, sy, sX0, sY0;
    viewport.addEventListener('mousedown', function(e) {
      dragging = true; viewport.classList.add('dragging');
      sx = e.clientX; sy = e.clientY;
      const st = window._cropState[window._cropTab];
      sX0 = st.x; sY0 = st.y;
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      const st = window._cropState[window._cropTab];
      st.x = sX0 + (e.clientX - sx);
      st.y = sY0 + (e.clientY - sy);
      applyCropTransform();
    });
    document.addEventListener('mouseup', function() {
      dragging = false; viewport.classList.remove('dragging');
    });
  }

  window.openCropModalForMember = function() {
    window._cropTab = 'avatar';
    window._cropState = { avatar: { zoom: 1, x: 0, y: 0 }, hero: { zoom: 1, x: 0, y: 0 } };
    const img = document.getElementById('cropImg');
    img.src = window._cropSourceDataUrl;
    img.onload = function() { applyCropTransform(); };
    document.getElementById('tabAvatar').classList.add('active');
    document.getElementById('tabHero').classList.remove('active');
    document.getElementById('cropViewport').classList.add('avatar-mode');
    document.getElementById('cropCircleOverlay').style.display = '';
    document.getElementById('cropZoom').value = 1;
    document.getElementById('cropModal').classList.add('open');
    wireCropDrag();
  };

  window.switchCropTab = function(tab) {
    window._cropTab = tab;
    document.getElementById('tabAvatar').classList.toggle('active', tab === 'avatar');
    document.getElementById('tabHero').classList.toggle('active', tab === 'hero');
    document.getElementById('cropViewport').classList.toggle('avatar-mode', tab === 'avatar');
    document.getElementById('cropCircleOverlay').style.display = tab === 'avatar' ? '' : 'none';
    document.getElementById('cropSubtitle').textContent = tab === 'avatar'
      ? 'Trascina per centrare il volto nell\'avatar circolare'
      : 'Trascina per posizionare il banner esteso';
    document.getElementById('cropZoom').value = window._cropState[tab].zoom;
    applyCropTransform();
  };

  window.onZoomChange = function() {
    window._cropState[window._cropTab].zoom = parseFloat(document.getElementById('cropZoom').value);
    applyCropTransform();
  };

  window.cancelCrop = function() {
    document.getElementById('cropModal').classList.remove('open');
    window._cropSourceDataUrl = null;
  };

  function extractCropDataUrl(tab, outW, outH) {
    const img = document.getElementById('cropImg');
    const viewport = document.getElementById('cropViewport');
    const st = window._cropState[tab];
    const natW = img.naturalWidth, natH = img.naturalHeight;
    const wasAvatarMode = viewport.classList.contains('avatar-mode');
    viewport.classList.toggle('avatar-mode', tab === 'avatar');
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    viewport.classList.toggle('avatar-mode', wasAvatarMode);
    const coverScale = Math.max(vw / natW, vh / natH) * st.zoom;
    const dispW = natW * coverScale, dispH = natH * coverScale;
    const left = (vw - dispW) / 2 + st.x;
    const top = (vh - dispH) / 2 + st.y;
    const canvas = document.createElement('canvas');
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    const scaleX = outW / vw, scaleY = outH / vh;
    ctx.drawImage(img, left * scaleX, top * scaleY, dispW * scaleX, dispH * scaleY);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  window.confirmCrop = async function() {
    const memberId = window._currentAvatarMemberId;
    if (!memberId) { cancelCrop(); return; }
    const token = localStorage.getItem('wet_admin_token');
    try {
      const avatarDataUrl = extractCropDataUrl('avatar', 400, 400);
      const heroDataUrl = extractCropDataUrl('hero', 1000, 450);

      // Sequenziali, non Promise.all: save-photo fa una read-modify-write sul
      // manifest memberPhotos di content.json — due chiamate in parallelo per
      // lo stesso membro rischierebbero di perdersi a vicenda l'aggiornamento.
      const avatarRes = await fetch('/api/save-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ memberId: memberId + '-avatar', dataUrl: avatarDataUrl })
      });
      const avatarData = await avatarRes.json();

      const heroRes = await fetch('/api/save-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ memberId: memberId, dataUrl: heroDataUrl })
      });
      const heroData = await heroRes.json();

      if (!avatarRes.ok || !avatarData.url || !heroRes.ok || !heroData.url) {
        const errMsg = avatarData.error || heroData.error || 'errore sconosciuto';
        showToast('Errore upload foto: ' + errMsg);
        return;
      }

      const m = [...membersData.founders, ...membersData.players].find(x => x.id === memberId);
      if (m) { m.photoAvatar = avatarData.url; m.photo = heroData.url; }

      showToast('Foto aggiornata con successo. Sarà disponibile tra qualche minuto.');
      renderMembers();
      document.getElementById('cropModal').classList.remove('open');
      window._cropSourceDataUrl = null;
    } catch (e) {
      showToast('Errore durante il caricamento della foto');
    }
  };

  // ── GUIDE EDITOR ──────────────────────────────────────────────────────────
  function injectGuideModal() {
    if (document.getElementById('guideCreateModal')) return;
    var modal = document.createElement('div');
    modal.id = 'guideCreateModal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);align-items:center;justify-content:center';
    modal.innerHTML =
      '<div style="background:var(--surface);border:1px solid var(--border-bright);padding:2.5rem;max-width:480px;width:90%;max-height:85vh;overflow-y:auto;position:relative">' +
        '<button onclick="closeGuideModal()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text-muted);font-size:1.1rem;cursor:pointer" onmouseover="this.style.color=\'var(--gold)\'" onmouseout="this.style.color=\'var(--text-muted)\'">✕</button>' +
        '<div id="guideModalTitle" style="font-family:\'Orbitron\',sans-serif;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:1.5rem">CREA GUIDA</div>' +
        '<div style="margin-bottom:1.2rem">' +
          '<label style="display:block;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.4rem">Nome Guida</label>' +
          '<input id="guideCreateTitle" type="text" placeholder="Es. Kewl Tune" style="width:100%;box-sizing:border-box;padding:10px 12px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:0.85rem;outline:none">' +
        '</div>' +
        '<div style="margin-bottom:1.2rem">' +
          '<label style="display:block;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.4rem">Immagine</label>' +
          '<input id="guideCreateImageFile" type="file" accept="image/*" onchange="previewGuideImage(this)" style="width:100%;box-sizing:border-box;padding:8px 0;color:var(--text);font-size:0.8rem;cursor:pointer">' +
          '<img id="guideCreatePreview" src="" alt="" style="display:none;width:100%;height:160px;object-fit:cover;margin-top:0.8rem;border:1px solid var(--border)">' +
        '</div>' +
        '<div style="margin-bottom:1.5rem">' +
          '<label style="display:block;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.4rem">Link Metafy</label>' +
          '<input id="guideCreateLink" type="url" placeholder="https://metafy.gg/..." style="width:100%;box-sizing:border-box;padding:10px 12px;background:var(--bg);border:1px solid var(--border);color:var(--text);font-size:0.85rem;outline:none">' +
        '</div>' +
        '<div style="margin-bottom:1.5rem">' +
          '<label style="display:block;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted);margin-bottom:0.6rem">Lingua</label>' +
          '<div style="display:flex;gap:0.8rem">' +
            '<button type="button" id="flagBtnIT" onclick="window.toggleGuideLang(\'it\')" title="Italiano" style="background:none;border:2px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;opacity:0.35;transition:opacity 0.2s,border-color 0.2s"><svg viewBox="0 0 3 2" width="28.8" height="19.2" xmlns="http://www.w3.org/2000/svg" style="display:block;border-radius:2px"><rect width="1" height="2" fill="#008C45"/><rect x="1" width="1" height="2" fill="#F4F5F0"/><rect x="2" width="1" height="2" fill="#CD212A"/></svg></button>' +
            '<button type="button" id="flagBtnEN" onclick="window.toggleGuideLang(\'en\')" title="English" style="background:none;border:2px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;opacity:0.35;transition:opacity 0.2s,border-color 0.2s"><svg viewBox="0 0 60 30" width="36.5" height="18.2" xmlns="http://www.w3.org/2000/svg" style="display:block;border-radius:2px"><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2"/><path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" stroke-width="10"/><path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6"/></svg></button>' +
          '</div>' +
        '</div>' +
        '<div id="guideCreateStatus" style="font-size:0.75rem;color:var(--gold);margin-bottom:1rem;min-height:1.2em"></div>' +
        '<div style="display:flex;gap:1rem">' +
          '<button onclick="closeGuideModal()" style="flex:1;padding:10px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer;font-family:\'Orbitron\',sans-serif;font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase">Annulla</button>' +
          '<button onclick="saveNewGuide()" style="flex:1;padding:10px;background:var(--gold);color:var(--black);border:none;cursor:pointer;font-family:\'Orbitron\',sans-serif;font-size:0.65rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:700">Salva</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  }

  window._selectedLangs = [];
  window.toggleGuideLang = function(lang) {
    var idx = window._selectedLangs.indexOf(lang);
    if (idx >= 0) window._selectedLangs.splice(idx, 1);
    else window._selectedLangs.push(lang);
    window._updateLangButtons();
  };
  window._updateLangButtons = function() {
    var it = document.getElementById('flagBtnIT');
    var en = document.getElementById('flagBtnEN');
    if (it) { var si = window._selectedLangs.indexOf('it') >= 0; it.style.opacity = si ? '1' : '0.35'; it.style.setProperty('border-color', si ? 'var(--gold)' : 'transparent'); }
    if (en) { var se = window._selectedLangs.indexOf('en') >= 0; en.style.opacity = se ? '1' : '0.35'; en.style.setProperty('border-color', se ? 'var(--gold)' : 'transparent'); }
  };

  window.openCreateGuideModal = function() {
    window._editingGuideId = null;
    window._selectedLangs = [];
    var titleEl = document.getElementById('guideModalTitle'); if (titleEl) titleEl.textContent = 'CREA GUIDA';
    var m = document.getElementById('guideCreateModal');
    if (m) m.style.display = 'flex';
    window._updateLangButtons();
  };

  window.closeGuideModal = function() {
    var m = document.getElementById('guideCreateModal');
    if (m) m.style.display = 'none';
    var t = document.getElementById('guideCreateTitle'); if (t) t.value = '';
    var l = document.getElementById('guideCreateLink'); if (l) l.value = '';
    var f = document.getElementById('guideCreateImageFile'); if (f) f.value = '';
    var p = document.getElementById('guideCreatePreview'); if (p) p.style.display = 'none';
    var s = document.getElementById('guideCreateStatus'); if (s) s.textContent = '';
    window._editingGuideId = null;
    window._selectedLangs = [];
  };

  window.openEditGuideModal = function(id) {
    var g = (window._guidesData || []).find(function(x) { return x.id === id; });
    if (!g) return;
    window._editingGuideId = id;
    window._selectedLangs = (g.langs || []).slice();
    var titleEl = document.getElementById('guideModalTitle'); if (titleEl) titleEl.textContent = 'MODIFICA GUIDA';
    document.getElementById('guideCreateTitle').value = g.title;
    document.getElementById('guideCreateLink').value = g.metafyLink || '';
    var preview = document.getElementById('guideCreatePreview');
    preview.src = g.image; preview.style.display = 'block';
    document.getElementById('guideCreateImageFile').value = '';
    document.getElementById('guideCreateStatus').textContent = '';
    document.getElementById('guideCreateModal').style.display = 'flex';
    window._updateLangButtons();
  };

  window.previewGuideImage = function(input) {
    var preview = document.getElementById('guideCreatePreview');
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) { preview.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(input.files[0]);
    }
  };

  window.saveNewGuide = async function() {
    var status = document.getElementById('guideCreateStatus');
    var title = document.getElementById('guideCreateTitle').value.trim();
    var link = document.getElementById('guideCreateLink').value.trim();
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    var fileInput = document.getElementById('guideCreateImageFile');
    if (!title) { status.textContent = 'Inserisci il nome della guida.'; return; }
    status.textContent = 'Salvataggio...';
    var token = localStorage.getItem('wet_admin_token');
    var guideId = 'guide-' + Date.now();
    var imageUrl = '';
    if (fileInput.files && fileInput.files[0]) {
      try {
        var dataUrl = await new Promise(function(resolve) {
          var reader = new FileReader();
          reader.onload = function(e) { resolve(e.target.result); };
          reader.readAsDataURL(fileInput.files[0]);
        });
        var upRes = await fetch(SERVER_URL + '/api/save-guide-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({ guideId: window._editingGuideId || guideId, dataUrl: dataUrl })
        });
        var upData = await upRes.json();
        if (upData.url) imageUrl = upData.url;
        else { status.textContent = 'Errore upload: ' + (upData.error || 'sconosciuto'); return; }
      } catch(e) { status.textContent = 'Errore upload immagine.'; return; }
    }
    try {
      var cRes = await fetch(SERVER_URL + '/api/get-content');
      var content = await cRes.json();
      content.guides = Array.isArray(window._guidesData) && window._guidesData.length ? window._guidesData.slice() : (Array.isArray(content.guides) ? content.guides : []);
      if (window._editingGuideId) {
        content.guides = content.guides.map(function(g) {
          return g.id === window._editingGuideId
            ? { id: g.id, title: title, image: imageUrl || g.image, metafyLink: link || '#', langs: window._selectedLangs.slice() }
            : g;
        });
      } else {
        content.guides.push({ id: guideId, title: title, image: imageUrl, metafyLink: link || '#', langs: window._selectedLangs.slice() });
      }
      var sRes = await fetch(SERVER_URL + '/api/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(content)
      });
      if (!sRes.ok) throw new Error('HTTP ' + sRes.status);
      window._guidesData = content.guides;
      if (typeof renderGuideCards === 'function') renderGuideCards(content.guides);
      setTimeout(injectGuideAdminOverlays, 60);
      closeGuideModal();
    } catch(e) { status.textContent = 'Errore salvataggio: ' + e.message; }
  };

  window.deleteGuide = async function(id) {
    if (!confirm('Eliminare questa guida?')) return;
    var token = localStorage.getItem('wet_admin_token');
    try {
      var cRes = await fetch(SERVER_URL + '/api/get-content');
      var content = await cRes.json();
      if (!Array.isArray(content.guides)) return;
      content.guides = content.guides.filter(function(g) { return g.id !== id; });
      var sRes = await fetch(SERVER_URL + '/api/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(content)
      });
      if (!sRes.ok) throw new Error('HTTP ' + sRes.status);
      window._guidesData = content.guides;
      if (typeof renderGuideCards === 'function') renderGuideCards(content.guides);
      setTimeout(injectGuideAdminOverlays, 60);
    } catch(e) { alert('Errore eliminazione: ' + e.message); }
  };

  function injectGuideAdminOverlays() {
    document.querySelectorAll('#guide-grid .guide-card').forEach(function(card) {
      if (card.querySelector('.guide-admin-delete')) return;
      var guideId = card.dataset.guideId;
      card.style.position = 'relative';
      var editBtn = document.createElement('button');
      editBtn.className = 'guide-admin-edit';
      editBtn.textContent = '✎';
      editBtn.onclick = function(e) { e.stopPropagation(); openEditGuideModal(guideId); };
      editBtn.style.cssText = 'position:absolute;top:0.6rem;left:0.6rem;z-index:10;background:var(--gold);color:var(--black);border:none;width:28px;height:28px;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center';
      card.appendChild(editBtn);
      var btn = document.createElement('button');
      btn.className = 'guide-admin-delete';
      btn.textContent = '✕';
      btn.onclick = function(e) { e.stopPropagation(); deleteGuide(guideId); };
      btn.style.cssText = 'position:absolute;top:0.6rem;left:2.0rem;z-index:10;background:rgba(180,0,0,0.85);color:#fff;border:none;width:28px;height:28px;cursor:pointer;font-size:0.85rem;display:flex;align-items:center;justify-content:center';
      card.appendChild(btn);
    });
  }

  function injectGuideEditor() {
    var guideSection = document.getElementById('guide');
    if (!guideSection || guideSection.querySelector('.guide-admin-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'guide-admin-bar';
    bar.style.cssText = 'display:flex;justify-content:flex-end;max-width:1300px;margin:0 auto 1rem';
    var createBtn = document.createElement('button');
    createBtn.textContent = '+ CREA GUIDA';
    createBtn.onclick = function() { openCreateGuideModal(); };
    createBtn.style.cssText = 'font-family:\'Orbitron\',sans-serif;font-size:0.62rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:8px 20px;background:var(--gold);color:var(--black);border:none;cursor:pointer;transition:background 0.2s';
    createBtn.onmouseover = function() { this.style.background = 'var(--gold-light)'; };
    createBtn.onmouseout = function() { this.style.background = 'var(--gold)'; };
    bar.appendChild(createBtn);
    var grid = document.getElementById('guide-grid');
    guideSection.insertBefore(bar, grid);
    injectGuideModal();
    setTimeout(injectGuideAdminOverlays, 500);
  }

  function injectMemberEditor() {
    var grid = document.getElementById('playersGrid');
    if (!grid || document.querySelector('.member-admin-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'member-admin-bar';
    bar.style.cssText = 'display:flex;justify-content:flex-end;max-width:1300px;margin:0 auto 1rem';
    var addBtn = document.createElement('button');
    addBtn.textContent = '+ AGGIUNGI MEMBRO';
    addBtn.onclick = function() { openCreateMemberModal(); };
    addBtn.style.cssText = 'font-family:\'Orbitron\',sans-serif;font-size:0.62rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:8px 20px;background:var(--gold);color:var(--black);border:none;cursor:pointer;transition:background 0.2s';
    addBtn.onmouseover = function() { this.style.background = 'var(--gold-light)'; };
    addBtn.onmouseout = function() { this.style.background = 'var(--gold)'; };
    bar.appendChild(addBtn);
    grid.parentNode.insertBefore(bar, grid);
  }

  // ── Editor sfondi sezioni ──────────────────────────────────────────────────
  var BG_SECTIONS = [
    { id: 'members', label: 'Il Team' },
    { id: 'academy', label: 'Academy' },
    { id: 'guide', label: 'Guide' },
    { id: 'social', label: 'Social' }
  ];
  var bgState = null; // { bgs, id, cfg }

  function bgToken() { return localStorage.getItem('wet_admin_token'); }

  function bgResizeToDataUrl(file) {
    return new Promise(function(resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function() {
        var max = 2400, k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function() { reject(new Error('Immagine non valida')); };
      img.src = url;
    });
  }

  function bgPreviewApply() {
    var cfg = bgState.cfg, pv = document.getElementById('bgPreviewLayer');
    var pos = cfg.x + '% ' + cfg.y + '%';
    pv.style.backgroundImage = cfg.src ? 'url("' + cfg.src + '")' : 'none';
    pv.style.backgroundPosition = pos;
    pv.style.transformOrigin = pos;
    pv.style.transform = 'scale(' + cfg.zoom / 100 + ')';
    pv.style.opacity = cfg.opacity;
    document.getElementById('bgValX').textContent = Math.round(cfg.x) + '%';
    document.getElementById('bgValY').textContent = Math.round(cfg.y) + '%';
    document.getElementById('bgValZoom').textContent = Math.round(cfg.zoom) + '%';
    document.getElementById('bgValOp').textContent = Math.round(cfg.opacity * 100) + '%';
    // anteprima live sulla pagina reale
    var live = Object.assign({}, bgState.bgs);
    live[bgState.id] = cfg.src ? cfg : null;
    window.applySectionBgs(live);
  }

  function bgSelectSection(id) {
    var c = bgState.bgs[id] || {};
    bgState.id = id;
    bgState.cfg = { src: c.src || '', x: c.x == null ? 50 : c.x, y: c.y == null ? 0 : c.y, zoom: c.zoom || 100, opacity: c.opacity == null ? 0.18 : c.opacity };
    var sec = document.getElementById(id);
    document.getElementById('bgPreview').style.aspectRatio = sec.offsetWidth + ' / ' + sec.offsetHeight;
    document.getElementById('bgSecSelect').value = id;
    document.getElementById('bgRangeX').value = bgState.cfg.x;
    document.getElementById('bgRangeY').value = bgState.cfg.y;
    document.getElementById('bgRangeZoom').value = bgState.cfg.zoom;
    document.getElementById('bgRangeOp').value = bgState.cfg.opacity;
    document.getElementById('bgStatus').textContent = bgState.cfg.src ? '' : 'Nessuna foto personalizzata (sfondo predefinito).';
    bgPreviewApply();
  }

  function bgClose(revert) {
    var m = document.getElementById('bgEditorModal');
    if (m) m.style.display = 'none';
    if (revert && bgState) window.applySectionBgs(bgState.bgs);
  }

  async function bgSave(remove) {
    var status = document.getElementById('bgStatus'), cfg = bgState.cfg;
    status.textContent = 'Salvataggio...';
    try {
      var existing = await fetchContent();
      existing.sectionBgs = existing.sectionBgs || {};
      if (remove || !cfg.src) delete existing.sectionBgs[bgState.id];
      else existing.sectionBgs[bgState.id] = { src: cfg.src, x: cfg.x, y: cfg.y, zoom: cfg.zoom, opacity: cfg.opacity };
      var res = await postContent(existing);
      if (!res.ok) { var e = await res.json().catch(function() { return {}; }); status.textContent = 'Errore: ' + (e.error || res.status); return; }
      bgState.bgs = existing.sectionBgs;
      try { localStorage.setItem('wet_content_v1', JSON.stringify(existing)); } catch (err) {}
      window._cachedContent = existing;
      window.applySectionBgs(existing.sectionBgs);
      if (remove) { bgSelectSection(bgState.id); status.textContent = 'Ripristinato lo sfondo predefinito.'; }
      else status.textContent = 'Salvato.';
    } catch (err) { status.textContent = 'Errore salvataggio: ' + err.message; }
  }

  window.openSectionBgEditor = async function() {
    var content = await fetchContent();
    bgState = { bgs: content.sectionBgs || {}, id: null, cfg: null };
    var modal = document.getElementById('bgEditorModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bgEditorModal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-family:inherit;color:var(--text)';
      var lab = 'font-size:0.62rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);display:flex;justify-content:space-between;margin:0.9rem 0 0.3rem';
      var btn = 'flex:1;padding:10px;border:1px solid var(--border);background:transparent;color:var(--text-dim);cursor:pointer;';
      modal.innerHTML =
        '<div style="background:var(--surface);border:1px solid var(--border-bright);padding:1.5rem;width:min(94vw,860px);max-height:92vh;overflow-y:auto">' +
          '<div style="font-family:Orbitron,sans-serif;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:1rem">Sfondi sezioni</div>' +
          '<select id="bgSecSelect" style="width:100%;background:var(--black2);border:1px solid var(--border);color:var(--text);padding:0.7rem;margin-bottom:1rem">' +
            BG_SECTIONS.map(function(s) { return '<option value="' + s.id + '">' + s.label + '</option>'; }).join('') +
          '</select>' +
          '<div id="bgPreview" style="position:relative;overflow:hidden;background:var(--black);border:1px solid var(--border);cursor:grab;touch-action:none;width:100%;max-height:50vh;margin:0 auto">' +
            '<div id="bgPreviewLayer" style="position:absolute;inset:0;background-size:cover;background-repeat:no-repeat;pointer-events:none"></div>' +
            '<div style="position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(201,168,76,0.4);display:flex;align-items:flex-start;justify-content:center;padding:6% 8%"><div style="width:100%;height:60%;border:1px dashed rgba(201,168,76,0.35);display:flex;align-items:center;justify-content:center;font-size:0.6rem;letter-spacing:0.2em;color:rgba(201,168,76,0.6);text-transform:uppercase">area contenuti</div></div>' +
          '</div>' +
          '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.4rem">Trascina l\'anteprima per spostare la foto. La pagina dietro si aggiorna in tempo reale.</div>' +
          '<div style="' + lab + '"><span>Posizione X</span><span id="bgValX"></span></div><input id="bgRangeX" type="range" min="0" max="100" step="0.5" style="width:100%">' +
          '<div style="' + lab + '"><span>Posizione Y</span><span id="bgValY"></span></div><input id="bgRangeY" type="range" min="0" max="100" step="0.5" style="width:100%">' +
          '<div style="' + lab + '"><span>Zoom</span><span id="bgValZoom"></span></div><input id="bgRangeZoom" type="range" min="100" max="300" step="1" style="width:100%">' +
          '<div style="' + lab + '"><span>Opacità</span><span id="bgValOp"></span></div><input id="bgRangeOp" type="range" min="0.05" max="1" step="0.01" style="width:100%">' +
          '<input id="bgFile" type="file" accept="image/*" style="display:none">' +
          '<div id="bgStatus" style="font-size:0.75rem;color:var(--text-dim);min-height:1.2rem;margin:1rem 0 0.6rem"></div>' +
          '<div style="display:flex;gap:0.6rem;flex-wrap:wrap">' +
            '<button id="bgBtnUpload" style="' + btn + '">Carica foto</button>' +
            '<button id="bgBtnReset" style="' + btn + '">Ripristina predefinito</button>' +
            '<button id="bgBtnCancel" style="' + btn + '">Chiudi</button>' +
            '<button id="bgBtnSave" style="flex:1;padding:10px;background:var(--gold);color:var(--black);border:none;cursor:pointer;font-weight:bold">Salva</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);

      var bind = function(rid, key) {
        document.getElementById(rid).addEventListener('input', function(e) { bgState.cfg[key] = parseFloat(e.target.value); bgPreviewApply(); });
      };
      bind('bgRangeX', 'x'); bind('bgRangeY', 'y'); bind('bgRangeZoom', 'zoom'); bind('bgRangeOp', 'opacity');
      document.getElementById('bgSecSelect').addEventListener('change', function(e) {
        window.applySectionBgs(bgState.bgs);
        bgSelectSection(e.target.value);
      });
      document.getElementById('bgBtnUpload').onclick = function() { document.getElementById('bgFile').click(); };
      document.getElementById('bgBtnCancel').onclick = function() { bgClose(true); };
      document.getElementById('bgBtnReset').onclick = function() { bgSave(true); };
      document.getElementById('bgBtnSave').onclick = function() { bgSave(false); };
      document.getElementById('bgFile').addEventListener('change', async function(e) {
        var f = e.target.files[0], status = document.getElementById('bgStatus');
        if (!f) return;
        status.textContent = 'Caricamento foto...';
        try {
          var dataUrl = await bgResizeToDataUrl(f);
          var res = await fetch('/api/save-section-bg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + bgToken() },
            body: JSON.stringify({ sectionId: bgState.id, dataUrl: dataUrl })
          });
          var data = await res.json();
          if (!data.url) { status.textContent = 'Errore upload: ' + (data.error || res.status); return; }
          bgState.cfg.src = data.url;
          status.textContent = 'Foto caricata: regola la posizione e premi Salva.';
          bgPreviewApply();
        } catch (err) { status.textContent = 'Errore upload: ' + err.message; }
        e.target.value = '';
      });
      // trascinamento nell'anteprima
      var pv = document.getElementById('bgPreview'), drag = null;
      pv.addEventListener('pointerdown', function(e) { drag = { px: e.clientX, py: e.clientY, x: bgState.cfg.x, y: bgState.cfg.y }; pv.setPointerCapture(e.pointerId); pv.style.cursor = 'grabbing'; });
      pv.addEventListener('pointermove', function(e) {
        if (!drag) return;
        var r = pv.getBoundingClientRect();
        bgState.cfg.x = Math.max(0, Math.min(100, drag.x - (e.clientX - drag.px) / r.width * 100));
        bgState.cfg.y = Math.max(0, Math.min(100, drag.y - (e.clientY - drag.py) / r.height * 100));
        document.getElementById('bgRangeX').value = bgState.cfg.x;
        document.getElementById('bgRangeY').value = bgState.cfg.y;
        bgPreviewApply();
      });
      var end = function() { drag = null; pv.style.cursor = 'grab'; };
      pv.addEventListener('pointerup', end);
      pv.addEventListener('pointercancel', end);
    }
    modal.style.display = 'flex';
    bgSelectSection(BG_SECTIONS[0].id);
  };

  function injectSectionBgButton() {
    if (document.getElementById('adminBgBtn')) return;
    var b = document.createElement('button');
    b.id = 'adminBgBtn';
    b.textContent = 'SFONDI SEZIONI';
    b.onclick = function() { window.openSectionBgEditor(); };
    b.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:10000;font-family:'Orbitron',sans-serif;font-size:0.62rem;font-weight:700;letter-spacing:0.15em;padding:10px 18px;background:var(--gold);color:var(--black);border:none;cursor:pointer;box-shadow:0 8px 32px rgba(0,0,0,0.7)";
    document.body.appendChild(b);
  }


  injectHeroEditor();
  injectSectionBgButton();
  injectAdminButtons();
  injectMemberAvatarOverlay();
  injectGuideEditor();
  injectMemberEditor();
  console.log('--- ADMIN LOGIC ACTIVE ---');
})();
