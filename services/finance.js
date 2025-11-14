// services/finance.js - stadium and finance helpers (moved from root finance.js)
(function(){
    function computeMatchAttendance(match) {
        if (!match || !match.homeClub) return { attendance: 0, capacity: 0 };
        const homeClub = match.homeClub;
        const awayClub = match.awayClub;
        const homePlayers = Array.isArray(match.homePlayers) ? match.homePlayers : (homeClub.team && Array.isArray(homeClub.team.players) ? homeClub.team.players : []);
        const awayPlayers = Array.isArray(match.awayPlayers) ? match.awayPlayers : (awayClub && awayClub.team && Array.isArray(awayClub.team.players) ? awayClub.team.players : []);

        const homeSkill = homePlayers.length ? homePlayers.reduce((s,p)=>s+(p.skill||0),0)/homePlayers.length : 50;
        const awaySkill = awayPlayers.length ? awayPlayers.reduce((s,p)=>s+(p.skill||0),0)/awayPlayers.length : 50;

    // Allow stadiums up to 100k capacity (user requested max)
    // homeClub may be either a "club" object (with .team) or a plain team object.
    // Prefer top-level stadiumCapacity, then fallback to team.stadiumCapacity.
    const rawCap = Number(homeClub && (homeClub.stadiumCapacity || (homeClub.team && homeClub.team.stadiumCapacity)) || homeClub && homeClub.stadium || 10000);
        const effectiveCap = Math.max(500, Math.min(rawCap, 100000));

        const avgSkill = (homeSkill + awaySkill) / 2;
        // Base demand driven by average skill (quality), plus a popularity factor derived from members
        const skillFactor = (avgSkill / 100) * 0.6; // 0..0.6

    // popularity derived from members; normalize roughly between 0 and 1 where top clubs ~70000 members
    // prefer club.members then team.members
    const homeMembers = Number((homeClub && (homeClub.members || (homeClub.team && homeClub.team.members))) || homeClub && homeClub.supporters || homeClub && homeClub.fans || 1000);
        const popNorm = Math.max(0, Math.min(1, (homeMembers - 500) / 70000));
        const popFactor = popNorm * 0.3; // up to +0.3

    // small base demand to avoid zero attendance
    let demandPct = 0.05 + skillFactor + popFactor; // approx 0.05..0.95
        // slight bonus from recent performance (points) but capped
        const perfBonus = (homeClub && typeof homeClub.points === 'number') ? Math.min(0.15, (homeClub.points || 0) / 500) : 0;
    demandPct = Math.min(1, demandPct + perfBonus);

    // scale demand by division strength so higher divisions attract proportionally more fans
    // index: division 1 = 1, division 4 = 4. We choose multipliers so div1 > 2x div4.
    const divisionMultipliers = { 1: 1.0, 2: 0.75, 3: 0.6, 4: 0.45 };
    const clubDivision = (homeClub && Number(homeClub.division)) ? Number(homeClub.division) : 1;
    const divMultiplier = divisionMultipliers[clubDivision] || 1.0;
    demandPct = Math.min(1, demandPct * divMultiplier);

    // compute attendance and ensure sensible minimums; enforce division-aware baselines

        // initial estimate from demand fraction
        let attendanceEstimate = Math.floor(effectiveCap * demandPct);

        // if match features top-ranked teams (positions 1..4) treat as high-profile
    const homePos = (homeClub && Number(homeClub.currentLeaguePosition)) ? Number(homeClub.currentLeaguePosition) : (homeClub && homeClub.team && Number(homeClub.team.currentLeaguePosition) ? Number(homeClub.team.currentLeaguePosition) : (homeClub && Number(homeClub.leaguePosition) ? Number(homeClub.leaguePosition) : null));
    const awayPos = (awayClub && Number(awayClub.currentLeaguePosition)) ? Number(awayClub.currentLeaguePosition) : (awayClub && awayClub.team && Number(awayClub.team.currentLeaguePosition) ? Number(awayClub.team.currentLeaguePosition) : (awayClub && Number(awayClub.leaguePosition) ? Number(awayClub.leaguePosition) : null));
        const highProfile = (homePos && homePos >= 1 && homePos <= 4) || (awayPos && awayPos >= 1 && awayPos <= 4);

    // Division ladder: compute a dynamic minimum attendance per division scaled
    // by the club's effective stadium capacity. Using a fixed large minimum
    // (e.g. 20000) made many Division 1 matches show the same value; instead
    // compute a sensible floor proportional to stadium size so smaller stadiums
    // within Div1 won't all display the same attendance.
    const divisionBaseFraction = { 1: 0.5, 2: 0.35, 3: 0.20, 4: 0.10 };
    const baseMin = Math.max(50, Math.round(effectiveCap * (divisionBaseFraction[clubDivision] || 0.10)));

        // High-profile behavior: only allow Division 1 high-profile matches to approach stadium capacity.
        if (highProfile) {
            if (clubDivision === 1) {
                // near sellout for top division
                attendanceEstimate = Math.max(attendanceEstimate, Math.round(effectiveCap * 0.95));
            } else {
                // allow a boost but still respect the club's stadium capacity
                const highBoost = { 2: 0.85, 3: 0.75, 4: 0.6 };
                const fill = highBoost[clubDivision] || 0.7;
                attendanceEstimate = Math.max(attendanceEstimate, Math.round(effectiveCap * fill));
            }
        }

        // --- ranking-based interest modifier ---
        // If both teams are bottom-ranked inside their division (e.g. bottom quartile) and they play each other,
        // reduce attendance (lower interest). If both are top-ranked, give a small boost.
        try {
            // determine division size if available (fall back to 18)
            let divisionSize = 18;
            if (typeof window !== 'undefined' && window.allDivisions && Array.isArray(window.allDivisions[clubDivision - 1])) {
                divisionSize = window.allDivisions[clubDivision - 1].length || divisionSize;
            }

            function rankPercentile(club) {
                if (!club) return 0.5;
                const pos = Number(club.currentLeaguePosition || club.leaguePosition || 0);
                if (!pos || divisionSize <= 1) return 0.5;
                return Math.max(0, Math.min(1, (pos - 1) / (divisionSize - 1)));
            }

            const homePct = rankPercentile(homeClub);
            const awayPct = rankPercentile(awayClub);

            // bottom quartile threshold
            const bottomThreshold = 0.75;
            const topThreshold = 0.25;

            if ((homeClub && awayClub) && (homeClub.division === awayClub.division)) {
                // same-division match
                if (homePct >= bottomThreshold && awayPct >= bottomThreshold) {
                    // bottom vs bottom: penalize attendance
                    attendanceEstimate = Math.round(attendanceEstimate * 0.5);
                } else if (homePct <= topThreshold && awayPct <= topThreshold) {
                    // top vs top (non-Top-4 case): small boost
                    attendanceEstimate = Math.round(Math.max(attendanceEstimate, attendanceEstimate * 1.15));
                }
            } else {
                // cross-division: if both are top of their divisions, small boost
                if (homePct <= topThreshold && awayPct <= topThreshold) {
                    attendanceEstimate = Math.round(attendanceEstimate * 1.08);
                }
            }
        } catch (e) {
            // defensive: don't let ranking logic break attendance
        }

        // now compute final attendance clamped between sensible minima and stadium capacity
        // (We allow per-club variability based on stadiumCapacity so top clubs can start
        // with large capacities and later expand toward the game's absolute max.)
        let attendance = Math.round(Math.max(baseMin, Math.min(effectiveCap, Math.max(attendanceEstimate, baseMin))));

        // edge-case: if effectiveCap is smaller than 500, clamp to effectiveCap
        if (effectiveCap < 500) attendance = Math.min(attendance, effectiveCap);

        return { attendance, capacity: effectiveCap };
    }

    function calcUpgradeCost(club, pct) {
        const currentCap = Number(club.stadiumCapacity || club.stadium || 10000);
        const seatsAdded = Math.ceil(currentCap * (pct/100));
        const costPerSeat = Math.round(20 + (currentCap / 1000) * 2);
        const total = seatsAdded * costPerSeat;
        return { seatsAdded, costPerSeat, total };
    }

    function applyUpgrade(club, pct) {
        const c = calcUpgradeCost(club, pct);
        const currentBudget = Number(club.budget || 0);
        if (c.total > currentBudget) throw new Error('Insufficient budget');
        const currentCap = Number(club.stadiumCapacity || club.stadium || 10000);
        const newCap = Math.min(100000, currentCap + c.seatsAdded);
        club.stadiumCapacity = newCap;
        club.budget = currentBudget - c.total;
        return { newCap, cost: c.total };
    }

    function estimateMatchRevenue(club, price) {
        // build fake match to compute attendance
        const match = { homeClub: club, awayClub: {} };
        const attendance = computeMatchAttendance(match).attendance;
        const ticketPrice = Number(price || club.ticketPrice || club.ticket || 20) || 20;
        return { attendance, estRevenue: Math.round(attendance * ticketPrice) };
    }

    // ----- Ticket price target and gradual evolution -----
    function computeTargetTicketPrice(club) {
        if (!club) return 10;
        const div = Number(club.division) || 1;
        const baseByDiv = { 1: 30, 2: 25, 3: 18, 4: 12 };
        const base = baseByDiv[div] || 12;

        // popularity & quality modifiers (safe defaults)
        const members = Number(club.members || club.supporters || club.fans || 1000);
        const membersFactor = Math.max(0, Math.min(1, members / 70000)); // 0..1

        const players = Array.isArray(club.players) ? club.players : [];
        const avgSkill = players.length ? players.reduce((s,p)=>s+(p.skill||0),0)/players.length : 50;
        // tune skill influence slightly higher
        const skillFactor = (avgSkill / 100) * 0.25; // up to +0.25

        // position-based modifier (top teams can charge more)
        const pos = Number(club.currentLeaguePosition || club.leaguePosition || 0);
        const posFactor = (pos > 0) ? (1 - ((pos - 1) / Math.max(1, (club.division ? (window.allDivisions && window.allDivisions[club.division-1] && window.allDivisions[club.division-1].length) || 18 : 18)))) : 0.5;

        // increase weights: members slightly more influential, position slightly more
        const target = Math.round(base * (1 + membersFactor * 0.30 + skillFactor + (posFactor * 0.15)));
        return Math.max(3, Math.min(200, target));
    }

    function evolveClubEconomyMonthly(club, months) {
        months = Math.max(1, Number(months) || 1);
        for (let m=0;m<months;m++) {
            try {
                const targetPrice = computeTargetTicketPrice(club);
                const current = Number(club.ticketPrice || club.ticket || 10);
                // move ticket price more responsively toward target (15% per month)
                const newPrice = Math.round(current + (targetPrice - current) * 0.15);
                club.ticketPrice = Math.max(1, newPrice);

                // adjust members slowly toward a division baseline (so relegation/promotion is gradual)
                const div = Number(club.division) || 1;
                const baseMembersByDiv = {1:25000,2:15000,3:7000,4:2000};
                const targetMembers = baseMembersByDiv[div] || 2000;
                const curMembers = Number(club.members || club.supporters || club.fans || 1000);
                const delta = Math.round((targetMembers - curMembers) * 0.07); // 7% per month shift (faster)
                club.members = Math.max(0, curMembers + delta);
            } catch(e) {
                // ignore errors for robustness
            }
        }
        return club;
    }

    // ----- Player contract negotiation helper -----
    function negotiatePlayerContract(club, playerIdOrIndex, proposedMonthlySalary, years) {
        if (!club || !Array.isArray(club.players)) return false;
        let player = null;
        if (typeof playerIdOrIndex === 'number') {
            player = club.players.find(p=>p.id === playerIdOrIndex) || club.players[playerIdOrIndex];
        } else if (typeof playerIdOrIndex === 'string') {
            player = club.players.find(p=>String(p.id) === playerIdOrIndex);
        }
        if (!player) return false;

        years = Number(years) || 1;
        proposedMonthlySalary = Math.max(1, Math.round(Number(proposedMonthlySalary) || 0));

        // Negotiation model: higher acceptance for higher offers; reasonable acceptance for small cuts
        const skillFactor = ((player.skill || 50) - 50) / 100; // -0.5..+0.5
        const currentSalary = Math.max(1, Number(player.salary || 1));
        const salaryRatio = proposedMonthlySalary / currentSalary;
        const pctChange = (proposedMonthlySalary - currentSalary) / currentSalary; // negative for cuts

        // higher base acceptance to make negotiations less hostile
        let acceptProb = 0.45 + (skillFactor * 0.25);

        if (salaryRatio >= 1) {
            // reputation-aware expected raise logic:
            // - similar club/player reputation -> expected raise ~10%
            // - if the offering club has noticeably smaller reputation than the player, expect ~30% to accept
            // - if the offering club is much bigger, expect a smaller raise (~5%)
            const members = Number(club.members || club.supporters || club.fans || 1000);
            const clubRepScore = Math.max(0, Math.min(100, (members / 70000) * 100)); // 0..100
            const playerRepScore = Math.max(0, Math.min(100, Number(player.skill || 50))); // use skill as a proxy for player rep
            const relative = clubRepScore - playerRepScore; // positive => club stronger

            let requiredRaise = 0.10; // default ~10% for similar clubs
            if (relative < -10) {
                // club much smaller than player -> require larger raise to accept drop in reputation
                requiredRaise = 0.30;
            } else if (relative > 10) {
                // club noticeably stronger -> player may accept smaller raise
                requiredRaise = 0.05;
            }

            const raisePct = Math.max(0, (proposedMonthlySalary - currentSalary) / currentSalary);

            if (raisePct >= requiredRaise) {
                // reward offers that meet/exceed expected raise. give a meaningful bonus but with diminishing returns
                const excess = raisePct - requiredRaise;
                const bonus = Math.min(0.85, 0.25 + excess * 0.6);
                acceptProb += bonus;
            } else {
                // below expectation: smaller positive effect for small raises, small penalty for noticeably low raises
                const shortfall = requiredRaise - raisePct;
                const penalty = Math.min(0.30, shortfall * 0.8);
                // small raises (< required) still help a bit; large shortfalls penalize
                acceptProb += Math.max(-penalty, (raisePct * 0.5));
            }
        } else {
            // salary decrease: apply a modest penalty but allow acceptance for small cuts
            const penalty = Math.min(0.6, (1 - salaryRatio) * 0.5);
            acceptProb -= penalty;
            // lower-skill players are more likely to accept a pay cut to keep playing
            if ((player.skill || 50) < 60) acceptProb += 0.05;
            // if the player currently has no contract (contractYears === 0) they are likelier to accept changes
            if (Number(player.contractYears || 0) === 0) acceptProb += 0.05;
        }

        // club budget slight influence (small positive if rich, small negative if poor)
        const clubBudget = Number(club.budget || 0);
        acceptProb += Math.max(-0.1, Math.min(0.1, (clubBudget / 1000000) * 0.02));

        // clamp
        acceptProb = Math.max(0.02, Math.min(0.99, acceptProb));

        const roll = Math.random();
        const accepted = roll < acceptProb;
        if (accepted) {
            player.salary = proposedMonthlySalary;
            player.contractYears = years;
            // Optionally deduct a signing-on cost (not enforced here)
        }
        return { accepted, acceptProb, roll };
    }

    // payroll helpers
    function computePayrollPerMonth(club) {
        if (!club || !Array.isArray(club.players)) return 0;
        return club.players.reduce((sum, p) => sum + (Number(p.salary) || 0), 0);
    }

    function computePayrollPerWeek(club) {
        const monthly = computePayrollPerMonth(club);
        // assume ~4 weeks per month
        return Math.round(monthly / 4);
    }

    function computePayrollPerMatch(club) {
        // matches happen weekly in the simulation: payroll per match ~= payroll per week
        return computePayrollPerWeek(club);
    }

    function setTicketPrice(club, price) {
        club.ticketPrice = Math.max(1, Math.round(Number(price || club.ticketPrice || 20)));
        return club.ticketPrice;
    }

    window.Finance = window.Finance || {};
    window.Finance.computeMatchAttendance = computeMatchAttendance;
    window.Finance.calcUpgradeCost = calcUpgradeCost;
    window.Finance.applyUpgrade = applyUpgrade;
    window.Finance.estimateMatchRevenue = estimateMatchRevenue;
    window.Finance.setTicketPrice = setTicketPrice;
    window.Finance.computePayrollPerMonth = computePayrollPerMonth;
    window.Finance.computePayrollPerWeek = computePayrollPerWeek;
    window.Finance.computePayrollPerMatch = computePayrollPerMatch;
    window.Finance.computeTargetTicketPrice = computeTargetTicketPrice;
    window.Finance.evolveClubEconomyMonthly = evolveClubEconomyMonthly;
    window.Finance.negotiatePlayerContract = negotiatePlayerContract;
})();
