let Dispatcher = require('flux').Dispatcher
  , { 
    actionsMixin
  , emitterMixin } = require('./storeMixins')
  , invariant = require('scoped-invariant')('kwik-E-mart');


let idCount = 0;

module.exports = class Boutique {

  constructor(){
    this.dispatcher = new Dispatcher()
    this.actions = {}
    this.stores = {}
  }

  dispatch(action, ...data){
    var spread = data.length >= 1;

    this.dispatcher.dispatch({ action, data, spread })
  }

  createStore(StoreClass, options = {}){
    const ACTIONS = {};

    let boutique = this
      , proto = StoreClass.prototype
      , batching = false
      , needsFlush = false
      , assignState = options.assignState || StoreClass.assignState || ((n, o)=>({ ...n, ...o}));

    if (typeof StoreClass !== 'function') {
      let tmp = StoreClass
      StoreClass = StoreClass.hasOwnProperty('constructor') ? StoreClass.constructor : function Store(){}
      proto = tmp
    }

    StoreClass.prototype = Object.assign(proto, {

      waitFor(stores) {
        invariant(Array.isArray(stores)
          , 'Expected an `Array` to be passed to `waitFor()`, but got: `%s`', typeof actions)

        boutique.dispatcher.waitFor(
          stores.map( store => store.dispatchToken || store ))
      },

      setState(updates){
        this.state = assignState(this.state, updates)
        if (batching) needsFlush = true
        else          this.emitChange()
      },

      batchChanges(fn){
        if ( batching ) return fn.call(this)
        batching = true
        fn.call(this)
        needsFlush && this.emitChange()
        needsFlush = batching = false
      },

      ...actionsMixin(ACTIONS),

      ...emitterMixin()
    })

    let store = new StoreClass()

    store.dispatchToken = boutique.dispatcher.register( payload => {
      let handler = ACTIONS[payload.action];

      if ( handler )
        store.batchChanges(()=> handler.apply(store, payload.data))
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

  createActions(actionHash){
    let name = actionHash.displayName || uniqueId('action_')

    return this.actions[name] = transform(actionHash, (actions, val, key) => {
      if( key === 'displayName') 
        return

      let ACTION_ID = `${name}_${key}`
        , dispatch  = (...data) => this.dispatch(ACTION_ID, ...data)
        , success   = createAsyncAction('success', ACTION_ID, key, this)
        , failure   = createAsyncAction('failure', ACTION_ID, key, this)
        , handler   = val.bind({ actions, dispatch, success, failure });

      handler.KEY = key
      handler.ACTION_ID = ACTION_ID;
      handler.success = success
      handler.failure = failure
      actions[key] = handler;      
    })
  }
}

function createAsyncAction(suffix, parentID, parentKey, boutique){
  var handler = (...data) => boutique.dispatch(parentID + '__' + suffix, ...data)
  handler.ACTION_ID = parentID + '__' + suffix
  handler.KEY = parentKey + suffix[0].toUpperCase() + suffix.substr(1).toLowerCase()
  return handler
}

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