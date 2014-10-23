boutique
=============

Another Dispatcher/Store/Action implementation

## Usage

```javascript
var Dispatcher = require('boutique/lib/dispatcher')
var ActionCreator = require('boutique/lib/action-creator')
var Store = require('boutique/lib/store')
var AppDispatcher = new Dispatcher()

var App = {}

var AppStore = Store.extend({
      getInitialState: function(){
        return { users: [] }    
      },
      actions: [
        Store.listenFor('SAVE_USER', function(user){
          this._set({
            users: this.state.users.concat(user)
          })   
        })
      ],
    });

App.appActions = ActionCreator.create({

  saveUser: ActionCreator.action('SAVE_USER', function(user, send){
    user.id = ids++
    send(user)

    makeApiCallToSave(user).then(this.finishSave.bind(this))
  })

  finishSave: ActionCreator.action('SAVE_USER_COMPLETED')
  
})

App.AppStore = new AppStore(AppDispatcher)

App.AppStore.listen(function(){
  console.log('Store Changed!')
})

App.appActions.saveUser({ name: 'jimmy'})

```