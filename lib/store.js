var _ = require('lodash')
  , Clank = require('clank')
  , ActionHandler = require('./action-handler')
  , batchingMixin = require('./batching-mixin')
  , emitterMixin = require('./emitter-mixin');


var Store;

Store = Clank.Object.extend(
    emitterMixin
  , batchingMixin
  , {

  constructor: function BaseStore(dispatcher){
    Clank.Object.call(this)

    var self = this 
      , actions = this.actions;

    this.id   = _.uniqueId('store_')
    this.state = this.getInitialState() || null
    this.dispatcher = dispatcher || this.dispatcher

    // this.stores = _.transform(self.references, function(obj, type){
    //   var instance = storeFor(type)
    //   if( !instance ) throw new TypeError('Unmet store dependency: "' + type + '"');

    //   obj[type] = instance
    // }, {})

    this.dispatcher.register(this, function(payload) { 
      var action   = payload.action
        , handlers = _.where(actions, function(a){ return a.matches(action) }); 

      if ( !handlers || !handlers.length ) return

      _.each(handlers, function(handler){
        handler.execute(self, payload.data)
      })
    })
  },

  getInitialState: _.noop,

  waitFor: function(stores) {
    stores = _.map([].concat(stores), function(store){
      return typeof store === 'string'
        ? store 
        : store.id 
    })

    this.dispatcher.waitFor(this, stores)
  },

  _set: function(newState){
    this.state = _.extend({}, this.state, newState)
    this._schedule(this.emitChange)
  }

})

Store.listenFor = function(){
  var types = _.toArray(arguments)
    , cb = types.pop();

  if( arguments.length < 2) 
    throw new  TypeError('An Action Listener needs at least one type and a handler')

  return new ActionHandler(types, cb)
}

Store.setCompositionStrategy({
  actions:    Clank.concat()
})

module.exports =  Store


function getInst(insts, type ){
  var useId = typeof type === 'string'

  return _.find(insts, function(i){ 
    return useId ? i.id === type : (i instanceof type)
  })
}
