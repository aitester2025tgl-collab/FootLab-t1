// ui/overlays.js - intro and halftime overlays extracted from ui.js
(function(){
    // use shared color helpers when available
    function hexToRgb(hex) {
        if (window.ColorUtils && typeof window.ColorUtils.hexToRgb === 'function') return window.ColorUtils.hexToRgb(hex);
        if (!hex) return [34,34,34];
        const h = String(hex).replace('#','').trim();
        if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
        if (h.length === 6) return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
        return [34,34,34];
    }

    function luminance(rgb) {
        if (window.ColorUtils && typeof window.ColorUtils.luminance === 'function') return window.ColorUtils.luminance(rgb);
        if (!rgb) return 0;
        const s = rgb.map(v => { const c = v/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); });
        return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
    }

    function getReadableTextColor(bgHex, preferredHex) {
        if (window.ColorUtils && typeof window.ColorUtils.getReadableTextColor === 'function') return window.ColorUtils.getReadableTextColor(bgHex, preferredHex);
        const bgRgb = hexToRgb(bgHex || '#000000');
        const fgPrefRgb = hexToRgb(preferredHex || '#ffffff');
        const Lbg = luminance(bgRgb);
        const Lwhite = 1;
        const Lblack = 0;
        function contrast(L1, L2) { return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05); }
        const prefLum = luminance(fgPrefRgb);
        const prefContrast = contrast(Lbg, prefLum);
        if (prefContrast >= 4.5) return preferredHex;
        const whiteContrast = contrast(Lbg, Lwhite);
        const blackContrast = contrast(Lbg, Lblack);
        return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
    }

    // Normalize common position codes for display (map AM -> CM as requested)
    function normalizePosition(pos) {
        if (!pos) return '';
        const p = String(pos || '').toUpperCase().trim();
        if (p === 'GK' || p === 'GOALKEEPER') return 'GK';
        if (/^(CB|CENTERBACK|CENTREBACK|CEN|CTR|DC|DF)$/.test(p)) return 'CB';
        if (/^(LB|LWB|LEFTBACK|LEFTBACKWARD)$/.test(p)) return 'LB';
        if (/^(RB|RWB|RIGHTBACK|RIGHTBACKWARD)$/.test(p)) return 'RB';
        // Map attacking midfield variants to central midfield (CM)
        if (/^(CDM|DM|DEFMID|HOLDING)$/.test(p)) return 'CM';
        if (/^(CM|MC|MID|MF|MIDFIELDER|CENTRAL)$/.test(p)) return 'CM';
        if (/^(AM|CAM|OM|SS|SH|ATT|AMF)$/.test(p)) return 'CM';
        if (/^(LW|LM|LEFTWING|LEFT)$/.test(p)) return 'LW';
        if (/^(RW|RM|RIGHTWING|RIGHT)$/.test(p)) return 'RW';
        if (/^(ST|CF|FW|FORWARD|STRIKER)$/.test(p)) return 'ST';
        if (/^D/.test(p)) return 'CB';
        if (/^M/.test(p)) return 'CM';
        if (/^F|^A|^S/.test(p)) return 'ST';
        return p;
    }

    function setIntroColors(club) {
        const bg = (club && club.team && club.team.bgColor) || '#222';
        const fg = getReadableTextColor(bg, (club && club.team && club.team.color) || '#ffffff');
        const fgRgb = hexToRgb(fg);
        const blackContrast = luminance(fgRgb) > 0.5 ? 21 : 1;
        const whiteContrast = luminance(fgRgb) > 0.5 ? 1 : 21;
        const stroke = blackContrast >= whiteContrast ? '#000' : '#fff';
        const overlay = document.getElementById('intro-overlay');
        if (overlay) {
            overlay.style.setProperty('--intro-bg', bg);
            overlay.style.setProperty('--intro-fg', fg);
            overlay.style.setProperty('--intro-club-bg', bg);
            overlay.style.setProperty('--team-menu-stroke', stroke);
        }
        const hubMenu = document.getElementById('hub-menu');
        if (hubMenu) hubMenu.style.setProperty('--team-menu-stroke', stroke);
        return { bg, fg };
    }

    function showIntroOverlay(club, cb) {
        const overlay = document.getElementById('intro-overlay');
        if (!overlay) { if (typeof cb === 'function') cb(); return; }
        const playerMatch = (window.Elifoot && window.Elifoot.currentRoundMatches ? window.Elifoot.currentRoundMatches : (window.currentRoundMatches || [])).find(m => (m.homeClub === club) || (m.awayClub === club));
        const isHome = playerMatch && playerMatch.homeClub === club;
        const starters = playerMatch ? (isHome ? playerMatch.homePlayers : playerMatch.awayPlayers) : (club && club.team && club.team.players ? club.team.players.slice(0,11) : []);
        const subs = playerMatch ? (isHome ? playerMatch.homeSubs || [] : playerMatch.awaySubs || []) : (club && club.team && club.team.players ? club.team.players.slice(11) : []);
        const { bg, fg } = setIntroColors(club);
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden','false');
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 560ms ease';
        const content = document.createElement('div');
        content.className = 'intro-card intro-lineup';
        content.style.background = 'var(--intro-bg)';
        content.style.color = 'var(--intro-fg)';
        const badge = `<div class="intro-badge" id="introBadge" style="background:${bg}; border-color:${getReadableTextColor(bg,'#ffffff')}"></div>`;
        const header = `<div style="display:flex; align-items:center; gap:12px; width:100%; justify-content:center; margin-bottom:8px;">${badge}<div><h2 id="introTeamName">${(club && club.team && club.team.name) || 'Equipe'}</h2><div style="opacity:0.9;">Onze inicial / Suplentes</div></div></div>`;
    const startersHtml = `<div class="lineup-col starters"><h3>Onze Inicial</h3><ol>${(starters || []).map(p => `<li>${normalizePosition(p.position) || ''} — ${p.name || '—'}</li>`).join('')}</ol></div>`;
    const subsHtml = `<div class="lineup-col subs"><h3>Suplentes</h3><ol>${(subs || []).map(p => `<li>${normalizePosition(p.position) || ''} — ${p.name || '—'}</li>`).join('')}</ol></div>`;
        content.innerHTML = `${header}<div style="display:flex; gap:20px; width:100%; justify-content:space-between;">${startersHtml}${subsHtml}</div>`;
        overlay.innerHTML = '';
        overlay.appendChild(content);
        requestAnimationFrame(() => { overlay.style.opacity = '1'; });
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.setAttribute('aria-hidden','true');
                if (typeof cb === 'function') cb();
            }, 360);
        }, 2200);
    }

    function showHalfTimeSubsOverlay(club, match, cb) {
        const overlay = document.getElementById('subs-overlay');
        if (!overlay) { if (typeof cb === 'function') cb(); return; }
        const isHome = match.homeClub === club;
        const starters = isHome ? (match.homePlayers || []) : (match.awayPlayers || []);
        const subs = isHome ? (match.homeSubs || []) : (match.awaySubs || []);
    overlay.innerHTML = '';
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden','false');
        const hubMenu = document.getElementById('hub-menu');
        const hubMenuPrev = hubMenu ? { bg: hubMenu.style.getPropertyValue('--team-menu-bg'), fg: hubMenu.style.getPropertyValue('--team-menu-fg') } : null;
        let teamBg = (club && club.team && club.team.bgColor) || '#2e2e2e';
        let teamSec = (club && club.team && club.team.color) || '#ffffff';
        const fg = getReadableTextColor(teamBg, teamSec);
        const rgb = hexToRgb(teamBg) || [34,34,34];
        const panelBg = `linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.28)), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
        try {
            if (hubMenu && club && club.team) {
                hubMenu.style.setProperty('--team-menu-bg', teamBg);
                hubMenu.style.setProperty('--team-menu-fg', fg);
            }
            overlay.style.setProperty('--subs-fg', fg);
            overlay.style.setProperty('--subs-overlay-bg', 'rgba(0,0,0,0.66)');
        } catch (e) {}
        const panel = document.createElement('div');
        panel.className = 'subs-panel';
        panel.style.background = panelBg;
        panel.style.color = fg;
        // compute match score to show in header (helps choose substitutions)
        const homeGoals = (typeof match.homeGoals === 'number') ? match.homeGoals : 0;
        const awayGoals = (typeof match.awayGoals === 'number') ? match.awayGoals : 0;
        const homeName = (match.homeClub && match.homeClub.team && match.homeClub.team.name) || (match.home && match.home.name) || '';
        const awayName = (match.awayClub && match.awayClub.team && match.awayClub.team.name) || (match.away && match.away.name) || '';
        const scoreText = `${homeGoals} - ${awayGoals}`;

        panel.innerHTML = [
            `<h2 style="background:${teamBg};color:${fg};padding:8px 0;border-radius:8px;">Substituições ao Intervalo - ${club.team.name} <small style=\"margin-left:10px;opacity:0.9;font-weight:600;\">(${scoreText})</small></h2>`,
            `<div class="subs-columns">`,
                `<div class="subs-col starters-col" style="background:rgba(255,255,255,0.02);color:${fg};"><h3>Onze Inicial (clique num titular, depois num suplente para substituir)</h3><ol class="starters-list">${starters.map((p,si)=>`<li data-si='${si}' data-name='${p.name}' data-pos='${p.position}'>${p.position} — ${p.name} <span class="player-skill">(skill: ${p.skill || 0})</span></li>`).join('')}</ol></div>`,
                `<div class="subs-col subs-col-right" style="background:rgba(0,0,0,0.04);color:${fg};"><h3>Suplentes</h3><ul class="subs-list">${subs.map((p,idx)=>`<li data-idx='${idx}' data-name='${p.name}' data-pos='${p.position}'>${p.position} — ${p.name} <span class="player-skill">(skill: ${p.skill || 0})</span></li>`).join('')}</ul></div>`,
            `</div>`,
            `<div style="margin-top:12px; display:flex; gap:12px; align-items:center;">`,
                `<div id="subs-pairs" style="flex:1"></div>`,
                `<button id="subsBackToGameBtn" style="padding:10px 22px;font-size:1.1em;border-radius:8px;background:#fff;color:#222;border:none;cursor:pointer;box-shadow:0 2px 8px #0002;transition:background 0.2s;">Voltar ao Jogo</button>`,
            `</div>`,
            `<div style="margin-top:8px; font-size:0.9em; opacity:0.9;">Regras: apenas 5 substituições; GR pode ser substituído só por GR; clique num titular e depois num suplente para formar a troca.</div>`
        ].join('');
        overlay.appendChild(panel);
        try {
            const teamRgb = hexToRgb(teamBg) || [34,34,34];
            const teamLum = luminance(teamRgb);
            const panelSurface = teamLum < 0.45 ? 'rgba(255,255,255,0.94)' : 'rgba(10,10,10,0.92)';
            const itemSurface = teamLum < 0.45 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
            const borderColor = getReadableTextColor(teamBg, '#ffffff') === '#ffffff' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
            overlay.style.setProperty('--subs-panel-bg', panelSurface);
            panel.style.background = `var(--subs-panel-bg, ${panelSurface})`;
            const panelTextColor = (teamLum < 0.45) ? '#111' : '#fff';
            panel.style.color = panelTextColor;
            overlay.style.setProperty('--subs-fg', panelTextColor);
            panel.querySelectorAll('.subs-col').forEach(col => {
                col.style.background = itemSurface;
                col.style.border = `1px solid ${borderColor}`;
                col.style.boxShadow = 'inset 0 1px 0 rgba(0,0,0,0.04)';
            });
            panel.querySelectorAll('.subs-list li, .starters-list li').forEach(li => {
                li.style.borderBottom = `1px solid ${borderColor}`;
                li.style.padding = '8px 6px';
                li.style.backgroundClip = 'padding-box';
                li.style.color = panelTextColor;
            });
            const headerNode = panel.querySelector('h2');
            if (headerNode) headerNode.style.background = teamBg;
        } catch (e) {}
        setTimeout(() => {
            const backBtn = panel.querySelector('#subsBackToGameBtn');
            if (backBtn) {
                backBtn.onclick = () => {
                    try { if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur(); } catch(e) {}
                    try {
                        // if there's an in-flight selection (starter selected + a sub selected), create a pair
                        if (selectedOut && typeof selectedOut.idx === 'number' && selectedSubIdx !== null) {
                            pairs.push({ outIdx: selectedOut.idx, inIdx: selectedSubIdx, applied: false });
                            // clear temps
                            selectedOut = null;
                            selectedSubIdx = null;
                            renderPairs();
                        }

                        // (season summary overlay used elsewhere)
                        // apply any unapplied pairs before returning to the match
                        pairs.forEach((pr, idx) => { try { if (!pr.applied) applyPair(idx); } catch(e){} });
                    } catch (e) { console.warn('Error auto-applying substitutions on close', e); }

                    if (hubMenu && hubMenuPrev) {
                        if (hubMenuPrev.bg) hubMenu.style.setProperty('--team-menu-bg', hubMenuPrev.bg);
                        if (hubMenuPrev.fg) hubMenu.style.setProperty('--team-menu-fg', hubMenuPrev.fg);
                    }
                    overlay.style.display = 'none';
                    overlay.setAttribute('aria-hidden','true');
                    if (typeof cb === 'function') cb();
                };
            }
        }, 0);

        // selection/pairing logic (same as in original ui.js)
        const pairsContainer = panel.querySelector('#subs-pairs');
    let selectedOut = null;
    // make selectedSubIdx available outside attachListHandlers so we can auto-apply when closing
    let selectedSubIdx = null;
    const pairs = [];

        function renderLists() {
            const startersHtml = (isHome ? match.homePlayers : match.awayPlayers).map((p,si)=>`<li data-si="${si}" data-name="${p.name}" data-pos="${normalizePosition(p.position)}">${normalizePosition(p.position)} — ${p.name} <span class="player-skill">(skill: ${p.skill || 0})</span></li>`).join('');
            const subsHtml = (isHome ? match.homeSubs : match.awaySubs).map((p,idx)=>`<li data-idx="${idx}" data-name="${p.name}" data-pos="${normalizePosition(p.position)}">${normalizePosition(p.position)} — ${p.name} <span class="player-skill">(skill: ${p.skill || 0})</span></li>`).join('');
            const startersCol = panel.querySelector('.starters-col .starters-list');
            const subsCol = panel.querySelector('.subs-col-right .subs-list');
            if (startersCol) startersCol.innerHTML = startersHtml;
            if (subsCol) subsCol.innerHTML = subsHtml;
            attachListHandlers();
        }

        function renderPairs() {
            pairsContainer.innerHTML = `<strong>Trocas:</strong><ul>${pairs.map((pr,i)=>{
                const out = (isHome ? match.homePlayers : match.awayPlayers)[pr.outIdx] || {name:'-', position:''};
                const incoming = (isHome ? match.homeSubs : match.awaySubs)[pr.inIdx] || {name:'-', position:''};
                const appliedCls = pr.applied ? 'applied' : '';
                const applyBtn = pr.applied ? `<button disabled>aplicada</button>` : `<button data-apply="${i}">substituir</button>`;
                return `<li class="${appliedCls}" data-pair="${i}">${normalizePosition(out.position)} ${out.name} → ${normalizePosition(incoming.position)} ${incoming.name} ${applyBtn} <button data-remove="${i}">remover</button></li>`;
            }).join('')}</ul>`;
            pairsContainer.querySelectorAll('button[data-remove]').forEach(btn=>{
                btn.addEventListener('click',(e)=>{
                    const idx = Number(btn.getAttribute('data-remove'));
                    const pr = pairs[idx];
                    if (!pr) return;
                    const outNode = panel.querySelector(`.starters-list li[data-si="${pr.outIdx}"]`);
                    const inNode = panel.querySelector(`.subs-list li[data-idx="${pr.inIdx}"]`);
                    if (outNode) outNode.classList.remove('paired');
                    if (inNode) inNode.classList.remove('paired');
                    pairs.splice(idx,1);
                    renderPairs();
                    const MAX_SUBS = (window.Elifoot && window.Elifoot.GameConfig && window.Elifoot.GameConfig.rules && window.Elifoot.GameConfig.rules.maxSubs) || 5;
                    if (pairs.length < MAX_SUBS) {
                        panel.querySelectorAll('.starters-list li.disabled').forEach(n => n.classList.remove('disabled'));
                        panel.querySelectorAll('.subs-list li.disabled').forEach(n => n.classList.remove('disabled'));
                    }
                });
            });
            pairsContainer.querySelectorAll('button[data-apply]').forEach(btn=>{
                btn.addEventListener('click',(e)=>{
                    const idx = Number(btn.getAttribute('data-apply'));
                    applyPair(idx);
                });
            });
        }

        function attachListHandlers() {
            panel.querySelectorAll('.starters-list li').forEach(n=>{ n.classList.remove('paired'); n.classList.remove('disabled'); });
            panel.querySelectorAll('.subs-list li').forEach(n=>{ n.classList.remove('paired'); n.classList.remove('disabled'); });
            panel.querySelectorAll('.subs-list li').forEach(n=>n.classList.remove('selected-out'));
            if (selectedOut && typeof selectedOut.idx === 'number') {
                panel.querySelectorAll('.starters-list li').forEach(n=>n.classList.remove('selected-out'));
                const outNode = panel.querySelector(`.starters-list li[data-si="${selectedOut.idx}"]`);
                if (outNode) outNode.classList.add('selected-out');
            }
            const startersNodes = panel.querySelectorAll('.starters-list li');
            const subsNodes = panel.querySelectorAll('.subs-list li');
            // selectedSubIdx is defined in the outer scope so Back-to-Game can auto-apply
            function maybeShowConfirm() {
                    if (selectedOut && typeof selectedOut.idx === 'number' && selectedSubIdx !== null) {
                    const out = selectedOut.player;
                    const inIdx = selectedSubIdx;
                    const incoming = (isHome ? match.homeSubs : match.awaySubs)[inIdx];
                    const ENFORCE_GK_ONLY = (window.Elifoot && window.Elifoot.GameConfig && window.Elifoot.GameConfig.rules && window.Elifoot.GameConfig.rules.enforceGkOnlySwap) !== false;
                    if (ENFORCE_GK_ONLY) {
                        if (out.position === 'GK' && incoming.position !== 'GK') {
                            const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                            if (subNode) { subNode.classList.add('invalid-swap'); setTimeout(()=>subNode.classList.remove('invalid-swap'),400); }
                            return;
                        }
                        if (incoming.position === 'GK' && out.position !== 'GK') {
                            const teamPlayers = isHome ? (match.homePlayers || []) : (match.awayPlayers || []);
                            const hasSentOffGk = teamPlayers.some(p => p && p.sentOff && String(p.position || '').toUpperCase() === 'GK');
                            if (!hasSentOffGk) {
                                const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                                if (subNode) { subNode.classList.add('invalid-swap'); setTimeout(()=>subNode.classList.remove('invalid-swap'),400); }
                                return;
                            }
                        }
                    }
                    const confirmDiv = document.createElement('div');
                    confirmDiv.className = 'subs-confirm-prompt';
                    confirmDiv.style.position = 'fixed';
                    confirmDiv.style.left = '0';
                    confirmDiv.style.top = '0';
                    confirmDiv.style.width = '100vw';
                    confirmDiv.style.height = '100vh';
                    confirmDiv.style.background = 'rgba(0,0,0,0.45)';
                    confirmDiv.style.display = 'flex';
                    confirmDiv.style.alignItems = 'center';
                    confirmDiv.style.justifyContent = 'center';
                    confirmDiv.style.zIndex = '40000';
                    confirmDiv.style.pointerEvents = 'auto';
                    confirmDiv.innerHTML = `<div style="background:${teamBg};color:${fg};padding:32px 24px;border-radius:12px;box-shadow:0 2px 16px #0008;min-width:320px;max-width:90vw;text-align:center;">
                        <h3>Confirmar Substituição?</h3>
                        <div style='margin:12px 0;font-size:1.1em;'>${out.position} <b>${out.name}</b> → ${incoming.position} <b>${incoming.name}</b></div>
                        <button id="subsDoConfirmBtn" style="margin-right:16px;">Confirmar</button>
                        <button id="subsDoCancelBtn">Cancelar</button>
                    </div>`;
                    document.body.appendChild(confirmDiv);
                    confirmDiv.querySelector('#subsDoConfirmBtn').onclick = () => {
                        const outNode = panel.querySelector(`.starters-list li[data-si="${selectedOut.idx}"]`);
                        const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                        if (outNode) outNode.classList.add('paired');
                        if (subNode) subNode.classList.add('paired');
                        pairs.push({ outIdx: selectedOut.idx, inIdx, applied: false });
                        renderPairs();
                        const MAX_SUBS = (window.Elifoot && window.Elifoot.GameConfig && window.Elifoot.GameConfig.rules && window.Elifoot.GameConfig.rules.maxSubs) || 5;
                        if (pairs.length >= MAX_SUBS) {
                            panel.querySelectorAll('.starters-list li:not(.paired)').forEach(n=>n.classList.add('disabled'));
                            panel.querySelectorAll('.subs-list li:not(.paired)').forEach(n=>n.classList.add('disabled'));
                        }
                        document.body.removeChild(confirmDiv);
                        selectedOut = null;
                        selectedSubIdx = null;
                        panel.querySelectorAll('.starters-list li').forEach(n=>n.classList.remove('selected-out'));
                    };
                    confirmDiv.querySelector('#subsDoCancelBtn').onclick = () => { document.body.removeChild(confirmDiv); selectedSubIdx = null; };
                }
            }

            startersNodes.forEach(node => {
                node.addEventListener('click', () => {
                    const si = Number(node.getAttribute('data-si'));
                    if (node.classList.contains('disabled') || node.classList.contains('paired')) return;
                    if (selectedOut && selectedOut.idx === si) { node.classList.remove('selected-out'); selectedOut = null; return; }
                    panel.querySelectorAll('.starters-list li').forEach(n=>n.classList.remove('selected-out'));
                    panel.querySelectorAll('.subs-list li').forEach(n=>n.classList.remove('selected-out'));
                    node.classList.add('selected-out');
                    selectedOut = { idx: si, player: (isHome ? match.homePlayers : match.awayPlayers)[si] };
                    maybeShowConfirm();
                });
            });

            subsNodes.forEach(node => {
                node.addEventListener('click', () => {
                    if (node.classList.contains('disabled') || node.classList.contains('paired')) return;
                    if (!selectedOut) return;
                    const inIdx = Number(node.getAttribute('data-idx'));
                    selectedSubIdx = inIdx;
                    maybeShowConfirm();
                });
            });
        }

        function applyPair(pairIndex) {
            const pr = pairs[pairIndex];
            if (!pr || pr.applied) return;
            const outIdx = pr.outIdx; const inIdx = pr.inIdx;
            if (isHome) {
                const outPlayer = match.homePlayers[outIdx]; const incoming = match.homeSubs[inIdx];
                if (outPlayer && incoming) {
                    match.homePlayers[outIdx] = incoming;
                    const sidx = match.homeSubs.findIndex(s=>s.name===incoming.name);
                    if (sidx>=0) match.homeSubs.splice(sidx,1);
                    match.homeSubs.push(outPlayer);
                }
            } else {
                const outPlayer = match.awayPlayers[outIdx]; const incoming = match.awaySubs[inIdx];
                if (outPlayer && incoming) {
                    match.awayPlayers[outIdx] = incoming;
                    const sidx = match.awaySubs.findIndex(s=>s.name===incoming.name);
                    if (sidx>=0) match.awaySubs.splice(sidx,1);
                    match.awaySubs.push(outPlayer);
                }
            }
            try { if (window.Elifoot && window.Elifoot.Lineups && typeof window.Elifoot.Lineups.reorderMatchByRoster === 'function') window.Elifoot.Lineups.reorderMatchByRoster(club, match, isHome); } catch(e) {}
            pr.applied = true;
            renderLists(); renderPairs();
            try { if (typeof updateMatchBoardLine === 'function' && typeof match.index !== 'undefined') updateMatchBoardLine(match.index, match); } catch(e){}
        }

        renderLists(); renderPairs();
    }

        // Season summary overlay: shows champions, promoted and relegated clubs across divisions
        function showSeasonSummaryOverlay(data) {
            const overlay = document.getElementById('season-summary-overlay');
            if (!overlay) {
                // create one if missing
                const root = document.createElement('div');
                root.id = 'season-summary-overlay';
                root.className = 'season-summary-overlay';
                document.body.appendChild(root);
            }
            const node = document.getElementById('season-summary-overlay');
            node.style.display = 'flex';
            node.setAttribute('aria-hidden','false');
            node.style.opacity = '0';
            node.style.transition = 'opacity 360ms ease';

            const champions = data && data.champions ? [data.champions] : [];
            const promoted = data && data.promoted ? data.promoted : {};
            const relegated = data && data.relegated ? data.relegated : {};

            function buildList(title, obj) {
                const keys = Object.keys(obj || {}).sort();
                if (!keys.length) return '';
                return `<div class="season-block"><h3>${title}</h3>${keys.map(k=>{
                    const arr = obj[k] || [];
                    return `<div class="season-division"><strong>Div ${Number(k)+1}:</strong> ${arr.map(c=> (c && c.team && c.team.name) || (c && c.team) || '—').join(', ')}</div>`;
                }).join('')}</div>`;
            }

            const champHtml = champions.map(c => `<div class="season-champion">${(c && c.team && c.team.name) || (c && c.team) || '—'}</div>`).join('');
            const html = [`<div class="season-summary-card"><h2>Fim da Época</h2>`,
                `<div style="margin:8px 0;"><strong>Campeões:</strong>${champHtml || '<span style="opacity:0.8">—</span>'}</div>`,
                buildList('Promovidos', promoted),
                buildList('Rebaixados', relegated),
                `<div style="margin-top:12px;text-align:right;"><button id="seasonSummaryClose" style="padding:8px 14px;border-radius:6px;border:none;cursor:pointer;background:#222;color:#fff;">Fechar</button></div>`,
                `</div>`].join('');

            node.innerHTML = html;
            requestAnimationFrame(()=>{ node.style.opacity = '1'; });
            const closeBtn = node.querySelector('#seasonSummaryClose');
            if (closeBtn) closeBtn.onclick = () => { node.style.opacity = '0'; setTimeout(()=>{ node.style.display='none'; node.setAttribute('aria-hidden','true'); }, 300); };
        }

        // expose season summary overlay
        window.Overlays = window.Overlays || {};
        window.Overlays.showSeasonSummary = showSeasonSummaryOverlay;

    // expose functions
    window.Overlays = window.Overlays || {};
    window.Overlays.setIntroColors = setIntroColors;
    window.Overlays.showIntroOverlay = showIntroOverlay;
    window.Overlays.showHalfTimeSubsOverlay = showHalfTimeSubsOverlay;

})();
