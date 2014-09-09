var _ = require('lodash')
  , Clank = require('clank')
  , Promise = require('bluebird')
  , ActionHandler = require('./action-handler')
  , emitterMixin = require('.emitter-mixin');


var Store;

Store = Clank.Object.extend(
    emitterMixin
  , {

  constructor: function BaseStore(){
    var self = this 
      , actions = this.actions
      , stores  = (this.stores || []).slice(0);

    this.id   = this.id || _.uniqueId('store_');
    this.data = this.getInitialData() || {};

    this.stores = _.transform(self.references, function(obj, type){
      var instance = storeFor(type)
      if( !instance ) throw new TypeError('Unmet store dependency: "' + type + '"');

      obj[type] = instance
    }, {})

    this.dispatcher.register(this, function(payload) { 
      var action   = payload.action
        , handlers = _.where(actions, function(a){ a.matches(action) }); 

      if ( !handlers || !handlers.length ) return

      return Promise.map(handlers, function(handler){
        return handler.execute(self, payload.data)
      })
    })
  },

  getInitialData: _.noop,

  waitFor: function(stores) {
    stores = _.map([].concat(stores), function(store){
      return typeof store === 'string'
        ? store 
        : store.id 
    })

    return this.dispatcher.waitFor(this, stores)
  },

})


Store.listensFor = function(){
  var types = _.toArray(arguments)
    , cb = types.pop();

  if( arguments.length < 2) 
      throw new  TypeError('An Action Listener needs at least one type and a handler')

  return new ActionHandler(types, cb)
}

Store.setCompositionStrategy({
  actions:    Clank.concat(),
  references: Clank.concat()
})

store.$injects = [ 'dispatcher:main', '']
return Store


function storeFor(type){
  return di.resolve('store:' + type)
}

function getInst(insts, type ){
  var useId = typeof type === 'string'

  return _.find(insts, function(i){ 
    return useId ? i.id === type : (i instanceof type)
  })
}
