var EventEmitter = require("tiny-emitter"),
    invariant = require("invariant");

module.exports.actionsMixin = function (actions) {

  return {

    bindAction: function (action) {
      var _this = this;

      var name = arguments[1] === undefined ? action.KEY : arguments[1];
      return (function () {
        var key = action.ACTION_ID || action;
        var handler = _this[name];

        invariant(typeof handler === "function", "Action `handler` must be a function, instead got: %s", typeof handler);

        if (process.env.NODE_ENV !== "production") createHandlerWarning(_this, name, handler);

        actions[key] = handler;
      })();
    },

    bindActions: function (actionCreators) {
      for (var key in actionCreators) {
        if (actionCreators.hasOwnProperty(key)) this.bindAction(actionCreators[key], key);
      }
    }
  };
};

module.exports.emitterMixin = function () {
  var emitter = new EventEmitter();

  return {

    emitChange: function () {
      emitter.emit("change");
    },

    listen: function (fn) {
      emitter.on("change", fn);
    },

    stopListening: function (fn) {
      emitter.off("change", fn);
    }
  };
};

function createHandlerWarning(instance, key, handler) {
  Object.defineProperty(instance, key, {
    get: function () {
      console.warn("Accessing an Action handler: `" + key + "()` directly is bad practice. " + "Only the dispatcher should call this method");
      return handler;
    }
  });
}