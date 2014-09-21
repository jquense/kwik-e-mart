var EventEmitter = require('events').EventEmitter
  , _ = require('lodash');

module.exports = {

  emitChange: function(){
    EventEmitter.prototype.emit.call(this, 'change')
  },

  listen: function(fn){
    EventEmitter.prototype.addListener.call(this, 'change', fn)
  },

  stopListening: function(fn){
    EventEmitter.prototype.removeListener.call(this,'change', fn)
  },
}
