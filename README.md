# CPF Relief Estimator (Beta)

A lightweight, client-side CPF tax relief estimator for Singapore taxpayers, built as a static web app. Covers employees, self-employed persons, and platform workers for Year of Assessment (YA) 2026.

> **Disclaimer:** This tool provides estimates only. Actual relief may differ based on individual circumstances and IRAS assessment. Refer to IRAS and CPF Board for official guidance.

## Features

### Worker Types
Supports mixed income profiles — tick any combination:
- **Employee** — salaried workers with monthly CPF deductions
- **Self-Employed (SEP)** — freelancers, sole proprietors, consultants, etc.
- **Platform Worker** — Grab, delivery, ride-hail platforms (mandatory or opted-in)

### CPF Relief Components

**Employee CPF Relief**
- Computed automatically from monthly Ordinary Wage (OW) and annual Additional Wages (AW)
- Uses age-based employee contribution rates against the 2025 OW ceiling of $7,400/month
- Optional override field for multi-employer situations

**SEP MediSave Relief**
- Compulsory MediSave contributions computed from Net Trade Income (NTI) and age using the full CPF rate table, including the phased-in formula for the $12,001–$18,000 NTI band
- Pensioner rate (6%, capped at $5,328) supported via toggle
- From YA 2026, the full compulsory MediSave amount qualifies for relief with no upper cap

**Platform Worker CPF Relief**
- Mandatory contributors (born on/after 1 Jan 1995) and opted-in workers: worker share computed from the 2025 phased-in transition rate table by age
- Non-opted-in workers (born before 1995): MediSave only, using SEP MediSave rates on net platform earnings

**Voluntary CPF Relief**
- Available to SEPs and platform workers making voluntary contributions to OA, SA, and MA
- Capped at the lowest of: (a) 37% of NTI minus compulsory MediSave; (b) Annual Limit headroom; (c) actual amount contributed

**CPF Cash Top-up Relief (RSTU)**
- Own SA/RA top-ups: up to $8,000
- Family members' SA/RA/MA top-ups: up to $8,000
- Total maximum: $16,000 per year, separate from the CPF Annual Limit
- MRSS and MMSS-matched amounts excluded from YA 2026

### Annual Limit Tracking
- Live progress bar showing usage of the $37,740 CPF Annual Limit across all compulsory and voluntary contributions
- Pooled cap applied across worker types, with SEP MediSave taking precedence over employee CPF

### Results
- Step-by-step calculation breakdown for each relief component, with formulas shown
- Plain-English summary of the full relief position
- $80,000 personal income tax relief cap tracker, with optional entry of other personal reliefs

## Tech

Pure HTML, CSS, and vanilla JS — no frameworks, no build step, no dependencies except IBM Plex Sans loaded from Google Fonts.

```
cpf-relief.html   — structure and styles
app.js            — all interactivity and computation logic
logo.png          — header logo
```

The JS is structured as a single `DOMContentLoaded` block with no inline event handlers.

## Tax Rules Reference

Calculations follow IRAS and CPF Board rules for YA 2026 (income year 2025):

| Parameter | Value |
|---|---|
| OW ceiling | $7,400/month |
| AW ceiling | $102,000 − total OW subject to CPF |
| CPF Annual Limit | $37,740 |
| Employee contribution rates | 20% (≤55), 17% (56–60), 11.5% (61–65), 7% (66–70), 5% (>70) |
| SEP MediSave rates | 4–10.5% of NTI by age band; phased-in formula for $12,001–$18,000 |
| PW worker share (2025) | 9–13% by age |
| RSTU relief cap | $8,000 self + $8,000 family |
| Personal relief cap | $80,000 |

Key rule changes for YA 2026:
- SEPs receive full relief on compulsory MediSave with no upper cap (previously capped)
- MRSS/MMSS-matched top-up amounts no longer qualify for CPF Cash Top-up Relief
- Platform worker CPF contributions begin phased alignment with employee rates (2025–2029)

**Sources:** [IRAS CPF Relief for Employees](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs/central-provident-fund(cpf)-relief-for-employees) · [IRAS CPF Relief for Self-Employed](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs/central-provident-fund-(cpf)-relief-for-self-employed-employee-who-is-also-self-employed) · [IRAS CPF Relief as a Platform Worker](https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-reliefs-rebates-and-deductions/tax-reliefs/central-provident-fund-(cpf)-relief-as-a-platform-worker) · [CPF Board contribution rate tables](https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay)

## Known Limitations

- **PR rates not differentiated** — first- and second-year PRs have reduced CPF rates. The tool uses third-year-onwards rates for all PRs and displays a notice accordingly.
- **Multi-employer OW ceiling** — where a taxpayer has more than one employer, each employer applies the OW ceiling independently. An override field is provided for users to enter their actual total CPF deducted.
- **Annual approximation for platform workers** — CPF contributions for platform workers are computed monthly per platform operator. The tool annualises net earnings for simplicity, which may differ slightly from the actual sum of monthly deductions.
- **RSTU top-up limits not verified** — the tool does not check whether top-ups exceed the member's Full Retirement Sum (own account) or Basic Healthcare Sum (MediSave). Users should check their CPF Retirement Dashboard before making top-ups.

## Status

Beta — calculations have been manually verified against IRAS and CPF Board guidelines but have not been officially endorsed.
