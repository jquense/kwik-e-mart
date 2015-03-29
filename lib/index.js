var babelHelpers = require("./util/babelHelpers.js");
var Dispatcher = require("flux").Dispatcher;

var _require = require("./storeMixins");

var actionsMixin = _require.actionsMixin;
var emitterMixin = _require.emitterMixin;
var invariant = require("invariant");

var idCount = 0;

module.exports = (function () {
  function Boutique() {
    babelHelpers.classCallCheck(this, Boutique);

    this.dispatcher = new Dispatcher();
  }

  Boutique.prototype.dispatch = function dispatch(action) {
    for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      data[_key - 1] = arguments[_key];
    }

    var spread = data.length >= 1;

    this.dispatcher.dispatch({ action: action, data: data, spread: spread });
  };

  Boutique.prototype.createStore = function createStore(StoreClass) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    const ACTIONS = {};

    var boutique = this,
        proto = StoreClass.prototype,
        handlingDispatch = false,
        needsFlush = false,
        assignState = options.assignState || StoreClass.assignState || function (n, o) {
      return babelHelpers._extends({}, n, o);
    };

    if (typeof StoreClass !== "function") {
      var tmp = StoreClass;
      StoreClass = StoreClass.hasOwnProperty("constructor") ? StoreClass.constructor : function Store() {};
      proto = tmp;
    }

    StoreClass.prototype = assign(proto, babelHelpers._extends({

      waitFor: function (stores) {
        invariant(Array.isArray(stores), "Expected an `Array` to be passed to `waitFor()`, but got: `%s`", typeof actions);

        boutique.dispatcher.waitFor(stores.map(function (store) {
          return store.dispatchToken || store;
        }));
      },

      setState: function (updates) {
        this.state = assignState(this.state, updates);

        if (handlingDispatch) needsFlush = true;else this.emitChange();
      } }, actionsMixin(ACTIONS), emitterMixin()));

    var store = new StoreClass();

    store.dispatchToken = boutique.dispatcher.register(function (payload) {
      var handler = ACTIONS[payload.action];

      if (handler) {
        handlingDispatch = true;

        handler.apply(store, payload.data);

        needsFlush && store.emitChange();

        needsFlush = handlingDispatch = false;
      }
    });

    return store;
  };

  Boutique.prototype.generateActions = function generateActions(actions) {
    invariant(Array.isArray(actions), "Expected an Array to be passed to `generateActions()`, but got: %s", typeof actions);

    return transform(actions, function (o, action) {
      return o[action] = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        invariant(!!this.dispatch, "the result of `generateActions()` must be passed to `createActions()` and not called directly");

        this.dispatch.apply(this, args);
      };
    }, {});
  };

  Boutique.prototype.createActions = function createActions(prefix, actionHash) {
    var _this = this;

    if (arguments.length === 1) actionHash = prefix, prefix = uniqueId("action_");

    return transform(actionHash, function (actions, val, key) {
      var ACTION_ID = "" + prefix + "_" + key,
          dispatch = function () {
        for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
          data[_key] = arguments[_key];
        }

        return _this.dispatch.apply(_this, [ACTION_ID].concat(data));
      },
          handler = val.bind({ actions: actions, dispatch: dispatch });

      handler.KEY = key;
      handler.ACTION_ID = ACTION_ID;
      actions[key] = handler;
    });
  };

  return Boutique;
})();

function transform(obj, cb, seed) {
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}));

  if (Array.isArray(obj)) obj.forEach(cb);else for (var key in obj) if (obj.hasOwnProperty(key)) cb(obj[key], key, obj);

  return seed;
}

function assign(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) if (source.hasOwnProperty(key)) target[key] = source[key];
  }

  return target;
}

function uniqueId(prefix) {
  return "" + ((prefix == null ? "" : prefix) + ++idCount);
}