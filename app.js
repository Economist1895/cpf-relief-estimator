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

  // ── Tab switching (2 tabs: inputs, result) ────────────────────────────────
  function switchTab(tab) {
    ['inputs', 'result'].forEach(function (t) {
      $('page-' + t).classList.toggle('active', t === tab);
      $('tab-' + t).classList.toggle('active', t === tab);
    });
    if (tab === 'result') updateResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('tab-inputs').addEventListener('click', function () { switchTab('inputs'); });
  $('tab-result').addEventListener('click', function () { switchTab('result'); });
  $('btnToResult').addEventListener('click', function () { switchTab('result'); });

  // ── Reset ─────────────────────────────────────────────────────────────────
  $('btnReset').addEventListener('click', function () {
    document.querySelectorAll('input[type="number"]').forEach(function (el) { el.value = ''; });

    isEmpType = true; isSEPType = false; isPWType = false;
    $('wc-employee').querySelector('input').checked = true;
    $('wc-sep').querySelector('input').checked = false;
    $('wc-pw').querySelector('input').checked = false;
    $('wc-employee').classList.add('selected');
    $('wc-sep').classList.remove('selected');
    $('wc-pw').classList.remove('selected');
    hide('noTypeWarning');

    isSC = true;
    $('btnSC').classList.add('active'); $('btnPR').classList.remove('active');
    $('prNote').style.display = 'none';

    isPW1995 = true;
    $('btnPW1995').classList.add('active'); $('btnPWPre1995').classList.remove('active');
    $('pwOptInSection').classList.add('hidden');
    $('pwOptedInSection').classList.remove('hidden');
    $('pwNotOptedSection').classList.add('hidden');

    ['sepPensioner', 'pwOptIn', 'selfMRSS', 'familyMRSS'].forEach(function (id) {
      $(id).checked = false;
    });
    $('selfMRSSSection').classList.add('hidden');
    $('familyMRSSSection').classList.add('hidden');

    ['empCPFDisplay', 'sepMADisplay', 'pwCPFDisplay', 'pwMADisplay',
     'volCPFAllowedDisplay', 'topupTotalDisplay'].forEach(function (id) {
      setText(id, '$0.00');
    });
    $('volCPFCapNote').textContent = '';

    applyWorkerType();
    applyPWOptIn();
    switchTab('inputs');
    recalc();
  });

  // ── Worker type selection ─────────────────────────────────────────────────
  document.querySelectorAll('input[name="workerType"]').forEach(function (cb) {
    cb.addEventListener('change', function () {
      isEmpType = $('wc-employee').querySelector('input').checked;
      isSEPType = $('wc-sep').querySelector('input').checked;
      isPWType  = $('wc-pw').querySelector('input').checked;
      ['wc-employee', 'wc-sep', 'wc-pw'].forEach(function (id) {
        $(id).classList.toggle('selected', $(id).querySelector('input').checked);
      });
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
  $('pwOptIn').addEventListener('change', function () { applyPWOptIn(); recalc(); });
  function applyPWOptIn() {
    var optedIn = isPW1995 || $('pwOptIn').checked;
    $('pwOptedInSection').classList.toggle('hidden', !optedIn);
    $('pwNotOptedSection').classList.toggle('hidden', optedIn);
  }

  $('sepPensioner').addEventListener('change', recalc);

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
    el.addEventListener('keydown', function (e) { if (e.key === '-') e.preventDefault(); });
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
  // BUG FIX: age 66-70 corrected from 0.07 to 0.075 per official CPF table
  var EMP_RATES = [
    { maxAge: 55,  rate: 0.20 },
    { maxAge: 60,  rate: 0.17 },
    { maxAge: 65,  rate: 0.115 },
    { maxAge: 70,  rate: 0.075 },
    { maxAge: 999, rate: 0.05 }
  ];
  var OW_CEILING = 7400;
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
    return {
      owCapped: owCapped, owAnnual: owAnnual,
      awCapped: awCapped, awCeiling: awCeiling,
      rate: rate, rawCPF: raw
    };
  }

  // SEP MediSave rates (non-pensioner), 2025
  var SEP_MA_CAPS = [
    { maxAge: 34,  lowRate: 0.040, highRate: 0.080, maxAmt: 7104, phaseA: 480,  phaseB: 0.1600 },
    { maxAge: 44,  lowRate: 0.045, highRate: 0.090, maxAmt: 7992, phaseA: 540,  phaseB: 0.1800 },
    { maxAge: 49,  lowRate: 0.050, highRate: 0.100, maxAmt: 8880, phaseA: 600,  phaseB: 0.2000 },
    { maxAge: 999, lowRate: 0.0525, highRate: 0.105, maxAmt: 9324, phaseA: 630,  phaseB: 0.2100 }
  ];
  var PENSIONER_RATE = 0.06;
  var PENSIONER_MAX  = 5328;

  // Pensioner phase-in formulas for $12,001-$18,000 band
  // From official CPF table: pensioners phase from lowRate to 6%
  var PENSIONER_PHASE = [
    { maxAge: 34,  phaseA: 480, phaseB: 0.10 },
    { maxAge: 44,  phaseA: 540, phaseB: 0.09 },
    { maxAge: 49,  phaseA: 600, phaseB: 0.08 },
    { maxAge: 999, phaseA: 630, phaseB: 0.075 }
  ];

  function getSEPMAbracket(age) {
    for (var i = 0; i < SEP_MA_CAPS.length; i++) {
      if (age <= SEP_MA_CAPS[i].maxAge) return SEP_MA_CAPS[i];
    }
    return SEP_MA_CAPS[SEP_MA_CAPS.length - 1];
  }

  function getPensionerPhase(age) {
    for (var i = 0; i < PENSIONER_PHASE.length; i++) {
      if (age <= PENSIONER_PHASE[i].maxAge) return PENSIONER_PHASE[i];
    }
    return PENSIONER_PHASE[PENSIONER_PHASE.length - 1];
  }

  function computeSEPMA(age, nti, isPensioner) {
    if (nti <= 6000) return { amount: 0, desc: 'NTI ≤ $6,000 — no compulsory MediSave payable.', rate: 0 };

    var b = getSEPMAbracket(age);

    if (isPensioner) {
      // BUG FIX: Pensioners use same lower-band rates as non-pensioners for NTI $6,001-$12,000
      var amount, desc, rate;
      if (nti <= 12000) {
        // Same as non-pensioner lower rate
        amount = nti * b.lowRate;
        rate = b.lowRate;
        desc = fmtPct(b.lowRate) + ' × NTI (NTI $6,001–$12,000 — same rate as non-pensioner)';
      } else if (nti <= 18000) {
        var pp = getPensionerPhase(age);
        amount = pp.phaseA + pp.phaseB * (nti - 12000);
        rate = amount / nti;
        desc = '$' + pp.phaseA + ' + ' + fmtPct(pp.phaseB) + ' × (NTI − $12,000) [pensioner phased-in band]';
      } else {
        amount = Math.min(nti * PENSIONER_RATE, PENSIONER_MAX);
        rate = PENSIONER_RATE;
        desc = '6% × NTI, capped at $5,328 (pensioner rate, NTI > $18,000)';
      }
      return { amount: amount, rate: rate, desc: desc };
    }

    // Non-pensioner
    var amount, desc, rate;
    if (nti <= 12000) {
      amount = nti * b.lowRate;
      rate = b.lowRate;
      desc = fmtPct(b.lowRate) + ' × NTI (NTI $6,001–$12,000)';
    } else if (nti <= 18000) {
      amount = b.phaseA + b.phaseB * (nti - 12000);
      rate = amount / nti;
      desc = '$' + b.phaseA + ' + ' + fmtPct(b.phaseB) + ' × (NTI − $12,000) [phased-in $12,001–$18,000]';
    } else {
      amount = Math.min(nti * b.highRate, b.maxAmt);
      rate = b.highRate;
      desc = fmtPct(b.highRate) + ' × NTI, capped at $' + b.maxAmt.toLocaleString('en-SG') + ' (NTI > $18,000)';
    }
    return { amount: amount, rate: rate, desc: desc };
  }

  // Platform Worker rates (opted-in/mandatory, 2025)
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
    var capped = Math.min(netEarnings, 102000);
    if (netEarnings <= 6000) return { amount: 0, rate: 0, desc: 'Net earnings ≤ $6,000 — no worker share CPF.' };
    var rate = getPWRate2025(age);
    var amount = capped * rate;
    return { amount: amount, rate: rate, desc: fmtPct(rate) + ' × net earnings (2025 phased rate, age ' + age + ')' };
  }

  function computePWMA(age, netEarnings) {
    return computeSEPMA(age, netEarnings, false);
  }

  // ─── Main recalc ──────────────────────────────────────────────────────────
  function recalc() {
    var rawAge = parseInt($('age').value);
    var age = (isNaN(rawAge) || rawAge < 16 || rawAge > 100) ? 0 : rawAge;
    var isEmp = isEmpType, isSEP = isSEPType, isPW = isPWType;

    var empCPF = 0, empDetail = null;
    if (isEmp && age > 0) {
      var override = val('empOverrideCPF');
      if (override > 0) {
        empCPF = override;
        empDetail = { override: true, raw: override, capped: empCPF };
      } else {
        empDetail = computeEmpCPF(age, val('empOW'), val('empAW'));
        empCPF = empDetail.rawCPF;
      }
    }

    var sepMAResult = null, sepMA = 0;
    if (isSEP && age > 0) {
      sepMAResult = computeSEPMA(age, val('sepNTI'), $('sepPensioner').checked);
      sepMA = sepMAResult.amount;
    }

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

    var sepPWCompulsory = sepMA + pwCPF + pwMA;
    var empCPFAllowed = Math.max(0, Math.min(empCPF, CPF_ANNUAL_LIMIT - sepPWCompulsory));
    var totalCompulsory = empCPFAllowed + sepPWCompulsory;

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
        capA = CPF_ANNUAL_LIMIT;
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
          volCPFCapNote = 'Capped to ' + fmt(volCPFAllowed) + ' by ' + reason + '.';
        } else {
          volCPFCapNote = 'Full amount qualifies for relief.';
        }
      }
      setText('volCPFAllowedDisplay', fmt(volCPFAllowed));
      $('volCPFCapNote').textContent = volCPFCapNote;
    }

    empCPF = empCPFAllowed;

    var selfTopup = Math.min(val('topupSelf'), 8000);
    var selfMRSS  = $('selfMRSS').checked ? Math.min(val('selfMRSSAmt'), selfTopup) : 0;
    var selfRelief = Math.max(0, selfTopup - selfMRSS);
    var famTopup  = Math.min(val('topupFamily'), 8000);
    var famMRSS   = $('familyMRSS').checked ? Math.min(val('familyMRSSAmt'), famTopup) : 0;
    var famRelief = Math.max(0, famTopup - famMRSS);
    var topupTotal = selfRelief + famRelief;
    setText('topupTotalDisplay', fmt(topupTotal));


    var compulsoryRelief = empCPF + sepMA + pwCPF + pwMA;
    var totalCPFRelief = compulsoryRelief + volCPF + topupTotal;

    window._cpfState = {
      age: age, isEmp: isEmp, isSEP: isSEP, isPW: isPW, isSC: isSC,
      empCPF: empCPF, empDetail: empDetail,
      empOW: val('empOW'), empAW: val('empAW'),
      sepMA: sepMA, sepMAResult: sepMAResult, nti: val('sepNTI'), isPensioner: $('sepPensioner').checked,
      pwCPF: pwCPF, pwDetail: pwDetail, pwMA: pwMA, pwMADetail: pwMADetail,
      isPW1995: isPW1995, pwOptedIn: isPW1995 || (isPW && $('pwOptIn').checked),
      pwNetEarnings: val('pwNetEarnings'), pwMANetEarnings: val('pwMANetEarnings'),
      volCPF: volCPF, volCPFAllowed: volCPFAllowed, volCPFRaw: val('volCPF'), volCapNote: volCPFCapNote,
      topupSelfRaw: val('topupSelf'), topupFamRaw: val('topupFamily'),
      topupSelf: selfRelief, topupFam: famRelief, topupTotal: topupTotal,
      selfMRSSAmt: selfMRSS, famMRSSAmt: famMRSS,
      compulsoryRelief: compulsoryRelief, totalCPFRelief: totalCPFRelief
    };
  }

  // ─── Results page ─────────────────────────────────────────────────────────
  function updateResults() {
    recalc();
    var s = window._cpfState;
    if (!s || s.age === 0) {
      $('stepsContainer').innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:12px 0;">Please enter your age and income details first.</div>';
      return;
    }

    setText('r-total', fmt(s.totalCPFRelief));
    setText('r-totalBig', fmt(s.totalCPFRelief));

    // Show separate rows for each compulsory relief source
    if (s.isEmp && s.empCPF > 0) { show('r-empRow'); setText('r-emp', fmt(s.empCPF)); } else { hide('r-empRow'); }
    if (s.isSEP && s.sepMA > 0) { show('r-sepRow'); setText('r-sep', fmt(s.sepMA)); } else { hide('r-sepRow'); }
    if (s.isPW && (s.pwCPF > 0 || s.pwMA > 0)) {
      show('r-pwRow');
      if (s.pwOptedIn) {
        setText('r-pwLabel', 'PW CPF Relief (worker share)');
        setText('r-pw', fmt(s.pwCPF));
      } else {
        setText('r-pwLabel', 'PW MediSave Relief');
        setText('r-pw', fmt(s.pwMA));
      }
    } else { hide('r-pwRow'); }

    if (s.volCPF > 0) { show('r-volRow'); setText('r-vol', fmt(s.volCPF)); } else { hide('r-volRow'); }
    if (s.topupTotal > 0) { show('r-topupRow'); setText('r-topup', fmt(s.topupTotal)); } else { hide('r-topupRow'); }

    // $80k cap note (replaces the old separate card)
    var capRem = 80000 - s.totalCPFRelief;
    var capNote = $('r-capNote');
    capNote.innerHTML = 'Your CPF reliefs use <strong>' + fmt(s.totalCPFRelief) + '</strong> of the $80,000 personal relief cap. <strong>' + fmt(capRem) + '</strong> remaining.<br><span style="font-size:0.76rem;color:var(--text-muted);">Remember to account for other reliefs (Earned Income, Spouse, NSman, etc.) against the $80,000 cap.</span>';

    buildSteps(s);
  }

  // ── Chevron SVG ───────────────────────────────────────────────────────────
  var chevronSVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4,6 8,10 12,6"/></svg>';

  function makeStep(num, title, resultText, desc, calc, warn, pills) {
    var pillsHtml = '';
    if (pills && pills.length) {
      pills.forEach(function (p) {
        pillsHtml += ' <span class="pill ' + p.cls + '">' + p.text + '</span>';
      });
    }
    var w = warn ? '<div class="step-warn">' + warn + '</div>' : '';
    var c = calc ? '<div class="step-calc">' + calc + '</div>' : '';
    var r = resultText ? '<div class="step-result-inline">→ ' + resultText + '</div>' : '';
    return '<div class="step">' +
      '<div class="step-header">' +
        '<div class="step-num">' + num + '</div>' +
        '<div class="step-summary">' +
          '<div class="step-title">' + title + pillsHtml + '</div>' +
          r +
        '</div>' +
        '<div class="step-chevron">' + chevronSVG + '</div>' +
      '</div>' +
      '<div class="step-detail">' +
        '<div class="step-desc">' + desc + '</div>' +
        c + w +
      '</div>' +
    '</div>';
  }

  function buildSteps(s) {
    var html = '';
    var stepN = 1;

    // ── EMPLOYEE ──
    if (s.isEmp) {
      if (s.empDetail && s.empDetail.override) {
        html += makeStep(stepN++,
          'Employee CPF Relief (manual)',
          'Employee CPF Relief = ' + fmt(s.empCPF),
          'You entered your actual total CPF contributions directly.',
          'Actual employee CPF: ' + fmt(s.empDetail.raw) + '\nCapped at Annual Limit ($37,740): ' + fmt(s.empCPF),
          null, null
        );
      } else if (s.empDetail) {
        var d = s.empDetail;
        var pills = [];
        if (s.empOW > OW_CEILING) pills.push({ text: 'OW ceiling applied', cls: 'pill-cap' });
        if (s.empAW > d.awCeiling && d.awCeiling >= 0) pills.push({ text: 'AW ceiling applied', cls: 'pill-cap' });

        var calc = 'Monthly OW: ' + fmt(s.empOW) + '  →  capped at $7,400: ' + fmt(d.owCapped) + '/month\n' +
          'Annual OW: ' + fmt(d.owCapped) + ' × 12 = ' + fmt(d.owAnnual) + '\n\n' +
          'AW ceiling: $102,000 − ' + fmt(d.owAnnual) + ' = ' + fmt(d.awCeiling) + '\n' +
          'AW entered: ' + fmt(s.empAW) + '  →  capped: ' + fmt(d.awCapped) + '\n\n' +
          'Total wages for CPF: ' + fmt(d.owAnnual) + ' + ' + fmt(d.awCapped) + ' = ' + fmt(d.owAnnual + d.awCapped) + '\n' +
          'Employee rate (age ' + s.age + '): ' + fmtPct(d.rate) + '\n' +
          fmt(d.owAnnual + d.awCapped) + ' × ' + fmtPct(d.rate) + ' = ' + fmt((d.owAnnual + d.awCapped) * d.rate) + '\n' +
          'After pooled Annual Limit cap: ' + fmt(s.empCPF);

        html += makeStep(stepN++,
          'Compulsory Employee CPF',
          'Employee CPF Relief = ' + fmt(s.empCPF),
          'CPF Relief for employees is the compulsory employee share on ordinary wages (OW) and additional wages (AW), using the age-based contribution rate.',
          calc,
          d.rawCPF > CPF_ANNUAL_LIMIT ? 'Exceeded the $37,740 Annual Limit — reduced accordingly.' : null,
          pills
        );
      }
    }

    // ── SEP ──
    if (s.isSEP && s.sepMAResult) {
      var maR = s.sepMAResult;
      var ageGroup = s.age <= 34 ? 'Below 35' : s.age <= 44 ? '35–44' : s.age <= 49 ? '45–49' : '50+';
      var calc = 'NTI: ' + fmt(s.nti) + '\nAge group: ' + ageGroup + '\n' + maR.desc + '\nCompulsory MediSave: ' + fmt(maR.amount);
      html += makeStep(stepN++,
        'Compulsory MediSave (SEP)',
        'SEP MediSave Relief = ' + fmt(s.sepMA),
        'Self-employed persons with NTI > $6,000 must make compulsory MediSave contributions. From YA 2026, the full amount qualifies for relief.',
        calc,
        s.nti <= 6000 && s.nti > 0 ? 'NTI ≤ $6,000 — no compulsory MediSave required.' : null,
        null
      );
    }

    // ── PLATFORM WORKER ──
    if (s.isPW) {
      if (s.pwOptedIn && s.pwDetail) {
        var pwR = s.pwDetail;
        var capped = Math.min(s.pwNetEarnings, 102000);
        var calc = 'Net platform earnings: ' + fmt(s.pwNetEarnings) + '\nCapped at $102,000: ' + fmt(capped) + '\n' +
          '2025 worker rate (age ' + s.age + '): ' + fmtPct(pwR.rate) + '\n' +
          fmt(capped) + ' × ' + fmtPct(pwR.rate) + ' = ' + fmt(pwR.amount);
        html += makeStep(stepN++,
          'Platform Worker CPF (worker share)',
          'PW CPF Relief = ' + fmt(s.pwCPF),
          'Mandatory or opted-in platform workers contribute to OA, SA, and MA. Only the worker share qualifies for relief.',
          calc,
          s.pwNetEarnings <= 6000 ? 'Net earnings ≤ $6,000 — no worker share CPF applies.' : null,
          null
        );
      } else if (!s.pwOptedIn && s.pwMADetail) {
        html += makeStep(stepN++,
          'MediSave (non-opted-in PW)',
          'PW MediSave Relief = ' + fmt(s.pwMA),
          'Non-opted-in platform workers contribute to MediSave only, at SEP rates.',
          'Net platform earnings: ' + fmt(s.pwMANetEarnings) + '\n' + s.pwMADetail.desc + '\nMediSave: ' + fmt(s.pwMADetail.amount),
          null, null
        );
      }
    }

    // ── ANNUAL LIMIT ──
    var compTotal = s.empCPF + s.sepMA + s.pwCPF + s.pwMA;
    var wasPoolCapped = (s.empDetail && !s.empDetail.override && (s.empDetail.rawCPF + s.sepMA + s.pwCPF + s.pwMA) > CPF_ANNUAL_LIMIT);
    var limitPills = [];
    if (compTotal >= CPF_ANNUAL_LIMIT) limitPills.push({ text: 'Limit reached', cls: 'pill-warn' });
    else limitPills.push({ text: fmt(37740 - compTotal) + ' headroom', cls: 'pill-ok' });

    html += makeStep(stepN++,
      'Annual Limit ($37,740)',
      compTotal >= 37740 ? 'Fully used — no voluntary relief available' : 'Headroom = ' + fmt(37740 - compTotal),
      'The $37,740 Annual Limit covers all compulsory and voluntary CPF. SEP MediSave takes priority; employee CPF is reduced if needed.',
      'Employee CPF (before cap): ' + fmt(s.empDetail && !s.empDetail.override ? s.empDetail.rawCPF : s.empCPF) +
      '\nSEP MediSave: ' + fmt(s.sepMA) +
      '\nPW CPF / MediSave: ' + fmt(s.pwCPF + s.pwMA) +
      '\nTotal compulsory (capped): ' + fmt(compTotal) +
      '\nRemaining for voluntary: ' + fmt(Math.max(0, 37740 - compTotal)),
      wasPoolCapped ? 'Employee CPF reduced — combined compulsory exceeded $37,740. SEP MediSave takes priority.' : null,
      limitPills
    );

    // ── VOLUNTARY ──
    if (s.isEmp && !s.isSEP && !s.isPW) {
      html += makeStep(stepN++,
        'Voluntary CPF (Employee)',
        'Not applicable',
        'Employees cannot claim CPF Relief on voluntary OA/SA contributions from 1 Jan 2022. Voluntary MediSave top-ups are claimed under RSTU.',
        null, null, null
      );
    } else if (s.volCPFRaw > 0 || s.volCPF > 0) {
      var sepNTI = s.nti;
      var totalMA = s.sepMA + s.pwMA;
      var capAVal = (s.isSEP && sepNTI > 0) ? Math.max(0, 0.37 * sepNTI - totalMA) : CPF_ANNUAL_LIMIT;
      var capBVal = Math.max(0, 37740 - compTotal);
      var capCVal = s.volCPFRaw;
      var bindingVal = Math.min(capAVal, capBVal, capCVal);
      var bindingName = '';
      if (bindingVal === capAVal && s.isSEP && sepNTI > 0) bindingName = '37% of NTI minus MediSave';
      else if (bindingVal === capBVal) bindingName = 'Annual Limit headroom';
      else bindingName = 'Actual contribution';

      var volPills = [];
      if (s.volCPF < capCVal) volPills.push({ text: bindingName + ' binding', cls: 'pill-cap' });
      else volPills.push({ text: 'Full amount', cls: 'pill-ok' });

      var capADesc = (s.isSEP && sepNTI > 0)
        ? 'Cap A: 37% × ' + fmt(sepNTI) + ' − ' + fmt(totalMA) + ' = ' + fmt(capAVal)
        : 'Cap A: N/A (no trade income)';
      html += makeStep(stepN++,
        'Voluntary CPF Relief',
        'Voluntary Relief = ' + fmt(s.volCPF),
        'For SEPs: lowest of (A) 37% of NTI minus compulsory MediSave, (B) Annual Limit headroom, (C) actual contribution. For opted-in PWs without trade income, only B and C apply.',
        capADesc + '\nCap B: Annual Limit headroom = ' + fmt(capBVal) + '\nCap C: Actual contributed = ' + fmt(capCVal) + '\nBinding: ' + fmt(bindingVal) + ' (' + bindingName + ')',
        s.volCPF < capCVal ? 'Voluntary contribution partially restricted by ' + bindingName + '.' : null,
        volPills
      );
    }

    // ── RSTU ──
    if (s.topupSelfRaw > 0 || s.topupFamRaw > 0) {
      var selfRaw = Math.min(s.topupSelfRaw, 8000);
      var famRaw  = Math.min(s.topupFamRaw, 8000);
      html += makeStep(stepN++,
        'Cash Top-up Relief (RSTU)',
        'RSTU Relief = ' + fmt(s.topupTotal),
        'Cash top-ups under RSTU get up to $16,000 relief ($8,000 self + $8,000 family). Does not count toward the CPF Annual Limit. From YA 2026, MRSS/MMSS-matched amounts are excluded.',
        'Own top-up (capped at $8,000): ' + fmt(selfRaw) + '\n  Less MRSS: −' + fmt(s.selfMRSSAmt) + '\n  Net: ' + fmt(s.topupSelf) + '\n\n' +
        'Family top-up (capped at $8,000): ' + fmt(famRaw) + '\n  Less MRSS/MMSS: −' + fmt(s.famMRSSAmt) + '\n  Net: ' + fmt(s.topupFam),
        null, null
      );
    }

    // ── TOTAL ──
    html += makeStep(stepN++,
      'Total CPF Relief',
      'Total = ' + fmt(s.totalCPFRelief),
      'Sum of all CPF relief components. This forms part of your $80,000 personal relief cap.',
      'Compulsory CPF / MediSave:  ' + fmt(s.compulsoryRelief) + '\nVoluntary CPF:              ' + fmt(s.volCPF) + '\nRSTU Cash Top-up:           ' + fmt(s.topupTotal) + '\n──────────────────────────\nTotal CPF Relief (YA 2026): ' + fmt(s.totalCPFRelief),
      null, null
    );

    $('stepsContainer').innerHTML = html;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  // Delegated click handler for collapsible steps (avoids inline JS)
  $('stepsContainer').addEventListener('click', function (e) {
    var header = e.target.closest('.step-header');
    if (header) {
      header.parentElement.classList.toggle('open');
    }
  });

  applyWorkerType();
  applyPWOptIn();
  recalc();
});
