var EventEmitter = require('tiny-emitter')
  , invariant = require('scoped-invariant')('kwik-E-mart')
  , warning = require('scoped-warning')('kwik-E-mart');

let handlerName = key => 'on' + key[0].toUpperCase() + key.substr(1)

module.exports.actionsMixin = function(actions) {
  var handlerCache = Object.create(null)

  return {

    bindAction(action, name = handlerName(action.KEY)) {
      let key = action.ACTION_ID || action
      let handler = handlerCache[name] || this[name];

      if (!handler && (handlerCache[action.KEY] || this[action.KEY] )){
        warning(false
          , 'The handler name: `' + action.KEY + '` is the same as the action it listens for. '
          + 'Use the more descriptive `'+ name +'` instead')
        name = action.KEY
        handler = handlerCache[name] || this[name]
      }

      invariant(typeof handler === 'function'
        , 'Action `handler` must be a function, instead got: %s', typeof handler)

      if (!handlerCache[name] && process.env.NODE_ENV !== 'production' ){
        handlerCache[name] = handler
        createHandlerWarning(this, name, handler)
      }

      actions[key] = handler
    },

    bindActions(actionCreators) {
      for( let key in actionCreators ) if ( actionCreators.hasOwnProperty(key)) {
        var action = actionCreators[key]
        
        this.bindAction(action, handlerName(key))

        // don't 'require' async methods to exist
        if (this[handlerName(action.success.KEY)]) this.bindAction(action.success)
        if (this[handlerName(action.failure.KEY)]) this.bindAction(action.failure)
      }
    },

    bindListeners(handlerHash) {
      for(let key in handlerHash ) if ( handlerHash.hasOwnProperty(key)) {
        var actions = [].concat(handlerHash[key])
        actions.forEach( action => this.bindAction(action, key))    
      }
    }
  }
}


module.exports.emitterMixin = function(){
  let emitter = new EventEmitter()
    
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


function createHandlerWarning(instance, key, handler) {
  Object.defineProperty(instance, key, {
    get() {
      console.warn(
        `Accessing an Action handler: \`${key}()\` directly is bad practice. ` + 
        `Only the dispatcher should call this method`)
      return handler
    }
  })
}