'use strict';

var EventEmitter = require('tiny-emitter'),
    invariant = require('scoped-invariant')('boutique');

module.exports.actionsMixin = function (actions) {

  return {

    bindAction: function bindAction(action) {
      var name = arguments[1] === undefined ? action.KEY : arguments[1];
      return (function () {
        var key = action.ACTION_ID || action;
        var handler = this[name];

        invariant(typeof handler === 'function', 'Action `handler` must be a function, instead got: %s', typeof handler);

        if (process.env.NODE_ENV !== 'production') createHandlerWarning(this, name, handler);

        actions[key] = handler;
      }).apply(this, arguments);
    },

    bindActions: function bindActions(actionCreators) {
      for (var key in actionCreators) {
        if (actionCreators.hasOwnProperty(key)) {
          var action = actionCreators[key];

          this.bindAction(action, key);

          // don't 'require' async methods to exist
          if (this[action.success.KEY]) this.bindAction(action.success);
          if (this[action.failure.KEY]) this.bindAction(action.failure);
        }
      }
    }
  };
};

module.exports.emitterMixin = function () {
  var emitter = new EventEmitter();

  return {

    emitChange: function emitChange() {
      emitter.emit('change');
    },

    listen: function listen(fn) {
      emitter.on('change', fn);
    },

    stopListening: function stopListening(fn) {
      emitter.off('change', fn);
    }
  };
};

function createHandlerWarning(instance, key, handler) {
  Object.defineProperty(instance, key, {
    get: function get() {
      console.warn('Accessing an Action handler: `' + key + '()` directly is bad practice. ' + 'Only the dispatcher should call this method');
      return handler;
    }
  });
}