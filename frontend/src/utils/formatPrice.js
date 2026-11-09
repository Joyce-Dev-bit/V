export function formatPrice(price) {
  return `${new Intl.NumberFormat('fr-FR').format(price)} Ar`
}
