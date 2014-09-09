var _ = require('lodash')
  , Clank = require('clank')
  , Promise = require('bluebird');


module.exports = Clank.Object.extend({

  constructor: function Dispatcher(){
      this._stores = {}
      this._deferreds = {}
      this._waits = {}
      this.dispatching = null;
  },

  register: function(store, callback) {
    var self = this
      , name = getName(store);

    if (_.has(self._stores, name) )
      throw new Error('Store: "'+ name + '" already registered with Dispatcher')

    self._stores[name] = callback;
  },

  dispatch: function(payload) {
    var self = this

    if ( self.dispatching ) 
      throw new TypeError('Cannot dispatch "'+ payload.action + '" until "'+ this.dispatching + '" is finished')

    else if (!_.has(payload, 'action')) 
      throw new TypeError('Action payload must have an Action property')
    
    else if (!_.has(payload, 'data')  ) 
      throw new TypeError('Action payload must have an Data property')

    self.dispatching = payload.action;

    self._deferreds = toDeferreds(self._stores);

    _.each(self._stores, function(store, key) {
      var d = self._deferreds[key]

      try {

        Promise
          .cast(store(payload))
          .then(function(){
            d.resolve(payload)
          })
          .catch(function(err){
            d.reject(err)
          })
      } 
      catch(err){ d.reject(err) }
    });

    self._deferreds = {}
    self._waits = {}
    self.dispatching = null
  },

  waitFor: function(callee, stores) {
    var self = this
      , calleeName = getName(callee);

    stores = [].concat(stores);

    if (!_.has(self._stores, calleeName))     throw new Error('Calling store is not registered with the Dispatcher')
    else if ( _.has(self._waits, calleeName)) throw new Error('Store: "' + calleeName + '" already waiting')
    else if ( _.contains(stores, calleeName)) throw new Error('Calling store cannot wait on itself')
    
    _waits[calleeName] = stores;

    return Promise.map(stores, function(name){
      cirularwait = ( self._waits[name] || [] ).indexOf(calleeName)!== -1;

      if (!_.has(self._stores, name) ) 
        throw new Error('Store: "' + calleeName + '" attempting to wait on a non-registered Store:"'+ name + '"')

      else if ( cirularwait ) 
        throw new Error('Circular wait attempted between: "' + calleeName + '" and "'+ name + '"')

      return self._deferreds[name].promise;
    });
  }
})


function getName(store){
    return typeof store === 'string' 
        ? store 
        : store.id // || store.constructor.name;
}

function toDeferreds(_stores){
    return _.mapValues(_stores, function() {
        var d = {}
        
        d.promise = new Promise(function(resolve, reject){ 
            d.resolve = resolve
            d.reject  = reject
        })

        return d
    });
}


