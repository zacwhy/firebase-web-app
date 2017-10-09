const e = React.createElement

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
      entries: {}
    }
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        console.log('Signed in as ' + user.email)
      } else {
        alert('User is signed out')
      }
    }, error => {
      console.log(error)
      alert('Error with auth')
    })

    const database = firebase.database()
    const entryListRef = database.ref('entries')

    entryListRef.on('child_added', data => {
      this.setState(previousState => {
        const entries = {...previousState.entries, [data.key]: data.val()}
        return {entries}
      })
    })

    entryListRef.on('child_changed', data => {
      console.log(new Date(), 'child_changed', data.key, data.val())
    })

    entryListRef.on('child_removed', data => {
      this.setState(previousState => {
        const {[data.key]: {}, ...entries} = previousState.entries
        return {entries}
      })
    })
  }

  render() {
    return e('section', {className: 'section'},
      e('div', {className: 'container'},
        e(EntryForm),
        e('hr'),
        e(EntryList, {entries: this.state.entries})
      )
    )
  }
}

ReactDOM.render(e(App), document.getElementById('root'))
