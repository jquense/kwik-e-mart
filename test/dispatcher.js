var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , boutique = require('../index')
  , listenFor = boutique.Store.listenFor;

chai.use(sinonChai);
chai.should();

it( 'should register the store', function(){
  var dispatcher = new boutique.Dispatcher()

  sinon.spy(dispatcher, 'register')

  var store = new boutique.Store(dispatcher)

  dispatcher.register.should.have.been.calledOnce
})

it( 'should register the store only once', function(){
  var dispatcher = new boutique.Dispatcher()
  var store = new boutique.Store(dispatcher);

  ;(function(){
    dispatcher.register(store)
  }).should.throw()
  
})


it( 'should register store actions', function(){
  var dispatcher = new boutique.Dispatcher()
    , spyA = sinon.spy(),spyB = sinon.spy()
    , payload = {};

  var Store = boutique.Store.extend({
    actions: [
      listenFor('MY_ACTION', spyA),
      listenFor('MY_ACTION_B', spyB)
    ]
  });

  new Store(dispatcher)

  dispatcher.dispatch({ action: 'MY_ACTION', data: payload })
  dispatcher.dispatch({ action: 'MY_ACTION_B', data: payload })

  spyA.should.have.been.calledOnce.and.calledWithExactly(payload)
  spyB.should.have.been.calledOnce.and.calledWithExactly(payload)
})

it( 'should not dispatch while dispatching', function(){
  var dispatcher = new boutique.Dispatcher()
    , payload = {};

  var Store = boutique.Store.extend({
    actions: [
      listenFor('ACTION', function(){
        return dispatcher.dispatch({ action: 'another_action' })
      })
    ]
  });

  new Store(dispatcher)

  ;(function(){
    dispatcher.dispatch({ action: 'ACTION', data: payload })
  }).should.throw('Dispatcher.dispatch(...): Cannot dispatch in the middle of a dispatch.')
  
})

it( 'should wait for others', function(){
  var dispatcher = new boutique.Dispatcher()
    , spyB = sinon.spy()
    , storeB;

  var StoreA = boutique.Store.extend({
    actions: [ 
      listenFor('ACTION', function(){
        spyB.should.not.have.been.calledOnce
        this.waitFor(storeB)
        spyB.should.have.been.calledOnce
      })
    ]
  });

  var StoreB = boutique.Store.extend({
    actions: [ listenFor('ACTION', spyB) ]
  });

  new StoreA(dispatcher)
  storeB = new StoreB(dispatcher)
  
  dispatcher.dispatch({ action: 'ACTION', data: {} })
})


it( 'should concat actions', function(){
  var dispatcher = new boutique.Dispatcher()
    , Base = boutique.Store.extend({ actions: [ listenFor('ACTION', _.noop) ] })
    , MyStore = Base.extend({ actions: [ listenFor('ACTION_2', _.noop) ] });

  
  (new MyStore(dispatcher)).actions.length.should.equal(2)
})

it( 'should emit change events', function(){
  var dispatcher = new boutique.Dispatcher()
    , spy = sinon.spy()
    , store = boutique.Store.create({ 
        dispatcher: dispatcher
      });

  store.listen(spy)

  store.emitChange()

  spy.should.have.been.calledOnce
})


it( 'should batch set calls', function(done){
  var dispatcher = new boutique.Dispatcher()
    , spy = sinon.spy()
    , store = boutique.Store.create({ dispatcher: dispatcher })
    , timer;

  store.listen(spy = sinon.spy(function(){
    if(!timer)
      timer = setTimeout(function(){
        store.state.should.eql({ hi: 'oops', a: 'hi' })
        spy.should.have.been.calledOnce
        done()
      }, 0)
  }))

  store._set({ hi: 'hello' })
  store._set({ a: 'hi' })

  store.state.should.eql({ hi: 'hello', a: 'hi' })
  
  store._set({ hi: 'oops' })

  spy.should.not.have.been.called
})

it( 'should respond to multiple actions from a single handler', function(){
  var dispatcher = new boutique.Dispatcher()
    , spy = sinon.spy()
    , store = boutique.Store.create({ 
        dispatcher: dispatcher,
        actions: [ listenFor('ACTION', 'ACTION_B', spy) ] 
      });

  dispatcher.dispatch({ action: 'ACTION', data: {} })
  dispatcher.dispatch({ action: 'ACTION_B', data: {} })

  spy.should.have.been.calledTwice
})