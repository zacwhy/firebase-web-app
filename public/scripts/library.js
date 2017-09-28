function orderBy(selector, ascending = true) {
  return (a, b) => selector(ascending ? a : b).localeCompare(selector(ascending ? b : a))
}

function orderByDesc(selector) {
  return orderBy(selector, false)
}
