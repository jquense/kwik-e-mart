var _ = require('lodash')
  , Clank = require('clank');

module.exports = Clank.Object.extend({

  constructor: function Dispatcher(){
      this._stores = {}
      this._isPending = {};
      this._isHandled = {};
      this._isDispatching = false;
      this._pendingPayload = null;
  },

  register: function(store, callback) {
    var self = this
      , name = getName(store);

    if (_.has(self._stores, name) )
      throw new Error('Store: "'+ name + '" already registered with Dispatcher')

    self._stores[name] = callback;
  },


  dispatch: function(payload) {

    if (!!this._isDispatching)  
      throw new Error('Dispatcher.dispatch(...): Cannot dispatch in the middle of a dispatch.')

    this._startDispatching(payload);

    try {
      for (var id in this._stores) {
        if (this._isPending[id]) continue;
        
        this._invokeCallback(id);
      }
    } finally {
      this._stopDispatching();
    }
  },

  waitFor: function(callee, stores) {
    var calleeName = getName(callee)
      , name;

    if (!this._isDispatching)  
      throw new Error('Dispatcher.waitFor(...): Must be invoked while dispatching.')

    for (var i = 0; i < stores.length; i++) {
      name = getName(stores[i]);

      if (this._isPending[name]) {
        if (!this._isHandled[name])  
          throw new Error('Circular wait attempted between: "' + calleeName + '" and "'+ name + '"');

        continue;
      }

      this._invokeCallback(name);
    }
  },

  _invokeCallback: function(name) {
    this._isPending[name] = true;
    this._stores[name](this._pendingPayload);
    this._isHandled[name] = true;
  },

  _startDispatching: function(payload) {
    for (var id in this._stores) {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    }

    this._pendingPayload = payload;
    this._isDispatching = true;
  },

  _stopDispatching: function() {
    this._pendingPayload = null;
    this._isDispatching = false;
  }
})


function getName(store){
  return typeof store === 'string' 
    ? store 
    : store.id // || store.constructor.name;
}


