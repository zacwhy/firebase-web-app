function hyperscriptHelpers(h, tagNames = [
  'a',
  'button',
  'div',
  'form',
  'h1',
  'input',
  'label',
  'span'
]) {
  return tagNames.reduce((acc, tagName) => ({
    ...acc,
    [tagName]: (first, second) => h(tagName, first, second)
  }), {})
}

function h(tagName, first, second) {
  const hasProps = typeof first === 'object' && !Array.isArray(first)
  const props = hasProps ? first : {}
  const children = hasProps ? second : first
  const content = Array.isArray(children) ? children.join('') : children

  if (typeof props.style === 'object') {
    props.style = Object.entries(props.style).map(([key, value]) => `${key}: ${value};`).join(' ')
  }

  const propsString = hasProps ? ' ' + Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ') : ''
  return `<${tagName}${propsString}>${content}</${tagName}>`
}
