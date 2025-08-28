const PRICE_URL = "https://interview.switcheo.com/prices.json";
const ICON_BASE = "https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/";

const BALANCES = {
  SWTH: 123.4567,
  USDC: 530.45,
  ETH: 0.789,
  BTC: 0.02345,
  ATOM: 45.12,
  OSMO: 300.0,
};

// --- State ---
let prices = {};
let tokenList = [];
let submitting = false;

// --- Helpers ---
const $ = (sel) => document.querySelector(sel);
const format = (n, maxFractionDigits = 6) =>
  Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits })
    : "—";

function iconUrl(sym) {
  return `${ICON_BASE}${encodeURIComponent(sym)}.svg`;
}

function setIcon(imgEl, sym) {
  imgEl.src = iconUrl(sym);
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = "data:image/svg+xml;utf8," +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="%23ccc"/></svg>';
  };
}

// --- Elements ---
const fromSel = $("#from-token");
const toSel = $("#to-token");
const fromIcon = $("#from-icon");
const toIcon = $("#to-icon");
const inputAmount = $("#input-amount");
const outputAmount = $("#output-amount");
const toSym = $("#to-sym");
const fromBalanceEl = $("#from-balance");
const rateEl = $("#rate");
const slippageEl = $("#slippage");
const slippageValEl = $("#slippage-val");
const estEl = $("#est-receive");
const feeEl = $("#fee");
const minEl = $("#min-received");
const errorsEl = $("#errors");
const confirmBtn = $("#confirm-btn");
const switchBtn = $("#switch-btn");
const maxBtn = $("#max-btn");
const toast = $("#toast");

// --- Init ---
init();

async function init() {
  attachEvents();
  await loadPrices();
  populateTokens();
  const hasSWTH = tokenList.includes("SWTH");
  const hasUSDC = tokenList.includes("USDC");
  fromSel.value = hasSWTH ? "SWTH" : tokenList[0];
  toSel.value = hasUSDC ? "USDC" : (tokenList.find(t => t !== fromSel.value) || tokenList[1] || tokenList[0]);

  setIcon(fromIcon, fromSel.value);
  setIcon(toIcon, toSel.value);
  toSym.textContent = toSel.value;

  slippageValEl.textContent = `${Number(slippageEl.value).toFixed(1)}%`;

  inputAmount.value = "";
  updateBalance();
  compute();
}

function attachEvents() {
  fromSel.addEventListener("change", () => {
    setIcon(fromIcon, fromSel.value);
    updateBalance();
    if (fromSel.value === toSel.value) {
      pickDifferentTo();
    }
    compute();
  });

  toSel.addEventListener("change", () => {
    setIcon(toIcon, toSel.value);
    toSym.textContent = toSel.value;
    if (toSel.value === fromSel.value) {
      pickDifferentFrom();
    }
    compute();
  });

  inputAmount.addEventListener("input", onAmountInput);

  slippageEl.addEventListener("input", () => {
    slippageValEl.textContent = `${Number(slippageEl.value).toFixed(1)}%`;
    compute();
  });

  switchBtn.addEventListener("click", () => {
    const from = fromSel.value;
    const to = toSel.value;
    fromSel.value = to;
    toSel.value = from;
    setIcon(fromIcon, fromSel.value);
    setIcon(toIcon, toSel.value);
    toSym.textContent = toSel.value;
    updateBalance();
    compute();
  });

  maxBtn.addEventListener("click", () => {
    const bal = BALANCES[fromSel.value] ?? 0;
    inputAmount.value = String(bal);
    compute();
  });

  confirmBtn.addEventListener("click", onSubmit);
}

async function loadPrices() {
  try {
    const res = await fetch(PRICE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    prices = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => Number.isFinite(v) && v > 0)
    );
    tokenList = Object.keys(prices).sort();
  } catch (e) {
    showError("Failed to load prices — check your network.");
    prices = {};
    tokenList = [];
  }
}

function populateTokens() {
  const make = (sym) => `<option value="${sym}">${sym}</option>`;
  fromSel.innerHTML = tokenList.map(make).join("");
  toSel.innerHTML = tokenList.map(make).join("");
}

function onAmountInput(e) {
  // chỉ cho số và 1 dấu .
  const next = e.target.value.replace(/,/g, ".");
  if (/^[0-9]*\.?[0-9]*$/.test(next) || next === "") {
    inputAmount.value = next;
    compute();
  }
}

function updateBalance() {
  const sym = fromSel.value;
  const bal = BALANCES[sym] ?? 0;
  fromBalanceEl.textContent = `Balance: ${format(bal)} ${sym}`;
}

function currentRate() {
  const from = fromSel.value, to = toSel.value;
  const fp = prices[from] ?? 0;
  const tp = prices[to] ?? 0;
  return fp && tp ? fp / tp : 0;
}

function compute() {
  clearErrors();

  const from = fromSel.value;
  const to = toSel.value;
  const amount = Number(inputAmount.value);
  const rate = currentRate();
  const slippage = Number(slippageEl.value);
  const balance = BALANCES[from] ?? 0;

  rateEl.textContent = rate ? `Rate: 1 ${from} ≈ ${format(rate, 8)} ${to}` : "Rate: —";

  let est = 0, fee = 0, min = 0;

  let ok = true;
  if (!tokenList.length) {
    showError("No token prices available.");
    ok = false;
  }
  if (from === to) {
    showError("Pick different tokens to swap.");
    ok = false;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    if (inputAmount.value !== "") showError("Enter a valid positive amount.");
    ok = false;
  }
  if (amount > balance) {
    showError("Insufficient balance.");
    ok = false;
  }
  if (!rate) {
    showError("This pair has no available price.");
    ok = false;
  }

  if (ok) {
    est = amount * rate;
    fee = est * 0.003; // 0.3%
    min = est * (1 - slippage / 100);
  }

  outputAmount.textContent = format(est);
  estEl.textContent = `${format(est)} ${to}`;
  feeEl.textContent = `${format(fee)} ${to}`;
  minEl.textContent = `${format(min)} ${to}`;

  confirmBtn.disabled = !ok || submitting;
}

function pickDifferentTo() {
  const cur = fromSel.value;
  const alt = tokenList.find((t) => t !== cur) || cur;
  toSel.value = alt;
  setIcon(toIcon, alt);
  toSym.textContent = alt;
}

function pickDifferentFrom() {
  const cur = toSel.value;
  const alt = tokenList.find((t) => t !== cur) || cur;
  fromSel.value = alt;
  setIcon(fromIcon, alt);
  updateBalance();
}

function showError(msg) {
  const p = document.createElement("p");
  p.className = "error";
  p.textContent = msg;
  errorsEl.appendChild(p);
}
function clearErrors() {
  errorsEl.innerHTML = "";
}

async function onSubmit() {
  if (confirmBtn.disabled || submitting) return;

  submitting = true;
  confirmBtn.disabled = true;
  const original = confirmBtn.innerHTML;
  confirmBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

  const from = fromSel.value;
  const to = toSel.value;
  const amount = Number(inputAmount.value);
  const minReceivedText = minEl.textContent;

  await new Promise((r) => setTimeout(r, 1200));

 
  const rate = currentRate();
  const est = amount * rate;
  const fee = est * 0.003;
  const received = est - fee;
  BALANCES[from] = Math.max((BALANCES[from] ?? 0) - amount, 0);
  BALANCES[to] = (BALANCES[to] ?? 0) + received;
  updateBalance();

  toast.textContent = `Swapped ${format(amount)} ${from} → ${minReceivedText}`;
  toast.hidden = false;
  setTimeout(() => { toast.hidden = true }, 4200);

  // reset input
  inputAmount.value = "";
  compute();

  confirmBtn.innerHTML = original;
  submitting = false;
}
