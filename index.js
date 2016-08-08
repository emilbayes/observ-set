'use strict'

module.exports = function ObservSet (arr, hashFn) {
  if (!(this instanceof ObservSet)) return new ObservSet(arr, hashFn)

  var self = this

  self._keys = []
  self._values = []
  hashFn = hashFn || function (o) { return o }
  self._key = function (observ) {
    return hashFn(typeof observ === 'function' ? observ() : observ, observ)
  }

  if (arr == null) arr = []

  _addArray.call(self, arr)

  self._listeners = []

  var obs = function (listener) {
    if (listener == null) return self._values.slice()

    self._listeners.push(listener)
    return _removeListener.bind(self, listener)
  }

  obs.set = _wrap.call(self, _addArray)

  obs.add = _wrap.call(self, _add)
  obs.clear = _wrap.call(self, _clear)
  obs.delete = _wrap.call(self, _delete)
  obs.entries = _entries.bind(self)
  obs.has = _has.bind(self)
  obs.values = _values.bind(self)
  obs.transaction = _wrap.call(self, _transaction)

  obs._type = 'observ-set'
  obs._version = '1'

  return obs
}

function _transaction (fn) {
  var self = this
  var changed = false
  var mutators = {
    add: wrap(_add),
    clear: wrap(_clear),
    delete: wrap(_delete),
    entries: _entries.bind(self),
    forEach: _forEach.bind(self, true),
    has: _has.bind(self),
    values: _values.bind(self)
  }

  function wrap (fn) {
    return function () {
      var causedChange = fn.apply(self, arguments)
      if (!changed && causedChange) changed = true
    }
  }

  var oldValues = self._values.slice()
  var oldKeys = self._keys.slice()

  if (fn(mutators) === false) { // transaction can be canceled$
    self._values = oldValues
    self._keys = oldKeys
  }

  return changed
}

function _addArray (arr) {
  _clear.call(this)
  arr.forEach(_add, this)

  return true
}

function _wrap (fn) {
  var self = this
  return function () {
    if (fn.apply(self, arguments)) _notify.call(self)
  }
}

function _add (observ) {
  var key = this._key(observ)
  if (!_has.call(this, null, key)) {
    this._keys.push(key)
    this._values.push(observ)
    return true
  }

  return false
}

function _clear () {
  this._keys = []
  this._values = []
}

function _delete (observ) {
  var idx = this._keys.indexOf(this._key(observ))
  if (idx !== -1) {
    this._keys.splice(idx, 1)
    this._values.splice(idx, 1)
    return true
  }

  return false
}

function _entries () {
  var _valueCopy = this._values.slice()
  var ptr = 0
  return {
    next: function () {
      if (ptr < _valueCopy.length) return { done: false, value: [_valueCopy[ptr], _valueCopy[ptr++]] }
      return {done: true}
    }
  }
}

function _values () {
  var _valueCopy = this._values.slice()
  var ptr = 0
  return {
    next: function () {
      if (ptr < _valueCopy.length) return { done: false, value: _valueCopy[ptr++] }
      return {done: true}
    }
  }
}

function _forEach (nested, fn, thisArg) {
  var _valuesCopy = this._values.slice()
  var changed = _transaction.call(this, function (rawSet) {
    for (var i = 0; i < _valuesCopy.length; i++) {
      fn.call(thisArg, _valuesCopy[i], _valuesCopy[i], rawSet)
    }
  })
  if (!nested && changed) _notify.call(this)
}

// Optimization if we've already calculated the key
function _has (observ, key) {
  return this._keys.indexOf(key || this._key(observ)) !== -1
}

function _notify () {
  for (var i = 0; i < this._listeners.length; i++) {
    this._listeners[i](this._values.slice())
  }
}

function _removeListener (listener) {
  for (var i = 0, len = this._listeners.length; i < len; i++) {
    if (this._listeners[i] === listener) {
      this._listeners.splice(i, 1)
      break
    }
  }
}
