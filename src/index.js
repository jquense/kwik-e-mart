let Dispatcher = require('flux').Dispatcher
  , { 
    actionsMixin
  , emitterMixin
  , stateMixin } = require('./storeMixins')
  , invariant = require('invariant');


let idCount = 0;

module.exports = class Boutique {

  constructor(){
    this.dispatcher = new Dispatcher()
  }

  dispatch(action, ...data){
    var spread = data.length >= 1;

    this.dispatcher.dispatch({ action, data, spread })
  }

  createStore(StoreClass, options = {}){
    const ACTIONS = {};

    let boutique = this
      , proto = StoreClass.prototype;

    if (typeof StoreClass !== 'function') {
      let tmp = StoreClass
      StoreClass = StoreClass.hasOwnProperty('constructor') ? StoreClass.constructor : function Store(){}
      proto = tmp
    }

    StoreClass.prototype = {

      waitFor(stores) {
        invariant(Array.isArray(stores)
          , 'Expected an `Array` to be passed to `waitFor()`, but got: `%s`', typeof actions)

        boutique.dispatcher.waitFor(
          stores.map( store => store.dispatchToken || store ))
      },

      ...stateMixin(options.sync),

      ...actionsMixin(ACTIONS),

      ...emitterMixin(),

      ...proto
    }

    let store = new StoreClass()

    store.dispatchToken = boutique.dispatcher.register( payload => {
        let handler = ACTIONS[payload.action];

        if ( handler )
          handler.apply(store, payload.data)
      })

    return store
  }

  generateActions(actions){
    invariant(Array.isArray(actions)
      , 'Expected an Array to be passed to `generateActions()`, but got: %s', typeof actions)

    return transform(actions, (o, action) => o[action] = function(...args) {
      invariant(!!this.dispatch
        , 'the result of `generateActions()` must be passed to `createActions()` and not called directly')

      this.dispatch(...args)
    }, {})
  }

  createActions(prefix, actionHash){
    if (arguments.length === 1)
      actionHash = prefix, prefix = uniqueId('action_')

    return transform(actionHash, (actions, val, key) => {
      let ACTION_ID = `${prefix}_${key}`
        , dispatch  = (...data) => this.dispatch(ACTION_ID, ...data)
        , handler   = val.bind({ actions, dispatch });

      handler.ACTION_ID = ACTION_ID;
      actions[key] = handler;      
    })
  }

}

// createActions({ 
//   ...boutique.generateActions('create')

//   )


function transform(obj, cb, seed){
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}))

  if( Array.isArray(obj)) 
    obj.forEach(cb)
  else
    for(var key in obj) if( obj.hasOwnProperty(key) ) 
      cb(obj[key], key, obj)

  return seed
}

function uniqueId(prefix) {
  return ''+ ((prefix == null ? '' : prefix) + (++idCount));
}