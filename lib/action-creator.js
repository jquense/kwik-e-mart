var Clank = require('clank')
  , _ = require('lodash');

var ActionCreator 
    = module.exports 
    = Clank.Object.extend({

      constructor: Clank.after(function ActionCreator(dispatcher){
        this.dispatcher = dispatcher || this.dispatcher
      })

    });

/**
 * creates a method that dispatches to specified actions.
 * @param  {string...}  a constant string to dispatch to
 * @param  {function}   a function that does work before dispatching to the actions, 
 *                      it is called with the last arg being a `send` function with you call with the action payload
 * @return {function}   the compiled method
 */
ActionCreator.action = function action(action, method) {
  var l = arguments.length
    , dispatches = new Array(l)
    , method;

  for (var i = 0; i < l; i++) 
    dispatches[i] = arguments[i];
  
  if (typeof dispatches[dispatches.length - 1] === 'function')
    method = dispatches.pop()
  
  return new Clank.Descriptor(function(key){
    var self = this;

    //if no action specified then use the key as the action
    if (!dispatches.length) 
      dispatches = [key]

    return method ? _.partialRight(method, send) : send

    function send(data) {
      _.each(dispatches, function(type){
        self.dispatcher.dispatch({ action: type, data: data })
      })
    }
  })
}