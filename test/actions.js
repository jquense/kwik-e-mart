var chai  = require('chai')
  , sinon = require("sinon")
  , sinonChai = require("sinon-chai")
  , _      = require('lodash')
  , boutique = require('../index')
  , ActionCreator = boutique.ActionCreator
  , action = boutique.ActionCreator.action;

chai.use(sinonChai);
chai.should();


it( 'should create methods that dispatch correctly', function(){
  var dispatcher = new boutique.Dispatcher()
    , payload = {} 
  
  sinon.spy(dispatcher, 'dispatch')

  var storeActions = ActionCreator.create({

        dispatcher: dispatcher,

        createUser: action('CREATE_USER', function(name, send){
          payload.name = name
          send(payload)
        }),

        saveUser: action('SAVE_USER', 'PERSIST_USER', function(name, send){
          payload.name = name
          send(payload)
        })
      });

  storeActions.createUser('jason')

  dispatcher.dispatch.should.have.been
    .calledOnce.and.calledWithExactly({ action: 'CREATE_USER', data: payload })

  dispatcher.dispatch.reset()

  storeActions.saveUser('jason')

  dispatcher.dispatch.should.have.been.calledTwice

})

it( 'should create methods that dispatch by default', function(){
  var dispatcher = new boutique.Dispatcher(); 

  var storeActions = ActionCreator.create({

        dispatcher: dispatcher,

        createUser: action('CREATE_USER')

      });

  sinon.spy(dispatcher, 'dispatch')

  storeActions.createUser('jason')

  dispatcher.dispatch.should.have.been
    .calledOnce.and.calledWithExactly({ action: 'CREATE_USER', data: 'jason' })
})


it( 'should dispatch using key name if no action provided', function(){
  var dispatcher = new boutique.Dispatcher(); 

  var storeActions = ActionCreator.create({

        dispatcher: dispatcher,

        createUser: action(function(name, send){
          send(name)
        }),

        saveUser: action(),
      });

  sinon.spy(dispatcher, 'dispatch')

  storeActions.createUser('jason')
  storeActions.saveUser('jason')

  dispatcher.dispatch
    .should.have.been.calledTwice
    .and.have.deep.property('args[0][0]').that.eqls({ action: 'createUser', data: 'jason' })

  dispatcher.dispatch
    .should.have.deep.property('args[1][0]').that.eqls({ action: 'saveUser', data: 'jason' })
})


it( 'should be able to call other actions from an action', function(){
  var dispatcher = new boutique.Dispatcher(); 

  var storeActions = ActionCreator.create({

        dispatcher: dispatcher,

        createUser: action('CREATE_USER', function(name, send){
          send(name)
          this.saveUser(name)
        }),

        saveUser: action('SAVE_USER')

      });

  sinon.spy(dispatcher, 'dispatch')

  storeActions.createUser('jason')

  dispatcher.dispatch.should.have.been.calledTwice
})