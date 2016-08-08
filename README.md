# `observ-set`

> A Set like structure that's observable

## Install

```sh
npm install observ-set
```

## Usage

```js
var observSet = require('observ-set')
var observ = require('observ')
var isObserv = require('is-observ')

var set = observSet([{id: 1}, {id: 2}], function (obj, rawObj) {
  return [isObserv(rawObj), obj.id].join()
})

set(function onChange (state) {
  console.log('changed!')
})

set.add({id: 3})
set.delete({id: 2})
set.add(observ({id: 4}))

set.transaction(function (rawSet) {
  set.add({id: 2})
  set.add({id: 6})
  set.delete({id: 1})
})

// Transactional as well
set.forEach(function (value, valueCopy, rawSet) {
  if (value.id < 5) rawSet.delete(value)
})

```

## API

### `new ObservSet([array], [hashFunction])`

Creates a new `ObservSet`, with initial data obtained from `array`. `hashFunction(value, rawValue)` defines how the identity of objects is determined. `value` is the evaluated value, which might be the contents of another `observ` or a computed function. `rawValue` is whatever is passed to `ObservSet`. Note that `hashFunction` should return a primitive value, in most cases, if values are to be compared properly. Can also be called without the `new` keyword.

### `set()`

Standard `Observ` interface. Returns a copy of the values in the set, as an array.

### `set(onChange)`

Standard `Observ` interface. Calls `onChange(values)` with a copy of the values contained in the set, as an array.

### `set.set(array)`

Standard `Observ` interface. Applies the `hashFunction` to `values` of `array` and overwrites the set with the new values, notifying all listeners.

### `set.add(value)`

Applies `hashFunction` to `value` and adds the value if in the set, notifying all listeners if a value was added.

### `set.clear()`

Clears the set and notifies all listeners.

### `set.delete(value)`

Applies `hashFunction` to `value` and deletes the value if in the set, notifying all listeners if a value was deleted.

### `set.entries()`

Returns an iterator with `[value, value]` entries, from a copy of the values contained in the set.

### `set.forEach(callback, [thisArg])`

Starts a transaction around `callback(value, value, rawSet)`, allowing you to modify `rawSet` and notify all listeners if any changes are made.

### `set.has(value)`

Applies `hashFunction` to `value` and returns a Boolean whether the values is contained in the set.

### `set.values()`

Returns an iterator from a copy of the values contained in the set.

### `set.transaction(callback)`

`callback(rawSet)` is passed a Set-like object that you can safely mutate without notifying listeners before the transaction is over. If no mutations are made, the listeners will not be notified. Transactions can be canceled by returning `false`.

## License

[ISC](LICENSE.md)
