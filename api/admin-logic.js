(function() {
  console.log('ADMIN LOGIC VERSION: 1.0.9 - 17:53');
  console.log('--- ADMIN LOGIC STARTING ---');

  // 1. Creazione del Modal HTML via JS
  const modalHTML = `
    <div id="memberEditModal" style="display:none;position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);align-items:center;justify-content:center">
      <div style="background:var(--surface);border:1px solid var(--border-bright);padding:2.5rem;max-width:520px;width:90%;max-height:85vh;overflow-y:auto;position:relative">
        <button onclick="closeMemberEdit()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text-muted);font-size:1.1rem;cursor:pointer;transition:color 0.2s" onmouseover="this.style.color='var(--gold)'" onmouseout="this.style.color='var(--text-muted)'">✕</button>
        <div style="font-family:'Orbitron',sans-serif;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.3rem">Modifica Membro</div>
        <div id="memberEditName" style="font-size:0.85rem;color:var(--text-dim);margin-bottom:1.2rem"></div>
        <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gold);margin-bottom:0.6rem">Nome</div>
        <input id="memberEditNameInput" type="text" style="width:100%;background:var(--black2);border:1px solid var(--border);color:var(--text);font-size:0.85rem;padding:0.9rem;font-family:inherit;outline:none;transition:border-color 0.2s;box-sizing:border-box;margin-bottom:1.5rem">
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
    document.getElementById('memberEditName').textContent = m.name;
    document.getElementById('memberEditNameInput').value = m.name;
    document.getElementById('memberEditBirth').value = m.birth || '';
    document.getElementById('memberEditTops').value = m.tops.join('\n');
    document.getElementById('memberEditModal').style.display = 'flex';
  };

  window.closeMemberEdit = function() {
    document.getElementById('memberEditModal').style.display = 'none';
  };

  window.saveMemberEdit = async function() {
    const m = [...membersData.founders, ...membersData.players].find(x => x.id === window.currentEditingMemberId);
    if (!m) return;
    
    m.name = document.getElementById('memberEditNameInput').value;
    m.birth = document.getElementById('memberEditBirth').value;
    m.tops = document.getElementById('memberEditTops').value.split('\n').filter(t => t.trim() !== '');
    
    try {
      const res = await fetch('/api/save-content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('wet_admin_token')
        },
        body: JSON.stringify(await getMemberDataMap())
      });
      if (res.ok) {
        showToast('Modifiche salvate con successo');
        renderMembers();
        closeMemberEdit();
      }
    } catch(e) {
      showToast('Errore durante il salvataggio');
    }
  };

  async function getMemberDataMap() {
    let data = {};
    try { data = await fetch('/api/get-content?t=' + Date.now()).then(r => r.json()); } catch(e) {}
    [...membersData.founders, ...membersData.players].forEach(m => {
      data[m.id] = { name: m.name, birth: m.birth, tops: m.tops };
    });
    return data;
  }

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
      }
    });
  };

  // Override render
  const originalRenderMembers = window.renderMembers;
  window.renderMembers = function() {
    if (originalRenderMembers) originalRenderMembers();
    setTimeout(injectAdminButtons, 100);
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
          await fetch('/api/delete-blob', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ url: imgUrl })
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
      if (status) status.textContent = 'Salvato!';
      heroEditorRefreshInteractive();
      setTimeout(function() { if (status) status.textContent = ''; }, 2000);
    } catch(e) {
      if (status) status.textContent = 'Errore salvataggio';
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
            '<button type="button" id="flagBtnIT" onclick="window.toggleGuideLang(\'it\')" title="Italiano" style="font-size:1.8rem;background:none;border:2px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;opacity:0.35;transition:opacity 0.2s,border-color 0.2s">🇮🇹</button>' +
            '<button type="button" id="flagBtnEN" onclick="window.toggleGuideLang(\'en\')" title="English" style="font-size:1.8rem;background:none;border:2px solid transparent;border-radius:6px;padding:4px 8px;cursor:pointer;opacity:0.35;transition:opacity 0.2s,border-color 0.2s">🇬🇧</button>' +
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

  injectHeroEditor();
  injectAdminButtons();
  injectGuideEditor();
  console.log('--- ADMIN LOGIC ACTIVE ---');
})();
