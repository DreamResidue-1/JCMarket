export function formatMoney(amountMoney: number){
  return `$${(Math.round(amountMoney) /100).toFixed(2)}`
}