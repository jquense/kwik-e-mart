'use strict';
var extend = require('xtend')
  , Clank  = require('clank')
  , cobble = require('cobble')
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
      , actions = this.actions || [];

    this.id    = uniqueId('store_')
    this.state = this.getInitialState() || null
    this.dispatcher = dispatcher || this.dispatcher

    this.dispatcher.register(this, function(payload) {
      var action   = payload.action
        , handlers = findHandler(actions, action);

      if ( !handlers || !handlers.length ) return

      for(var i = 0; i < handlers.length; i++)
        handlers[i].execute(self, payload.data)
    })
  },

  getInitialState: function(){},

  waitFor: function(stores) {
    stores = normalizeStores([].concat(stores))
    this.dispatcher.waitFor(this, stores)
  },

  _set: function(newState){
    this.state = extend(this.state, newState)
    this._schedule(this.emitChange)
  }

})

Store.listenFor = function(){
  var l = arguments.length
    , types = new Array(l)
    , cb;

  if( l < 2) throw new  TypeError('An Action Handler needs at least one action and a handler')

  for (var i = 0; i < l; i++) types[i] = arguments[i];

  cb = types.pop();

  return new ActionHandler(types, cb)
}

Store.setCompositionStrategy({
  actions:    cobble.concat()
})

module.exports =  Store

function findHandler(actions, action){
  var arr = []
  for (var i = 0; i < actions.length; i++){
    if(actions[i].matches(action))
      arr.push(actions[i])
  }
  return arr
}

function normalizeStores(stores) {
  var idx = -1, l = stores.length, arr = new Array(l)
    , store;

  while (++idx < l) {
    store = stores[idx]
    arr[idx] = typeof store === 'string' ? store : store.id;
  }
  return arr
}

var idCounter = 0;
function uniqueId(prefix) {
  return (prefix == null ? '' : prefix) + (++idCounter);
}