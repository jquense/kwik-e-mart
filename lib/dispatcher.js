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

    self._deferreds = _.mapValues(self._stores, function(store, key) {
      return Promise.cast(store(payload))
    })

     console.log(self._deferreds)

    return Promise.all(_.values(self._deferreds))
      .then(function(){
        console.log('finished')
        self._deferreds = {}
        self._waits = {}
        self.dispatching = null
      })
  },

  waitFor: function(callee, stores) {
    var self = this
      , calleeName = getName(callee);

    stores = [].concat(stores);

    if (!_.has(self._stores, calleeName))     throw new Error('Calling store is not registered with the Dispatcher')
    else if ( _.has(self._waits, calleeName)) throw new Error('Store: "' + calleeName + '" already waiting')
    else if ( _.contains(stores, calleeName)) throw new Error('Calling store cannot wait on itself')
    
    self._waits[calleeName] = stores;

    return Promise.map(stores, function(name){
      cirularwait = ( self._waits[name] || [] ).indexOf(calleeName)!== -1;

      if (!_.has(self._stores, name) ) 
        throw new Error('Store: "' + calleeName + '" attempting to wait on a non-registered Store:"'+ name + '"')

      else if ( cirularwait ) 
        throw new Error('Circular wait attempted between: "' + calleeName + '" and "'+ name + '"')

      console.log(self)
      return self._deferreds[name];
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


