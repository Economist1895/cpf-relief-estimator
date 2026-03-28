# CPF Relief Estimator

A personal project to help calculate **CPF tax relief** for Singapore's Year of Assessment 2026 (YA2026).

**Live tool**: https://economist1895.github.io/cpf-relief-estimator/

---

## ⚠️ Disclaimer

**This tool is educational and provided as-is.** It is **not an official IRAS or CPF Board product** and should not be used as a substitute for professional tax advice. 

The author assumes no liability for errors, omissions, or tax consequences arising from use of this tool.

---

## Features

This tool calculates CPF-related tax relief for:

- **Employees** — Compulsory employee share on ordinary wages (OW) and additional wages (AW)
- **Self-Employed Persons (SEPs)** — Compulsory MediSave based on Net Trade Income (NTI)
- **Platform Workers (PWs)** — Mandatory/opted-in CPF or MediSave contributions
- **Voluntary CPF** — Relief subject to the 37% NTI cap (SEPs) and Annual Limit headroom
- **CPF Cash Top-ups (RSTU)** — Self and family cash top-ups, with MRSS/MMSS exclusions (YA2026)

The tool accounts for:
- Age-based contribution rate bands
- Multiple ceilings and caps
- Phased-in contribution rates for certain income ranges
- Pensioner MediSave rules
- Pre-1995 platform worker opt-in eligibility
- The $37,740 Annual Limit with pooling rules

---

## How It Works

### Overview

The tool computes your total CPF relief by:

1. **Identifying income types** — You select employee, SEP, PW, or any combination
2. **Calculating compulsory contributions** — Based on age, income, and worker type
3. **Applying ceilings and caps** — OW ceiling, AW ceiling, Annual Limit
4. **Computing voluntary relief** — Subject to the 37% rule (SEPs only) and Annual Limit headroom
5. **Summing RSTU cash top-ups** — Excluding MRSS/MMSS-matched amounts
6. **Displaying step-by-step breakdown** — Each calculation is shown with full working

### Methodology & Key Assumptions

#### **Employee CPF (Compulsory)**

**Rates (2025)** — Age-based employee share:
- Age ≤ 55: 20%
- Age 56–60: 17%
- Age 61–65: 11.5%
- Age 66–70: 7.5%
- Age 71+: 5%

**Ceilings:**
- **Ordinary Wage (OW)**: $7,400/month → annual OW = OW × 12, capped at $88,800
- **Additional Wages (AW)**: Annual limit = $102,000 − annual OW

**Calculation:**
```
Total wages = (Monthly OW, capped at $7,400) × 12 + (AW, capped at ceiling)
Employee CPF = Total wages × age-based rate
```

If you have multiple employers, OW ceiling applies per employer. The tool allows you to override with your actual total CPF deducted.

---

#### **SEP MediSave (Compulsory)**

**Non-pensioners** — NTI-based, age-bracketed (2025):

| Age Range | Low Rate (≤$12k) | High Rate (>$18k) | Max Amount | Phase Band ($12k–$18k) |
|-----------|------------------|-------------------|------------|------------------------|
| ≤34       | 4.0%             | 8.0%              | $7,104     | $480 + 16% of excess    |
| 35–44     | 4.5%             | 9.0%              | $7,992     | $540 + 18% of excess    |
| 45–49     | 5.0%             | 10.0%             | $8,880     | $600 + 20% of excess    |
| 50+       | 5.25%            | 10.5%             | $9,324     | $630 + 21% of excess    |

**Pensioners** — Lower cap (6% max $5,328 for NTI > $18k), but same rates as non-pensioners for NTI ≤ $12k.

**Rule:**
- NTI ≤ $6,000: No compulsory MediSave
- NTI $6,001–$12,000: Low rate applies
- NTI $12,001–$18,000: Phased-in formula
- NTI > $18,000: High rate or pensioner cap

**From YA2026**: Full compulsory MediSave amount qualifies for relief.

---

#### **Platform Worker CPF/MediSave**

**Opted-in (mandatory or voluntary, born 1995+)** — Worker share only:

| Age Range | Rate  |
|-----------|-------|
| ≤35       | 10.5% |
| 36–45     | 11.5% |
| 46–50     | 12.5% |
| 51–60     | 13.0% |
| 61–65     | 10.5% |
| 66–70     | 10.5% |
| 71+       | 9.0%  |

- Net earnings capped at $102,000
- Only earnings > $6,000 attract relief
- Platform operator contributions (not in relief) are also deducted

**Not opted-in (born before 1995, if not elected)** — MediSave only, at SEP rates.

---

#### **Voluntary CPF Relief**

**For SEPs & opted-in PWs** — Lowest of:
- **(A)** 37% of NTI − compulsory MediSave (SEPs only)
- **(B)** Annual Limit headroom ($37,740 − total compulsory)
- **(C)** Actual contribution

**For Employees** — No relief on voluntary OA/SA from 1 Jan 2022 (but voluntary MediSave is claimed under RSTU).

---

#### **Annual Limit ($37,740)**

Pools all compulsory and voluntary CPF relief. Priority:
1. SEP MediSave and PW CPF/MediSave are deducted first
2. Employee CPF is reduced if combined total exceeds $37,740
3. Remaining headroom available for voluntary contributions

---

#### **CPF Cash Top-up Relief (RSTU)**

**Caps:**
- Self top-up: $8,000/year
- Family top-up: $8,000/year
- Total: $16,000/year

**From YA2026:** MRSS- and MMSS-matched amounts are **excluded** from relief.

**Does not count** toward the $37,740 Annual Limit.

---

## Development

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/economist1895/cpf-relief-estimator.git
   cd cpf-relief-estimator
   ```

2. Open `index.html` in a browser, or serve locally:
   ```bash
   python3 -m http.server 8000
   # Open http://localhost:8000
   ```

### Docker

A Dockerfile is included for deployment:
```bash
docker build -t cpf-relief-estimator .
docker run -p 8080:80 cpf-relief-estimator
# Open http://localhost:8080
```

### File Structure

```
.
├── index.html       # HTML form & results layout
├── app.js           # Calculation engine & event handlers
├── logo.png         # IRAS logo
├── Dockerfile       # Multi-stage nginx build
└── README.md        # This file
```

### Browser Compatibility

Built with vanilla JavaScript (ES5). Works on all modern browsers (Chrome, Firefox, Safari, Edge).

---

## License

Personal project. No warranty. Use at your own risk. See [Disclaimer](#-disclaimer) above.
