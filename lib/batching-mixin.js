var EventEmitter = require('events').EventEmitter
  , _ = require('lodash')
  , Clank = require('clank')
  , asap = require('./asap');

module.exports = {

  _tickScheduled: false,

  _schedule: function(fn){
    var self = this;

    if ( !self._tickScheduled ) {
      asap(function(){
        self._tickScheduled = false
        fn.call(self)
      })
      this._tickScheduled = true
    }
  }
}
