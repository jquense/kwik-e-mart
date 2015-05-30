'use strict';

var babelHelpers = require('./util/babelHelpers.js');

var Dispatcher = require('flux').Dispatcher;

var _require = require('./storeMixins');

var actionsMixin = _require.actionsMixin;
var emitterMixin = _require.emitterMixin;
var invariant = require('scoped-invariant')('kwik-E-mart');

var idCount = 0;

module.exports = (function () {
  function Boutique() {
    babelHelpers.classCallCheck(this, Boutique);

    this.dispatcher = new Dispatcher();
    this.actions = {};
    this.stores = {};
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

    var ACTIONS = {};

    var boutique = this,
        proto = StoreClass.prototype,
        batching = false,
        needsFlush = false,
        assignState = options.assignState || StoreClass.assignState || function (n, o) {
      return babelHelpers._extends({}, n, o);
    };

    if (typeof StoreClass !== 'function') {
      var tmp = StoreClass;
      StoreClass = StoreClass.hasOwnProperty('constructor') ? StoreClass.constructor : function Store() {};
      proto = tmp;
    }

    StoreClass.prototype = babelHelpers._extends(proto, babelHelpers._extends({

      waitFor: function waitFor(stores) {
        invariant(Array.isArray(stores), 'Expected an `Array` to be passed to `waitFor()`, but got: `%s`', typeof actions);

        boutique.dispatcher.waitFor(stores.map(function (store) {
          return store.dispatchToken || store;
        }));
      },

      setState: function setState(updates) {
        this.state = assignState(this.state, updates);
        if (batching) needsFlush = true;else this.emitChange();
      },

      batchChanges: function batchChanges(fn) {
        if (batching) return fn.call(this);
        batching = true;
        fn.call(this);
        needsFlush && this.emitChange();
        needsFlush = batching = false;
      } }, actionsMixin(ACTIONS), emitterMixin()));

    var store = new StoreClass();

    store.dispatchToken = boutique.dispatcher.register(function (payload) {
      var handler = ACTIONS[payload.action];

      if (handler) store.batchChanges(function () {
        return handler.apply(store, payload.data);
      });
    });

    return store;
  };

  Boutique.prototype.generateActions = function generateActions(actions) {
    invariant(Array.isArray(actions), 'Expected an Array to be passed to `generateActions()`, but got: %s', typeof actions);

    return transform(actions, function (o, action) {
      return o[action] = function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        invariant(!!this.dispatch, 'the result of `generateActions()` must be passed to `createActions()` and not called directly');

        this.dispatch.apply(this, args);
      };
    }, {});
  };

  Boutique.prototype.createActions = function createActions(actionHash) {
    var _this = this;

    var name = actionHash.displayName || uniqueId('action_');

    return this.actions[name] = transform(actionHash, function (actions, val, key) {
      if (key === 'displayName') return;

      var ACTION_ID = '' + name + '_' + key,
          dispatch = function dispatch() {
        for (var _len3 = arguments.length, data = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          data[_key3] = arguments[_key3];
        }

        return _this.dispatch.apply(_this, [ACTION_ID].concat(data));
      },
          success = createAsyncAction('success', ACTION_ID, key, _this),
          failure = createAsyncAction('failure', ACTION_ID, key, _this),
          handler = val.bind({ actions: actions, dispatch: dispatch, success: success, failure: failure });

      handler.KEY = key;
      handler.ACTION_ID = ACTION_ID;
      handler.success = success;
      handler.failure = failure;
      actions[key] = handler;
    });
  };

  return Boutique;
})();

function createAsyncAction(suffix, parentID, parentKey, boutique) {
  var handler = function handler() {
    for (var _len4 = arguments.length, data = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      data[_key4] = arguments[_key4];
    }

    return boutique.dispatch.apply(boutique, [parentID + '__' + suffix].concat(data));
  };
  handler.ACTION_ID = parentID + '__' + suffix;
  handler.KEY = parentKey + suffix[0].toUpperCase() + suffix.substr(1).toLowerCase();
  return handler;
}

function transform(obj, cb, seed) {
  cb = cb.bind(null, seed = seed || (Array.isArray(obj) ? [] : {}));

  if (Array.isArray(obj)) obj.forEach(cb);else for (var key in obj) if (obj.hasOwnProperty(key)) cb(obj[key], key, obj);

  return seed;
}

function uniqueId(prefix) {
  return '' + ((prefix == null ? '' : prefix) + ++idCount);
}