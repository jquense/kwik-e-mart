var EventEmitter = require('tiny-emitter')
  , asap = require('asap')
  //, rawAsap = require('asap/raw') for production?
  , invariant = require('invariant');


module.exports.stateMixin = function(sync = false){
  let state = {}
    , scheduled = false;

  function schedule(fn) {
    
    if (sync) fn()

    else if ( !scheduled ) {
      asap(() => (scheduled = false), fn())
      scheduled = true
    }
  }

  return {

    setState(updates) {
      state = { ...state, ...updates }
      schedule(() => this.emitChange())
    },

    getState(){
      return state
    }
  }
}


module.exports.actionsMixin = function(actions){

  return {

    bindAction(action, handler){
      let key = action.ACTION_ID || action

      invariant(typeof handler === 'function'
        , 'Action `handler` must be a function, instead got: %s', typeof handler)

      actions[key] = handler
    },

    bindActions(actionCreators) {
      for( var key in actionCreators ) if ( actionCreators.hasOwnProperty(key))
        this.bindAction(actionCreators[key], this[key])
    }
  }
}


module.exports.emitterMixin = function(){
  let emitter = new EventEmitter();

  return {
    emitChange() {
      emitter.emit('change')
    },

    listen(fn) {
      emitter.on('change', fn)
    },

    stopListening(fn) {
      emitter.off('change', fn)
    }
  }
}