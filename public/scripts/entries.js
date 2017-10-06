const $ = selector => document.querySelector(selector)
const amountInput = $('#amount')
const dateInput = $('#date')
const {div, span} = hyperscriptHelpers(h)

amountInput.focus()
dateInput.valueAsDate = new Date()

const entryListRef = firebase.database().ref('entries')

entryListRef.once('value')
  .then(snapshot => Object.entries(snapshot.val()).map(([key, value]) => ({key, value})))
  .then(entries => entries.sort(compareEntry))
  .then(entries => $('#entries').innerHTML = renderEntries(entries))

function compareEntry(a, b) {
  const fns = [
    orderByDesc(x => x.value.date),
    orderByDesc(x => x.key)
  ]

  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i]
    const result = fn(a, b)
    if (result !== 0) {
      return result
    }
  }
}

entryListRef.on('child_added', data => console.log(new Date(), 'child_added', data.key, data.val()))
entryListRef.on('child_changed', data => console.log(new Date(), 'child_changed', data.key, data.val()))
entryListRef.on('child_removed', data => console.log(new Date(), 'child_removed', data.key, data.val()))

$('#entry').onsubmit = () => {
  const saveButton = $('#save')
  saveButton.disabled = true

  const fromInput = $('#from')
  const toInput = $('#to')
  const descriptionInput = $('#description')
  const status = $('#status')

  const entry = {
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    date: dateInput.value,
    amount: parseInt(amountInput.value),
    from: fromInput.value,
    to: toInput.value,
    description: descriptionInput.value
  }

  const newEntryRef = entryListRef.push()

  newEntryRef.set(entry)
    .then(() => {
      amountInput.value = ''
      fromInput.value = ''
      toInput.value = ''
      descriptionInput.value = ''
      amountInput.focus()
      saveButton.disabled = false

      status.innerText = 'Successful!'
      setTimeout(() => status.innerText = '', 5000)
    })
    .catch(error => {
      status.innerText = 'Error! ' + error
    })

  return false
}

function renderEntries(entries) {
  return div(entries.map(renderEntry).join(''))
}

function renderEntry({value: {amount, date, description, from, to}}) {
  return div({class: 'entry'}, [
    span({class: 'label grey'}, '$' + centsToString(amount)),
    span({class: 'label red'}, from),
    span({class: 'label blue'}, to),
    span(description),
    span({class: 'date'}, dateToString(new Date(date)))
  ])
}

function dateToString(date) {
  return date.toLocaleDateString('en-SG', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  })
}

function centsToString(cents) {
  return (cents / 100).toFixed(2);
}
