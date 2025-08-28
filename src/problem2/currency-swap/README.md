# Currency Swap (Vite + React + TypeScript)

A simple, attractive currency swap UI that fetches live prices, shows token icons, validates inputs, supports slippage, and simulates a backend swap.

---

## 🚀 Quick Start

```bash
npm i
npm run dev
```

Vite will print a local URL (e.g. `http://localhost:5173`). Open it in your browser.

---

## 📦 Build & Preview

```bash
npm run build
npm run preview
```

---

## 🗂 Project Structure

```
.
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles.css
    ├── hooks/
    │   └── usePrices.ts
    ├── components/
    │   └── SwapForm.tsx
    └── utils/
        └── format.ts
```

---

## ✨ Features

* Live prices from `https://interview.switcheo.com/prices.json` (filters out invalid/zero prices)
* Token icons from `https://github.com/Switcheo/token-icons` (with fallback)
* Input validation: positive amount, different tokens, sufficient (mock) balance, available pair rate
* Slippage control (0.1–2.0%) and minimum received calculation
* MAX balance, token switch, estimated receive, fee (0.3%), and toast on success
* Simulated network latency (\~1200ms) on swap with spinner
* Clean, responsive UI with subtle 3D hover transitions

---

## 🔧 Configuration

* **API endpoints**

  * Prices: `https://interview.switcheo.com/prices.json`
  * Icons: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/{SYMBOL}.svg`
* **Mock balances** are defined in `src/components/SwapForm.tsx` (`MOCK_BALANCES`). Replace with real wallet balances if integrating a provider.

---

## 🧪 How to Test Quickly

1. Choose two different tokens in the From/To selects.
2. Enter a positive amount, or click **MAX**.
3. If amount > balance → **Insufficient balance** error appears.
4. Press **Swap** → spinner then success toast; mock balances update.

