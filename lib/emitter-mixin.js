var EventEmitter = require('events').EventEmitter;

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
