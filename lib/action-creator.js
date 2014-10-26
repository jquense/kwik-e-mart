'use strict';
var Clank  = require('clank')
  , cobble = require('cobble');

module.exports = Clank.Object.extend({

  constructor: function ActionCreator(dispatcher){
    Clank.Object.call(this)
    this.dispatcher = dispatcher || this.dispatcher
  },

  send: function(dispatch, payload){
    this.dispatcher.dispatch({
      action: dispatch,
      data: payload
    })
  }

});

/**
 * creates a method that dispatches to specified actions.
 * @param  {string...}  a constant string to dispatch to
 * @param  {function}   a function that does work before dispatching to the actions,
 *                      it is called with the last arg being a `send` function with you call with the action payload
 * @return {function}   the compiled method
 */
module.exports.action = function action(action, method) {
  var l = arguments.length
    , dispatches = new Array(l)
    , method;

  for (var i = 0; i < l; i++)
    dispatches[i] = arguments[i];

  if (typeof dispatches[dispatches.length - 1] === 'function')
    method = dispatches.pop()

  return new cobble.Descriptor(function(key){
    var self = this;

    //if no action specified then use the key as the action
    if (!dispatches.length)
      dispatches = [key]

    return method ? pr(method, send) : send

    function send(data) {
      for (var i = 0; i < dispatches.length; i++)
        self.send(dispatches[i], data)
    }
  })
}


function pr(fn, arg) {
  return function() {
    var l = arguments.length, args = new Array(l);
    for (var i = 0; i < l; i++) args[i] = arguments[i];
    args.push(arg)
    return fn.apply(this, args);
  };
}