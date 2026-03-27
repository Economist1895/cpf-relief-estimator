document.addEventListener('DOMContentLoaded', function () {

  // ── Formatters ────────────────────────────────────────────────────────────
  function fmt(n) {
    return '$' + Math.max(0, n).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtPct(n) { return (n * 100).toFixed(2).replace(/\.?0+$/, '') + '%'; }

  // ── DOM helpers ────────────────────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }
  function val(id) { var v = parseFloat($(id).value); return (isNaN(v) || v < 0) ? 0 : v; }
  function setText(id, t) { var el = $(id); if (el) el.textContent = t; }
  function show(id) { var el = $(id); if (el) el.classList.remove('hidden'); }
  function hide(id) { var el = $(id); if (el) el.classList.add('hidden'); }

  // ── State ─────────────────────────────────────────────────────────────────
  var isEmpType = true;
  var isSEPType = false;
  var isPWType  = false;
  var isSC = true;
  var isPW1995 = true;

  // ── Tab switching ─────────────────────────────────────────────────────────
  function switchTab(tab) {
    ['profile', 'voluntary', 'result'].forEach(function (t) {
      $('page-' + t).classList.toggle('active', t === tab);
      $('tab-' + t).classList.toggle('active', t === tab);
    });
    if (tab === 'result') updateResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('tab-profile').addEventListener('click', function () { switchTab('profile'); });
  $('tab-voluntary').addEventListener('click', function () { switchTab('voluntary'); });
  $('tab-result').addEventListener('click', function () { switchTab('result'); });
  $('btnToVoluntary').addEventListener('click', function () { switchTab('voluntary'); });
  $('btnToResult').addEventListener('click', function () { switchTab('result'); });

  // ── Reset ─────────────────────────────────────────────────────────────────
  $('btnReset').addEventListener('click', function () {
    // Clear all number inputs
    document.querySelectorAll('input[type="number"]').forEach(function (el) { el.value = ''; });

    // Reset worker type checkboxes — Employee only
    isEmpType = true; isSEPType = false; isPWType = false;
    $('wc-employee').querySelector('input').checked = true;
    $('wc-sep').querySelector('input').checked = false;
    $('wc-pw').querySelector('input').checked = false;
    $('wc-employee').classList.add('selected');
    $('wc-sep').classList.remove('selected');
    $('wc-pw').classList.remove('selected');
    hide('noTypeWarning');

    // Reset SC/PR to SC
    isSC = true;
    $('btnSC').classList.add('active'); $('btnPR').classList.remove('active');
    $('prNote').style.display = 'none';

    // Reset PW birth year to 1995+
    isPW1995 = true;
    $('btnPW1995').classList.add('active'); $('btnPWPre1995').classList.remove('active');
    $('pwOptInSection').classList.add('hidden');
    $('pwOptedInSection').classList.remove('hidden');
    $('pwNotOptedSection').classList.add('hidden');

    // Reset all checkboxes/toggles
    ['sepPensioner', 'pwOptIn', 'selfMRSS', 'familyMRSS'].forEach(function (id) {
      $(id).checked = false;
    });
    $('selfMRSSSection').classList.add('hidden');
    $('familyMRSSSection').classList.add('hidden');

    // Reset displayed computed values
    ['empCPFDisplay', 'sepMADisplay', 'pwCPFDisplay', 'pwMADisplay',
     'volCPFAllowedDisplay', 'topupTotalDisplay'].forEach(function (id) {
      setText(id, '$0.00');
    });
    $('volCPFCapNote').textContent = '';

    // Apply worker type visibility and go back to first tab
    applyWorkerType();
    applyPWOptIn();
    switchTab('profile');
    recalc();
  });

  // ── Worker type selection ─────────────────────────────────────────────────
  document.querySelectorAll('input[name="workerType"]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      isEmpType = $('wc-employee').querySelector('input').checked;
      isSEPType = $('wc-sep').querySelector('input').checked;
      isPWType  = $('wc-pw').querySelector('input').checked;
      // Sync selected styling
      ['wc-employee', 'wc-sep', 'wc-pw'].forEach(function (id) {
        $(id).classList.toggle('selected', $(id).querySelector('input').checked);
      });
      // Warn if nothing selected
      $('noTypeWarning').classList.toggle('hidden', isEmpType || isSEPType || isPWType);
      applyWorkerType();
      recalc();
    });
  });

  function applyWorkerType() {
    $('sec-employee').classList.toggle('hidden', !isEmpType);
    $('sec-sep').classList.toggle('hidden', !isSEPType);
    $('sec-pw').classList.toggle('hidden', !isPWType);
    $('sec-pw-sep-note').classList.toggle('hidden', !(isPWType && isSEPType));

    // Voluntary CPF: SEP or PW can claim; pure employee cannot
    var canClaimVol = isSEPType || isPWType;
    $('sec-voluntary-cpf').classList.remove('hidden');
    if (!canClaimVol) {
      $('volCPFGroup').classList.add('hidden');
      $('volCPFCapRow').style.display = 'none';
      show('empVolNote');
      hide('volCPFInfo');
    } else {
      $('volCPFGroup').classList.remove('hidden');
      $('volCPFCapRow').style.display = '';
      hide('empVolNote');
      show('volCPFInfo');
    }

    // Multi-employer note
    $('multiEmpNote').classList.toggle('hidden', !isEmpType);
  }

  // ── SC/PR toggle ──────────────────────────────────────────────────────────
  $('btnSC').addEventListener('click', function () {
    isSC = true;
    $('btnSC').classList.add('active'); $('btnPR').classList.remove('active');
    $('prNote').style.display = 'none';
    recalc();
  });
  $('btnPR').addEventListener('click', function () {
    isSC = false;
    $('btnPR').classList.add('active'); $('btnSC').classList.remove('active');
    $('prNote').style.display = 'block';
    recalc();
  });

  // ── PW birth year toggle ──────────────────────────────────────────────────
  $('btnPW1995').addEventListener('click', function () {
    isPW1995 = true;
    $('btnPW1995').classList.add('active'); $('btnPWPre1995').classList.remove('active');
    $('pwOptInSection').classList.add('hidden');
    $('pwOptedInSection').classList.remove('hidden');
    $('pwNotOptedSection').classList.add('hidden');
    recalc();
  });
  $('btnPWPre1995').addEventListener('click', function () {
    isPW1995 = false;
    $('btnPWPre1995').classList.add('active'); $('btnPW1995').classList.remove('active');
    $('pwOptInSection').classList.remove('hidden');
    applyPWOptIn();
    recalc();
  });
  $('pwOptIn').addEventListener('change', function () {
    applyPWOptIn();
    recalc();
  });
  function applyPWOptIn() {
    var optedIn = isPW1995 || $('pwOptIn').checked;
    $('pwOptedInSection').classList.toggle('hidden', !optedIn);
    $('pwNotOptedSection').classList.toggle('hidden', optedIn);
  }

  // ── SEP pensioner toggle ──────────────────────────────────────────────────
  $('sepPensioner').addEventListener('change', recalc);

  // ── MRSS toggles ─────────────────────────────────────────────────────────
  $('selfMRSS').addEventListener('change', function () {
    $('selfMRSSSection').classList.toggle('hidden', !this.checked);
    recalc();
  });
  $('familyMRSS').addEventListener('change', function () {
    $('familyMRSSSection').classList.toggle('hidden', !this.checked);
    recalc();
  });

  // ── Number input guards ───────────────────────────────────────────────────
  document.querySelectorAll('input[type="number"]').forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === '-') e.preventDefault();
    });
    el.addEventListener('input', function () {
      if (this.value !== '' && parseFloat(this.value) < 0) this.value = 0;
      recalc();
    });
    el.addEventListener('change', recalc);
    el.addEventListener('wheel', function () {
      if (document.activeElement === this) this.blur();
    }, { passive: true });
    el.addEventListener('focus', function () {
      if (this.value === '0' || this.value === '0.00') this.value = '';
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTATION ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  // Employee CPF contribution rates (employee share), 2025
  // Age is as of Dec 31 of the income year
  var EMP_RATES = [
    { maxAge: 55,  rate: 0.20 },
    { maxAge: 60,  rate: 0.17 },
    { maxAge: 65,  rate: 0.115 },
    { maxAge: 70,  rate: 0.07 },
    { maxAge: 999, rate: 0.05 }
  ];
  var OW_CEILING = 7400;   // per month, 2025
  var AW_CEILING_TOTAL = 102000;
  var CPF_ANNUAL_LIMIT = 37740;

  function getEmpRate(age) {
    for (var i = 0; i < EMP_RATES.length; i++) {
      if (age <= EMP_RATES[i].maxAge) return EMP_RATES[i].rate;
    }
    return 0.05;
  }

  function computeEmpCPF(age, owMonthly, awAnnual) {
    var owCapped = Math.min(owMonthly, OW_CEILING);
    var owAnnual = owCapped * 12;
    var awCeiling = Math.max(0, AW_CEILING_TOTAL - owAnnual);
    var awCapped = Math.min(awAnnual, awCeiling);
    var totalWages = owAnnual + awCapped;
    var rate = getEmpRate(age);
    var raw = totalWages * rate;
    // Note: we do NOT cap at Annual Limit here — that is done in recalc
    // after pooling with any SEP MediSave contributions
    return {
      owCapped: owCapped,
      owAnnual: owAnnual,
      awCapped: awCapped,
      awCeiling: awCeiling,
      rate: rate,
      rawCPF: raw   // uncapped — pooled cap applied in recalc
    };
  }

  // SEP MediSave rates (non-pensioner), 2025 work year
  // Returns { rate: effective rate, amount: payable, formula: string }
  var SEP_MA_CAPS = [
    { maxAge: 34,  lowRate: 0.040, highRate: 0.080, maxAmt: 7104,
      phaseA: 480,  phaseB: 0.1600 },
    { maxAge: 44,  lowRate: 0.045, highRate: 0.090, maxAmt: 7992,
      phaseA: 540,  phaseB: 0.1800 },
    { maxAge: 49,  lowRate: 0.050, highRate: 0.100, maxAmt: 8880,
      phaseA: 600,  phaseB: 0.2000 },
    { maxAge: 999, lowRate: 0.0525, highRate: 0.105, maxAmt: 9324,
      phaseA: 630,  phaseB: 0.2100 }
  ];
  var PENSIONER_RATE = 0.06;
  var PENSIONER_MAX  = 5328;

  function getSEPMAbracket(age) {
    for (var i = 0; i < SEP_MA_CAPS.length; i++) {
      if (age <= SEP_MA_CAPS[i].maxAge) return SEP_MA_CAPS[i];
    }
    return SEP_MA_CAPS[SEP_MA_CAPS.length - 1];
  }

  function computeSEPMA(age, nti, isPensioner) {
    if (nti <= 6000) return { amount: 0, desc: 'NTI ≤ $6,000 — no compulsory MediSave payable.', rate: 0 };
    if (isPensioner) {
      var amt = Math.min(nti * PENSIONER_RATE, PENSIONER_MAX);
      return { amount: amt, rate: PENSIONER_RATE, desc: 'Pensioner rate: 6% × NTI, capped at $5,328.' };
    }
    var b = getSEPMAbracket(age);
    var amount, desc, rate;
    if (nti <= 12000) {
      amount = nti * b.lowRate;
      rate = b.lowRate;
      desc = fmtPct(b.lowRate) + ' × NTI (NTI in $6,001–$12,000 band)';
    } else if (nti <= 18000) {
      // Phased-in formula: (phaseA + phaseB × (NTI - 12000)) / NTI × NTI = phaseA + phaseB × (NTI-12000)
      amount = b.phaseA + b.phaseB * (nti - 12000);
      rate = amount / nti;
      desc = '$' + b.phaseA + ' + ' + fmtPct(b.phaseB) + ' × (NTI − $12,000) [phased-in band $12,001–$18,000]';
    } else {
      amount = Math.min(nti * b.highRate, b.maxAmt);
      rate = b.highRate;
      desc = fmtPct(b.highRate) + ' × NTI, capped at $' + b.maxAmt.toLocaleString('en-SG') + ' (NTI > $18,000)';
    }
    return { amount: amount, rate: rate, desc: desc };
  }

  // Platform Worker rates (opted-in/mandatory, 2025) — WORKER SHARE ONLY
  // Source: CPF Board, CPFPWContributionRatePWA2025_2029
  // Ages below use December-31 age convention (simplified to annual)
  var PW_RATES_2025 = [
    { maxAge: 35,  workerPct: 0.105 },
    { maxAge: 45,  workerPct: 0.115 },
    { maxAge: 50,  workerPct: 0.125 },
    { maxAge: 55,  workerPct: 0.130 },
    { maxAge: 60,  workerPct: 0.130 },
    { maxAge: 65,  workerPct: 0.105 },
    { maxAge: 70,  workerPct: 0.105 },
    { maxAge: 999, workerPct: 0.090 }
  ];

  function getPWRate2025(age) {
    for (var i = 0; i < PW_RATES_2025.length; i++) {
      if (age <= PW_RATES_2025[i].maxAge) return PW_RATES_2025[i].workerPct;
    }
    return 0.09;
  }

  function computePWCPF(age, netEarnings) {
    // Net earnings capped at $102,000 per PO for CPF
    var capped = Math.min(netEarnings, 102000);
    // Workers earning ≤$500/month on average don't pay worker share; approximate: annual ≤$6,000
    if (netEarnings <= 6000) return { amount: 0, rate: 0, desc: 'Net platform earnings ≤ $6,000 — no worker share CPF payable.' };
    var rate = getPWRate2025(age);
    var amount = capped * rate;
    return { amount: amount, rate: rate, desc: fmtPct(rate) + ' × net earnings (2025 phased rate, age ' + age + ')' };
  }

  // Non-opted-in PW: MediSave only, same rates as SEP
  function computePWMA(age, netEarnings) {
    // Non-opted-in PWs contribute MediSave on net platform earnings at SEP rates
    return computeSEPMA(age, netEarnings, false);
  }

  // ─── Main recalc ──────────────────────────────────────────────────────────
  function recalc() {
    var age = parseInt($('age').value) || 0;
    var isEmp = isEmpType;
    var isSEP = isSEPType;
    var isPW  = isPWType;

    // 1. Employee CPF
    var empCPF = 0, empDetail = null;
    if (isEmp && age > 0) {
      var override = val('empOverrideCPF');
      if (override > 0) {
        empCPF = override; // will be pooled-capped below
        empDetail = { override: true, raw: override, capped: empCPF };
      } else {
        empDetail = computeEmpCPF(age, val('empOW'), val('empAW'));
        empCPF = empDetail.rawCPF; // raw, uncapped
      }
    }

    // 2. SEP MediSave
    var sepMAResult = null, sepMA = 0;
    if (isSEP && age > 0) {
      sepMAResult = computeSEPMA(age, val('sepNTI'), $('sepPensioner').checked);
      sepMA = sepMAResult.amount;
    }

    // 3. Platform worker
    var pwCPF = 0, pwMA = 0, pwDetail = null, pwMADetail = null;
    if (isPW && age > 0) {
      var optedIn = isPW1995 || $('pwOptIn').checked;
      if (optedIn) {
        pwDetail = computePWCPF(age, val('pwNetEarnings'));
        pwCPF = pwDetail.amount;
      } else {
        pwMADetail = computePWMA(age, val('pwMANetEarnings'));
        pwMA = pwMADetail.amount;
      }
    }

    // 4. Pool compulsory contributions and apply Annual Limit cap.
    // SEP MediSave and PW contributions take precedence; employee CPF is the residual.
    var sepPWCompulsory = sepMA + pwCPF + pwMA;
    var empCPFAllowed = Math.max(0, Math.min(empCPF, CPF_ANNUAL_LIMIT - sepPWCompulsory));
    var totalCompulsory = empCPFAllowed + sepPWCompulsory;

    // Update all computed display fields (reset to $0.00 if not applicable)
    setText('empCPFDisplay', isEmp ? fmt(empCPFAllowed) : '$0.00');
    setText('sepMADisplay',  isSEP ? fmt(sepMA)         : '$0.00');
    if (isPW) {
      if (isPW1995 || $('pwOptIn').checked) {
        setText('pwCPFDisplay', fmt(pwCPF));
        setText('pwMADisplay',  '$0.00');
      } else {
        setText('pwCPFDisplay', '$0.00');
        setText('pwMADisplay',  fmt(pwMA));
      }
    } else {
      setText('pwCPFDisplay', '$0.00');
      setText('pwMADisplay',  '$0.00');
    }

    var headroom = Math.max(0, CPF_ANNUAL_LIMIT - totalCompulsory);

    // 5. Voluntary CPF (SEP/PW only — employees cannot claim voluntary OA/SA relief)
    // Cap A: 37% of net trade income minus compulsory MediSave contributions
    //        This cap only applies when there is trade income (SEP income).
    //        For opted-in PWs with no SEP income, there is no 37%-of-earnings cap;
    //        only the Annual Limit headroom (Cap B) applies.
    // Cap B: Annual Limit headroom (after all compulsory contributions)
    // Cap C: Actual voluntary amount contributed
    var volCPF = 0, volCPFAllowed = 0, volCPFCapNote = '';
    var canClaimVol = isSEP || isPW;
    if (canClaimVol) {
      var rawVol = val('volCPF');
      var sepNTI = val('sepNTI');
      var totalCompulsoryMA = sepMA + pwMA;
      var capA;
      if (isSEP && sepNTI > 0) {
        capA = Math.max(0, 0.37 * sepNTI - totalCompulsoryMA);
      } else {
        capA = CPF_ANNUAL_LIMIT; // no 37%-of-NTI cap without trade income
      }
      var capB = headroom;
      volCPFAllowed = Math.min(rawVol, capA, capB);
      volCPF = volCPFAllowed;
      if (rawVol > 0) {
        var binding = Math.min(capA, capB);
        if (rawVol > binding) {
          var reason = (capA <= capB && isSEP)
            ? '37% of NTI minus compulsory MediSave (' + fmt(capA) + ')'
            : 'Annual Limit headroom (' + fmt(capB) + ')';
          volCPFCapNote = 'Your voluntary contribution of ' + fmt(rawVol) + ' is capped to ' + fmt(volCPFAllowed) + ' by the ' + reason + ' limit.';
        } else {
          volCPFCapNote = 'Full voluntary contribution qualifies for relief.';
        }
      }
      setText('volCPFAllowedDisplay', fmt(volCPFAllowed));
      $('volCPFCapNote').textContent = volCPFCapNote;
    }

    // Expose empCPFAllowed for steps display
    empCPF = empCPFAllowed;

    // 6. RSTU Cash Top-up
    var selfTopup = Math.min(val('topupSelf'), 8000);
    var selfMRSS  = $('selfMRSS').checked ? Math.min(val('selfMRSSAmt'), selfTopup) : 0;
    var selfRelief = Math.max(0, selfTopup - selfMRSS);
    var famTopup  = Math.min(val('topupFamily'), 8000);
    var famMRSS   = $('familyMRSS').checked ? Math.min(val('familyMRSSAmt'), famTopup) : 0;
    var famRelief = Math.max(0, famTopup - famMRSS);
    var topupTotal = selfRelief + famRelief;
    setText('topupTotalDisplay', fmt(topupTotal));

    // 7. Update cap bar (Annual Limit — compulsory + voluntary only, not RSTU)
    var capUsed = totalCompulsory + volCPF;
    var capPct = Math.min(100, capUsed / CPF_ANNUAL_LIMIT * 100);
    var capFill = $('capBarFill');
    capFill.style.width = capPct + '%';
    capFill.className = 'cap-bar-fill' + (capUsed > CPF_ANNUAL_LIMIT ? ' over' : '');
    setText('capUsedDisplay', '$' + Math.round(capUsed).toLocaleString('en-SG'));
    setText('capPct', Math.round(capPct) + '% used');
    setText('capRemaining', fmt(Math.max(0, CPF_ANNUAL_LIMIT - capUsed)) + ' remaining');

    // 8. Total CPF relief
    var compulsoryRelief = empCPF + sepMA + pwCPF + pwMA;
    var totalCPFRelief = compulsoryRelief + volCPF + topupTotal;

    // Store for results
    window._cpfState = {
      age: age, isEmp: isEmp, isSEP: isSEP, isPW: isPW, isSC: isSC,
      empCPF: empCPF, empDetail: empDetail,
      sepMA: sepMA, sepMAResult: sepMAResult, nti: val('sepNTI'), isPensioner: $('sepPensioner').checked,
      pwCPF: pwCPF, pwDetail: pwDetail, pwMA: pwMA, pwMADetail: pwMADetail,
      isPW1995: isPW1995, pwOptedIn: isPW1995 || (isPW && $('pwOptIn').checked),
      pwNetEarnings: val('pwNetEarnings'), pwMANetEarnings: val('pwMANetEarnings'),
      volCPF: volCPF, volCPFAllowed: volCPFAllowed, volCPFRaw: val('volCPF'), volCapNote: volCPFCapNote,
      topupSelf: selfRelief, topupFam: famRelief, topupTotal: topupTotal,
      selfMRSSAmt: selfMRSS, famMRSSAmt: famMRSS,
      compulsoryRelief: compulsoryRelief, totalCPFRelief: totalCPFRelief,
      otherReliefs: val('otherReliefs')
    };
  }

  // ─── Results page ─────────────────────────────────────────────────────────
  function updateResults() {
    recalc();
    var s = window._cpfState;
    if (!s || s.age === 0) {
      $('stepsContainer').innerHTML = '<div style="color:var(--text-muted);font-size:0.88rem;padding:12px 0;">Please enter your age and income details first.</div>';
      return;
    }

    // Summary card values
    setText('r-comp', fmt(s.compulsoryRelief));
    setText('r-total', fmt(s.totalCPFRelief));
    setText('r-totalBig', fmt(s.totalCPFRelief));

    // Set compulsory label based on type
    var compLabel = '';
    if (s.isEmp && !s.isSEP && !s.isPW) compLabel = 'Compulsory Employee CPF Relief';
    else if (s.isSEP && !s.isEmp) compLabel = 'Compulsory MediSave Relief (SEP)';
    else if (s.isPW && s.pwOptedIn) compLabel = 'Worker Share CPF Relief (Platform Worker)';
    else if (s.isPW && !s.pwOptedIn) compLabel = 'MediSave Relief (Platform Worker)';
    else compLabel = 'Compulsory CPF / MediSave Relief';
    setText('r-compLabel', compLabel);

    if (s.compulsoryRelief > 0) { show('r-compRow'); } else { hide('r-compRow'); }
    if (s.volCPF > 0) { show('r-volRow'); setText('r-vol', fmt(s.volCPF)); } else { hide('r-volRow'); }
    if (s.topupTotal > 0) { show('r-topupRow'); setText('r-topup', fmt(s.topupTotal)); } else { hide('r-topupRow'); }

    // $80k cap
    var totalAll = s.totalCPFRelief + s.otherReliefs;
    var capRem = Math.max(0, 80000 - totalAll);
    setText('r-capRem', fmt(capRem) + ' headroom left');
    setText('rc-cpf', fmt(s.totalCPFRelief));
    setText('rc-other', fmt(s.otherReliefs));
    setText('rc-total', fmt(totalAll));
    setText('rc-remaining', fmt(capRem));
    $('rc-remaining').style.color = totalAll > 80000 ? 'var(--error)' : 'var(--success)';
    if (totalAll > 80000) {
      show('rc-overWarning');
      setText('rc-overText', 'Your total reliefs (' + fmt(totalAll) + ') exceed the $80,000 cap. CPF-related reliefs may be partially disallowed. Consider redistributing some reliefs to other family members where possible.');
    } else {
      hide('rc-overWarning');
    }

    // Build steps
    buildSteps(s);
    buildSummaryPara(s);
  }

  function makeStep(num, title, desc, calc, result, warn) {
    var w = warn ? '<div class="step-warn">' + warn + '</div>' : '';
    var c = calc ? '<div class="step-calc">' + calc + '</div>' : '';
    var r = result ? '<div class="step-result">→ ' + result + '</div>' : '';
    return '<div class="step"><div class="step-num">' + num + '</div><div class="step-body"><div class="step-title">' + title + '</div><div class="step-desc">' + desc + '</div>' + c + r + w + '</div></div>';
  }

  function buildSteps(s) {
    var html = '';
    var stepN = 1;

    // ── EMPLOYEE steps ──
    if (s.isEmp) {
      if (s.empDetail && s.empDetail.override) {
        html += makeStep(stepN++,
          'Employee CPF Relief (manual entry)',
          'You entered your actual total CPF contributions directly, overriding the computed amount.',
          'Actual employee CPF deducted: ' + fmt(s.empDetail.raw) + '\nCapped at Annual Limit ($37,740): ' + fmt(s.empCPF),
          'Employee CPF Relief = ' + fmt(s.empCPF)
        );
      } else if (s.empDetail) {
        var d = s.empDetail;
        var owLine = 'OW ceiling: $7,400/month\nMonthly OW entered: ' + fmt(val('empOW')) + '\nCapped OW: ' + fmt(d.owCapped) + '/month × 12 = ' + fmt(d.owAnnual);
        var awLine = 'AW ceiling: $102,000 − ' + fmt(d.owAnnual) + ' = ' + fmt(d.awCeiling) + '\nAW entered: ' + fmt(val('empAW')) + '\nCapped AW: ' + fmt(d.awCapped);
        var totalLine = 'Total wages subject to CPF: ' + fmt(d.owAnnual) + ' + ' + fmt(d.awCapped) + ' = ' + fmt(d.owAnnual + d.awCapped);
        var rateLine = 'Employee contribution rate (age ' + s.age + '): ' + fmtPct(d.rate);
        var rawLine  = 'Employee CPF: ' + fmt(d.owAnnual + d.awCapped) + ' × ' + fmtPct(d.rate) + ' = ' + fmt((d.owAnnual + d.awCapped) * d.rate);
        var capLine  = 'After pooled Annual Limit cap: ' + fmt(s.empCPF);
        html += makeStep(stepN++,
          'Compute Compulsory Employee CPF',
          'CPF Relief for employees is based on compulsory contributions on ordinary wages (OW) and additional wages (AW), calculated using the age-based employee contribution rate.',
          owLine + '\n\n' + awLine + '\n\n' + totalLine + '\n' + rateLine + '\n' + rawLine + '\n' + capLine,
          'Compulsory Employee CPF Relief = ' + fmt(s.empCPF),
          d.rawCPF > CPF_ANNUAL_LIMIT ? 'The computed amount exceeded the $37,740 Annual Limit and has been reduced accordingly.' : null
        );
      }
    }

    // ── SEP MediSave steps ──
    if (s.isSEP && s.sepMAResult) {
      var maR = s.sepMAResult;
      var ageGroup = s.age <= 34 ? 'Below 35' : s.age <= 44 ? '35 to 44' : s.age <= 49 ? '45 to 49' : '50 and above';
      var maCalc = 'NTI: ' + fmt(s.nti) + '\nAge group: ' + ageGroup + '\nFormula: ' + maR.desc + '\nCompulsory MediSave payable: ' + fmt(maR.amount);
      html += makeStep(stepN++,
        'Compute Compulsory MediSave (SEP)',
        'Self-employed persons with NTI exceeding $6,000 are required to make compulsory MediSave contributions. From YA 2026, the full amount qualifies for tax relief with no upper cap.',
        maCalc,
        'SEP MediSave Relief = ' + fmt(s.sepMA),
        s.nti <= 6000 ? 'NTI does not exceed $6,000 — no compulsory MediSave contribution is required.' : null
      );
    }

    // ── Platform Worker steps ──
    if (s.isPW) {
      if (s.pwOptedIn && s.pwDetail) {
        var pwR = s.pwDetail;
        var cappedEarnings = Math.min(s.pwNetEarnings, 102000);
        var pwCalc = 'Annual net platform earnings: ' + fmt(s.pwNetEarnings) + '\nCapped at $102,000: ' + fmt(cappedEarnings) + '\n2025 worker share rate (age ' + s.age + '): ' + fmtPct(pwR.rate) + '\nWorker share CPF: ' + fmt(cappedEarnings) + ' × ' + fmtPct(pwR.rate) + ' = ' + fmt(pwR.amount);
        html += makeStep(stepN++,
          'Compute Platform Worker CPF (opted-in / mandatory)',
          'Platform workers who are mandatory contributors or have opted in contribute to their Ordinary, Special/Retirement, and MediSave Accounts. Only the worker\'s own share qualifies for CPF Relief — the platform operator\'s contributions are not taxable income.',
          pwCalc,
          'Platform Worker CPF Relief = ' + fmt(s.pwCPF),
          s.pwNetEarnings <= 6000 ? 'Annual net earnings do not exceed $6,000 — no worker share CPF contribution applies.' : null
        );
      } else if (!s.pwOptedIn && s.pwMADetail) {
        html += makeStep(stepN++,
          'Compute MediSave (non-opted-in Platform Worker)',
          'Platform workers born before 1995 who have not opted in are required to contribute to MediSave only. The contribution is computed on net platform earnings using the same rates that apply to self-employed persons.',
          'Net platform earnings: ' + fmt(s.pwMANetEarnings) + '\n' + s.pwMADetail.desc + '\nCompulsory MediSave: ' + fmt(s.pwMADetail.amount),
          'Platform Worker MediSave Relief = ' + fmt(s.pwMA)
        );
      }
    }

    // ── Annual Limit check step ──
    var compTotal = s.empCPF + s.sepMA + s.pwCPF + s.pwMA;
    var wasPoolCapped = (s.empDetail && !s.empDetail.override && (s.empDetail.rawCPF + s.sepMA + s.pwCPF + s.pwMA) > CPF_ANNUAL_LIMIT);
    html += makeStep(stepN++,
      'Check CPF Annual Limit ($37,740)',
      'The $37,740 Annual Limit applies to all compulsory and voluntary CPF contributions combined. Where pooled compulsory contributions exceed the limit, SEP MediSave takes precedence and the employee CPF amount is reduced.',
      'Employee CPF (before pooled cap): ' + fmt(s.empDetail && !s.empDetail.override ? s.empDetail.rawCPF : s.empCPF) +
      '\nSEP MediSave: ' + fmt(s.sepMA) +
      '\nPlatform Worker CPF / MediSave: ' + fmt(s.pwCPF + s.pwMA) +
      '\nTotal compulsory (after Annual Limit cap): ' + fmt(compTotal) +
      '\nAnnual Limit: $37,740' +
      '\nRemaining headroom for voluntary contributions: ' + fmt(Math.max(0, 37740 - compTotal)),
      compTotal >= 37740 ? 'The Annual Limit is fully used. No voluntary CPF relief is available.' : 'Annual Limit headroom = ' + fmt(37740 - compTotal),
      wasPoolCapped ? 'Employee CPF has been reduced because the combined compulsory contributions exceeded $37,740. SEP MediSave contributions take precedence.' : null
    );

    // ── Voluntary CPF step ──
    if (s.isEmp && !s.isSEP && !s.isPW) {
      html += makeStep(stepN++,
        'Voluntary CPF Contributions (Employee)',
        'Employees cannot claim CPF Relief on voluntary contributions to their OA or SA. From 1 January 2022, voluntary MediSave top-ups are instead claimed under CPF Cash Top-up Relief — see the RSTU section below.',
        'Voluntary CPF Relief (employee): $0',
        'Not applicable for employees.'
      );
    } else if (val('volCPF') > 0 || s.volCPF > 0) {
      var sepNTI = s.nti;
      var totalMA = s.sepMA + s.pwMA;
      var capAVal = (s.isSEP && sepNTI > 0) ? Math.max(0, 0.37 * sepNTI - totalMA) : CPF_ANNUAL_LIMIT;
      var capBVal = Math.max(0, 37740 - compTotal);
      var capCVal = val('volCPF');
      var capADesc = (s.isSEP && sepNTI > 0)
        ? 'Cap A (37% × NTI − compulsory MediSave): ' + fmt(capAVal)
        : 'Cap A (37% of NTI): not applicable — no trade income declared';
      html += makeStep(stepN++,
        'Voluntary CPF Relief',
        'For self-employed persons, the relief is the lowest of: (A) 37% of NTI minus compulsory MediSave contributions; (B) the remaining Annual Limit headroom; and (C) the actual amount contributed. For opted-in platform workers with no trade income, only caps B and C apply.',
        capADesc + '\nCap B (Annual Limit headroom): ' + fmt(capBVal) + '\nCap C (actual contribution): ' + fmt(capCVal) + '\nBinding cap: ' + fmt(Math.min(capAVal, capBVal, capCVal)),
        'Voluntary CPF Relief = ' + fmt(s.volCPF),
        s.volCPF < capCVal ? 'The voluntary contribution has been partially restricted. Binding cap = ' + fmt(Math.min(capAVal, capBVal)) : null
      );
    }

    // ── RSTU top-up step ──
    if (val('topupSelf') > 0 || val('topupFamily') > 0) {
      var selfRaw = Math.min(val('topupSelf'), 8000);
      var famRaw  = Math.min(val('topupFamily'), 8000);
      html += makeStep(stepN++,
        'CPF Cash Top-up Relief (RSTU)',
        'Cash top-ups under the Retirement Sum Topping-Up Scheme attract a separate relief of up to $16,000 per year, which does not count toward the CPF Annual Limit. From YA 2026, top-up amounts matched under the MRSS or MMSS do not qualify for this relief.',
        'Own SA/RA top-up (capped at $8,000): ' + fmt(selfRaw) + '\n  Less MRSS-matched amount: −' + fmt(s.selfMRSSAmt) + '\n  Net relief — self: ' + fmt(s.topupSelf) + '\n\nFamily SA/RA/MA top-up (capped at $8,000): ' + fmt(famRaw) + '\n  Less MRSS/MMSS-matched amount: −' + fmt(s.famMRSSAmt) + '\n  Net relief — family: ' + fmt(s.topupFam),
        'CPF Cash Top-up Relief = ' + fmt(s.topupTotal)
      );
    }

    // ── Total step ──
    html += makeStep(stepN++,
      'Total CPF-related Relief',
      'The sum of all CPF relief components below forms part of your overall $80,000 personal income tax relief cap.',
      'Compulsory CPF / MediSave relief:  ' + fmt(s.compulsoryRelief) + '\nVoluntary CPF relief:               ' + fmt(s.volCPF) + '\nCPF Cash Top-up Relief (RSTU):      ' + fmt(s.topupTotal) + '\n────────────────────────────────────\nTotal:                              ' + fmt(s.totalCPFRelief),
      'Total CPF Relief (YA 2026) = ' + fmt(s.totalCPFRelief)
    );

    $('stepsContainer').innerHTML = html;
  }

  function buildSummaryPara(s) {
    var lines = [];
    var types = [];
    if (s.isEmp) types.push('an employee');
    if (s.isSEP) types.push('a self-employed person (SEP)');
    if (s.isPW)  types.push('a platform worker');
    var typeStr = types.length === 0 ? 'a worker'
                : types.length === 1 ? types[0]
                : types.slice(0, -1).join(', ') + ' and ' + types[types.length - 1];
    lines.push('You are ' + typeStr + ', aged ' + s.age + ' as at 31 December 2025.');

    if (s.isEmp && s.empCPF > 0) {
      lines.push('Your compulsory employee CPF contributions, after applying the Annual Limit, amount to ' + fmt(s.empCPF) + ', which qualifies for CPF Relief.');
    }
    if (s.isSEP && s.sepMA > 0) {
      lines.push('Your compulsory MediSave contributions as a self-employed person amount to ' + fmt(s.sepMA) + '. From YA 2026, the full amount qualifies for tax relief with no upper cap.');
    } else if (s.isSEP && s.nti <= 6000 && s.nti > 0) {
      lines.push('Your NTI of ' + fmt(s.nti) + ' does not exceed $6,000, so no compulsory MediSave contribution is required and no SEP MediSave relief applies.');
    }
    if (s.isPW && s.pwOptedIn && s.pwCPF > 0) {
      lines.push('As a ' + (s.isPW1995 ? 'mandatory' : 'opted-in') + ' platform worker, your worker share of CPF contributions is ' + fmt(s.pwCPF) + ' at the 2025 phased-in contribution rate. Only your own share qualifies for CPF Relief — the platform operator\'s contributions are not taxable income.');
    } else if (s.isPW && !s.pwOptedIn && s.pwMA > 0) {
      lines.push('As a non-opted-in platform worker, you are required to contribute to MediSave only, amounting to ' + fmt(s.pwMA) + '.');
    }
    if (s.volCPF > 0) {
      lines.push(fmt(s.volCPF) + ' of your voluntary CPF contributions of ' + fmt(s.volCPFRaw) + ' qualifies for relief after applying the relevant caps.');
    }
    if (s.topupTotal > 0) {
      lines.push('Your CPF cash top-ups under the RSTU scheme add ' + fmt(s.topupTotal) + ' in relief, which is separate from the CPF Annual Limit.');
    }
    var totalAll = s.totalCPFRelief + s.otherReliefs;
    var capRem = 80000 - totalAll;
    if (capRem < 0) {
      lines.push('Your total CPF-related relief is ' + fmt(s.totalCPFRelief) + '. Combined with other reliefs of ' + fmt(s.otherReliefs) + ', the aggregate of ' + fmt(totalAll) + ' exceeds the $80,000 personal income tax relief cap — a portion of the relief will be disallowed.');
    } else {
      lines.push('Your total CPF-related relief for YA 2026 is ' + fmt(s.totalCPFRelief) + ', leaving ' + fmt(capRem) + ' of the $80,000 personal relief cap available for other reliefs.');
    }
    $('summaryPara').textContent = lines.join(' ');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  applyWorkerType();
  applyPWOptIn();
  recalc();
});
