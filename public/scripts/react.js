const e = React.createElement
const [a, div, nav, span] = ['a', 'div', 'nav', 'span'].map(React.createFactory)

class Navbar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {active: false}
  }

  render() {
    const activeableClassName = className => this.state.active ? [className, 'is-active'].join(' ') : className

    return div({className: 'container'},
      nav({className: 'navbar'},
        div({className: 'navbar-brand'},
          div({
              className: activeableClassName('navbar-burger burger'),
              onClick: () => {
                this.setState(({active}) => ({active: !active}))
              }
            },
            span(),
            span(),
            span()
          )
        ),
        div({className: activeableClassName('navbar-menu')},
          div({className: 'navbar-start'},

            this.props.user ?
              div({className: 'navbar-item has-dropdown is-hoverable'},
                a({className: 'navbar-link is-active'}, `Welcome ${this.props.user.email}!`),
                div({className: 'navbar-dropdown'},
                  a({
                    className: 'navbar-item',
                    onClick: () => {
                      firebase.auth().signOut().then(e => console.log(e))
                    }
                  }, 'Sign out')
                )
              ) :
              a({className: 'navbar-item', href: 'login.html'}, 'Sign in')
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
    return e('form', {onSubmit: this.handleSubmit},
      e('input', {
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
      e('input', {
        id: 'from',
        onChange: this.handleChange,
        placeholder: 'from',
        required: true,
        type: 'text',
        value: this.state.from
      }),
      e('input', {
        id: 'to',
        onChange: this.handleChange,
        placeholder: 'to',
        required: true,
        type: 'text',
        value: this.state.to
      }),
      e('input', {
        id: 'description',
        onChange: this.handleChange,
        placeholder: 'description',
        required: true,
        type: 'text',
        value: this.state.description
      }),
      e('input', {
        id: 'date',
        onChange: this.handleChange,
        required: true,
        type: 'date'
        // value: this.state.date
      }),
      e('input', {
        type: 'submit',
        value: 'Submit'
      })
    )
  }
}

class EntryListItem extends React.Component {
  render() {
    const {amount, date, description, from, to} = this.props.entry
    return e('div', {className: 'columns tags'},
      e('span', {className: 'tag is-dark'}, formatDate(date)),
      e('span', {className: 'tag is-warning'}, amount),
      e('span', {className: 'tag is-primary'}, from),
      e('span', {className: 'tag is-danger'}, to),
      e('span', {className: 'tag is-light'}, description)
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

class EntryList extends React.Component {
  render() {
    const entryListItems = Object.entries(this.props.entries)
      .map(([key, value]) => ({key, value}))
      .sort(compareEntry)
      .map(({key, value}) => e(EntryListItem, {key: key, entry: value}))
    return e('div', null, ...entryListItems)
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
        entries: addEntry(previousState.entries, data)
      }))
    })

    entryListRef.on('child_changed', data => {
      this.setState(previousState => ({
        entries: addEntry(removeEntry(previousState.entries, data), data)
      }))
    })

    entryListRef.on('child_removed', data => {
      this.setState(previousState => ({
        entries: removeEntry(previousState.entries, data)
      }))
    })

    function addEntry(entries, data) {
      return {...entries, [data.key]: data.val()}
    }

    function removeEntry(entries, data) {
      const {[data.key]: {}, ...unchangedEntries} = entries
      return unchangedEntries
    }
  }

  render() {
    return div({},
      e(Navbar, {user: this.state.user}),
      this.state.user && e('section', {className: 'section'},
        e('div', {className: 'container'},
          e(EntryForm),
          e('hr'),
          e(EntryList, {entries: this.state.entries})
        )
      )
    )
  }
}

ReactDOM.render(e(App), document.getElementById('root'))
