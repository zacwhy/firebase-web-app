const e = React.createElement
const h = hyperscriptHelpers(React.createElement)

class Navbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {active: false}
  }

  render() {
    const activeableClassName = className => this.state.active ? [className, 'is-active'].join(' ') : className

    return h.div({className: 'container'},
      h.nav({className: 'navbar'},
        h.div({className: 'navbar-brand'},
          h.div({
              className: activeableClassName('navbar-burger burger'),
              onClick: () => {
                this.setState(({active}) => ({active: !active}))
              }
            },
            h.span(),
            h.span(),
            h.span()
          )
        ),
        h.div({className: activeableClassName('navbar-menu')},
          h.div({className: 'navbar-start'},

            this.props.user ?
              h.div({className: 'navbar-item has-dropdown is-hoverable'},
                h.a({className: 'navbar-link is-active'}, `Welcome ${this.props.user.email}!`),
                h.div({className: 'navbar-dropdown'},
                  h.a({
                    className: 'navbar-item',
                    onClick: () => {
                      firebase.auth().signOut().then(e => console.log(e))
                    }
                  }, 'Sign out')
                )
              ) :
              h.a({className: 'navbar-item', href: 'login.html'}, 'Sign in')
          )
        )
      )
    )
  }
}

class EntryForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      date: new Date().toLocaleDateString('en-CA'), // TODO: this.props.date
      // date: new Date().toISOString().split('T')[0]
      amount: '',
      from: '',
      to: '',
      description: ''
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    const target = event.target
    this.setState({[target.id]: target.value})
  }

  handleSubmit(event) {
    const entry2 = {
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      amount: parseInt(this.state.amount),
      from: this.state.from,
      to: this.state.to,
      description: this.state.description
    }
    const entry = {
      ...entry2,
      date: this.state.date
    }

    const database = firebase.database()
    const entryListRef = database.ref('entries')
    const newEntryRef = entryListRef.push()

    const newEntryKey = newEntryRef.key
    const updates = {}
    updates['/entries/' + newEntryKey] = entry

    const dateString = this.state.date.replace(/-/g, '/')
    updates[`/entries2/${dateString}/${newEntryKey}`] = entry2

    database.ref().update(updates)
      .then(() => {
        this.setState({
          amount: '',
          from: '',
          to: '',
          description: ''
        })
        this.amountInput.focus()
      })
      .catch(error => {
        console.log(error)
        alert('Error creating new entry')
      })

    event.preventDefault()
  }

  render() {
    return h.form({onSubmit: this.handleSubmit},
      h.input({
        id: 'amount',
        min: 1,
        onChange: this.handleChange,
        // pattern: '\d+',
        placeholder: 'amount',
        ref: input => this.amountInput = input,
        required: true,
        step: 1,
        type: 'number',
        value: this.state.amount
      }),
      h.input({
        id: 'from',
        onChange: this.handleChange,
        placeholder: 'from',
        required: true,
        type: 'text',
        value: this.state.from
      }),
      h.input({
        id: 'to',
        onChange: this.handleChange,
        placeholder: 'to',
        required: true,
        type: 'text',
        value: this.state.to
      }),
      h.input({
        id: 'description',
        onChange: this.handleChange,
        placeholder: 'description',
        required: true,
        type: 'text',
        value: this.state.description
      }),
      h.input({
        id: 'date',
        onChange: this.handleChange,
        required: true,
        type: 'date',
        value: this.state.date
      }),
      h.input({
        type: 'submit',
        value: 'Submit'
      })
    )
  }
}

class EntryListItem extends React.Component {
  render() {
    const {amount, description, from, to} = this.props.entry
    return h.div({className: 'columns tags'},
      h.span({className: 'tag is-warning'}, formatMoney(amount)),
      h.span({className: 'tag is-primary'}, from),
      h.span({className: 'tag is-danger'}, to),
      h.span({className: 'tag is-light'}, description)
    )
  }
}

class EntryListItemGroup extends React.Component {
  render() {
    const date = this.props.groupKey
    const entryListItems = this.props.entries
      .sort(orderByDesc(x => x.value.createdAt))
      .map(({key, value}) => e(EntryListItem, {key, entry: value}))

    return h.div({className: 'columns'},
      h.div({className: 'column'},
        h.div({className: 'columns tags'},
          h.span({className: 'tag is-dark'}, formatDate(date))
        ),
        ...entryListItems
      )
    )
  }
}

class EntryList extends React.Component {
  render() {
    const groups = groupBy(x => x.value.date)(objectEntries(this.props.entries))

    const entryListItemGroups = objectEntries(groups)
      .sort(orderByDesc(x => x.key))
      .map(({key, value}) => e(EntryListItemGroup, {groupKey: key, entries: value}))

    return h.div({}, ...entryListItemGroups)
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      count: null,
      entries: {},
      user: null
    }
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      this.setState({user})
    }, error => {
      console.log(error)
      alert('Error with auth')
    })

    const database = firebase.database()

    database.ref('count').on('value', snapshot => {
      this.setState({count: snapshot.val()})
    })

    const entryListRef = database.ref('entries').limitToLast(10)

    entryListRef.on('child_added', data => {
      this.setState(previousState => ({
        entries: addEntry(previousState.entries, data.key, data.val())
      }))
    })

    entryListRef.on('child_changed', data => {
      this.setState(previousState => ({
        entries: changeEntry(previousState.entries, data.key, data.val())
      }))
    })

    entryListRef.on('child_removed', data => {
      this.setState(previousState => ({
        entries: removeEntry(previousState.entries, data.key)
      }))
    })

    function addEntry(entries, key, value) {
      return {...entries, [key]: value}
    }

    function removeEntry(entries, key) {
      const {[key]: {}, ...unchangedEntries} = entries
      return unchangedEntries
    }

    function changeEntry(entries, key, value) {
      return addEntry(removeEntry(entries, key), key, value)
    }
  }

  render() {
    const {count, entries, user} = this.state
    return h.div({},
      e(Navbar, {user}),

      user &&
      h.section({className: 'section'},
        h.div({className: 'container'},
          h.button({
            onClick() {
              if (!confirm('Confirm?')) {
                return
              }
              const countRef = firebase.database().ref('count')
              countRef.transaction(count => count + 1)
            }
          }, count),
          e(EntryForm),
          h.hr(),
          e(EntryList, {entries})
        )
      )
    )
  }
}

ReactDOM.render(e(App), document.getElementById('root'))


function hyperscriptHelpers(createElement) {
  const types = ['a', 'button', 'div', 'form', 'hr', 'input', 'nav', 'section', 'span']
  return types.reduce((acc, type) => ({
    ...acc,
    [type]: (...args) => createElement(type, ...args)
  }), {})
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-SG', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  })
}

function formatMoney(cents) {
  return (cents / 100).toFixed(2)
}

function objectEntries(obj) {
  return Object.entries(obj)
    .map(([key, value]) => ({key, value}))
}

function groupBy(selector) {
  return items => {
    return items.reduce((acc, item) => {
      const field = selector(item)
      return {
        ...acc,
        [field]: (acc[field] || []).concat(item)
      }
    }, {})
  }
}

function orderBy(selector, ascending = true) {
  return (a, b) => {
    const [c, d] = [selector(a), selector(b)]
    const [x, y] = ascending ? [c, d] : [d, c]
    const type = typeof x

    if (type === 'number') {
      return x - y
    }

    if (type === 'string') {
      return x.localeCompare(y)
    }

    throw 'Type is not supported: ' + type
  }
}

function orderByDesc(selector) {
  return orderBy(selector, false)
}
