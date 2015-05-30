kwik-e-mart
=============

Another flux implementation. Based on the excellent Alt

## Usage

### actions

Actions trigger sets in stores and are your main means of broadcasting an intended state change to one or more stores. They are akin to triggering a global event.

#### Creating actions

Use the `createActions()` api to create a set of actions. All action method bodies have access to `this.dispatch()` which will send off the current action to the dispatcher.

```javascript
var kwikemart = require('kwik-e-mart')

var userActions = kwikemart.createActions({

  //the simplest action is just to dispatch out the passed in infomation
  updateUser(user){
    this.dispatch(user)
  }
})

```

The example above is extremely common and straightforward, all it does is pass the `user` object on to any stores listening to the `updateUser` action. You can streamline this process by using the helper api `generateActions(arrayOfActions)` which will create an object of simple 'pass through' actions like the one above.

```js
var kwikemart = require('kwik-e-mart')


var userActions = kwikemart.createActions(
    kwikemart.generateActions(['updateUser'])) 
```

Since `generateActions` just returns an object, you can combine these actions creation methods with `Object.assign` or the "spread" operator if you are using babel, or some other modern javascript transpiler.

```js
var kwikemart = require('kwik-e-mart')

// creates an `updateUser` and a `saveUser` action
var userActions = kwikemart.createActions({

  ...kwikemart.generateActions(['updateUser']),
  
  saveUser(user){
    saveToServer(user).then(this.dispatch)
  }
}) 
```

#### action context

You can also reference other actions inside an action to compose and combine actions by using `this.actions`.

```javascript
var kwikemart = require('kwik-e-mart')

var userActions = kwikemart.createActions({

  ...kwikemart.generateActions(['updateUser']),

  createUser(name){
    var user = { id: guid() }
    
    this.dispatch(user)

    user.name = name

    this.actions.updateUser(user)
  }
})

```

#### action asynchrony

Another common pattern when persisting changes back to a server is to dispatch the current object immediately so stores can optimistically update and then fire success and failure variants of hte action when the api request finishes. 

```js
var kwikemart = require('kwik-e-mart')

var userActions = kwikemart.createActions({

  ...kwikemart.generateActions([ 
    'updateUserSuccess', 
    'updateUserFailure'
  ]),
  
  updateUser(updatedUser){
    this.dispatch(updatedUser)
    saveToServer(updatedUser)
      .then(savedUser => this.actions.updateUserSuccess(savedUser))
      .catch(error =>  this.actions.updateUserFailure(error))
  }
}) 
```

kwik-e-mart makes this simplier by automatically creating `success` and `failure` actions for each action you create, they are available inside an action with `this.success` and `this.failure` or from outside an action like `userActions.updateUser.success` (more on that in the store section)

```js
var kwikemart = require('kwik-e-mart')

var userActions = kwikemart.createActions({
  
  updateUser(updatedUser){
    this.dispatch(updatedUser)
    saveToServer(updatedUser)
      .then(this.success)
      .catch(this.failure)
  }
}) 
```

### Stores

Stores are the locale for application state in a flux app

#### Creating stores

You can create stores as a plain old object or as a 'class' using es6 class syntax or any other form of prototypal inheritance patterns. With kwik-e-mart you don't instansiate stores yourself but pass them to `createStore` and get back an instance.

You configure stores to listen or 'bind' to specific actions. Binding a store to an action allows it to respond when that action is fired by the dispatcher.

To bind an action just pass it to the `bindAction` api along with the string name of method that will handle it. From an action handler you can update the stores `state` in much the same way you would a React Component's state. When a store's state is updated with `setState` it will emit a change and any listening view components can refetch store info to render with the updated data.

```js
var kwikemart = require('kwik-e-mart')
var userActions = require('./userActions')

class UserStore {
  constructor(){
    this.bindAction(userActions.createUser, 'onUpdateUser')

    this.state = {
      users: []
    }
  }
  // -- getters
  getUsers(){
    return this.state.users
  }

  getUser(id){
    return _.find(this.state.users, { id: id })
  }
  //----------------------

  onUpdateUser(newUser){
    this.setState({
      users: this.state.users.concat(newUser)
    })
  }
}

var userStore = kwikemart.createStore(UserStore)

userActions.createUser('john') // Now the store will create the user

userStore.getUsers() // returns all users
userStore.getUser(1) // returns a single user

```

You can also bind _all_ actions to a store by using `bindActions` which is a convenient alternative to using multiple `bindAction` calls.

```js
var kwikemart = require('kwik-e-mart')
var userActions = require('./userActions')

class UserStore {
  constructor(){
    // bind all userActions to a method of the same name
    this.bindActions(userActions)
  }

  //-- handlers
  updateUser(newUser){
    // update code...
  }

  updateUserSuccess(newUser){
    // update code...
  }
  updateUserFailure(newUser){
    // update code...
  }
  createUser(newUser){
    // create code...
  }
}

var userStore = kwikemart.createStore(UserStore)

userActions.createUser('john') // Now the store will create the user

userStore.getUsers() // returns all users
userStore.getUser(1) // returns a single user

```

All stores are given as `dispatchToken` which they can pass to `store.waitFor()` in order to handle inter store dependencies.
