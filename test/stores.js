
var Boutique = require('../src/index')

describe('Stores', ()=> {
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
        this.bindAction(actions.login, 'login')
      }

      login(arg){
        arg.should.equal('hi')
        done()
      }
    }

    btq.createStore(Store);

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

      logout(){
        count && done()
      }
    }

    store = btq.createStore(Store);

    actions.login('hi')
    actions.logout()
  })

  it('should be observable', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'login')
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

  it('should update state', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'login')

        this.state = { first: 5}
      }

      login() {
        this.setState({ prop: 1 })
        this.setState({ otherProp: 3 })
      }
    }

    let store = btq.createStore(Store);

    actions.login()

    store.state.should.eql({ first: 5, prop: 1, otherProp: 3})
  })

  it('should be batchable', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    let spy = sinon.spy()
      , store = btq.createStore({
        constructor(){
          this.bindAction(actions.login, 'login')
        },

        login() {
          this.setState({ prop: 1 })
          this.setState({ otherProp: 3 })
        }
      });

    store.listen(spy)

    actions.login()

    spy.should.have.been.calledOnce;
  })

  it('should not emit change when no setState calls were made', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    let spy = sinon.spy()
      , store = btq.createStore({
          constructor(){
            this.bindAction(actions.login, 'login')
          },

          login() {}
        });

    store.listen(spy)

    actions.login()

    spy.should.not.have.been.called;
  })

  it('should be update state synchronously', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'login')
      }

      login() {
        this.setState({ prop: 1 })
        this.state.should.eql({ prop: 1 })

        this.setState({ otherProp: 3 })
        this.state.should.eql({ prop: 1, otherProp: 3})
      }
    }

    let store = btq.createStore(Store)
      , spy = sinon.spy();

    store.listen(spy)

    actions.login()
    
    spy.should.have.been.calledOnce;
  })

  it('should not break store prototype chain', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class BaseStore {
      logout(){}
    }

    class Store extends BaseStore {
      constructor(){
        this.bindAction(actions.login)
      }

      login() {}
    }

    btq.createStore(Store)
      .logout.should.be.a('function');
  })

  it('should warn on direct action handler access', () => {
    let actions = btq.createActions(btq.generateActions(['login']));

    class Store {
      constructor(){
        this.bindAction(actions.login, 'login')
      }

      login() {}
    }

    let store = btq.createStore(Store)
      , spy = sinon.stub(console, 'warn');

    store.login()

    spy.should.have.been.calledOnce;

    console.warn.restore()
  })
})