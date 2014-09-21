var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , boutique = require('../index')
  , listenFor = boutique.Store.listenFor;

chai.use(sinonChai);
chai.should();


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