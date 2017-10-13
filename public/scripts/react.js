const types = ['a', 'div', 'form', 'hr', 'input', 'nav', 'section', 'span']

const e = React.createElement
const h = types.reduce((acc, type) => ({
  ...acc,
  [type]: (...args) => e(type, ...args)
}), {})

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
    const entry = {
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      date: this.state.date,
      amount: parseInt(this.state.amount),
      from: this.state.from,
      to: this.state.to,
      description: this.state.description
    }

    const database = firebase.database()
    const entryListRef = database.ref('entries')
    const newEntryRef = entryListRef.push()

    newEntryRef.set(entry)
      .then(() => {
        this.setState({
          amount: '',
          from: '',
          to: '',
          description: ''
        })
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
    const {amount, date, description, from, to} = this.props.entry
    return h.div({className: 'columns tags'},
      h.span({className: 'tag is-dark'}, formatDate(date)),
      h.span({className: 'tag is-warning'}, formatMoney(amount)),
      h.span({className: 'tag is-primary'}, from),
      h.span({className: 'tag is-danger'}, to),
      h.span({className: 'tag is-light'}, description)
    )
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-SG', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  })
}

function formatMoney(cents) {
  return (cents / 100).toFixed(2);
}

class EntryList extends React.Component {
  render() {
    const entryListItems = Object.entries(this.props.entries)
      .map(([key, value]) => ({key, value}))
      .sort(compareEntry)
      .map(({key, value}) => e(EntryListItem, {key: key, entry: value}))
    return h.div({}, ...entryListItems)
  }
}

function compareEntry(a, b) {
  const result = b.value.date.localeCompare(a.value.date)
  return result !== 0 ? result : b.key.localeCompare(a.key)
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
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
    return h.div({},
      e(Navbar, {user: this.state.user}),

      this.state.user &&
      h.section({className: 'section'},
        h.div({className: 'container'},
          e(EntryForm),
          h.hr(),
          e(EntryList, {entries: this.state.entries})
        )
      )
    )
  }
}

ReactDOM.render(e(App), document.getElementById('root'))
