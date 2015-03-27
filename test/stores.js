var Boutique = require('../src/index')

describe.only('Stores', ()=> {
  var btq;

  beforeEach(()=> {
    btq = new Boutique()
  })

  it('should Mixin in store methods', () => {
    var store = btq.createStore({ hi: 'hi'})

    Object.getPrototypeOf(store).should.contain.keys([
      'bindAction',
      'bindActions',
      'setState', 
      'getState',
      'emitChange', 
      'listen', 
      'stopListening', 
      'waitFor'
    ])
  })


  it('should listen for an action', done => {
     let actions = btq.createActions(
          btq.generateActions(['login', 'logout']));

    class Store {
      constructor(){
        this.bindAction(actions.login, this.login)
      }

      login(arg){
        arg.should.equal('hi')
        done()
      }
    }

    let store = btq.createStore(Store);

    actions.logout()
    actions.login('hi')
  })

  it('should listen for multiple actions', done => {
    let actions = btq.createActions(
          btq.generateActions(['login', 'logout']));

    let count = 0;

    class Store {
      constructor(){
        this.bindActions(actions)
      }

      login(arg){
        arg.should.equal('hi')
        count++;
      }

      logout(arg){
        count && done()
      }
    }

    let store = btq.createStore(Store);

    actions.login('hi')
    actions.logout()
  })

  it('should be observable', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, this.login)
      }

      login() {
        this.emitChange()
      }
    }

    let store = btq.createStore(Store)
      , spy = sinon.spy();

    store.listen(spy)

    actions.login()
    store.stopListening(spy)

    actions.login()

    spy.should.have.been.calledOnce;
  })

  it('should be batchable', done => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, this.login)
      }

      login() {
        this.setState({ prop: 1 })
        this.setState({ otherProp: 3 })
      }
    }

    let store = btq.createStore(Store)
      , spy = sinon.spy();

    store.listen(spy)

    actions.login()

    setTimeout(()=> {
      spy.should.have.been.calledOnce;
      done()
    })
  })

  it('should be allow sync updates', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, this.login)
      }

      login() {
        this.setState({ prop: 1 })
        this.setState({ otherProp: 3 })
      }
    }

    let store = btq.createStore(Store, { sync: true })
      , spy = sinon.spy();

    store.listen(spy)

    actions.login()
    
    spy.should.have.been.calledTwice;
  })
})