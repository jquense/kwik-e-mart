var EventEmitter = require('events').EventEmitter
  , _ = require('lodash');

module.exports = {

  emitChange: function(){
    EventEmitter.prototype.emit.apply(this, ['change'].concat(_.toArray(arguments)) )
  },

  listen: function(fn){
    EventEmitter.prototype.addListener.call(this, 'change', fn)
  },

  stopListening: function(fn){
    EventEmitter.prototype.removeListener.call(this,'change', fn)
  },
}