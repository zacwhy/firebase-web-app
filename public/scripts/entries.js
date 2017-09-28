// Initialize Firebase
firebase.initializeApp(config)

//  const bigOne = document.getElementById('bigOne')
//  const dbRef = firebase.database().ref().child('text')
//  dbRef.on('value', snap => bigOne.innerText = snap.val())

const $ = selector => document.querySelector(selector)
const amountInput = $('#amount')
const dateInput = $('#date')
const {div, span} = hyperscriptHelpers(h)

amountInput.focus()
dateInput.valueAsDate = new Date()

const entryListRef = firebase.database().ref('entries')

entryListRef.once('value')
  .then(snapshot => Object.entries(snapshot.val()).map(([key, value]) => ({key, value})))
  .then(entries => entries.sort(orderByDesc(x => x.key)))
  .then(entries => $('#entries').innerHTML = renderEntries(entries))

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
    div({class: 'header'}, [
      span({class: 'label red'}, from),
      span({class: 'label blue'}, to),
      span({class: 'date'}, dateToString(new Date(date)))
    ]),
    div([
      span({class: 'label grey'}, '$' + centsToString(amount)),
      span(description)
    ])
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
