(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/ui/helpers.mjs
  function hexToRgb(hex) {
    if (!hex)
      return [46, 46, 46];
    let h = String(hex).replace("#", "");
    if (h.length === 3)
      h = h.split("").map((c) => c + c).join("");
    const v = parseInt(h, 16);
    if (isNaN(v))
      return [46, 46, 46];
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  }
  function luminance(rgb) {
    if (!rgb)
      return 0;
    const s = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  }
  function getReadableTextColor(bg, pref) {
    const E = window.Elifoot || window;
    if (E.ColorUtils && typeof E.ColorUtils.getReadableTextColor === "function")
      return E.ColorUtils.getReadableTextColor(bg, pref);
    return pref || "#ffffff";
  }
  function normalizePosition(pos) {
    if (!pos)
      return "";
    const p = String(pos || "").toUpperCase().trim();
    if (p === "GK" || p === "GOALKEEPER")
      return "GK";
    if (/^(CB|CENTERBACK|CENTREBACK|CEN|CTR|DC|DF)$/.test(p))
      return "CB";
    if (/^(LB|LWB|LEFTBACK|LEFTBACKWARD)$/.test(p))
      return "LB";
    if (/^(RB|RWB|RIGHTBACK|RIGHTBACKWARD)$/.test(p))
      return "RB";
    if (/^(CDM|DM|DEFMID|HOLDING)$/.test(p))
      return "CM";
    if (/^(CM|MC|MID|MF|MIDFIELDER|CENTRAL)$/.test(p))
      return "CM";
    if (/^(AM|CAM|OM|SS|SH|ATT|AMF)$/.test(p))
      return "CM";
    if (/^(LW|LM|LEFTWING|LEFT)$/.test(p))
      return "LW";
    if (/^(RW|RM|RIGHTWING|RIGHT)$/.test(p))
      return "RW";
    if (/^(ST|CF|FW|FORWARD|STRIKER)$/.test(p))
      return "ST";
    if (/^D/.test(p))
      return "CB";
    if (/^M/.test(p))
      return "CM";
    if (/^F|^A|^S/.test(p))
      return "ST";
    return p;
  }
  function isPlayerInAnyClub(player) {
    try {
      const all = window.ALL_CLUBS || window.allClubs || [];
      for (const c of all) {
        if (!c || !c.team || !Array.isArray(c.team.players))
          continue;
        if (c.team.players.find(
          (p) => p && p.id && player.id && p.id === player.id || p && p.name && p.name === player.name
        ))
          return true;
      }
    } catch (e) {
    }
    return false;
  }
  if (typeof window !== "undefined") {
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.ColorUtils = window.Elifoot.ColorUtils || {};
    if (!window.Elifoot.ColorUtils.hexToRgb)
      window.Elifoot.ColorUtils.hexToRgb = hexToRgb;
    if (!window.Elifoot.ColorUtils.luminance)
      window.Elifoot.ColorUtils.luminance = luminance;
    if (!window.Elifoot.ColorUtils.getReadableTextColor)
      window.Elifoot.ColorUtils.getReadableTextColor = getReadableTextColor;
  }

  // src/ui/roster.mjs
  function renderTeamRoster2(club) {
    try {
      const formatMoney3 = window.Elifoot && window.Elifoot.formatMoney || window.formatMoney || ((v) => String(v));
      const content = document.getElementById("hub-main-content");
      if (!content)
        return;
      if (!club || !club.team || !club.team.players || club.team.players.length === 0) {
        content.innerHTML = "<h2>ERRO</h2><p>Equipa n\xE3o tem jogadores!</p>";
        return;
      }
      const teamBg = club.team && club.team.bgColor || "#2e2e2e";
      let teamFg = getReadableTextColor(teamBg, club.team && club.team.color || "#ffffff");
      try {
        const c = luminance(hexToRgb(teamBg));
        if (c < 0.18)
          teamFg = "#fff";
      } catch (e) {
      }
      const players = Array.isArray(club.team.players) ? club.team.players.slice() : [];
      const enriched = players.map((p) => Object.assign({}, p, { _normPos: normalizePosition(p.position || p.pos) }));
      enriched.sort((a, b) => {
        const order = { GK: 1, CB: 2, LB: 2, RB: 2, DF: 2, CM: 3, LW: 3, RW: 3, ST: 4 };
        const posA = order[a._normPos] || 5;
        const posB = order[b._normPos] || 5;
        if (posA !== posB)
          return posA - posB;
        return (b.skill || 0) - (a.skill || 0);
      });
      const groups = { GK: [], DEF: [], MID: [], ATT: [] };
      enriched.forEach((p) => {
        const np = p._normPos || normalizePosition(p.position || p.pos);
        if (np === "GK")
          groups.GK.push(p);
        else if (np === "CB" || np === "LB" || np === "RB" || np === "DF")
          groups.DEF.push(p);
        else if (np === "CM" || np === "LW" || np === "RW" || np === "AM" || np === "DM")
          groups.MID.push(p);
        else if (np === "ST")
          groups.ATT.push(p);
        else
          groups.MID.push(p);
      });
      const groupLabels = { GK: "Guarda-redes", DEF: "Defesas", MID: "M\xE9dios", ATT: "Avan\xE7ados" };
      let html = `<div class="players-cards" style="color:${teamFg};">`;
      const playerNameColor = teamFg;
      ["GK", "DEF", "MID", "ATT"].forEach((k) => {
        const list = groups[k];
        if (!list || list.length === 0)
          return;
        html += `<div class="player-group"><h4 style="margin:6px 0 8px 0;">${groupLabels[k]} (${list.length})</h4><div class="cards-wrap">`;
        list.forEach((p) => {
          const skill = p.skill || 0;
          const barColor = skill >= 80 ? "#4CAF50" : skill >= 70 ? "#8BC34A" : skill >= 60 ? "#FFC107" : "#F44336";
          const salary = p.salary || 0;
          const contractLeft = typeof p.contractYearsLeft !== "undefined" ? p.contractYearsLeft : typeof p.contractYears !== "undefined" ? p.contractYears : 0;
          const endsMarker = Number(contractLeft) === 0 ? "*" : "";
          const displayPos = p._normPos || p.position || p.pos || "";
          html += `<div class="hub-box player-box" data-player-id="${p.id}">
                  <div class="player-header-row">
                    <div class="player-pos">${displayPos}</div>
                    <div class="player-name" style="color:${playerNameColor};">${p.name}</div>
                  </div>
                  <div class="skill-bar"><div class="skill-fill" style="width:${skill}%;background:${barColor};"></div></div>
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.92em;">
                    <div style="font-weight:700;color:rgba(255,255,255,0.9);">${skill}</div>
                    <div class="player-salary" data-player-id="${p.id}">${formatMoney3(salary)}${endsMarker ? " " + endsMarker : ""}</div>
                  </div>
                </div>`;
        });
        html += `</div></div>`;
      });
      html += `</div>`;
      content.innerHTML = `<div class="hub-box team-roster-grid" style="color:${teamFg};"><h2 class="team-roster-title">PLANTEL (${enriched.length} jogadores)</h2>${html}</div>`;
      setTimeout(() => {
        try {
          const salaryEls = content.querySelectorAll(".player-salary");
          salaryEls.forEach((el) => {
            el.style.cursor = "pointer";
            el.title = "Clique para negociar contrato deste jogador";
            el.replaceWith(el.cloneNode(true));
          });
          const fresh = content.querySelectorAll(".player-salary");
          fresh.forEach((el) => {
            el.addEventListener("click", () => {
              const pid = Number(el.dataset.playerId);
              const player = club.team && Array.isArray(club.team.players) ? club.team.players.find((p) => p.id === pid) : null;
              if (!player)
                return alert("Jogador n\xE3o encontrado");
              const current = Number(player.salary || 0);
              const proposedStr = window.prompt(`Negociar sal\xE1rio para ${player.name}
Sal\xE1rio atual: ${formatMoney3(current)}
Introduza sal\xE1rio mensal proposto (n\xFAmero):`, String(current));
              if (proposedStr === null)
                return;
              const proposed = Math.max(1, Math.round(Number(proposedStr) || 0));
              const yearsStr = window.prompt("Dura\xE7\xE3o do contrato em anos (ex: 1 ou 0):", String(Number(player.contractYears || 1)));
              if (yearsStr === null)
                return;
              const years = Math.max(0, Math.min(10, Number(yearsStr) || 1));
              if (window.Finance && typeof window.Finance.negotiatePlayerContract === "function") {
                const res = window.Finance.negotiatePlayerContract(club, pid, proposed, years);
                if (!res)
                  return alert("Erro na negocia\xE7\xE3o (resultado inv\xE1lido).");
                const prob = typeof res.acceptProb === "number" ? res.acceptProb : 0;
                if (res.accepted)
                  alert(`${player.name} aceitou a oferta!
Novo sal\xE1rio: ${formatMoney3(player.salary)}
Probabilidade estimada: ${(prob * 100).toFixed(1)}%`);
                else
                  alert(`${player.name} rejeitou a oferta.
Probabilidade estimada: ${(prob * 100).toFixed(1)}%`);
                renderTeamRoster2(club);
              } else {
                alert("Servi\xE7o de negocia\xE7\xE3o indispon\xEDvel.");
              }
            });
          });
          const rowEls = content.querySelectorAll(".player-box");
          rowEls.forEach((r) => {
            r.style.cursor = "pointer";
            r.title = "Clique para negociar ou oferecer contrato";
            r.replaceWith(r.cloneNode(true));
          });
          const freshRows = content.querySelectorAll(".player-box");
          freshRows.forEach((r) => {
            r.addEventListener("click", (ev) => {
              if (ev.target && ev.target.classList && ev.target.classList.contains("player-salary"))
                return;
              const pid = Number(r.dataset.playerId);
              const player = club.team && Array.isArray(club.team.players) ? club.team.players.find((p) => p.id === pid) : null;
              if (!player)
                return;
              const showPlayerActionMenu = window.Elifoot && window.Elifoot.Hub && window.Elifoot.Hub.showPlayerActionMenu || window.showPlayerActionMenu;
              if (typeof showPlayerActionMenu === "function")
                showPlayerActionMenu(player, club);
              else
                alert("A\xE7\xE3o de jogador indispon\xEDvel (showPlayerActionMenu).");
            });
          });
        } catch (e) {
          try {
            const L = window.Elifoot && window.Elifoot.Logger || console;
            L.warn && L.warn("Failed to attach negotiation handlers", e);
          } catch (_) {
          }
        }
      }, 10);
      const createFloatingOpponentBox = window.Elifoot && window.Elifoot.Hub && window.Elifoot.Hub.createFloatingOpponentBox || window.createFloatingOpponentBox;
      try {
        if (typeof createFloatingOpponentBox === "function")
          createFloatingOpponentBox(teamFg);
      } catch (e) {
      }
    } catch (e) {
      try {
        const L = window.Elifoot && window.Elifoot.Logger || console;
        L.warn && L.warn("renderTeamRoster failed", e);
      } catch (_) {
      }
    }
  }
  if (typeof window !== "undefined") {
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.Hub = window.Elifoot.Hub || {};
    window.Elifoot.Hub.renderTeamRoster = window.Elifoot.Hub.renderTeamRoster || renderTeamRoster2;
  }

  // src/ui/transfers.mjs
  function renderTransfers() {
    try {
      const content = document.getElementById("hub-main-content");
      if (!content)
        return;
      const market = window.transferMarket || window.availableTransfers || window.transferList || [];
      const rawFreeAgents = window.FREE_TRANSFERS || window.freeAgents || [];
      const freeAgents = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p)) : [];
      if ((!Array.isArray(market) || market.length === 0) && (!Array.isArray(freeAgents) || freeAgents.length === 0)) {
        content.innerHTML = "<h2>Transfer\xEAncias</h2><p>Nenhum jogador dispon\xEDvel no mercado.</p>";
        return;
      }
      let html = `<h2>Transfer\xEAncias</h2><div class="hub-box subs-panel" style="padding:8px;display:flex;flex-direction:column;gap:8px;">`;
      html += `<div style="display:flex;gap:8px;margin-bottom:8px;"><button id="tab-market" style="padding:6px 10px;border-radius:8px;border:none;background:#eee;color:#111;font-weight:700;">Mercado</button><button id="tab-free" style="padding:6px 10px;border-radius:8px;border:none;background:transparent;color:#aaa;font-weight:700;">Jogadores Livres</button></div>`;
      html += `<div id="trans-tab-content" style="display:flex;flex-direction:column;gap:8px;">`;
      html += `<div data-tab="market" class="trans-tab" style="display:block;">`;
      if (Array.isArray(market) && market.length) {
        const buyer = window.playerClub || null;
        market.forEach((p) => {
          try {
            const pos = p.position || p.pos || "-";
            const name = p.name || p.playerName || "\u2014";
            const clubObj = p.club || p.originalClubRef || null;
            const club = clubObj && (clubObj.team ? clubObj.team.name : clubObj.name) || p.clubName || "Livre";
            const price = p.price || p.minPrice || p.value || 0;
            let isOwn = false;
            if (buyer && clubObj) {
              try {
                if (clubObj === buyer)
                  isOwn = true;
                else if (clubObj.team && buyer.team && clubObj.team === buyer.team)
                  isOwn = true;
                else {
                  const pName = clubObj.team ? clubObj.team.name : clubObj.name || clubObj.clubName || "";
                  const bName = buyer.team ? buyer.team.name : buyer.name || buyer.clubName || "";
                  if (pName && bName && String(pName).trim() === String(bName).trim())
                    isOwn = true;
                }
              } catch (e) {
                isOwn = false;
              }
            }
            const btnTitle = isOwn ? "N\xE3o \xE9 poss\xEDvel comprar jogadores do seu pr\xF3prio clube" : "";
            const btnStyle = isOwn ? "padding:6px 8px;border-radius:6px;border:none;background:#9e9e9e;color:#fff;cursor:not-allowed;opacity:0.9;" : "padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;";
            const disabledAttr = isOwn ? "disabled" : "";
            html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.04);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${club}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#FFEB3B">${formatMoney(price)}</div><button data-player-name="${name}" class="buy-market-btn" title="${btnTitle}" ${disabledAttr} style="${btnStyle}">${isOwn ? "N\xE3o dispon\xEDvel" : "Comprar"}</button></div>
                </div>`;
          } catch (e) {
            const name = p && (p.name || p.playerName) || "\u2014";
            html += `<div style="padding:6px 8px;background:rgba(0,0,0,0.02);border-radius:6px;"><div style="font-weight:600">${name}</div></div>`;
          }
        });
      } else {
        html += `<div style="opacity:0.85;padding:8px">Nenhum item no mercado.</div>`;
      }
      html += `</div>`;
      html += `<div data-tab="free" class="trans-tab" style="display:none;">`;
      if (Array.isArray(freeAgents) && freeAgents.length) {
        freeAgents.forEach((p, idx) => {
          const pos = p.position || p.pos || "-";
          const name = p.name || p.playerName || "\u2014";
          const prev = p.previousClubName || p.club && (p.club.team ? p.club.team.name : p.club.name) || p.clubName || "\u2014";
          const minContract = p.minContract || p.minMonthly || p.minSalary || 0;
          const skill = typeof p.skill === "number" ? p.skill : p._skill || 0;
          html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;background:rgba(0,0,0,0.03);border-radius:6px;">
                    <div style="display:flex;gap:10px;align-items:center;"><div style="width:36px;font-weight:700;text-align:center">${pos}</div><div style="font-weight:600">${name}</div><div style="opacity:0.8;margin-left:8px">${prev}</div><div style="opacity:0.75;margin-left:8px;font-size:0.9em;color:#ddd">Skill: ${skill}</div></div>
                    <div style="display:flex;gap:8px;align-items:center;"><div style="font-weight:700;color:#8BC34A">M\xEDn: ${formatMoney(minContract)}</div><button data-free-idx="${idx}" class="buy-free-btn" style="padding:6px 8px;border-radius:6px;border:none;background:#2b7;color:#fff;">Comprar</button></div>
                </div>`;
        });
      } else {
        html += `<div style="opacity:0.85;padding:8px">Nenhum jogador livre dispon\xEDvel.</div>`;
      }
      html += `</div>`;
      html += `</div>`;
      html += `</div>`;
      content.innerHTML = html;
      setTimeout(() => {
        try {
          const tabMarket = document.getElementById("tab-market");
          const tabFree = document.getElementById("tab-free");
          const tabs = content.querySelectorAll(".trans-tab");
          const showTab = (name) => {
            tabs.forEach((t) => {
              t.style.display = t.getAttribute("data-tab") === name ? "block" : "none";
            });
            if (name === "market") {
              tabMarket.style.background = "#eee";
              tabMarket.style.color = "#111";
              tabFree.style.background = "transparent";
              tabFree.style.color = "#aaa";
            } else {
              tabFree.style.background = "#eee";
              tabFree.style.color = "#111";
              tabMarket.style.background = "transparent";
              tabMarket.style.color = "#aaa";
            }
          };
          if (tabMarket)
            tabMarket.addEventListener("click", () => showTab("market"));
          if (tabFree)
            tabFree.addEventListener("click", () => showTab("free"));
          content.querySelectorAll(".buy-market-btn").forEach((b) => {
            b.addEventListener("click", () => {
              if (b.disabled) {
                const title = b.getAttribute("title") || "A\xE7\xE3o indispon\xEDvel";
                alert(title);
                return;
              }
              const name = b.getAttribute("data-player-name");
              alert("Comprar do mercado: " + name + ". Implementar fluxo de transfer\xEAncia dependendo do tipo de listagem.");
            });
          });
          content.querySelectorAll(".buy-free-btn").forEach((b) => {
            b.addEventListener("click", () => {
              const idx = Number(b.getAttribute("data-free-idx"));
              const freeList = Array.isArray(rawFreeAgents) ? rawFreeAgents.filter((p) => !isPlayerInAnyClub(p)) : [];
              const pl = freeList[idx];
              if (!pl)
                return alert("Jogador livre n\xE3o encontrado");
              showBuyFreePlayerMenu(pl, rawFreeAgents, idx);
            });
          });
        } catch (e) {
          try {
            const L = window.Elifoot && window.Elifoot.Logger || console;
            L.warn && L.warn("attach transfer handlers failed", e);
          } catch (_) {
          }
        }
      }, 10);
    } catch (e) {
      try {
        const L = window.Elifoot && window.Elifoot.Logger || console;
        L.warn && L.warn("renderTransfers failed", e);
      } catch (_) {
      }
    }
  }
  function showBuyFreePlayerMenu(pl, rawFreeAgents, idxInFiltered) {
    try {
      const overlayId = "buy-free-overlay";
      let overlay = document.getElementById(overlayId);
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = overlayId;
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.zIndex = "70010";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.background = "rgba(0,0,0,0.5)";
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = "";
      const box = document.createElement("div");
      box.style.maxWidth = "620px";
      box.style.width = "92%";
      box.style.background = "var(--hub-panel-bg, #222)";
      box.style.color = "#fff";
      box.style.padding = "14px";
      box.style.borderRadius = "10px";
      const skill = pl.skill || 0;
      const minC = Math.max(0, Number(pl.minContract || pl.minMonthly || pl.minSalary || 0));
      const prev = pl.previousClubName || pl.club && (pl.club.team ? pl.club.team.name : pl.club.name) || pl.clubName || "\u2014";
      const html = `
                <h3>Assinar jogador livre</h3>
                <div style="margin-top:6px;font-weight:700">${pl.name} <span style="font-weight:500;opacity:0.85">(${pl.position || ""})</span></div>
                <div style="margin-top:6px;color:rgba(255,255,255,0.85)">Skill: ${skill} \xB7 Clube anterior: ${prev} \xB7 Sal\xE1rio m\xEDnimo: ${formatMoney(minC)}</div>
                <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
                    <label style="min-width:120px">Sal\xE1rio mensal</label>
                    <input id="buyFreeSalaryInput" type="number" min="${minC}" value="${minC || Math.max(500, Number(pl.salary || 500))}" style="width:160px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
                </div>
                <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">
                    <button id="buyFreeCancelBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#fff;color:#111">Cancelar</button>
                    <button id="buyFreeConfirmBtn" style="padding:8px 12px;border-radius:8px;border:none;background:#2b7;color:#fff">Assinar (1 ano)</button>
                </div>`;
      box.innerHTML = html;
      overlay.appendChild(box);
      setTimeout(() => {
        const cancel = document.getElementById("buyFreeCancelBtn");
        const confirm = document.getElementById("buyFreeConfirmBtn");
        const salaryIn = document.getElementById("buyFreeSalaryInput");
        if (cancel)
          cancel.addEventListener("click", () => {
            try {
              if (overlay && overlay.parentNode)
                overlay.parentNode.removeChild(overlay);
            } catch (e) {
            }
          });
        if (confirm)
          confirm.addEventListener("click", () => {
            const salary = Math.max(minC, Math.round(Number(salaryIn.value || minC || 500)));
            const buyer = window.playerClub;
            if (!buyer)
              return alert("Nenhum clube comprador definido (playerClub).");
            const ridx = rawFreeAgents.findIndex((pp) => pp.id && pl.id && pp.id === pl.id || pp.name && pp.name === pl.name);
            if (ridx >= 0)
              rawFreeAgents.splice(ridx, 1);
            const playerToAdd = Object.assign({}, pl);
            playerToAdd.salary = salary;
            playerToAdd.contractYears = 1;
            playerToAdd.contractYearsLeft = 1;
            buyer.team.players = buyer.team.players || [];
            buyer.team.players.push(playerToAdd);
            if (overlay && overlay.parentNode)
              overlay.parentNode.removeChild(overlay);
            alert(`${pl.name} assinado por ${buyer.team.name} por ${formatMoney(salary)} /m\xEAs (1 ano).`);
            try {
              if (typeof renderTransfers === "function")
                renderTransfers();
            } catch (_) {
            }
            try {
              if (typeof renderTeamRoster === "function")
                renderTeamRoster(buyer);
            } catch (_) {
            }
          });
      }, 10);
    } catch (e) {
      try {
        const L = window.Elifoot && window.Elifoot.Logger || console;
        L.warn && L.warn("showBuyFreePlayerMenu failed", e);
      } catch (_) {
      }
    }
  }
  if (typeof window !== "undefined") {
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.Hub = window.Elifoot.Hub || {};
    window.Elifoot.Hub.renderTransfers = window.Elifoot.Hub.renderTransfers || renderTransfers;
    window.Elifoot.Hub.showBuyFreePlayerMenu = window.Elifoot.Hub.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
    window.renderTransfers = window.renderTransfers || renderTransfers;
    window.showBuyFreePlayerMenu = window.showBuyFreePlayerMenu || showBuyFreePlayerMenu;
  }

  // src/ui/finance.mjs
  function renderFinance(club) {
    try {
      const content = document.getElementById("hub-main-content");
      if (!content)
        return;
      const c = club || window.playerClub;
      if (!c) {
        content.innerHTML = "<h2>Finan\xE7as</h2><p>Nenhum clube do jogador definido.</p>";
        return;
      }
      const stadiumCap = Number(c.stadiumCapacity || c.stadium || 1e4) || 1e4;
      const ticketPrice = Number(c.ticketPrice || c.ticket || 20) || 20;
      const bud = Number(c.budget || 0) || 0;
      content.innerHTML = `
      <h2>Finan\xE7as</h2>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:640px;">
          <div><strong>Or\xE7amento:</strong> <span id="clubBudgetDisplay">${formatMoney(bud)}</span></div>
          <div><strong>Capacidade do Est\xE1dio (atual):</strong> <span id="stadiumCapacityDisplay">${stadiumCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span> lugares</div>
          <div><strong>Limite atual do motor:</strong> 65.000 lugares (pode expandir at\xE9 100.000)</div>
          <div style="display:flex;gap:12px;align-items:center;">
              <label style="min-width:160px;">Aumentar est\xE1dio (%)</label>
              <input id="upgradePercentInput" type="number" min="1" max="100" value="10" style="width:80px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
              <button id="upgradeStadiumBtn" style="padding:8px 12px;border-radius:8px;background:#2b7; border:none; cursor:pointer;">Aumentar</button>
              <div id="upgradeCostDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;">
              <label style="min-width:160px;">Pre\xE7o do bilhete (\u20AC)</label>
              <input id="ticketPriceInput" type="number" min="1" value="${ticketPrice}" style="width:100px;padding:6px;border-radius:6px;border:1px solid #ccc;" />
              <button id="setTicketBtn" style="padding:8px 12px;border-radius:8px;background:#58a; border:none; cursor:pointer;color:#fff;">Guardar</button>
              <div id="estRevenueDisplay" style="margin-left:8px;color:rgba(0,0,0,0.6)"></div>
          </div>
          <div style="opacity:0.9;font-size:0.92em;color:rgba(0,0,0,0.7);">Notas: o custo por lugar aumenta com o tamanho atual do est\xE1dio. A receita dos jogos entra no or\xE7amento do clube ap\xF3s o fim de cada jogo.</div>
      </div>
    `;
      setTimeout(() => {
        try {
          let calcCostForPercent = function(pct) {
            const currentCap = Number(c.stadiumCapacity || c.stadium || 1e4);
            const seatsAdded = Math.ceil(currentCap * (pct / 100));
            const costPerSeat = Math.round(20 + currentCap / 1e3 * 2);
            const total = seatsAdded * costPerSeat;
            return { seatsAdded, costPerSeat, total };
          }, updateCostDisplay = function() {
            const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
            const cc = calcCostForPercent(pct);
            costDisp.textContent = `${cc.seatsAdded} lugares \u2192 custo aprox. ${formatMoney(cc.total)} (${cc.costPerSeat}\u20AC/lugar)`;
            const estAttendance = window.Finance && typeof window.Finance.computeMatchAttendance === "function" ? window.Finance.computeMatchAttendance({ homeClub: c, awayClub: {} }).attendance : Math.min(Number(c.stadiumCapacity || 1e4), 1e4);
            estDisp.textContent = estAttendance ? `Estimativa por jogo: ${estAttendance} espectadores \u2192 receita ~ ${formatMoney(Math.round(estAttendance * Number(priceIn.value || c.ticketPrice || 20)))} ` : "";
          };
          const pctIn = document.getElementById("upgradePercentInput");
          const upgradeBtn = document.getElementById("upgradeStadiumBtn");
          const costDisp = document.getElementById("upgradeCostDisplay");
          const capDisp = document.getElementById("stadiumCapacityDisplay");
          const budDisp = document.getElementById("clubBudgetDisplay");
          const priceIn = document.getElementById("ticketPriceInput");
          const setTicket = document.getElementById("setTicketBtn");
          const estDisp = document.getElementById("estRevenueDisplay");
          pctIn.addEventListener("input", updateCostDisplay);
          priceIn.addEventListener("input", updateCostDisplay);
          updateCostDisplay();
          upgradeBtn.addEventListener("click", () => {
            const pct = Math.max(1, Math.min(100, Number(pctIn.value || 10)));
            const ccalc = calcCostForPercent(pct);
            const currentBudget = Number(c.budget || 0);
            if (ccalc.total > currentBudget) {
              alert("Or\xE7amento insuficiente para esta expans\xE3o.");
              return;
            }
            const currentCap = Number(c.stadiumCapacity || c.stadium || 1e4);
            const newCap = Math.min(1e5, currentCap + ccalc.seatsAdded);
            c.stadiumCapacity = newCap;
            c.budget = currentBudget - ccalc.total;
            try {
              const snap = {
                currentJornada: window.currentJornada,
                playerClub: window.playerClub,
                allDivisions: window.allDivisions,
                allClubs: window.allClubs,
                currentRoundMatches: window.currentRoundMatches
              };
              if (window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.saveSnapshot === "function") {
                try {
                  window.Elifoot.Persistence.saveSnapshot(snap);
                } catch (_) {
                }
              } else {
                try {
                  localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
                } catch (e) {
                }
              }
            } catch (e) {
            }
            capDisp.textContent = newCap.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            budDisp.textContent = formatMoney(c.budget || 0);
            updateCostDisplay();
            alert(`Expans\xE3o aplicada: +${ccalc.seatsAdded} lugares (novo total ${newCap}). Custo: ${formatMoney(ccalc.total)}.`);
          });
          setTicket.addEventListener("click", () => {
            const price = Math.max(1, Math.round(Number(priceIn.value || c.ticketPrice || 20)));
            c.ticketPrice = price;
            try {
              const snap = {
                currentJornada: window.currentJornada,
                playerClub: window.playerClub,
                allDivisions: window.allDivisions,
                allClubs: window.allClubs,
                currentRoundMatches: window.currentRoundMatches
              };
              if (window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.saveSnapshot === "function") {
                try {
                  window.Elifoot.Persistence.saveSnapshot(snap);
                } catch (_) {
                }
              } else {
                try {
                  localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
                } catch (e) {
                }
              }
            } catch (e) {
            }
            alert("Pre\xE7o do bilhete atualizado para " + formatMoney(price));
            updateCostDisplay();
          });
        } catch (e) {
        }
      }, 10);
    } catch (e) {
      try {
        const L = window.Elifoot && window.Elifoot.Logger || console;
        L.warn && L.warn("renderFinance failed", e);
      } catch (_) {
      }
    }
  }
  if (typeof window !== "undefined") {
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.Hub = window.Elifoot.Hub || {};
    window.Elifoot.Hub.renderFinance = window.Elifoot.Hub.renderFinance || renderFinance;
    window.renderFinance = window.renderFinance || renderFinance;
  }

  // src/ui/tactics.mjs
  function initTacticPanel() {
    const tacticList = document.getElementById("tacticList");
    const tactics = window.Elifoot && window.Elifoot.TACTICS || window.TACTICS;
    if (!tacticList || !tactics)
      return;
    tacticList.innerHTML = "";
    const team = window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team;
    const profile = { CB: 0, LB: 0, RB: 0, CM: 0, LW: 0, RW: 0, ST: 0, GK: 0 };
    if (team && Array.isArray(team.players)) {
      team.players.forEach((p) => {
        const pos = (p.position || "").toUpperCase();
        if (Object.prototype.hasOwnProperty.call(profile, pos))
          profile[pos]++;
        else if (pos === "DF")
          profile.CB++;
        else if (pos === "MF" || pos === "AM" || pos === "DM")
          profile.CM++;
        else if (pos === "FW" || pos === "SS")
          profile.ST++;
      });
    }
    function tacticCompatible(tactic) {
      if (!tactic || !tactic.requires)
        return true;
      const req = tactic.requires;
      if (req.threeAtBack) {
        if ((profile.CB || 0) < 3)
          return false;
      }
      if (req.wingers) {
        const wide = (profile.LW || 0) + (profile.RW || 0);
        if (wide < 2)
          return false;
      }
      return true;
    }
    tactics.forEach((tactic) => {
      if (!tacticCompatible(tactic))
        return;
      const tacticItem = document.createElement("div");
      tacticItem.className = "tactic-item";
      tacticItem.textContent = `${tactic.name}`;
      tacticItem.dataset.tactic = tactic.name;
      if (window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team) {
        const teamBg = window.Elifoot.playerClub.team.bgColor || "#2E7D32";
        const teamSec = window.Elifoot.playerClub.team.color || "#ffffff";
        const rgb = hexToRgb(teamBg) || [34, 125, 50];
        const alphaBg = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
        const borderColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
        tacticItem.style.backgroundColor = alphaBg;
        tacticItem.style.border = `1px solid ${borderColor}`;
        tacticItem.style.color = getReadableTextColor(teamBg, teamSec);
      }
      if (window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team.tactic === tactic.name) {
        tacticItem.classList.add("active");
        if (window.Elifoot && window.Elifoot.playerClub && window.Elifoot.playerClub.team) {
          const teamBg2 = window.Elifoot.playerClub.team.bgColor || "#2E7D32";
          const rgb2 = hexToRgb(teamBg2) || [34, 125, 50];
          tacticItem.style.backgroundColor = `rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.26)`;
          tacticItem.style.border = `2px solid rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.6)`;
          tacticItem.style.boxShadow = `0 12px 30px rgba(${rgb2[0]}, ${rgb2[1]}, ${rgb2[2]}, 0.22), inset 0 0 0 1px rgba(255,255,255,0.03)`;
          const outlineColor = getReadableTextColor(
            teamBg2,
            window.Elifoot.playerClub.team.color || "#ffffff"
          );
          tacticItem.style.outline = `3px solid ${outlineColor}`;
          tacticItem.style.outlineOffset = "3px";
          tacticItem.style.zIndex = "3";
        }
      }
      tacticItem.addEventListener("click", () => {
        if (!window.Elifoot || !window.Elifoot.playerClub)
          return;
        window.Elifoot.playerClub.team.tactic = tactic.name;
        window.Elifoot.playerClub.team.tacticData = tactic;
        const teamBg = window.Elifoot.playerClub.team.bgColor || "#2E7D32";
        const rgb = hexToRgb(teamBg) || [34, 125, 50];
        document.querySelectorAll(".tactic-item").forEach((item) => {
          item.classList.remove("active");
          if (item.dataset.tactic === tactic.name) {
            item.classList.add("active");
            item.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26)`;
            item.style.border = `2px solid rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)`;
            item.style.boxShadow = `0 12px 30px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.26), inset 0 0 0 1px rgba(255,255,255,0.04)`;
            const outlineColor = getReadableTextColor(
              window.Elifoot.playerClub.team.bgColor || teamBg,
              window.Elifoot.playerClub.team.color || "#ffffff"
            );
            item.style.outline = `3px solid ${outlineColor}`;
            item.style.outlineOffset = "3px";
            item.style.transform = "translateY(-4px)";
            item.style.zIndex = "5";
          } else {
            item.style.backgroundColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.12)`;
            item.style.border = `1px solid rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
            item.style.boxShadow = "none";
            item.style.transform = "translateY(0)";
            item.style.outline = "none";
            item.style.zIndex = "";
          }
        });
        const renderFn = window.Elifoot && window.Elifoot.renderHubContent || window.renderHubContent;
        if (typeof renderFn === "function")
          renderFn("menu-team");
      });
      tacticList.appendChild(tacticItem);
    });
    try {
      const L = window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
      L.info && L.info("Painel de t\xE1ticas inicializado");
    } catch (_) {
    }
  }
  if (typeof window !== "undefined") {
    window.Tactics = window.Tactics || {};
    window.Tactics.initTacticPanel = window.Tactics.initTacticPanel || initTacticPanel;
    window.initTacticPanel = window.initTacticPanel || initTacticPanel;
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.Tactics = window.Elifoot.Tactics || {};
    window.Elifoot.Tactics.initTacticPanel = window.Elifoot.Tactics.initTacticPanel || initTacticPanel;
    window.Elifoot.initTacticPanel = window.Elifoot.initTacticPanel || initTacticPanel;
  }

  // src/ui/overlays/intro.mjs
  var intro_exports = {};
  __export(intro_exports, {
    setIntroColors: () => setIntroColors,
    showIntroOverlay: () => showIntroOverlay
  });
  function getLogger() {
    return window.Elifoot && window.Elifoot.Logger || console;
  }
  function setIntroColors(club) {
    const bg = club && club.team && club.team.bgColor || "#222";
    const fg = getReadableTextColor(bg, club && club.team && club.team.color || "#ffffff");
    const fgRgb = hexToRgb(fg);
    const blackContrast = luminance(fgRgb) > 0.5 ? 21 : 1;
    const whiteContrast = luminance(fgRgb) > 0.5 ? 1 : 21;
    const stroke = blackContrast >= whiteContrast ? "#000" : "#fff";
    const overlay = document.getElementById("intro-overlay");
    if (overlay) {
      overlay.style.setProperty("--intro-bg", bg);
      overlay.style.setProperty("--intro-fg", fg);
      overlay.style.setProperty("--intro-club-bg", bg);
      overlay.style.setProperty("--team-menu-stroke", stroke);
    }
    const hubMenu = document.getElementById("hub-menu");
    if (hubMenu)
      hubMenu.style.setProperty("--team-menu-stroke", stroke);
    return { bg, fg };
  }
  function showIntroOverlay(club, cb) {
    try {
      const E = window.Elifoot || window;
      const overlay = document.getElementById("intro-overlay");
      if (!overlay) {
        if (typeof cb === "function")
          cb();
        return;
      }
      const playerMatch = (E.currentRoundMatches || window.currentRoundMatches || []).find(
        (m) => m.homeClub === club || m.awayClub === club
      );
      const isHome = playerMatch && playerMatch.homeClub === club;
      const starters = playerMatch ? isHome ? playerMatch.homePlayers : playerMatch.awayPlayers : club && club.team && club.team.players ? club.team.players.slice(0, 11) : [];
      const subs = playerMatch ? isHome ? playerMatch.homeSubs || [] : playerMatch.awaySubs || [] : club && club.team && club.team.players ? club.team.players.slice(11) : [];
      const { bg, fg } = setIntroColors(club);
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 560ms ease";
      const content = document.createElement("div");
      content.className = "intro-card intro-lineup";
      content.style.background = "var(--intro-bg)";
      content.style.color = "var(--intro-fg)";
      const badge = `<div class="intro-badge" id="introBadge" style="background:${bg}; border-color:${getReadableTextColor(bg, "#ffffff")}"></div>`;
      const header = `<div class="intro-header">${badge}<div><h2 id="introTeamName">${club && club.team && club.team.name || "Equipe"}</h2><div style="opacity:0.9;">Onze inicial / Suplentes</div></div></div>`;
      const renderSimpleListItem = (p, idx) => {
        const displayPos = normalizePosition(p.position) || "";
        const skill = p.skill || 0;
        return `<li data-idx="${idx}">${displayPos} \u2014 ${p.name || "\u2014"} <span class="player-skill">(skill: ${skill})</span></li>`;
      };
      const startersList = (starters || []).map((p, i) => renderSimpleListItem(p, i)).join("");
      const subsList = (subs || []).map((p, i) => renderSimpleListItem(p, i)).join("");
      const startersHtml = `<div class="subs-col starters-col"><h3 style="margin:0 0 8px 0;">Onze Inicial</h3><ol class="intro-lineup-list">${startersList}</ol></div>`;
      const subsHtml = `<div class="subs-col subs-col-right"><h3 style="margin:0 0 8px 0;">Suplentes</h3><ol class="intro-lineup-list">${subsList}</ol></div>`;
      content.innerHTML = `${header}<div class="subs-columns">${startersHtml}${subsHtml}</div>`;
      overlay.innerHTML = "";
      overlay.appendChild(content);
      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
      });
      setTimeout(() => {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.display = "none";
          overlay.setAttribute("aria-hidden", "true");
          if (typeof cb === "function")
            cb();
        }, 360);
      }, 2200);
    } catch (e) {
      try {
        const L = getLogger();
        L.warn && L.warn("showIntroOverlay failed", e);
      } catch (_) {
      }
      if (typeof cb === "function")
        cb();
    }
  }
  if (typeof window !== "undefined") {
    window.Elifoot = window.Elifoot || {};
    window.Elifoot.Overlays = window.Elifoot.Overlays || {};
    window.Elifoot.Overlays.setIntroColors = window.Elifoot.Overlays.setIntroColors || setIntroColors;
    window.Elifoot.Overlays.showIntroOverlay = window.Elifoot.Overlays.showIntroOverlay || showIntroOverlay;
  }

  // src/ui/overlays/halftime.mjs
  var halftime_exports = {};
  __export(halftime_exports, {
    showHalfTimeSubsOverlay: () => showHalfTimeSubsOverlay
  });
  function getLogger2() {
    return window.Elifoot && window.Elifoot.Logger || console;
  }
  function showHalfTimeSubsOverlay(club, match, cb) {
    try {
      let applyPair = function(pairIndex) {
        const pr = pairs[pairIndex];
        if (!pr || pr.applied)
          return;
        const outIdx = pr.outIdx;
        const inIdx = pr.inIdx;
        if (isHome) {
          const outPlayer = match.homePlayers[outIdx];
          const incoming = match.homeSubs[inIdx];
          if (outPlayer && incoming) {
            match.homePlayers[outIdx] = incoming;
            const sidx = match.homeSubs.findIndex((s) => s.name === incoming.name);
            if (sidx >= 0)
              match.homeSubs.splice(sidx, 1);
            match.homeSubs.push(outPlayer);
          }
        } else {
          const outPlayer = match.awayPlayers[outIdx];
          const incoming = match.awaySubs[inIdx];
          if (outPlayer && incoming) {
            match.awayPlayers[outIdx] = incoming;
            const sidx = match.awaySubs.findIndex((s) => s.name === incoming.name);
            if (sidx >= 0)
              match.awaySubs.splice(sidx, 1);
            match.awaySubs.push(outPlayer);
          }
        }
        try {
          if (window.Elifoot && window.Elifoot.Lineups && typeof window.Elifoot.Lineups.reorderMatchByRoster === "function")
            window.Elifoot.Lineups.reorderMatchByRoster(club, match, isHome);
        } catch (e) {
        }
        pr.applied = true;
        renderLists();
        renderPairs();
        try {
          if (typeof window.updateMatchBoardLine === "function" && typeof match.index !== "undefined")
            window.updateMatchBoardLine(match.index, match);
        } catch (e) {
        }
      };
      const overlay = document.getElementById("subs-overlay");
      if (!overlay) {
        if (typeof cb === "function")
          cb();
        return;
      }
      const isHome = match.homeClub === club;
      const starters = isHome ? match.homePlayers || [] : match.awayPlayers || [];
      const subs = isHome ? match.homeSubs || [] : match.awaySubs || [];
      overlay.innerHTML = "";
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
      const hubMenu = document.getElementById("hub-menu");
      const hubMenuPrev = hubMenu ? { bg: hubMenu.style.getPropertyValue("--team-menu-bg"), fg: hubMenu.style.getPropertyValue("--team-menu-fg") } : null;
      let teamBg = club && club.team && club.team.bgColor || "#2e2e2e";
      let teamSec = club && club.team && club.team.color || "#ffffff";
      const fg = getReadableTextColor(teamBg, teamSec);
      const rgb = hexToRgb(teamBg) || [34, 34, 34];
      const panelBg = `linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.28)), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.9)`;
      try {
        if (hubMenu && club && club.team) {
          hubMenu.style.setProperty("--team-menu-bg", teamBg);
          hubMenu.style.setProperty("--team-menu-fg", fg);
        }
        overlay.style.setProperty("--subs-fg", fg);
        overlay.style.setProperty("--subs-overlay-bg", "rgba(0,0,0,0.66)");
        overlay.style.setProperty("--subs-panel-bg", panelBg);
      } catch (e) {
      }
      const panel = document.createElement("div");
      panel.className = "subs-panel";
      panel.style.color = fg;
      panel.style.maxHeight = "90vh";
      panel.style.overflow = "auto";
      panel.style.width = "min(1100px, 95vw)";
      const homeGoals = typeof match.homeGoals === "number" ? match.homeGoals : 0;
      const awayGoals = typeof match.awayGoals === "number" ? match.awayGoals : 0;
      const scoreText = `${homeGoals} - ${awayGoals}`;
      const rawSubsForPanel = subs || [];
      panel.innerHTML = [
        `<h2 style="background:${teamBg};color:${fg};padding:8px 0;border-radius:8px;margin:0 0 8px 0;">Substitui\xE7\xF5es ao Intervalo - ${club.team.name} <small style="margin-left:10px;opacity:0.9;font-weight:600;">(${scoreText})</small></h2>`,
        `<div class="subs-columns">`,
        `<div class="subs-col starters-col" style="background:rgba(255,255,255,0.02);color:${fg};"><h3 style="margin:0 0 8px 0;">Onze Inicial</h3><ol class="starters-list">${starters.map((p, si) => `<li data-si='${si}' data-name='${p.name}' data-pos='${p.position}'><span style="flex:0 0 36px;">${p.position}</span> <span class="player-name">${p.name}</span> <span class="player-skill">(skill: ${p.skill || 0})</span></li>`).join("")}</ol></div>`,
        `<div class="subs-col subs-col-right" style="background:rgba(0,0,0,0.04);color:${fg};"><h3 style="margin:0 0 8px 0;">Suplentes</h3><ul class="subs-list">${rawSubsForPanel.map((p, idx) => {
          const cls = normalizePosition(p.position || p.pos || "") === "GK" ? "is-gk" : "";
          return `<li class="${cls}" data-idx='${idx}' data-name='${p.name}' data-pos='${p.position}'><span class="player-pos-badge">${normalizePosition(p.position)}</span><span class="player-name">${p.name}</span><span class="player-skill">(skill: ${p.skill || 0})</span></li>`;
        }).join("")}</ul></div>`,
        `</div>`,
        `<div style="margin-top:12px; display:flex; gap:12px; align-items:center;">`,
        `<div id="subs-pairs" style="flex:1"></div>`,
        `<button id="subsBackToGameBtn" style="padding:10px 22px;font-size:1.1em;border-radius:8px;background:#fff;color:#222;border:none;cursor:pointer;box-shadow:0 2px 8px #0002;transition:background 0.2s;">Voltar ao Jogo</button>`,
        `</div>`,
        `<div class="subs-footer" style="margin-top:12px; font-size:0.9em; opacity:0.9; text-align:left;">Regras: apenas 5 substitui\xE7\xF5es; GR pode ser substitu\xEDdo s\xF3 por GR.</div>`
      ].join("");
      overlay.appendChild(panel);
      try {
        const teamRgb = hexToRgb(teamBg) || [34, 34, 34];
        const teamLum = luminance(teamRgb);
        const panelSurface = teamLum < 0.45 ? "rgba(255,255,255,0.94)" : "rgba(10,10,10,0.92)";
        const itemSurface = teamLum < 0.45 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.02)";
        const borderColor = teamLum < 0.45 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
        overlay.style.setProperty("--subs-panel-bg", panelSurface);
        panel.style.background = panelSurface;
        const panelTextColor = teamLum < 0.45 ? "#111" : "#fff";
        panel.style.color = panelTextColor;
        overlay.style.setProperty("--subs-fg", panelTextColor);
        panel.querySelectorAll(".subs-col").forEach((col) => {
          col.style.background = itemSurface;
          col.style.border = `1px solid ${borderColor}`;
          col.style.boxShadow = "inset 0 1px 0 rgba(0,0,0,0.04)";
          col.style.color = panelTextColor;
        });
        panel.querySelectorAll(".starters-list, .subs-list").forEach((list) => {
          list.style.maxHeight = "60vh";
          list.style.overflowY = "auto";
          list.style.margin = "0";
          list.style.padding = "6px";
          list.style.display = "block";
        });
        const liBgFull = teamLum < 0.45 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)";
        panel.querySelectorAll(".subs-list li, .starters-list li").forEach((li) => {
          li.style.borderBottom = "none";
          li.style.padding = "8px 12px";
          li.style.backgroundClip = "padding-box";
          li.style.color = panelTextColor;
          li.style.background = liBgFull;
          li.style.borderRadius = "8px";
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.justifyContent = "space-between";
        });
        const headerNode = panel.querySelector("h2");
        if (headerNode)
          headerNode.style.background = teamBg;
      } catch (e) {
      }
      setTimeout(() => {
        const backBtn = panel.querySelector("#subsBackToGameBtn");
        if (backBtn) {
          backBtn.onclick = () => {
            try {
              if (document.activeElement && typeof document.activeElement.blur === "function")
                document.activeElement.blur();
            } catch (e) {
            }
            try {
              if (selectedOut && typeof selectedOut.idx === "number" && selectedSubIdx !== null) {
                pairs.push({ outIdx: selectedOut.idx, inIdx: selectedSubIdx, applied: false });
                selectedOut = null;
                selectedSubIdx = null;
                renderPairs();
              }
              pairs.forEach((pr, idx) => {
                try {
                  if (!pr.applied)
                    applyPair(idx);
                } catch (e) {
                }
              });
            } catch (e) {
              try {
                const L = getLogger2();
                L.warn && L.warn("Error auto-applying substitutions on close", e);
              } catch (_) {
              }
            }
            if (hubMenu && hubMenuPrev) {
              if (hubMenuPrev.bg)
                hubMenu.style.setProperty("--team-menu-bg", hubMenuPrev.bg);
              if (hubMenuPrev.fg)
                hubMenu.style.setProperty("--team-menu-fg", hubMenuPrev.fg);
            }
            overlay.style.display = "none";
            overlay.setAttribute("aria-hidden", "true");
            if (typeof cb === "function")
              cb();
          };
        }
      }, 0);
      const pairsContainer = panel.querySelector("#subs-pairs");
      let selectedOut = null;
      let selectedSubIdx = null;
      const pairs = [];
      const renderLists = function() {
        const startersHtml = (isHome ? match.homePlayers : match.awayPlayers).map(
          (p, si) => `<li data-si="${si}" data-name="${p.name}" data-pos="${normalizePosition(p.position)}"><span style="flex:0 0 36px;">${normalizePosition(p.position)}</span> <span class="player-name">${p.name}</span> <span class="player-skill">(skill: ${p.skill || 0})</span></li>`
        ).join("");
        const rawSubs = isHome ? match.homeSubs || [] : match.awaySubs || [];
        const subsHtml = rawSubs.map((p, idx) => {
          const cls = normalizePosition(p.position || p.pos || "") === "GK" ? "is-gk" : "";
          return `<li class="${cls}" data-idx="${idx}" data-name="${p.name}" data-pos="${p.position}"><span class="player-pos-badge">${normalizePosition(p.position)}</span> <span class="player-name">${p.name}</span> <span class="player-skill">(skill: ${p.skill || 0})</span></li>`;
        }).join("");
        const startersCol = panel.querySelector(".starters-col .starters-list");
        const subsCol = panel.querySelector(".subs-col-right .subs-list");
        if (startersCol)
          startersCol.innerHTML = startersHtml;
        if (subsCol)
          subsCol.innerHTML = subsHtml;
        attachListHandlers();
      };
      const renderPairs = function() {
        pairsContainer.innerHTML = `<strong>Trocas:</strong><ul>${pairs.map((pr, i) => {
          const out = (isHome ? match.homePlayers : match.awayPlayers)[pr.outIdx] || { name: "-", position: "" };
          const incoming = (isHome ? match.homeSubs : match.awaySubs)[pr.inIdx] || { name: "-", position: "" };
          const appliedCls = pr.applied ? "applied" : "";
          const statusNode = pr.applied ? `<button disabled>aplicada</button>` : `<span class="pending">pendente</span>`;
          return `<li class="${appliedCls}" data-pair="${i}">${normalizePosition(out.position)} ${out.name} \u2192 ${normalizePosition(incoming.position)} ${incoming.name} ${statusNode} <button data-remove="${i}">remover</button></li>`;
        }).join("")}</ul>`;
        pairsContainer.querySelectorAll("button[data-remove]").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const idx = Number(btn.getAttribute("data-remove"));
            const pr = pairs[idx];
            if (!pr)
              return;
            const outNode = panel.querySelector(`.starters-list li[data-si="${pr.outIdx}"]`);
            const inNode = panel.querySelector(`.subs-list li[data-idx="${pr.inIdx}"]`);
            if (outNode)
              outNode.classList.remove("paired");
            if (inNode)
              inNode.classList.remove("paired");
            pairs.splice(idx, 1);
            renderPairs();
            const MAX_SUBS = window.Elifoot && window.Elifoot.GameConfig && window.Elifoot.GameConfig.rules && window.Elifoot.GameConfig.rules.maxSubs || 5;
            if (pairs.length < MAX_SUBS) {
              panel.querySelectorAll(".starters-list li.disabled").forEach((n) => n.classList.remove("disabled"));
              panel.querySelectorAll(".subs-list li.disabled").forEach((n) => n.classList.remove("disabled"));
            }
          });
        });
      };
      const attachListHandlers = function() {
        panel.querySelectorAll(".starters-list li").forEach((n) => {
          n.classList.remove("paired");
          n.classList.remove("disabled");
        });
        panel.querySelectorAll(".subs-list li").forEach((n) => {
          n.classList.remove("paired");
          n.classList.remove("disabled");
        });
        panel.querySelectorAll(".subs-list li").forEach((n) => n.classList.remove("selected-out"));
        if (selectedOut && typeof selectedOut.idx === "number") {
          panel.querySelectorAll(".starters-list li").forEach((n) => n.classList.remove("selected-out"));
          const outNode = panel.querySelector(`.starters-list li[data-si="${selectedOut.idx}"]`);
          if (outNode)
            outNode.classList.add("selected-out");
        }
        const startersNodes = panel.querySelectorAll(".starters-list li");
        const subsNodes = panel.querySelectorAll(".subs-list li");
        const maybeShowConfirm = function() {
          if (selectedOut && typeof selectedOut.idx === "number" && selectedSubIdx !== null) {
            const out = selectedOut.player;
            const inIdx = selectedSubIdx;
            const incoming = (isHome ? match.homeSubs : match.awaySubs)[inIdx];
            const ENFORCE_GK_ONLY = (window.Elifoot && window.Elifoot.GameConfig && window.Elifoot.GameConfig.rules && window.Elifoot.GameConfig.rules.enforceGkOnlySwap) !== false;
            if (ENFORCE_GK_ONLY) {
              if (out.position === "GK" && incoming.position !== "GK") {
                const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                if (subNode) {
                  subNode.classList.add("invalid-swap");
                  setTimeout(() => subNode.classList.remove("invalid-swap"), 400);
                }
                return;
              }
              if (incoming.position === "GK" && out.position !== "GK") {
                const teamPlayers = isHome ? match.homePlayers || [] : match.awayPlayers || [];
                const hasSentOffGk = teamPlayers.some((p) => p && p.sentOff && String(p.position || "").toUpperCase() === "GK");
                if (!hasSentOffGk) {
                  const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                  if (subNode) {
                    subNode.classList.add("invalid-swap");
                    setTimeout(() => subNode.classList.remove("invalid-swap"), 400);
                  }
                  return;
                }
              }
            }
            const confirmDiv = document.createElement("div");
            confirmDiv.className = "subs-confirm-prompt";
            confirmDiv.style.position = "fixed";
            confirmDiv.style.left = "0";
            confirmDiv.style.top = "0";
            confirmDiv.style.width = "100vw";
            confirmDiv.style.height = "100vh";
            confirmDiv.style.background = "rgba(0,0,0,0.45)";
            confirmDiv.style.display = "flex";
            confirmDiv.style.alignItems = "center";
            confirmDiv.style.justifyContent = "center";
            confirmDiv.style.zIndex = "40000";
            confirmDiv.style.pointerEvents = "auto";
            confirmDiv.innerHTML = `<div style="background:${teamBg};color:${fg};padding:32px 24px;border-radius:12px;box-shadow:0 2px 16px #0008;min-width:320px;max-width:90vw;text-align:center;">
                        <h3>Confirmar Substitui\xE7\xE3o?</h3>
                        <div style='margin:12px 0;font-size:1.1em;'>${out.position} <b>${out.name}</b> \u2192 ${incoming.position} <b>${incoming.name}</b></div>
                        <button id="subsDoConfirmBtn" style="margin-right:16px;">Confirmar</button>
                        <button id="subsDoCancelBtn">Cancelar</button>
                    </div>`;
            document.body.appendChild(confirmDiv);
            confirmDiv.querySelector("#subsDoConfirmBtn").onclick = () => {
              try {
                const outNode = panel.querySelector(`.starters-list li[data-si="${selectedOut.idx}"]`);
                const subNode = panel.querySelector(`.subs-list li[data-idx="${inIdx}"]`);
                if (outNode)
                  outNode.classList.add("paired");
                if (subNode)
                  subNode.classList.add("paired");
                pairs.push({ outIdx: selectedOut.idx, inIdx, applied: false });
                const pairIndex = pairs.length - 1;
                applyPair(pairIndex);
                const MAX_SUBS = window.Elifoot && window.Elifoot.GameConfig && window.Elifoot.GameConfig.rules && window.Elifoot.GameConfig.rules.maxSubs || 5;
                if (pairs.length >= MAX_SUBS) {
                  panel.querySelectorAll(".starters-list li:not(.paired)").forEach((n) => n.classList.add("disabled"));
                  panel.querySelectorAll(".subs-list li:not(.paired)").forEach((n) => n.classList.add("disabled"));
                }
              } catch (err) {
                try {
                  const L = getLogger2();
                  L.warn && L.warn("Error applying substitution on confirm", err);
                } catch (_) {
                }
              } finally {
                try {
                  document.body.removeChild(confirmDiv);
                } catch (_) {
                }
                selectedOut = null;
                selectedSubIdx = null;
                panel.querySelectorAll(".starters-list li").forEach((n) => n.classList.remove("selected-out"));
              }
            };
            confirmDiv.querySelector("#subsDoCancelBtn").onclick = () => {
              document.body.removeChild(confirmDiv);
              selectedSubIdx = null;
            };
          }
        };
        startersNodes.forEach((node) => {
          node.addEventListener("click", () => {
            const si = Number(node.getAttribute("data-si"));
            if (node.classList.contains("disabled") || node.classList.contains("paired"))
              return;
            if (selectedOut && selectedOut.idx === si) {
              node.classList.remove("selected-out");
              selectedOut = null;
              return;
            }
            panel.querySelectorAll(".starters-list li").forEach((n) => n.classList.remove("selected-out"));
            panel.querySelectorAll(".subs-list li").forEach((n) => n.classList.remove("selected-out"));
            node.classList.add("selected-out");
            selectedOut = { idx: si, player: (isHome ? match.homePlayers : match.awayPlayers)[si] };
            maybeShowConfirm();
          });
        });
        subsNodes.forEach((node) => {
          node.addEventListener("click", () => {
            if (node.classList.contains("disabled") || node.classList.contains("paired"))
              return;
            if (!selectedOut)
              return;
            const inIdx = Number(node.getAttribute("data-idx"));
            selectedSubIdx = inIdx;
            maybeShowConfirm();
          });
        });
      };
      renderLists();
      renderPairs();
    } catch (e) {
      try {
        const L = getLogger2();
        L.warn && L.warn("showHalfTimeSubsOverlay failed", e);
      } catch (_) {
      }
      if (typeof cb === "function")
        cb();
    }
  }

  // src/ui/overlays/seasonSummary.mjs
  var seasonSummary_exports = {};
  __export(seasonSummary_exports, {
    showSeasonSummaryOverlay: () => showSeasonSummaryOverlay
  });
  function showSeasonSummaryOverlay(summary, cb) {
    try {
      const overlay = document.getElementById("season-summary-overlay");
      if (!overlay) {
        if (typeof cb === "function")
          cb();
        return;
      }
      overlay.innerHTML = "";
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
      const panel = document.createElement("div");
      panel.className = "season-summary-panel";
      panel.style.width = "min(1100px, 96vw)";
      panel.style.maxHeight = "90vh";
      panel.style.overflow = "auto";
      panel.style.padding = "18px";
      panel.style.borderRadius = "12px";
      const clubNames = summary && summary.clubs ? summary.clubs.map((c) => c.name).join(", ") : "";
      const title = `Resumo da Temporada ${summary && summary.season ? summary.season : ""}`;
      panel.innerHTML = `<h2 style="margin:0 0 12px 0;">${title}</h2><div style="margin-bottom:8px;color:rgba(0,0,0,0.6);">Clubes: ${clubNames}</div>`;
      const sections = [];
      if (summary.topScorers && summary.topScorers.length) {
        sections.push("<section><h3>Artilheiros</h3><ol>" + summary.topScorers.map((s) => `<li>${s.player} (${s.club}) - ${s.goals}</li>`).join("") + "</ol></section>");
      }
      if (summary.assists && summary.assists.length) {
        sections.push("<section><h3>Assist\xEAncias</h3><ol>" + summary.assists.map((s) => `<li>${s.player} (${s.club}) - ${s.assists}</li>`).join("") + "</ol></section>");
      }
      if (summary.awards && summary.awards.length) {
        sections.push("<section><h3>Pr\xEAmios</h3><ul>" + summary.awards.map((a) => `<li>${a.title} - ${a.player} (${a.club})</li>`).join("") + "</ul></section>");
      }
      panel.innerHTML += sections.join("");
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Fechar";
      closeBtn.style.marginTop = "12px";
      closeBtn.style.padding = "8px 12px";
      closeBtn.style.borderRadius = "8px";
      closeBtn.onclick = () => {
        overlay.style.display = "none";
        overlay.setAttribute("aria-hidden", "true");
        if (typeof cb === "function")
          cb();
      };
      overlay.appendChild(panel);
      overlay.appendChild(closeBtn);
      try {
        const dominantColor = summary && summary.dominantColor || "#2e2e2e";
        const rgb = hexToRgb(dominantColor) || [34, 34, 34];
        const fg = getReadableTextColor(dominantColor, "#ffffff");
        panel.style.background = `linear-gradient(rgba(0,0,0,0.06), rgba(0,0,0,0.02)), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.96)`;
        panel.style.color = fg;
      } catch (e) {
      }
    } catch (e) {
      console.warn("showSeasonSummaryOverlay failed", e);
      if (typeof cb === "function")
        cb();
    }
  }

  // src/ui/overlays/index.mjs
  var Overlays = {
    ...intro_exports,
    ...halftime_exports,
    ...seasonSummary_exports
  };
  if (!window.Elifoot)
    window.Elifoot = {};
  if (!window.Elifoot.Overlays)
    window.Elifoot.Overlays = {};
  Object.assign(window.Elifoot.Overlays, Overlays);

  // src/main.js
  var allDivisions = [];
  var playerClub = null;
  var allClubs = [];
  var coachName = "";
  var currentJornada = 1;
  var currentRoundMatches = [];
  var isSimulating = false;
  var simIntervalId = null;
  if (typeof window !== "undefined") {
    window.GAME_NAME = window.GAME_NAME || "FootLab t1";
    try {
      if (typeof document !== "undefined")
        document.title = window.GAME_NAME;
    } catch (e) {
    }
  }
  var MainLogger = typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : console;
  function getLogger3() {
    return typeof window !== "undefined" && window.Elifoot && window.Elifoot.Logger ? window.Elifoot.Logger : MainLogger || console;
  }
  function setupInitialUiHandlers() {
    const introBtn = document.getElementById("introContinueBtn");
    if (introBtn) {
      introBtn.addEventListener("click", () => {
        const intro = document.getElementById("intro-screen");
        const setup = document.getElementById("screen-setup");
        if (intro)
          intro.style.display = "none";
        if (setup)
          setup.style.display = "flex";
      });
    }
    try {
      const intro = document.getElementById("intro-screen");
      const setup = document.getElementById("screen-setup");
      if (intro && setup) {
        intro.style.transition = intro.style.transition || "opacity 600ms ease, transform 600ms ease";
        setup.style.transition = setup.style.transition || "opacity 600ms ease, transform 600ms ease";
        setTimeout(() => {
          try {
            intro.style.opacity = "0";
            intro.style.transform = "translateY(-8px) scale(0.995)";
          } catch (e) {
          }
          setTimeout(() => {
            try {
              intro.style.display = "none";
            } catch (e) {
            }
            try {
              setup.style.display = "flex";
              setup.style.opacity = "0";
              setup.style.transform = "translateY(6px)";
              setup.offsetWidth;
              setup.style.opacity = "1";
              setup.style.transform = "none";
            } catch (e) {
            }
          }, 620);
        }, 900);
      }
    } catch (e) {
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupInitialUiHandlers);
  } else {
    try {
      setupInitialUiHandlers();
    } catch (e) {
      try {
        const L = getLogger3();
        L.warn && L.warn("setupInitialUiHandlers failed", e);
      } catch (_) {
      }
    }
  }
  function formatMoney2(value) {
    if (!value && value !== 0)
      return "0 \u20AC";
    return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " \u20AC";
  }
  var _startBtn = document.getElementById("startBtn");
  if (!_startBtn) {
    try {
      const L = getLogger3();
      L.error && L.error("startBtn not found in DOM; cannot start game.");
    } catch (_) {
    }
  } else {
    _startBtn.addEventListener("click", () => {
      coachName = document.getElementById("coachName").value.trim();
      if (!coachName) {
        alert("Digite o nome do treinador!");
        return;
      }
      if (typeof generateAllClubs === "function") {
        allClubs = generateAllClubs();
        allDivisions = [[], [], [], []];
        allClubs.forEach((club) => {
          if (club.division >= 1 && club.division <= 4) {
            allDivisions[club.division - 1].push(club);
          }
        });
        const division4 = allDivisions[3];
        if (!Array.isArray(division4) || division4.length === 0) {
          alert("N\xE3o existem clubes na Divis\xE3o 4 para escolher o seu clube.");
          return;
        }
        try {
          if (typeof assignRandomShortContracts === "function") {
            assignRandomShortContracts(allDivisions);
          }
        } catch (e) {
          try {
            const L = getLogger3();
            L.warn && L.warn("assignRandomShortContracts failed", e);
          } catch (_) {
          }
        }
        try {
          if (typeof markSomeContractsExpiring === "function") {
            markSomeContractsExpiring(allDivisions, 0.12);
          }
        } catch (e) {
          try {
            const L = getLogger3();
            L.warn && L.warn("markSomeContractsExpiring failed", e);
          } catch (_) {
          }
        }
        const pool = division4.length > 8 ? division4.slice(-8) : division4.slice();
        let pickedClub = pool[Math.floor(Math.random() * pool.length)];
        playerClub = pickedClub;
        window.playerClub = playerClub;
        window.allDivisions = allDivisions;
        window.Elifoot = window.Elifoot || {};
        window.Elifoot.playerClub = playerClub;
        window.Elifoot.allDivisions = allDivisions;
        try {
          const L = getLogger3();
          L.debug && L.debug("Clube do jogador selecionado:", playerClub);
        } catch (_) {
        }
        try {
          const L = getLogger3();
          L.debug && L.debug("Equipa do clube:", playerClub.team);
        } catch (_) {
        }
        try {
          const L = getLogger3();
          L.debug && L.debug("Jogadores da equipa:", playerClub.team.players);
        } catch (_) {
        }
        try {
          const L = getLogger3();
          L.debug && L.debug(
            "N\xFAmero de jogadores:",
            playerClub.team.players ? playerClub.team.players.length : 0
          );
        } catch (_) {
        }
        if (typeof applySkillCaps === "function") {
          try {
            applySkillCaps(allDivisions);
            try {
              const L = getLogger3();
              L.debug && L.debug("applySkillCaps executed");
            } catch (_) {
            }
          } catch (e) {
            try {
              const L = getLogger3();
              L.warn && L.warn("applySkillCaps failed", e);
            } catch (_) {
            }
          }
        }
        if (typeof generateRounds === "function") {
          const firstRoundMatches = [];
          allDivisions.forEach((divisionClubs) => {
            const rounds = generateRounds(divisionClubs);
            if (rounds.length > 0) {
              firstRoundMatches.push(...rounds[0]);
            }
          });
          currentRoundMatches = firstRoundMatches;
          window.currentRoundMatches = currentRoundMatches;
          window.Elifoot = window.Elifoot || {};
          window.Elifoot.currentRoundMatches = currentRoundMatches;
          if (Array.isArray(currentRoundMatches)) {
            const _assign = typeof window !== "undefined" && (window.assignStartingLineups || window.Elifoot && window.Elifoot.assignStartingLineups);
            if (typeof _assign === "function")
              _assign(currentRoundMatches);
          }
          const proceedToMatch = function() {
            document.getElementById("screen-hub").style.display = "none";
            document.getElementById("screen-match").style.display = "flex";
            try {
              const nextFloat = document.getElementById("nextOpponentFloating");
              if (nextFloat && nextFloat.parentNode) {
                nextFloat.parentNode.removeChild(nextFloat);
              }
              const budgetFloat = document.getElementById("budgetFloating");
              if (budgetFloat && budgetFloat.parentNode) {
                budgetFloat.parentNode.removeChild(budgetFloat);
              }
            } catch (e) {
            }
            const matchTeamNameEl = document.getElementById("playerTeamNameMatch");
            if (matchTeamNameEl)
              matchTeamNameEl.textContent = "";
            const hubTeamNameEl = document.getElementById("playerTeamNameHub");
            if (hubTeamNameEl)
              hubTeamNameEl.textContent = "";
            const teamFooterEl = document.getElementById("playerTeamNameFooter");
            if (teamFooterEl)
              teamFooterEl.textContent = "";
            if (typeof renderInitialMatchBoard === "function") {
              renderInitialMatchBoard(allDivisions);
            } else {
              try {
                const L = getLogger3();
                L.error && L.error("Fun\xE7\xE3o renderInitialMatchBoard n\xE3o encontrada (ui.js).");
              } catch (_) {
              }
              isSimulating = false;
              return;
            }
          };
          try {
            const setupScreen = document.getElementById("screen-setup");
            if (setupScreen)
              setupScreen.style.display = "none";
            const hubScreen = document.getElementById("screen-hub");
            if (hubScreen)
              hubScreen.style.display = "flex";
            if (typeof initHubUI === "function") {
              try {
                initHubUI();
              } catch (e) {
                try {
                  const L = getLogger3();
                  L.warn && L.warn("initHubUI threw during start flow:", e);
                } catch (_) {
                }
                if (typeof renderHubContent === "function")
                  try {
                    renderHubContent("menu-team");
                  } catch (_) {
                  }
              }
            } else if (typeof renderHubContent === "function") {
              try {
                renderHubContent("menu-team");
              } catch (e) {
                try {
                  const L = getLogger3();
                  L.warn && L.warn("renderHubContent failed during start flow:", e);
                } catch (_) {
                }
              }
            }
          } catch (e) {
            try {
              const L = getLogger3();
              L.warn && L.warn("Failed to show hub after team selection:", e);
            } catch (_) {
            }
          }
        }
        const endSimulation = function() {
          if (simIntervalId) {
            clearInterval(simIntervalId);
            simIntervalId = null;
          }
          {
            const _updateClubStats = typeof window !== "undefined" && (window.updateClubStatsAfterMatches || window.Elifoot && window.Elifoot.updateClubStatsAfterMatches);
            if (typeof _updateClubStats === "function") {
              _updateClubStats(currentRoundMatches);
            } else {
              try {
                const L = getLogger3();
                L.error && L.error("Fun\xE7\xE3o updateClubStatsAfterMatches n\xE3o encontrada (matches.js).");
              } catch (_) {
              }
            }
          }
          const progressContainer = document.getElementById("progress-container");
          if (progressContainer)
            progressContainer.style.display = "none";
          try {
            isSimulating = false;
            if (typeof finishDayAndReturnToHub === "function") {
              finishDayAndReturnToHub();
              return;
            }
            document.getElementById("screen-match").style.display = "none";
            document.getElementById("screen-hub").style.display = "flex";
            if (typeof renderHubContent === "function")
              renderHubContent("menu-standings");
          } catch (err) {
            try {
              const L = getLogger3();
              L.warn && L.warn("endSimulation: could not switch to standings view", err);
            } catch (_) {
            }
          }
        };
        const finishDayAndReturnToHub = function() {
          var _a, _b, _c, _d, _e, _f;
          try {
            if (Array.isArray(currentRoundMatches)) {
              currentRoundMatches.forEach((m) => {
                if (m)
                  m.isFinished = true;
              });
              {
                const _updateClubStats = typeof window !== "undefined" && (window.updateClubStatsAfterMatches || window.Elifoot && window.Elifoot.updateClubStatsAfterMatches);
                if (typeof _updateClubStats === "function") {
                  _updateClubStats(currentRoundMatches);
                  try {
                    const L = getLogger3();
                    L.debug && L.debug(
                      "finishDayAndReturnToHub: updateClubStatsAfterMatches executed for current round"
                    );
                  } catch (_) {
                  }
                }
              }
            }
          } catch (e) {
            try {
              const L = getLogger3();
              L.warn && L.warn("finishDayAndReturnToHub: error finalizing matches", e);
            } catch (_) {
            }
          }
          currentJornada++;
          document.getElementById("screen-match").style.display = "none";
          document.getElementById("screen-hub").style.display = "flex";
          isSimulating = false;
          const jornadaDisplayEl = document.getElementById("currentJornadaDisplay");
          if (jornadaDisplayEl)
            jornadaDisplayEl.textContent = `${currentJornada}\xAA JORNADA`;
          const hubTeamNameEl = document.getElementById("playerTeamNameHub");
          if (hubTeamNameEl && playerClub && playerClub.team)
            hubTeamNameEl.textContent = playerClub.team.name;
          const teamFooterEl = document.getElementById("playerTeamNameFooter");
          if (teamFooterEl && playerClub && playerClub.team)
            teamFooterEl.textContent = playerClub.team.name;
          const progressContainer = document.getElementById("progress-container");
          if (progressContainer)
            progressContainer.style.display = "block";
          const finishBtn = document.getElementById("finishSimBtn");
          if (finishBtn)
            finishBtn.style.display = "none";
          if (typeof generateRounds === "function") {
            const nextRoundMatches = [];
            allDivisions.forEach((divisionClubs) => {
              const rounds = generateRounds(divisionClubs);
              if (!Array.isArray(rounds) || rounds.length === 0) {
                try {
                  const L = getLogger3();
                  L.warn && L.warn("generateRounds retornou vazio para uma divis\xE3o");
                } catch (_) {
                }
                return;
              }
              let roundIndex = (currentJornada - 1) % rounds.length;
              try {
                if (playerClub && Array.isArray(currentRoundMatches) && currentRoundMatches.length) {
                  const isPlayerInThisDivision = divisionClubs.some((dc) => dc === playerClub);
                  if (isPlayerInThisDivision) {
                    const lastMatch = currentRoundMatches.find(
                      (m) => m && (m.homeClub === playerClub || m.awayClub === playerClub)
                    );
                    const lastOpponent = lastMatch ? lastMatch.homeClub === playerClub ? lastMatch.awayClub : lastMatch.homeClub : null;
                    if (lastOpponent) {
                      let tries = 0;
                      while (tries < rounds.length) {
                        const candidateRound = rounds[roundIndex];
                        if (!Array.isArray(candidateRound))
                          break;
                        const candidateMatch = candidateRound.find(
                          (m) => m && (m.homeClub === playerClub || m.awayClub === playerClub)
                        );
                        if (!candidateMatch)
                          break;
                        const candidateOpp = candidateMatch.homeClub === playerClub ? candidateMatch.awayClub : candidateMatch.homeClub;
                        if (!candidateOpp || !candidateOpp.team || !lastOpponent.team)
                          break;
                        if (candidateOpp.team.name !== lastOpponent.team.name) {
                          break;
                        }
                        roundIndex = (roundIndex + 1) % rounds.length;
                        tries++;
                      }
                    }
                  }
                }
              } catch (e) {
                try {
                  const L = getLogger3();
                  L.warn && L.warn("Erro ao evitar repeti\xE7\xE3o de advers\xE1rio na gera\xE7\xE3o de rondas:", e);
                } catch (_) {
                }
              }
              if (rounds[roundIndex]) {
                nextRoundMatches.push(...rounds[roundIndex]);
              } else {
                try {
                  const L = getLogger3();
                  L.warn && L.warn("\xCDndice de jornada fora de alcance:", roundIndex, "de", rounds.length);
                } catch (_) {
                }
              }
            });
            currentRoundMatches = nextRoundMatches;
            window.currentRoundMatches = currentRoundMatches;
            try {
              const L = getLogger3();
              L.info && L.info(
                "finishDayAndReturnToHub: jornada",
                currentJornada,
                "gerou",
                currentRoundMatches.length,
                "jogos"
              );
            } catch (_) {
            }
            const sampleMatch = currentRoundMatches[0];
            if (sampleMatch) {
              try {
                const L = getLogger3();
                L.debug && L.debug("Exemplo de jogo gerado:", {
                  home: (_b = (_a = sampleMatch.homeClub) == null ? void 0 : _a.team) == null ? void 0 : _b.name,
                  away: (_d = (_c = sampleMatch.awayClub) == null ? void 0 : _c.team) == null ? void 0 : _d.name,
                  homePlayers: (_e = sampleMatch.homePlayers) == null ? void 0 : _e.length,
                  awayPlayers: (_f = sampleMatch.awayPlayers) == null ? void 0 : _f.length
                });
              } catch (_) {
              }
            }
            try {
              const _assign = typeof window !== "undefined" && (window.assignStartingLineups || window.Elifoot && window.Elifoot.assignStartingLineups);
              if (typeof _assign === "function")
                _assign(currentRoundMatches);
              try {
                const L = getLogger3();
                L.info && L.info("Lineups atribu\xEDdas para pr\xF3xima jornada");
              } catch (_) {
              }
            } catch (e) {
              try {
                const L = getLogger3();
                L.error && L.error("ERRO ao atribuir lineups:", e);
              } catch (_) {
              }
            }
            try {
              const dbg = {
                currentJornada,
                generatedMatchesCount: currentRoundMatches.length,
                matches: currentRoundMatches
              };
              if (window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.saveDebugSnapshot === "function") {
                try {
                  window.Elifoot.Persistence.saveDebugSnapshot(dbg);
                } catch (e) {
                }
              } else {
                try {
                  localStorage.setItem("elifoot_debug_snapshot", JSON.stringify(dbg));
                } catch (e) {
                  try {
                    const L = getLogger3();
                    L.warn && L.warn("Could not write debug snapshot to localStorage", e);
                  } catch (_) {
                  }
                }
              }
            } catch (e) {
              try {
                const L = getLogger3();
                L.warn && L.warn("Could not write debug snapshot", e);
              } catch (_) {
              }
            }
            try {
              const snap = {
                currentJornada,
                playerClub,
                allDivisions,
                allClubs,
                currentRoundMatches
              };
              if (window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.saveSnapshot === "function") {
                try {
                  window.Elifoot.Persistence.saveSnapshot(snap);
                } catch (e) {
                }
              } else {
                try {
                  localStorage.setItem("elifoot_save_snapshot", JSON.stringify(snap));
                } catch (err) {
                  try {
                    const L = getLogger3();
                    L.warn && L.warn("Could not write snapshot to localStorage", err);
                  } catch (_) {
                  }
                }
              }
            } catch (err) {
              try {
                const L = getLogger3();
                L.warn && L.warn("Erro ao guardar snapshot:", err);
              } catch (_) {
              }
            }
          }
          try {
            if (typeof seasonalSkillDrift === "function") {
              seasonalSkillDrift(allDivisions);
            }
          } catch (err) {
            try {
              const L = getLogger3();
              L.warn && L.warn("Erro em seasonalSkillDrift:", err);
            } catch (_) {
            }
          }
          try {
            if (typeof selectExpiringPlayersToLeave === "function") {
              selectExpiringPlayersToLeave(allDivisions, { probability: 0.35, maxPerClub: 1 });
            }
          } catch (err) {
            try {
              const L = getLogger3();
              L.warn && L.warn("selectExpiringPlayersToLeave failed:", err);
            } catch (_) {
            }
          }
          try {
            if (typeof selectPlayersForRelease === "function") {
              selectPlayersForRelease(allDivisions, { probability: 0.02, maxPerClub: 1 });
            }
          } catch (err) {
            try {
              const L = getLogger3();
              L.warn && L.warn("selectPlayersForRelease failed:", err);
            } catch (_) {
            }
          }
          if (typeof renderHubContent === "function") {
            if (window.Offers && typeof window.Offers.showPendingReleasesPopup === "function") {
              window.Offers.showPendingReleasesPopup(() => {
                try {
                  renderHubContent("menu-team");
                } catch (e) {
                  try {
                    const L = getLogger3();
                    L.warn && L.warn("renderHubContent failed after offers popup", e);
                  } catch (_) {
                  }
                }
                try {
                  if (typeof window.updateBudgetDisplays === "function")
                    window.updateBudgetDisplays(playerClub);
                } catch (e) {
                }
              });
            } else {
              renderHubContent("menu-team");
              try {
                if (typeof window.updateBudgetDisplays === "function")
                  window.updateBudgetDisplays(playerClub);
              } catch (e) {
              }
            }
          }
          try {
            if (Array.isArray(allClubs)) {
              allClubs.forEach((club) => {
                if (club && club.team && Array.isArray(club.team.players)) {
                  club.team.players.forEach((p) => {
                    if (p && typeof p.suspendedGames === "number" && p.suspendedGames > 0) {
                      p.suspendedGames = Math.max(0, p.suspendedGames - 1);
                    }
                    if (p)
                      p.yellowCards = 0;
                    if (p)
                      p.sentOff = false;
                  });
                }
              });
            }
          } catch (e) {
            try {
              const L = getLogger3();
              L.warn && L.warn("Erro ao decrementar suspens\xF5es:", e);
            } catch (_) {
            }
          }
        };
        window.formatMoney = formatMoney2;
        window.simulateDay = simulateDay;
        window.Elifoot = window.Elifoot || {};
        window.Elifoot.formatMoney = formatMoney2;
        window.Elifoot.simulateDay = simulateDay;
        const loadSavedGame = function() {
          try {
            const snap = window.Elifoot && window.Elifoot.Persistence && typeof window.Elifoot.Persistence.loadSnapshot === "function" ? window.Elifoot.Persistence.loadSnapshot() : function() {
              try {
                const raw = localStorage.getItem("elifoot_save_snapshot");
                return raw ? JSON.parse(raw) : null;
              } catch (e) {
                return null;
              }
            }();
            if (!snap) {
              alert("Nenhum jogo salvo encontrado.");
              return;
            }
            allDivisions = snap.allDivisions || allDivisions;
            allClubs = snap.allClubs || allClubs;
            currentRoundMatches = snap.currentRoundMatches || currentRoundMatches;
            playerClub = snap.playerClub || playerClub;
            currentJornada = snap.currentJornada || currentJornada;
            window.playerClub = playerClub;
            window.allDivisions = allDivisions;
            window.currentRoundMatches = currentRoundMatches;
            window.Elifoot = window.Elifoot || {};
            window.Elifoot.playerClub = playerClub;
            window.Elifoot.allDivisions = allDivisions;
            window.Elifoot.currentRoundMatches = currentRoundMatches;
            try {
              const _assign = typeof window !== "undefined" && (window.assignStartingLineups || window.Elifoot && window.Elifoot.assignStartingLineups);
              if (typeof _assign === "function")
                _assign(currentRoundMatches);
            } catch (e) {
            }
            startGame();
          } catch (err) {
            try {
              const L = getLogger3();
              L.error && L.error("Erro ao carregar jogo salvo:", err);
            } catch (_) {
            }
            alert("Erro ao carregar o jogo salvo. Verifica o console.");
          }
        };
        window.loadSavedGame = loadSavedGame;
      }
    });
  }
})();
//# sourceMappingURL=app.bundle.js.map
