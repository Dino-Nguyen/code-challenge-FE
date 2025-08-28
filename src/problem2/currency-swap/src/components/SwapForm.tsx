import { useMemo, useState } from 'react'
import { usePrices } from '../hooks/usePrices'
import { formatAmount, iconUrl } from '../utils/format'

interface BalanceMap { [symbol: string]: number }

// Mock balances for demo
const MOCK_BALANCES: BalanceMap = {
  SWTH: 123.4567,
  ETH: 0.789,
  ATOM: 45.12,
  BTC: 0.02345,
  USDC: 530.45,
  OSMO: 300.0,
}

export default function SwapForm() {
  const { tokens, prices, loading, error } = usePrices()

  const [from, setFrom] = useState<string>('SWTH')
  const [to, setTo] = useState<string>('USDC')
  const [amount, setAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number>(0.5)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const tokenList = useMemo(() => tokens, [tokens])

  const fromPrice = prices[from] ?? 0
  const toPrice = prices[to] ?? 0
  const rate = fromPrice && toPrice ? (fromPrice / toPrice) : 0

  const amtNum = Number(amount)
  const isAmtValid = Number.isFinite(amtNum) && amtNum > 0

  const balance = MOCK_BALANCES[from] ?? 0
  const insufficient = isAmtValid && amtNum > balance
  const sameToken = from === to

  const expectedReceive = isAmtValid && rate ? amtNum * rate : 0
  const feePct = 0.003
  const fee = expectedReceive * feePct
  const minReceived = expectedReceive * (1 - slippage / 100)

  const canSubmit = !loading && !sameToken && isAmtValid && !insufficient && rate > 0

  function swapDirections() {
    setFrom(to)
    setTo(from)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setToast(null)
    await new Promise(r => setTimeout(r, 1200))
    setSubmitting(false)
    setToast(`Swapped ${formatAmount(amtNum)} ${from} → ${formatAmount(minReceived)} ${to} (min received; slippage ${slippage}%)`)
    // update mock balances
    const received = expectedReceive - fee
    MOCK_BALANCES[from] = Math.max((MOCK_BALANCES[from] ?? 0) - amtNum, 0)
    MOCK_BALANCES[to] = (MOCK_BALANCES[to] ?? 0) + received
    setAmount('')
  }

  return (
    <div className="swap-card">
      <h2 className="card-title">Swap</h2>

      {/* ✅ Bọc phần submit trong form */}
      <form className="swap-form" onSubmit={onSubmit}>
        {/* From */}
        <div className="row">
          <label className="label">From</label>
          <div className="pair">
            <TokenSelect value={from} onChange={setFrom} options={tokenList} disabled={loading} />
            <AmountInput
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
              disabled={loading || submitting}
            />
          </div>
          <div className="meta">
            <small>
              Balance: {formatAmount(balance)} {from}{' '}
              <button type="button" className="link" onClick={() => setAmount(String(balance))}>
                MAX
              </button>
            </small>
          </div>
        </div>

        {/* Switch */}
        <div className="swap-btn-wrap">
          <button
            type="button"
            className="swap-btn"
            onClick={swapDirections}
            disabled={loading || submitting}
            aria-label="Switch tokens"
          >
            ↕
          </button>
        </div>

        {/* To */}
        <div className="row">
          <label className="label">To</label>
          <div className="pair">
            <TokenSelect value={to} onChange={setTo} options={tokenList} disabled={loading} />
            <ReadOnly value={expectedReceive} symbol={to} />
          </div>
          <div className="meta">
            <small>Rate: 1 {from} ≈ {rate ? formatAmount(rate, 8) : '—'} {to}</small>
          </div>
        </div>

        {/* Slippage */}
        <div className="row">
          <label className="label">Slippage</label>
          <div className="slippage">
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.1}
              value={slippage}
              onChange={e => setSlippage(Number(e.target.value))}
            />
            <span>{slippage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Summary */}
        <div className="summary">
          <div><span>Estimated receive</span><span>{formatAmount(expectedReceive)} {to}</span></div>
          <div><span>Fee (0.3%)</span><span>{formatAmount(fee)} {to}</span></div>
          <div><span>Min. received (slippage)</span><span>{formatAmount(minReceived)} {to}</span></div>
        </div>

        {/* Errors */}
        {error && <p className="error">Failed to load prices — try again.</p>}
        {sameToken && <p className="error">Pick different tokens to swap.</p>}
        {!isAmtValid && amount && <p className="error">Enter a valid positive amount.</p>}
        {insufficient && <p className="error">Insufficient balance.</p>}

        {/* Submit */}
        <button className="primary" type="submit" disabled={!canSubmit || submitting}>
          {submitting ? <Spinner /> : 'Swap'}
        </button>
      </form>

      {/* Toast */}
      {toast && (
        <div className="toast" role="status" aria-live="polite" onAnimationEnd={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  )
}

/* ----------------- Subcomponents ----------------- */

function TokenSelect({
  value, onChange, options, disabled,
}: { value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <div className="token-select">
      <img
        src={iconUrl(value)}
        alt={value}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle cx=%2216%22 cy=%2216%22 r=%2215%22 fill=%22%23ccc%22/></svg>'
        }}
      />
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map((sym) => (
          <option value={sym} key={sym}>{sym}</option>
        ))}
      </select>
    </div>
  )
}

function AmountInput({
  value, onChange, placeholder, disabled,
}: { value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <input
      className="amount"
      inputMode="decimal"
      pattern="^[0-9]*[.,]?[0-9]*$"
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        const next = e.target.value.replace(/,/g, '.')
        if (/^[0-9]*\.?[0-9]*$/.test(next) || next === '') onChange(next)
      }}
      disabled={disabled}
    />
  )
}

function ReadOnly({ value, symbol }: { value: number; symbol: string }) {
  return (
    <div className="readonly">
      <span>{formatAmount(value)}</span>
      <span className="sym">{symbol}</span>
    </div>
  )
}

function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}
