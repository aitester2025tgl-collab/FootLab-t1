const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
        const filePath = path.resolve(__dirname, 'index.html');
        const html = fs.readFileSync(filePath, 'utf8');

        const dom = new JSDOM(html, {
            runScripts: 'dangerously',
            resources: 'usable',
            url: 'file://' + filePath
        });

        const { window } = dom;
        const doc = window.document;

        // jsdom polyfills: provide requestAnimationFrame and a minimal localStorage to reduce noise
        try {
            if (typeof window.requestAnimationFrame !== 'function') {
                window.requestAnimationFrame = function(cb) { return setTimeout(function(){ cb(Date.now()); }, 0); };
            }
            if (typeof window.cancelAnimationFrame !== 'function') {
                window.cancelAnimationFrame = function(id) { clearTimeout(id); };
            }
            if (typeof window.localStorage === 'undefined' || !window.localStorage) {
                (function(){
                    let store = {};
                    window.localStorage = {
                        getItem: function(k){ return Object.prototype.hasOwnProperty.call(store,k) ? store[k] : null; },
                        setItem: function(k,v){ store[k] = String(v); },
                        removeItem: function(k){ delete store[k]; },
                        clear: function(){ store = {}; }
                    };
                })();
            }
        } catch (e) { /* ignore polyfill failures */ }

        // capture console from the page
        const origConsoleLog = console.log;
        window.console = {
            log: (...args) => { origConsoleLog('[page]', ...args); },
            error: (...args) => { origConsoleLog('[page][ERROR]', ...args); },
            warn: (...args) => { origConsoleLog('[page][WARN]', ...args); }
        };

        await new Promise((resolve, reject) => {
            // wait for scripts to load
            window.addEventListener('load', () => setTimeout(resolve, 50));

            // timeout
            setTimeout(() => reject(new Error('Timeout waiting for page load')), 5000);
        });

        // Fill coach name and click start
        const coachInput = doc.getElementById('coachName');
        const startBtn = doc.getElementById('startBtn');

        if (!coachInput || !startBtn) {
            console.error('smoke_test: start button or coach input not found');
            process.exit(2);
        }

        coachInput.value = 'SmokeTester';
        // dispatch input event
        coachInput.dispatchEvent(new window.Event('input', { bubbles: true }));

        startBtn.click();

        // wait for playerClub and currentRoundMatches to be defined
        const maxWait = 5000;
        const pollInterval = 100;
        let waited = 0;
        const ok = await new Promise((resolve) => {
            const i = setInterval(() => {
                const el = window.Elifoot && window.Elifoot.playerClub;
                const matches = window.Elifoot && window.Elifoot.currentRoundMatches;
                if (el && Array.isArray(matches)) {
                    clearInterval(i);
                    resolve({ playerClub: el, matchesCount: matches.length });
                }
                waited += pollInterval;
                if (waited >= maxWait) {
                    clearInterval(i);
                    resolve(null);
                }
            }, pollInterval);
        });

        if (!ok) {
            console.error('smoke_test: failed to initialize playerClub or matches');
            // dump some diagnostics
            console.error('window.playerClub =', !!window.playerClub);
            console.error('window.Elifoot =', !!window.Elifoot);
            console.error('window.currentRoundMatches =', !!window.currentRoundMatches);
            process.exit(3);
        }

        console.log('smoke_test: success — playerClub:', ok.playerClub.team ? ok.playerClub.team.name : '[no-name]', 'matches:', ok.matchesCount);
        process.exit(0);

    } catch (err) {
        console.error('smoke_test error:', err);
        process.exit(1);
    }
})();
