// ui.js — lightweight compatibility shim
// Purpose: expose legacy global functions but delegate heavy work to extracted modules
// (ui/hub.js, ui/matchBoard.js, ui/overlays.js, ui/tactics.js). Keep this file small.

(function(){
    'use strict';

    // Color helpers - use the centralized `window.ColorUtils` implementation.
    // Keep tiny fallback behavior so the UI doesn't throw if ColorUtils isn't present.
    function hexToRgb(hex) {
        if (window.ColorUtils && typeof window.ColorUtils.hexToRgb === 'function') return window.ColorUtils.hexToRgb(hex);
        if (!hex) return null;
        // minimal safe parse
        const h = String(hex).replace('#','').trim();
        if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
        if (h.length === 6) return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
        return null;
    }

    function luminance(rgb) {
        if (window.ColorUtils && typeof window.ColorUtils.luminance === 'function') return window.ColorUtils.luminance(rgb);
        if (!rgb) return 0;
        const s = rgb.map(v => { const c = v/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); });
        return 0.2126*s[0] + 0.7152*s[1] + 0.0722*s[2];
    }

    function getReadableTextColor(bgHex, preferredHex) {
        if (window.ColorUtils && typeof window.ColorUtils.getReadableTextColor === 'function') return window.ColorUtils.getReadableTextColor(bgHex, preferredHex);
        return preferredHex || '#ffffff';
    }

    // UI small helpers that remain here
    function updateDayProgress(minute) {
        const progress = document.getElementById('dayProgress');
        if (progress) progress.style.width = `${(minute/90) * 100}%`;
    }

    // Overlay delegators
    function setIntroColors(club) {
        if (window.Overlays && typeof window.Overlays.setIntroColors === 'function') return window.Overlays.setIntroColors(club);
        const bg = (club && club.team && club.team.bgColor) || '#222';
        const fg = (club && club.team && club.team.color) || '#fff';
        const overlay = document.getElementById('intro-overlay');
        if (overlay) {
            overlay.style.setProperty('--intro-bg', bg);
            overlay.style.setProperty('--intro-fg', fg);
        }
        return { bg, fg };
    }

    function showIntroOverlay(club, cb) {
        if (window.Overlays && typeof window.Overlays.showIntroOverlay === 'function') return window.Overlays.showIntroOverlay(club, cb);
        const overlay = document.getElementById('intro-overlay');
        if (!overlay) { if (typeof cb === 'function') cb(); return; }
        overlay.style.display = 'flex'; overlay.style.opacity = '1';
        setTimeout(()=>{ overlay.style.opacity = '0'; setTimeout(()=>{ overlay.style.display = 'none'; if (typeof cb === 'function') cb(); },300); }, 1200);
    }

    function showHalfTimeSubsOverlay(club, match, cb) {
        if (window.Overlays && typeof window.Overlays.showHalfTimeSubsOverlay === 'function') return window.Overlays.showHalfTimeSubsOverlay(club, match, cb);
        const overlay = document.getElementById('subs-overlay');
        if (!overlay) { if (typeof cb === 'function') cb(); return; }
        overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden','false');
        setTimeout(()=>{ overlay.style.display = 'none'; overlay.setAttribute('aria-hidden','true'); if (typeof cb === 'function') cb(); }, 800);
    }

    // Delegators to the extracted modules (Hub, MatchBoard, Tactics)
    function initHubUI() { if (window.Hub && typeof window.Hub.initHubUI === 'function') return window.Hub.initHubUI(); }
    function renderHubContent(menuId) { if (window.Hub && typeof window.Hub.renderHubContent === 'function') return window.Hub.renderHubContent(menuId); }
    function renderTeamRoster(club) { if (window.Hub && typeof window.Hub.renderTeamRoster === 'function') return window.Hub.renderTeamRoster(club); }
    function buildNextOpponentHtml() { if (window.Hub && typeof window.Hub.buildNextOpponentHtml === 'function') return window.Hub.buildNextOpponentHtml(); return '<div>Sem informação.</div>'; }
    function renderAllDivisionsTables() { if (window.Hub && typeof window.Hub.renderAllDivisionsTables === 'function') return window.Hub.renderAllDivisionsTables(); }
    function renderLeagueTable() { if (window.Hub && typeof window.Hub.renderLeagueTable === 'function') return window.Hub.renderLeagueTable(); }

    function initTacticPanel() { if (window.Tactics && typeof window.Tactics.initTacticPanel === 'function') return window.Tactics.initTacticPanel(); }

    function renderInitialMatchBoard(allDivisions) { if (window.MatchBoard && typeof window.MatchBoard.renderInitialMatchBoard === 'function') return window.MatchBoard.renderInitialMatchBoard(allDivisions); }
    function updateMatchBoardLine(matchIndex, matchResult) { if (window.MatchBoard && typeof window.MatchBoard.updateMatchBoardLine === 'function') return window.MatchBoard.updateMatchBoardLine(matchIndex, matchResult); }

    // Expose legacy globals for backward compatibility
    window.updateDayProgress = window.updateDayProgress || updateDayProgress;
    window.hexToRgb = window.hexToRgb || hexToRgb;
    window.luminance = window.luminance || luminance;
    window.getReadableTextColor = window.getReadableTextColor || getReadableTextColor;
    window.setIntroColors = window.setIntroColors || setIntroColors;
    window.showIntroOverlay = window.showIntroOverlay || showIntroOverlay;
    window.showHalfTimeSubsOverlay = window.showHalfTimeSubsOverlay || showHalfTimeSubsOverlay;

    window.initHubUI = window.initHubUI || initHubUI;
    window.renderHubContent = window.renderHubContent || renderHubContent;
    window.renderTeamRoster = window.renderTeamRoster || renderTeamRoster;
    window.buildNextOpponentHtml = window.buildNextOpponentHtml || buildNextOpponentHtml;
    window.renderAllDivisionsTables = window.renderAllDivisionsTables || renderAllDivisionsTables;
    window.renderLeagueTable = window.renderLeagueTable || renderLeagueTable;
    window.initTacticPanel = window.initTacticPanel || initTacticPanel;
    window.renderInitialMatchBoard = window.renderInitialMatchBoard || renderInitialMatchBoard;
    window.updateMatchBoardLine = window.updateMatchBoardLine || updateMatchBoardLine;

})();

