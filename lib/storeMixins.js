'use strict';

var EventEmitter = require('tiny-emitter'),
    invariant = require('scoped-invariant')('kwik-E-mart'),
    warning = require('scoped-warning')('kwik-E-mart');

var handlerName = function handlerName(key) {
  return 'on' + key[0].toUpperCase() + key.substr(1);
};

module.exports.actionsMixin = function (actions) {
  var handlerCache = Object.create(null);

  return {

    bindAction: function bindAction(action) {
      var name = arguments[1] === undefined ? handlerName(action.KEY) : arguments[1];
      return (function () {
        var key = action.ACTION_ID || action;
        var handler = handlerCache[name] || this[name];

        if (!handler && (handlerCache[action.KEY] || this[action.KEY])) {
          warning(false, 'The handler name: `' + action.KEY + '` is the same as the action it listens for. ' + 'Use the more descriptive `' + name + '` instead');
          name = action.KEY;
          handler = handlerCache[name] || this[name];
        }

        invariant(typeof handler === 'function', 'Action `handler` must be a function, instead got: %s', typeof handler);

        if (!handlerCache[name] && process.env.NODE_ENV !== 'production') {
          handlerCache[name] = handler;
          createHandlerWarning(this, name, handler);
        }

        actions[key] = handler;
      }).apply(this, arguments);
    },

    bindActions: function bindActions(actionCreators) {
      for (var key in actionCreators) {
        if (actionCreators.hasOwnProperty(key)) {
          var action = actionCreators[key];

          this.bindAction(action, handlerName(key));

          // don't 'require' async methods to exist
          if (this[handlerName(action.success.KEY)]) this.bindAction(action.success);
          if (this[handlerName(action.failure.KEY)]) this.bindAction(action.failure);
        }
      }
    },

    bindListeners: function bindListeners(handlerHash) {
      var _this = this;

      var _loop = function (key) {
        if (handlerHash.hasOwnProperty(key)) {
          actions = [].concat(handlerHash[key]);

          actions.forEach(function (action) {
            return _this.bindAction(action, key);
          });
        }
      };

      for (var key in handlerHash) {
        var actions;

        _loop(key);
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