export function formatAmount(n: number, maxFractionDigits = 6) {
if (!Number.isFinite(n)) return '—'
return n.toLocaleString(undefined, {
minimumFractionDigits: 0,
maximumFractionDigits: maxFractionDigits,
})
}


export function iconUrl(symbol: string) {
return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${encodeURIComponent(symbol)}.svg`
}