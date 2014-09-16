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


it( 'should register store actions', function(done){
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
    .then(function(){
      return dispatcher.dispatch({ action: 'MY_ACTION_B', data: payload })
    })
    .then(function(){
      spyA.should.have.been.calledOnce.and.calledWithExactly(payload)
      spyB.should.have.been.calledOnce.and.calledWithExactly(payload)

      done()
    })
})

it( 'should not dispatch while dispatching', function(done){
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

  dispatcher.dispatch({ action: 'ACTION', data: payload })
    .then(null, function(err){
      console.log('hiiii')
      done()
    })
})

it.only( 'should wait for others', function(done){
  var dispatcher = new boutique.Dispatcher()
    , spyA = sinon.spy()
    , storeA;

  var StoreA = boutique.Store.extend({
    actions: [ listenFor('ACTION',spyA) ]
  });

  var StoreB = boutique.Store.extend({
    actions: [ 
      listenFor('ACTION', function(){
        this.waitFor(storeA).then(function(){
          console.log('made it')
          done();

        })
      })
    ]
  });

  storeA = new StoreA(dispatcher)
  new StoreB(dispatcher)

  dispatcher.dispatch({ action: 'ACTION', data: {} })
})