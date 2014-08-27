!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.tests=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = _dereq_('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":3}],2:[function(_dereq_,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],3:[function(_dereq_,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = _dereq_('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = _dereq_('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,_dereq_("1YiZ5S"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":2,"1YiZ5S":5,"inherits":4}],4:[function(_dereq_,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],5:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],6:[function(_dereq_,module,exports){
var Vector = _dereq_('./vector.js');

/** 
 * 4x4 matrix.
 * @constructor
 */
function Matrix(){
    for (var i=0; i<16; i++){
        this[i] = 0;
    }
    this.length = 16;
}
/**
 * Compare matrices for equality.
 * @method
 * @param {Matrix} matrix
 * @return {boolean}
 */
Matrix.prototype.equal = function(matrix){
    for (var i = 0, len = this.length; i < len; i++){
        if (this[i] !== matrix[i]){
            return false;
        }
    }
    return true;
};
/**
 * Add matrices. Returns a new Matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.add = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] + matrix[i];
    }
    return new_matrix;
};
/**
 * Add matrices. Result is assigned to result parameter.
 * @method
 * @param {Matrix} matrix
 * @param {Matrix} result
 */
Matrix.prototype.addLG = function(matrix, result){
    result[0] = this[0] + matrix[0];
    result[1] = this[1] + matrix[1];
    result[2] = this[2] + matrix[2];
    result[3] = this[3] + matrix[3];
    result[4] = this[4] + matrix[4];
    result[5] = this[5] + matrix[5];
    result[6] = this[6] + matrix[6];
    result[7] = this[7] + matrix[7];
    result[8] = this[8] + matrix[8];
    result[9] = this[9] + matrix[9];
    result[10] = this[10] + matrix[10];
    result[11] = this[11] + matrix[11];
    result[12] = this[12] + matrix[12];
    result[13] = this[13] + matrix[13];
    result[14] = this[14] + matrix[14];
    result[15] = this[15] + matrix[15];
};
/**
 * Subtract matrices. Returns a new Matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.subtract = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] - matrix[i];
    }
    return new_matrix;
};
/**
 * Subtract matrices. Result is assigned to result parameter.
 * @method
 * @param {Matrix} matrix
 * @param {Matrix} result
 */
Matrix.prototype.subtractLG = function(matrix, result){
    result[0] = this[0] - matrix[0];
    result[1] = this[1] - matrix[1];
    result[2] = this[2] - matrix[2];
    result[3] = this[3] - matrix[3];
    result[4] = this[4] - matrix[4];
    result[5] = this[5] - matrix[5];
    result[6] = this[6] - matrix[6];
    result[7] = this[7] - matrix[7];
    result[8] = this[8] - matrix[8];
    result[9] = this[9] - matrix[9];
    result[10] = this[10] - matrix[10];
    result[11] = this[11] - matrix[11];
    result[12] = this[12] - matrix[12];
    result[13] = this[13] - matrix[13];
    result[14] = this[14] - matrix[14];
    result[15] = this[15] - matrix[15];
};
/**
 * Multiply matrix by scalar. Returns a new Matrix.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.multiplyScalar = function(scalar){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = this[i] * scalar;
    }
    return new_matrix;
};
/**
 * Multiply matrix by scalar. Result is assigned to result parameter.
 * @method
 * @param {number} scalar
 * @param {Matrix} result
 */
Matrix.prototype.multiplyScalarLG = function(scalar, result){
    result[0] = this[0] * scalar;
    result[1] = this[1] * scalar;
    result[2] = this[2] * scalar;
    result[3] = this[3] * scalar;
    result[4] = this[4] * scalar;
    result[5] = this[5] * scalar;
    result[6] = this[6] * scalar;
    result[7] = this[7] * scalar;
    result[8] = this[8] * scalar;
    result[9] = this[9] * scalar;
    result[10] = this[10] * scalar;
    result[11] = this[11] * scalar;
    result[12] = this[12] * scalar;
    result[13] = this[13] * scalar;
    result[14] = this[14] * scalar;
    result[15] = this[15] * scalar;
};
/**
 * Multiply matrices. Returns a new Matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.multiply = function(matrix){
    var new_matrix = new Matrix();
    new_matrix[0] = (this[0] * matrix[0]) + (this[1] * matrix[4]) + (this[2] * matrix[8]) + (this[3] * matrix[12]);
    new_matrix[1] = (this[0] * matrix[1]) + (this[1] * matrix[5]) + (this[2] * matrix[9]) + (this[3] * matrix[13]);
    new_matrix[2] = (this[0] * matrix[2]) + (this[1] * matrix[6]) + (this[2] * matrix[10]) + (this[3] * matrix[14]);
    new_matrix[3] = (this[0] * matrix[3]) + (this[1] * matrix[7]) + (this[2] * matrix[11]) + (this[3] * matrix[15]);
    new_matrix[4] = (this[4] * matrix[0]) + (this[5] * matrix[4]) + (this[6] * matrix[8]) + (this[7] * matrix[12]);
    new_matrix[5] = (this[4] * matrix[1]) + (this[5] * matrix[5]) + (this[6] * matrix[9]) + (this[7] * matrix[13]);
    new_matrix[6] = (this[4] * matrix[2]) + (this[5] * matrix[6]) + (this[6] * matrix[10]) + (this[7] * matrix[14]);
    new_matrix[7] = (this[4] * matrix[3]) + (this[5] * matrix[7]) + (this[6] * matrix[11]) + (this[7] * matrix[15]);
    new_matrix[8] = (this[8] * matrix[0]) + (this[9] * matrix[4]) + (this[10] * matrix[8]) + (this[11] * matrix[12]);
    new_matrix[9] = (this[8] * matrix[1]) + (this[9] * matrix[5]) + (this[10] * matrix[9]) + (this[11] * matrix[13]);
    new_matrix[10] = (this[8] * matrix[2]) + (this[9] * matrix[6]) + (this[10] * matrix[10]) + (this[11] * matrix[14]);
    new_matrix[11] = (this[8] * matrix[3]) + (this[9] * matrix[7]) + (this[10] * matrix[11]) + (this[11] * matrix[15]);
    new_matrix[12] = (this[12] * matrix[0]) + (this[13] * matrix[4]) + (this[14] * matrix[8]) + (this[15] * matrix[12]);
    new_matrix[13] = (this[12] * matrix[1]) + (this[13] * matrix[5]) + (this[14] * matrix[9]) + (this[15] * matrix[13]);
    new_matrix[14] = (this[12] * matrix[2]) + (this[13] * matrix[6]) + (this[14] * matrix[10]) + (this[15] * matrix[14]);
    new_matrix[15] = (this[12] * matrix[3]) + (this[13] * matrix[7]) + (this[14] * matrix[11]) + (this[15] * matrix[15]);
    return new_matrix;
};
/**
 * Multiply matrices. Result is assigned to result parameter.
 * @method
 * @param {Matrix} matrix
 * @param {Matrix} result
 */
Matrix.prototype.multiplyLG = function(matrix, result){
    result[0] = (this[0] * matrix[0]) + (this[1] * matrix[4]) + (this[2] * matrix[8]) + (this[3] * matrix[12]);
    result[1] = (this[0] * matrix[1]) + (this[1] * matrix[5]) + (this[2] * matrix[9]) + (this[3] * matrix[13]);
    result[2] = (this[0] * matrix[2]) + (this[1] * matrix[6]) + (this[2] * matrix[10]) + (this[3] * matrix[14]);
    result[3] = (this[0] * matrix[3]) + (this[1] * matrix[7]) + (this[2] * matrix[11]) + (this[3] * matrix[15]);
    result[4] = (this[4] * matrix[0]) + (this[5] * matrix[4]) + (this[6] * matrix[8]) + (this[7] * matrix[12]);
    result[5] = (this[4] * matrix[1]) + (this[5] * matrix[5]) + (this[6] * matrix[9]) + (this[7] * matrix[13]);
    result[6] = (this[4] * matrix[2]) + (this[5] * matrix[6]) + (this[6] * matrix[10]) + (this[7] * matrix[14]);
    result[7] = (this[4] * matrix[3]) + (this[5] * matrix[7]) + (this[6] * matrix[11]) + (this[7] * matrix[15]);
    result[8] = (this[8] * matrix[0]) + (this[9] * matrix[4]) + (this[10] * matrix[8]) + (this[11] * matrix[12]);
    result[9] = (this[8] * matrix[1]) + (this[9] * matrix[5]) + (this[10] * matrix[9]) + (this[11] * matrix[13]);
    result[10] = (this[8] * matrix[2]) + (this[9] * matrix[6]) + (this[10] * matrix[10]) + (this[11] * matrix[14]);
    result[11] = (this[8] * matrix[3]) + (this[9] * matrix[7]) + (this[10] * matrix[11]) + (this[11] * matrix[15]);
    result[12] = (this[12] * matrix[0]) + (this[13] * matrix[4]) + (this[14] * matrix[8]) + (this[15] * matrix[12]);
    result[13] = (this[12] * matrix[1]) + (this[13] * matrix[5]) + (this[14] * matrix[9]) + (this[15] * matrix[13]);
    result[14] = (this[12] * matrix[2]) + (this[13] * matrix[6]) + (this[14] * matrix[10]) + (this[15] * matrix[14]);
    result[15] = (this[12] * matrix[3]) + (this[13] * matrix[7]) + (this[14] * matrix[11]) + (this[15] * matrix[15]);
};
/**
 * Negate matrix. Returns a new Matrix.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.negate = function(){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.length; i < len; i++){
        new_matrix[i] = -this[i];
    }
    return new_matrix;
};
/**
 * Negate matrix. Result is assigned to result parameter.
 * @method
 * @param {number} scalar
 * @param {Matrix} result
 */
Matrix.prototype.negateLG = function(result){
    result[0] = -this[0];
    result[1] = -this[1];
    result[2] = -this[2];
    result[3] = -this[3];
    result[4] = -this[4];
    result[5] = -this[5];
    result[6] = -this[6];
    result[7] = -this[7];
    result[8] = -this[8];
    result[9] = -this[9];
    result[10] = -this[10];
    result[11] = -this[11];
    result[12] = -this[12];
    result[13] = -this[13];
    result[14] = -this[14];
    result[15] = -this[15];
};
/**
 * Transpose matrix. Returns a new Matrix.
 * @method
 * @return {Matrix}
 */
Matrix.prototype.transpose = function(){
    var new_matrix = new Matrix();
    new_matrix[0] = this[0];
    new_matrix[1] = this[4];
    new_matrix[2] = this[8];
    new_matrix[3] = this[12];
    new_matrix[4] = this[1];
    new_matrix[5] = this[5];
    new_matrix[6] = this[9];
    new_matrix[7] = this[13];
    new_matrix[8] = this[2];
    new_matrix[9] = this[6];
    new_matrix[10] = this[10];
    new_matrix[11] = this[14];
    new_matrix[12] = this[3];
    new_matrix[13] = this[7];
    new_matrix[14] = this[11];
    new_matrix[15] = this[15];
    return new_matrix;
};
/**
 * Transpose matrix. Result is assigned to result parameter.
 * @method
 * @return {Matrix}
 */
Matrix.prototype.transposeLG = function(result){
    result[0] = this[0];
    result[1] = this[4];
    result[2] = this[8];
    result[3] = this[12];
    result[4] = this[1];
    result[5] = this[5];
    result[6] = this[9];
    result[7] = this[13];
    result[8] = this[2];
    result[9] = this[6];
    result[10] = this[10];
    result[11] = this[14];
    result[12] = this[3];
    result[13] = this[7];
    result[14] = this[11];
    result[15] = this[15];
};
/**
 * Write zeros to all elements of the matrix.
 * @method
 */
Matrix.prototype.empty = function(){
    for (var i = 0, len = this.length; i < len; i++){
        this[i] = 0;
    }
};
/**
 * Copy matrix values to another matrix.
 * @method
 * @param result
 *
 */
Matrix.prototype.copy = function(result) {
    for (var i = 0; i < 16; i++) {
        result[i] = this[i];
    }
};


/**
 * Constructs a rotation matrix, rotating by theta around the x-axis. Returns a new Matrix.
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationX = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = 1;
    rotation_matrix[5] = cos;
    rotation_matrix[6] = -sin;
    rotation_matrix[9] = sin;
    rotation_matrix[10] = cos;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the x-axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationXLG = function(theta, result){
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    result[0] = 1;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = cos;
    result[6] = -sin;
    result[7] = 0;
    result[8] = 0;
    result[9] = sin;
    result[10] = cos;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
};
/**
 * Constructs a rotation matrix, rotating by theta around the y-axis. Returns a new Matrix.
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationY = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = cos;
    rotation_matrix[2] = sin;
    rotation_matrix[5] = 1;
    rotation_matrix[8] = -sin;
    rotation_matrix[10] = cos;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the y-axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationYLG = function(theta, result){
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    result[0] = cos;
    result[1] = 0;
    result[2] = sin;
    result[3] = 0;
    result[4] = 0;
    result[5] = 1;
    result[6] = 0;
    result[7] = 0;
    result[8] = -sin;
    result[9] = 0;
    result[10] = cos;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
};
/**
 * Constructs a rotation matrix, rotating by theta around the z-axis. Returns a new Matrix.
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationZ = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix[0] = cos;
    rotation_matrix[1] = -sin;
    rotation_matrix[4] = sin;
    rotation_matrix[5] = cos;
    rotation_matrix[10] = 1;
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the z-axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationZLG = function(theta, result){
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    result[0] = cos;
    result[1] = -sin;
    result[2] = 0;
    result[3] = 0;
    result[4] = sin;
    result[5] = cos;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = 1;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
};
/**
 * Constructs a rotation matrix, rotating by theta around the axis. Returns a new Matrix.
 * @method
 * @static
 * @param {Vector} axis
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationAxis = function(axis, theta){
    var rotation_matrix = new Matrix();
    var u = axis.normalize();
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = u.x;
    var uy = u.y;
    var uz = u.z;
    var xy = ux * uy;
    var xz = ux * uz;
    var yz = uy * uz;
    rotation_matrix[0] = cos + ((ux*ux)*cos1);
    rotation_matrix[1] = (xy*cos1) - (uz*sin);
    rotation_matrix[2] = (xz*cos1)+(uy*sin);
    rotation_matrix[4] = (xy*cos1)+(uz*sin);
    rotation_matrix[5] = cos+((uy*uy)*cos1);
    rotation_matrix[6] = (yz*cos1)-(ux*sin);
    rotation_matrix[8] = (xz*cos1)-(uy*sin);
    rotation_matrix[9] = (yz*cos1)+(ux*sin);
    rotation_matrix[10] = cos + ((uz*uz)*cos1);
    rotation_matrix[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the axis. Result is assigned to result parameter.
 * @method
 * @static
 * @param {Vector} axis
 * @param {number} theta
 * @param {Matrix} result
 */
Matrix.rotationAxisLG = function(axis, theta, result){
    axis.normalizeLG(temp_vector);
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = temp_vector.x;
    var uy = temp_vector.y;
    var uz = temp_vector.z;
    var xy = ux * uy;
    var xz = ux * uz;
    var yz = uy * uz;
    result[0] = cos + ((ux*ux)*cos1);
    result[1] = (xy*cos1) - (uz*sin);
    result[2] = (xz*cos1)+(uy*sin);
    result[3] = 0;
    result[4] = (xy*cos1)+(uz*sin);
    result[5] = cos+((uy*uy)*cos1);
    result[6] = (yz*cos1)-(ux*sin);
    result[7] = 0;
    result[8] = (xz*cos1)-(uy*sin);
    result[9] = (yz*cos1)+(ux*sin);
    result[10] = cos + ((uz*uz)*cos1);
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
};
/**
 * Constructs a rotation matrix from pitch, yaw, and roll. Returns a new Matrix.
 * @method
 * @static
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @return {Matrix}
 */
Matrix.rotation = function(pitch, yaw, roll){
    return Matrix.rotationX(roll).multiply(Matrix.rotationZ(yaw)).multiply(Matrix.rotationY(pitch));
};
/**
 * Constructs a rotation matrix from pitch, yaw, and roll. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @param {Matrix} result
 */
Matrix.rotationLG = function(pitch, yaw, roll, result){
    // TODO: Can I get away with using fewer temporary matrices?
    Matrix.rotationXLG(roll, temp_matrix1);
    Matrix.rotationZLG(yaw, temp_matrix2);
    Matrix.rotationYLG(pitch, temp_matrix3);
    temp_matrix1.multiplyLG(temp_matrix2, temp_matrix4);
    temp_matrix4.multiplyLG(temp_matrix3, result);
};
/**
 * Constructs a translation matrix from x, y, and z distances. Returns a new Matrix.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.translation = function(xtrans, ytrans, ztrans){
    var translation_matrix = Matrix.identity();
    translation_matrix[12] = xtrans;
    translation_matrix[13] = ytrans;
    translation_matrix[14] = ztrans;
    return translation_matrix;
};
/**
 * Constructs a translation matrix from x, y, and z distances. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.translationLG = function(xtrans, ytrans, ztrans, result){
    result[0] = 1;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = 1;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = 1;
    result[12] = xtrans;
    result[13] = ytrans;
    result[14] = ztrans;
    result[15] = 1;
};
/**
 * Constructs a scaling matrix from x, y, and z scale. Returns a new Matrix.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.scale = function(xscale, yscale, zscale){
    var scaling_matrix = new Matrix();
    scaling_matrix[0] = xscale;
    scaling_matrix[5] = yscale;
    scaling_matrix[10] = zscale;
    scaling_matrix[15] = 1;
    return scaling_matrix;
};
/**
 * Constructs a scaling matrix from x, y, and z scale. Result is assigned to result parameter.
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @param {Matrix} result
 */
Matrix.scaleLG = function(xscale, yscale, zscale, result){
    result[0] = xscale;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = yscale;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = zscale;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
};
/**
 * Constructs an identity matrix. Returns a new Matrix.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.identity = function(){
    var identity = new Matrix();
    identity[0] = 1;
    identity[5] = 1;
    identity[10] = 1;
    identity[15] = 1;
    return identity;
};
/**
 * Constructs an identity matrix. Result is assigned to result parameter.
 * @method
 * @static
 * @param {Matrix} result
 */
Matrix.identityLG = function(result){
    result[0] = 1;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = 1;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = 1;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 1;
};
/**
 * Constructs a zero matrix. Returns a new Matrix.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.zero = function(){
    return new Matrix();
};
/**
 * Constructs a zero matrix. Result is assigned to result parameter.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.zeroLG = function(result){
    result[0] = 0;
    result[1] = 0;
    result[2] = 0;
    result[3] = 0;
    result[4] = 0;
    result[5] = 0;
    result[6] = 0;
    result[7] = 0;
    result[8] = 0;
    result[9] = 0;
    result[10] = 0;
    result[11] = 0;
    result[12] = 0;
    result[13] = 0;
    result[14] = 0;
    result[15] = 0;
};
/**
 * Constructs a new matrix from an array. Returns a new Matrix.
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.fromArray = function(arr){
    var new_matrix = new Matrix();
    for (var i = 0; i < 16; i++){
        new_matrix[i] = arr[i];
    }
    return new_matrix;
};
/**
 * Constructs a new matrix from an array. Result is assigned to result parameter.
 * @method
 * @static
 * @param {Matrix} result
 */
Matrix.fromArrayLG = function(arr, result){
    result[0] = arr[0];
    result[1] = arr[1];
    result[2] = arr[2];
    result[3] = arr[3];
    result[4] = arr[4];
    result[5] = arr[5];
    result[6] = arr[6];
    result[7] = arr[7];
    result[8] = arr[8];
    result[9] = arr[9];
    result[10] = arr[10];
    result[11] = arr[11];
    result[12] = arr[12];
    result[13] = arr[13];
    result[14] = arr[14];
    result[15] = arr[15];
};
/**
 * Copy values from one matrix to another.
 * @param matrix1
 * @param matrix2
 */
Matrix.copy = function(matrix1, matrix2){
    for (var i = 0; i < 16; i++) {
        matrix2[i] = matrix1[i];
    }
};

var temp_matrix1 = new Matrix();
var temp_matrix2 = new Matrix();
var temp_matrix3 = new Matrix();
var temp_matrix4 = new Matrix();
var temp_vector = new Vector(0,0,0);

module.exports = Matrix;

},{"./vector.js":7}],7:[function(_dereq_,module,exports){
/**
 * 3D vector.
 * @constructor
 * @param {number} x x coordinate
 * @param {number} y y coordinate
 * @param {number} z z coordinate
 */
function Vector(x, y, z){
    if (typeof x === 'undefined' ||
        typeof y === 'undefined' ||
        typeof z === 'undefined'){
        throw new Error('Insufficient arguments.');
    } else {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
/**
 * Add vectors. Returns a new Vector.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.add = function(vector){
    return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
};
/**
 * Add vectors. Result is assigned to result parameter.
 * @method
 * @param {Vector} vector
 * @param {Vector} result
 */
Vector.prototype.addLG = function(vector, result){
    result.x = this.x + vector.x;
    result.y = this.y + vector.y;
    result.z = this.z + vector.z;
};
/**
 * Subtract vectors. Returns a new Vector.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.subtract = function(vector){
    return new Vector(this.x - vector.x, this.y - vector.y, this.z - vector.z);
};
/**
 * Subtract vectors. Result is assigned to result parameter.
 * @method
 * @param {Vector} vector
 * @param {Vector} result
 */
Vector.prototype.subtractLG = function(vector, result){
    result.x = this.x - vector.x;
    result.y = this.y - vector.y;
    result.z = this.z - vector.z;
};
/**
 * Compare vectors for equality
 * @method
 * @param {Vector} vector
 * @return {boolean}
 */
Vector.prototype.equal = function(vector){
    return this.x === vector.x && this.y === vector.y && this.z === vector.z;
};
/**
 * Calculate angle between two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.angle = function(vector){
    var a = this.normalize();
    var b = vector.normalize();
    var amag = a.magnitude();
    var bmag = b.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = a.dot(b) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return Math.acos(theta);
};
/**
 * Calculate angle between two vectors. Low garbage (doesn't create any intermediate Vectors).
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.angleLG = function(vector){
    this.normalizeLG(temp_vector1);
    vector.normalizeLG(temp_vector2);
    var amag = temp_vector1.magnitude();
    var bmag = temp_vector2.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = temp_vector1.dot(temp_vector2) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return Math.acos(theta);
};
/**
 * Calculate the cosine of the angle between two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.cosAngle = function(vector){
    var a = this.normalize();
    var b = vector.normalize();
    var amag = a.magnitude();
    var bmag = b.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = a.dot(b) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return theta;
};
/**
 * Calculate the cosine of the angle between two vectors. Low garbage (doesn't create any intermediate Vectors).
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.cosAngleLG = function(vector){
    this.normalizeLG(temp_vector1);
    vector.normalizeLG(temp_vector2);
    var amag = temp_vector1.magnitude();
    var bmag = temp_vector2.magnitude();
    if (amag === 0 || bmag === 0){
        return 0;
    }
    var theta = temp_vector1.dot(temp_vector2) / (amag * bmag );
    if (theta < -1) {theta = -1;}
    if (theta > 1) {theta = 1;}
    return theta;
};
/**
 * Calculate magnitude of a vector.
 * @method
 * @return {number}
 */
Vector.prototype.magnitude = function(){
    return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
};
/**
 * Calculate magnitude squared of a vector.
 * @method
 * @return {number}
 */
Vector.prototype.magnitudeSquared = function(){
    return (this.x * this.x) + (this.y * this.y) + (this.z * this.z);
};
/**
 * Calculate dot product of two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.dot = function(vector){
    return (this.x * vector.x) + (this.y * vector.y) + (this.z * vector.z);
};
/**
 * Calculate cross product of two vectors. Returns a new Vector.
 * @method
 * @param {Vector} vector
 * @return {Vector}
 */
Vector.prototype.cross = function(vector){
    return new Vector(
        (this.y * vector.z) - (this.z * vector.y),
        (this.z * vector.x) - (this.x * vector.z),
        (this.x * vector.y) - (this.y * vector.x)
    );
};
/**
 * Calculate cross product of two vectors. Result is assigned to result parameter.
 * @method
 * @param {Vector} vector
 * @param {Vector} result
 */
Vector.prototype.crossLG = function(vector, result){
    result.x = (this.y * vector.z) - (this.z * vector.y);
    result.y = (this.z * vector.x) - (this.x * vector.z);
    result.z = (this.x * vector.y) - (this.y * vector.x);
};
/**
 * Normalize vector. Returns a new Vector.
 * @method
 * @return {Vector}
 */
Vector.prototype.normalize = function(){
    var magnitude = this.magnitude();
    if (magnitude === 0) {
        return new Vector(this.x, this.y, this.z);
    }
    return new Vector(this.x / magnitude, this.y / magnitude, this.z / magnitude);
};
/**
 * Normalize vector. Result is assigned to result parameter.
 * @method
 * @param {Vector} result
 */
Vector.prototype.normalizeLG = function(result){
    var magnitude = this.magnitude();
    if (magnitude === 0) {
        result.x = this.x;
        result.y = this.y;
        result.z = this.z;
    }
    result.x = this.x / magnitude;
    result.y = this.y / magnitude;
    result.z = this.z / magnitude;
};
/**
 * Scale vector by scaling factor. Returns a new Vector.
 * @method
 * @param {number} scale
 * @return {Vector}
 */
Vector.prototype.scale = function(scale){
    return new Vector(this.x * scale, this.y * scale, this.z * scale);
};
/**
 * Scale vector by scaling factor. Result is assigned to result parameter.
 * @method
 * @param {number} scale
 * @param {Vector} result
 */
Vector.prototype.scaleLG = function(scale, result){
    result.x = this.x * scale;
    result.y = this.y * scale;
    result.z = this.z * scale;
};
/**
 * Negate vector. Returns a new Vector.
 * @method
 * @return {Vector}
 */
Vector.prototype.negate = function(){
    return new Vector(-this.x, -this.y, -this.z);
};
/**
 * Negate vector. Result is assigned to result parameter.
 * @method
 * @param {Vector} result
 */
Vector.prototype.negateLG = function(result){
    result.x = -this.x;
    result.y = -this.y;
    result.z = -this.z;
};
/**
 * Calculate vector projection of two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.vectorProjection = function(vector){
    var mag = vector.magnitude();
    return vector.scale(this.dot(vector) / (mag * mag));
};
/**
 * Calculate vector projection of two vectors. Does not construct any new Vectors in the course of its operation.
 * @method
 * @param {Vector} vector
 * @param {Vector} temp A temporary vector used in one of the intermediary steps of the calculation.
 * @return {number}
 */
Vector.prototype.vectorProjectionLG = function(vector, result){
    var mag = vector.magnitude();
    vector.scaleLG(this.dot(vector) / (mag * mag), result);
};
/**
 * Calculate scalar projection of two vectors.
 * @method
 * @param {Vector} vector
 * @return {number}
 */
Vector.prototype.scalarProjection = function(vector){
    return this.dot(vector) / vector.magnitude();
};
/**
 * Perform linear tranformation on a vector. Returns a new Vector.
 * @method
 * @param {Matrix} transform_matrix
 * @return {Vector}
 */
Vector.prototype.transform = function(transform_matrix){
    var x = (this.x * transform_matrix[0]) + (this.y * transform_matrix[4]) + (this.z * transform_matrix[8]) + transform_matrix[12];
    var y = (this.x * transform_matrix[1]) + (this.y * transform_matrix[5]) + (this.z * transform_matrix[9]) + transform_matrix[13];
    var z = (this.x * transform_matrix[2]) + (this.y * transform_matrix[6]) + (this.z * transform_matrix[10]) + transform_matrix[14];
    var w = (this.x * transform_matrix[3]) + (this.y * transform_matrix[7]) + (this.z * transform_matrix[11]) + transform_matrix[15];
    return new Vector(x / w, y / w, z / w);
};
/**
 * Perform linear tranformation on a vector.  Result is assigned to result parameter.
 * @method
 * @param {Matrix} transform_matrix
 * @param {Vector} result
 */
Vector.prototype.transformLG = function(transform_matrix, result){
    var x = (this.x * transform_matrix[0]) + (this.y * transform_matrix[4]) + (this.z * transform_matrix[8]) + transform_matrix[12];
    var y = (this.x * transform_matrix[1]) + (this.y * transform_matrix[5]) + (this.z * transform_matrix[9]) + transform_matrix[13];
    var z = (this.x * transform_matrix[2]) + (this.y * transform_matrix[6]) + (this.z * transform_matrix[10]) + transform_matrix[14];
    var w = (this.x * transform_matrix[3]) + (this.y * transform_matrix[7]) + (this.z * transform_matrix[11]) + transform_matrix[15];
    result.x = x / w;
    result.y = y / w;
    result.z = z / w;
};
/**
 * Rotate vector by theta around axis. Returns a new Vector.
 * @method
 * @param {Vector} axis
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotate = function(axis, theta){
    var u = axis.normalize();
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = u.x;
    var uy = u.y;
    var uz = u.z;
    var xy = u.x * u.y;
    var xz = u.x * u.z;
    var yz = u.y * u.z;
    var x = ((cos + ((ux*ux)*cos1)) * this.x) + (((xy*cos1) - (uz*sin)) * this.y) + (((xz*cos1)+(uy*sin)) * this.z);
    var y = (((xy*cos1)+(uz*sin)) * this.x) + ((cos+((uy*uy)*cos1)) * this.y) + (((yz*cos1)-(ux*sin)) * this.z);
    var z = (((xz*cos1)-(uy*sin)) * this.x) + (((yz*cos1)+(ux*sin)) * this.y) + ((cos + ((ux*ux)*cos1)) * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around axis. Result is assigned to result parameter.
 * @method
 * @param {Vector} axis
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateLG = function(axis, theta, result){
    axis.normalizeLG(result);
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var cos1 = 1-cos;
    var ux = result.x;
    var uy = result.y;
    var uz = result.z;
    var xy = result.x * result.y;
    var xz = result.x * result.z;
    var yz = result.y * result.z;
    var x = ((cos + ((ux*ux)*cos1)) * this.x) + (((xy*cos1) - (uz*sin)) * this.y) + (((xz*cos1)+(uy*sin)) * this.z);
    var y = (((xy*cos1)+(uz*sin)) * this.x) + ((cos+((uy*uy)*cos1)) * this.y) + (((yz*cos1)-(ux*sin)) * this.z);
    var z = (((xz*cos1)-(uy*sin)) * this.x) + (((yz*cos1)+(ux*sin)) * this.y) + ((cos + ((ux*ux)*cos1)) * this.z);
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by theta around x-axis. Returns a new Vector.
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateX = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = this.x;
    var y = (cos * this.y) - (sin * this.z);
    var z = (sin * this.y) + (cos * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around x-axis. Result is assigned to result parameter.
 * @method
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateXLG = function(theta, result){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = this.x;
    var y = (cos * this.y) - (sin * this.z);
    var z = (sin * this.y) + (cos * this.z);
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by theta around y-axis. Returns a new Vector.
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateY = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos *this.x) + (sin * this.z);
    var y = this.y;
    var z = -(sin * this.x) + (cos * this.z);
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around y-axis. Result is assigned to result parameter.
 * @method
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateYLG = function(theta, result){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos *this.x) + (sin * this.z);
    var y = this.y;
    var z = -(sin * this.x) + (cos * this.z);
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by theta around z-axis. Returns a new Vector.
 * @method
 * @param {number} theta
 * @return {Vector}
 */
Vector.prototype.rotateZ = function(theta){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos * this.x) - (sin * this.y);
    var y = (sin * this.x) + (cos * this.y);
    var z = this.z;
    return new Vector(x, y, z);
};
/**
 * Rotate vector by theta around z-axis. Result is assigned to result parameter.
 * @method
 * @param {number} theta
 * @param {Vector} result
 */
Vector.prototype.rotateZLG = function(theta, result){
    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var x = (cos * this.x) - (sin * this.y);
    var y = (sin * this.x) + (cos * this.y);
    var z = this.z;
    result.x = x;
    result.y = y;
    result.z = z;
};
/**
 * Rotate vector by pitch, yaw, and roll. Returns a new Vector.
 * @method
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @return {Vector}
 */
Vector.prototype.rotatePitchYawRoll = function(pitch_amnt, yaw_amnt, roll_amnt) {
    return this.rotateX(roll_amnt).rotateY(pitch_amnt).rotateZ(yaw_amnt);
};
/** 
 * Rotate vector by pitch, yaw, and roll. Result is assigned to result parameter.
 * @method
 * @param {number} pitch
 * @param {number} yaw
 * @param {number} roll
 * @param {Vector} temp
 * @param {Vector} result
 */
Vector.prototype.rotatePitchYawRollLG = function(pitch_amnt, yaw_amnt, roll_amnt, result) {
    this.rotateXLG(roll_amnt, result);
    result.rotateYLG(pitch_amnt, result);
    result.rotateZLG(yaw_amnt, result);
};

var temp_vector1 = new Vector(0,0,0);
var temp_vector2 = new Vector(0,0,0);

module.exports = Vector;

},{}],8:[function(_dereq_,module,exports){
_dereq_('./../tests/helpers.js');
_dereq_('./../tests/math/matrix.js');
_dereq_('./../tests/math/vector.js');

},{"./../tests/helpers.js":9,"./../tests/math/matrix.js":10,"./../tests/math/vector.js":11}],9:[function(_dereq_,module,exports){
function nearlyEqual(a, b, eps){
    if (typeof eps === "undefined") {eps = 0.01;}
    var diff = Math.abs(a - b);
    return (diff < eps);
}

var helpers = new Object(null);

helpers.nearlyEqual = nearlyEqual;

module.exports = helpers;
},{}],10:[function(_dereq_,module,exports){
var Matrix = _dereq_('../../src/matrix.js');
var Vector = _dereq_('../../src/vector.js');
var assert = _dereq_("assert");

suite('Matrix', function(){
    var zero, zero2, zero3, identity, identity2, identity3, ones, m0, m1, m2, m3, m4, m5, m6, m7, angles;
    var result, temp_mat, temp_vector;
    setup(function(){
        result = new Matrix();
        temp_mat = new Matrix();
        temp_vector = new Vector(0,0,0);
        angles = [0, Math.PI / 2, Math.PI, 3*Math.PI / 2, Math.PI / 2];
        zero = Matrix.zero();
        zero2 = new Matrix();
        zero3 = Matrix.fromArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        identity = Matrix.identity();
        identity2 = new Matrix();
        identity3 = Matrix.fromArray([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
        identity2[0] = 1;
        identity2[5] = 1;
        identity2[10] = 1;
        identity2[15] = 1;
        ones = new Matrix();
        m0 = new Matrix();
        m1 = new Matrix();
        m2 = new Matrix();
        m3 = new Matrix();
        m4 = new Matrix();
        m4[0] = 0;
        m4[1] = 1;
        m4[2] = 1;
        m4[3] = 2;
        m4[4] = 3;
        m4[5] = 5;
        m4[6] = 8;
        m4[7] = 13;
        m4[8] = 21;
        m4[9] = 34;
        m4[10] = 55;
        m4[11] = 89;
        m4[12] = 144;
        m4[13] = 233;
        m4[14] = 377;
        m4[15] = 610;
        m5 = Matrix.fromArray([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610]);
        m6 = Matrix.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8]);
        m7 = Matrix.fromArray([34, 44, 54, 64, 82, 108, 134, 160, 34, 44, 54, 64, 82, 108, 134, 160]);
        for (var i = 0; i < 16; i++){
            ones[i] = 1;
            m0[i] = i;
            m1[i] = i+1;
            m2[i] = i+2;
            m3[i] = i*2;
        }
    });
    suite('properties', function(){
        test('length', function(){
            assert.equal(zero.length, 16);
            assert.equal(zero2.length, 16);
            assert.equal(zero3.length, 16);
            assert.equal(identity.length, 16);
            assert.equal(identity2.length, 16);
            assert.equal(m1.length, 16);
            assert.equal(m2.length, 16);
            assert.equal(m3.length, 16);
            assert.equal(m4.length, 16);
            assert.equal(m5.length, 16);
        });
    });
    suite('methods', function(){
        test('equal', function(){
            assert.ok(identity.equal(identity2));
            assert.ok(zero.equal(zero2));
            assert.ok(zero.equal(zero3));
            assert.ok(zero2.equal(zero3));
            assert.ok(!identity.equal(zero));
            assert.ok(m4.equal(m5));
            assert.ok(!m0.equal(m1));
            assert.ok(!m0.equal(m2));
            assert.ok(!m0.equal(m3));
        });
        test('add', function(){
            var t1 = zero.add(m1);
            var t2 = m0.add(ones);
            var t3 = m0.add(ones).add(ones);
            assert.ok(t1.equal(m1));
            assert.ok(t2.equal(m1));
            assert.ok(t3.equal(m2));
        });
        test('addLG', function(){
            zero.addLG(m1, result);
            assert.ok(result.equal(m1));
            m0.addLG(ones, result);
            assert.ok(result.equal(m1));
            
            m0.addLG(ones, result)
            result.addLG(ones, result);
            assert.ok(result.equal(m2));
        });
        test('subtract', function(){
            var t1 = m4.subtract(m5);
            var t2 = m1.subtract(ones);
            var t3 = m2.subtract(m1);
            assert.ok(t1.equal(zero));
            assert.ok(t2.equal(m0));
            assert.ok(t3.equal(ones));
        });
        test('subtractLG', function(){
            m4.subtractLG(m5, result);
            assert.ok(result.equal(zero));
            m1.subtractLG(ones, result);
            assert.ok(result.equal(m0));
            m2.subtractLG(m1, result);
            assert.ok(result.equal(ones));
        });
        test('multiplyScalar', function(){
            var t1 = m0.multiplyScalar(2);
            var t2 = zero.multiplyScalar(20);
            var t3 = m0.multiplyScalar(1);
            assert.ok(t1.equal(m3));
            assert.ok(t2.equal(zero));
            assert.ok(t3.equal(m0));
        });
        test('multiplyScalarLG', function(){
            m0.multiplyScalarLG(2, result);
            assert.ok(result.equal(m3));
            zero.multiplyScalarLG(20, result);
            assert.ok(result.equal(zero));
            m0.multiplyScalarLG(1, result);
            assert.ok(result.equal(m0));
        });
        test('multiply', function(){
            var t1 = m6.multiply(m6);
            var t2 = identity.multiply(identity);
            var t3 = identity.multiply(zero);
            var t4 = identity.multiply(m0);
            var t5 = zero.multiply(m0);
            assert.ok(t1.equal(m7));
            assert.ok(t2.equal(identity));
            assert.ok(t3.equal(zero));
            assert.ok(t4.equal(m0));
            assert.ok(t5.equal(zero));
        });
        test('multiplyLG', function(){
            m6.multiplyLG(m6, result);
            assert.ok(result.equal(m7));
            identity.multiplyLG(identity, result);
            assert.ok(result.equal(identity));
            identity.multiplyLG(zero, result);
            assert.ok(result.equal(zero));
            identity.multiplyLG(m0, result);
            assert.ok(result.equal(m0));
            zero.multiplyLG(m0, result);
            assert.ok(result.equal(zero));
        });
        test('negate', function(){
            var t1 = m0.negate();
            var t2 = m1.negate();
            var t3 = m2.negate();
            var t4 = m3.negate();
            var t5 = zero.negate();
            var t6 = ones.negate();

            assert.ok(zero.equal(t5));
            for (var i = 0; i < 16; i++){
                assert.equal(t1[i], -m0[i]);
                assert.equal(t2[i], -m1[i]);
                assert.equal(t3[i], -m2[i]);
                assert.equal(t4[i], -m3[i]);
            }
            for (var j = 0; j < 16; j++){
                assert.equal(t1[j], -j);
                assert.equal(t6[j], -1);
            }
        });
        test('negateLG', function(){
            zero.negateLG(result);
            assert.ok(result.equal(zero));
            for (var i = 0; i < 16; i++){
                m0.negateLG(result);
                assert.equal(result[i], -m0[i]);
                m1.negateLG(result);
                assert.equal(result[i], -m1[i]);
                m2.negateLG(result);
                assert.equal(result[i], -m2[i]);
                m3.negateLG(result);
                assert.equal(result[i], -m3[i]);
            }
            for (var j = 0; j < 16; j++){
                m0.negateLG(result);
                assert.equal(result[j], -j);
                ones.negateLG(result);
                assert.equal(result[j], -1);
            }
        });
        test('transpose', function(){
            var transpose_map = {
                0:0, 1:4, 2:8, 3:12, 4:1, 5:5, 6:9, 7:13,
                8:2, 9:6, 10:10, 11:14, 12:3, 13:7, 14:11, 15:15
            }
            var t1 = identity.transpose();
            var t2 = ones.transpose();
            var t3 = zero.transpose();
            var t4 = m0.transpose();
            var t5 = m1.transpose();
            var t6 = m2.transpose();
            var t7 = m3.transpose();

            assert.ok(t1.equal(identity));
            assert.ok(t2.equal(ones));
            assert.ok(t3.equal(zero));
            var t4 = m0.transpose();
            for (var i = 0; i < 16; i++){
                assert.equal(t4[i], m0[transpose_map[i]]);
                assert.equal(t5[i], m1[transpose_map[i]]);
                assert.equal(t6[i], m2[transpose_map[i]]);
                assert.equal(t7[i], m3[transpose_map[i]]);
            }
        });
        test('transposeLG', function(){
            var transpose_map = {
                0:0, 1:4, 2:8, 3:12, 4:1, 5:5, 6:9, 7:13,
                8:2, 9:6, 10:10, 11:14, 12:3, 13:7, 14:11, 15:15
            }

            identity.transposeLG(result);
            assert.ok(result.equal(identity));
            ones.transposeLG(result);
            assert.ok(result.equal(ones));
            zero.transposeLG(result);
            assert.ok(result.equal(zero));
            var t4 = m0.transpose();
            for (var i = 0; i < 16; i++){
                m0.transposeLG(result);
                assert.equal(result[i], m0[transpose_map[i]]);
                m1.transposeLG(result);
                assert.equal(result[i], m1[transpose_map[i]]);
                m2.transposeLG(result);
                assert.equal(result[i], m2[transpose_map[i]]);
                m3.transposeLG(result);
                assert.equal(result[i], m3[transpose_map[i]]);
            }
        });
        test('empty', function(){
                m0.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
                m1.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
                m2.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
                m3.transposeLG(result);
                result.empty();
                assert.ok(result.equal(zero));
        });
        test('copy', function(){
            m0.copy(result);
            assert.ok(result.equal(m0));
            m1.copy(result);
            assert.ok(result.equal(m1));
            m2.copy(result);
            assert.ok(result.equal(m2));
            m3.copy(result);
            assert.ok(result.equal(m3));
        });
        test('rotationX', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationX(theta);
                var t2 = Matrix.identity();
                t2[5] = Math.cos(theta)
                t2[6] = -Math.sin(theta)
                t2[9] = Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationXLG', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationXLG(theta, result);
                var t2 = Matrix.identity();
                t2[5] = Math.cos(theta)
                t2[6] = -Math.sin(theta)
                t2[9] = Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(result.equal(t2));
            }
        });
        test('rotationY', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationY(theta);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[2] = Math.sin(theta)
                t2[8] = -Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationYLG', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationYLG(theta, result);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[2] = Math.sin(theta)
                t2[8] = -Math.sin(theta)
                t2[10] = Math.cos(theta)
                assert.ok(result.equal(t2));
            }
        });
        test('rotationZ', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationZ(theta);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[1] = -Math.sin(theta)
                t2[4] = Math.sin(theta)
                t2[5] = Math.cos(theta)
                assert.ok(t1.equal(t2));
            }
        });
        test('rotationZLG', function(){
            // TODO: Add more tests
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationZLG(theta, result);
                var t2 = Matrix.identity();
                t2[0] = Math.cos(theta)
                t2[1] = -Math.sin(theta)
                t2[4] = Math.sin(theta)
                t2[5] = Math.cos(theta)
                assert.ok(result.equal(t2));
            }
        });
        test('rotationAxis', function(){
            // TODO: Add multi-axis tests?
            var xaxis = new Vector(1, 0, 0);
            var yaxis = new Vector(0, 1, 0);
            var zaxis = new Vector(0, 0, 1);
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                var t1 = Matrix.rotationAxis(xaxis, theta);
                var t2 = Matrix.rotationAxis(yaxis, theta);
                var t3 = Matrix.rotationAxis(zaxis, theta);
                var t4 = Matrix.rotationAxis(xaxis, theta);
                var t5 = Matrix.rotationAxis(yaxis, theta);
                var t6 = Matrix.rotationAxis(zaxis, theta);
                assert.ok(t1.equal(Matrix.rotationX(theta)));
                assert.ok(t2.equal(Matrix.rotationY(theta)));
                assert.ok(t3.equal(Matrix.rotationZ(theta)));
                assert.ok(t4.equal(Matrix.rotationX(theta)));
                assert.ok(t5.equal(Matrix.rotationY(theta)));
                assert.ok(t6.equal(Matrix.rotationZ(theta)));
            }
        });
        test('rotationAxisLG', function(){
            // TODO: Add multi-axis tests?
            var xaxis = new Vector(1, 0, 0);
            var yaxis = new Vector(0, 1, 0);
            var zaxis = new Vector(0, 0, 1);
            for (var i = 0; i < angles.length; i++){
                var theta = angles[i];
                Matrix.rotationAxisLG(xaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationX(theta)));
                Matrix.rotationAxisLG(yaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationY(theta)));
                Matrix.rotationAxisLG(zaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationZ(theta)));
                Matrix.rotationAxisLG(xaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationX(theta)));
                Matrix.rotationAxisLG(yaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationY(theta)));
                Matrix.rotationAxisLG(zaxis, theta, result);
                assert.ok(result.equal(Matrix.rotationZ(theta)));
            }
        });
        test('rotation', function(){
            // TODO: Add better tests, this is basically just recreating the method
            for (var i = 0; i < angles.length; i++){
                var pitch = angles[i];
                for (var j = 0; j < angles.length; j++){
                    var yaw = angles[j];
                    for (var k = 0; k < angles.length; k++){
                        var roll = angles[k];
                        var t1 = Matrix.rotation(pitch, yaw, roll);
                        var t2 = Matrix.rotationX(roll).
                            multiply(Matrix.rotationZ(yaw)).
                            multiply(Matrix.rotationY(pitch));
                        assert.ok(t1.equal(t2));
                    }
                }
            }
        });
        test('rotationLG', function(){
            // TODO: Add better tests, this is basically just recreating the method
            for (var i = 0; i < angles.length; i++){
                var pitch = angles[i];
                for (var j = 0; j < angles.length; j++){
                    var yaw = angles[j];
                    for (var k = 0; k < angles.length; k++){
                        var roll = angles[k];
                        Matrix.rotationLG(pitch, yaw, roll, result);
                        var t1 = Matrix.rotationX(roll).
                            multiply(Matrix.rotationZ(yaw)).
                            multiply(Matrix.rotationY(pitch));
                        assert.ok(result.equal(t1));
                    }
                }
            }
        });
        test('translation', function(){
            var trans = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < trans.length; i++){
                var xtrans = trans[i];
                for (var j = 0; j < trans.length; j++){
                    var ytrans = trans[j];
                    for (var k = 0; k < trans.length; k++){
                        var ztrans = trans[k];
                        var t1 = Matrix.translation(xtrans, ytrans, ztrans);
                        for (var m = 0; m < 16; m++){
                            var result;
                            if (m === 12){
                                result = xtrans;
                            } else if (m === 13){
                                result = ytrans;
                            } else if (m === 14){
                                result = ztrans;
                            } else if (m === 0 || m === 5 || m === 10 || m === 15) {
                                result = 1;
                            } else {
                                result = 0;
                            }
                            assert.equal(t1[m], result);
                        }
                    }
                }
            }
        });
        test('translationLG', function(){
            var trans = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < trans.length; i++){
                var xtrans = trans[i];
                for (var j = 0; j < trans.length; j++){
                    var ytrans = trans[j];
                    for (var k = 0; k < trans.length; k++){
                        var ztrans = trans[k];
                        var t1 = Matrix.translationLG(xtrans, ytrans, ztrans, result);
                        for (var m = 0; m < 16; m++){
                            var res;
                            if (m === 12){
                                res = xtrans;
                            } else if (m === 13){
                                res = ytrans;
                            } else if (m === 14){
                                res = ztrans;
                            } else if (m === 0 || m === 5 || m === 10 || m === 15) {
                                res = 1;
                            } else {
                                res = 0;
                            }
                            assert.equal(res, result[m]);
                        }
                    }
                }
            }
        });
        test('scale', function(){
            var scale = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < scale.length; i++){
                var xscale = scale[i];
                for (var j = 0; j < scale.length; j++){
                    var yscale = scale[j];
                    for (var k = 0; k < scale.length; k++){
                        var zscale = scale[k];
                        var t1 = Matrix.scale(xscale, yscale, zscale);
                        for (var m = 0; m < 16; m++){
                            var result;
                            if (m === 0){
                                result = xscale;
                            } else if (m === 5){
                                result = yscale;
                            } else if (m === 10){
                                result = zscale;
                            } else if (m === 15) {
                                result = 1;
                            } else {
                                result = 0;
                            }
                            assert.equal(t1[m], result);
                        }
                    }
                }
            }
        });
        test('scaleLG', function(){
            var scale = [1, 2, 3, 5, 10, 20, 30, 40];
            for (var i = 0; i < scale.length; i++){
                var xscale = scale[i];
                for (var j = 0; j < scale.length; j++){
                    var yscale = scale[j];
                    for (var k = 0; k < scale.length; k++){
                        var zscale = scale[k];
                        var t1 = Matrix.scaleLG(xscale, yscale, zscale, result);
                        for (var m = 0; m < 16; m++){
                            var res;
                            if (m === 0){
                                res = xscale;
                            } else if (m === 5){
                                res = yscale;
                            } else if (m === 10){
                                res = zscale;
                            } else if (m === 15) {
                                res = 1;
                            } else {
                                res = 0;
                            }
                            assert.equal(result[m], res);
                        }
                    }
                }
            }
        });
        test('identity', function(){
            assert.ok(identity.equal(identity2));
            assert.ok(identity.equal(identity3));
            for (var i = 0; i < 16; i++){
                if (i % 5 === 0){
                    assert.equal(identity[i], 1);
                } else {
                    assert.equal(identity[i], 0);
                }
            }
        });
        test('identityLG', function(){
            Matrix.identityLG(result);
            assert.ok(result.equal(identity2));
            assert.ok(result.equal(identity3));
            for (var i = 0; i < 16; i++){
                if (i % 5 === 0){
                    assert.equal(result[i], 1);
                } else {
                    assert.equal(result[i], 0);
                }
            }
        });
        test('zero', function(){
            assert.ok(zero.equal(zero2));
            assert.ok(zero.equal(zero3));
            for (var i = 0; i < 16; i++){
                assert.equal(zero[i], 0);
            }
        });
        test('zero', function(){
            Matrix.zeroLG(result);
            assert.ok(result.equal(zero2));
            assert.ok(result.equal(zero3));
            for (var i = 0; i < 16; i++){
                assert.equal(result[i], 0);
            }
        });
        test('fromArray', function(){
            assert.ok(m5.equal(m4));
            assert.ok(zero.equal(zero3));
            assert.ok(zero2.equal(zero3));
            assert.ok(identity.equal(identity3));
            assert.ok(identity2.equal(identity3));
        });
        test('fromArrayLG', function(){
            Matrix.fromArrayLG([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], result);
            assert.ok(result.equal(zero3));
            assert.ok(result.equal(zero2));
            Matrix.fromArrayLG([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1], result);
            assert.ok(result.equal(identity2));
            Matrix.fromArrayLG([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610], result);
            assert.ok(result.equal(m4));
        });
        test('Matrix.copy', function(){
            Matrix.copy(m0, result);
            assert.ok(result.equal(m0));
            Matrix.copy(m1, result);
            assert.ok(result.equal(m1));
            Matrix.copy(m2, result);
            assert.ok(result.equal(m2));
            Matrix.copy(m3, result);
            assert.ok(result.equal(m3));
        });
    });
});

},{"../../src/matrix.js":6,"../../src/vector.js":7,"assert":1}],11:[function(_dereq_,module,exports){
var Vector = _dereq_('../../src/vector.js');
var assert = _dereq_('assert');
var nearlyEqual = _dereq_('../helpers.js')['nearlyEqual'];

suite('Vector', function(){
    var origin, vector1, vector2, vector3, vector4, vector5, vectorx, vectory, vectorz;
    var vector100x, vector200y, vector300z, vector123, vector112;
    var result, temp1, temp2;
    setup(function(){
        result = new Vector(0, 0, 0);
        temp1 = new Vector(0, 0, 0);
        temp2 = new Vector(0, 0, 0);
        origin = new Vector(0, 0, 0);
        vector1 = new Vector(1, 1, 1);
        vector2 = new Vector(1, 1, 1);
        vector3 = new Vector(10, 10, 10);
        vector4 = new Vector(11, 11, 11);
        vector5 = new Vector(-1, -1, -1);
        vectorx = new Vector(1, 0, 0);
        vectory = new Vector(0, 1, 0);
        vectorz = new Vector(0, 0, 1);
        vector100x = new Vector(100, 0, 0);
        vector200y = new Vector(0, 200, 0);
        vector300z = new Vector(0, 0, 300);
        vector123 = new Vector(1, 2, 3);
        vector112 = new Vector(-1, 1, 2);
    });
    suite('properties', function(){
        test('axes', function(){
            assert.throws(function(){new Vector();}, Error);
            assert.ok(vector1.x);
            assert.ok(vector1.y);
            assert.ok(vector1.z);
        });
    });
    suite('methods', function(){
        test('add', function(){
            var t1 = vector1.add(vector3);
            var t2 = vector1.add(vector5);
            assert.ok(t1.equal(vector4));
            assert.ok(t2.equal(origin));
            assert.equal(t1.x, 11);
            assert.equal(t1.y, 11);
            assert.equal(t1.z, 11);
            assert.equal(t2.x, 0);
            assert.equal(t2.y, 0);
            assert.equal(t2.z, 0);
        });
        test('addLG', function(){
            vector1.addLG(vector3, result);
            assert.equal(result.x, 11);
            assert.equal(result.y, 11);
            assert.equal(result.z, 11);
            assert.ok(result.equal(vector4));
            vector1.addLG(vector5, result);
            assert.ok(result.equal(origin));
            assert.equal(result.x, 0);
            assert.equal(result.y, 0);
            assert.equal(result.z, 0);
        });
        test('subtract', function(){
            var t1 = vector4.subtract(vector1);
            var t2 = vector1.subtract(vector2);
            assert.ok(t1.equal(vector3));
            assert.ok(t2.equal(origin));
            assert.equal(t1.x, 10);
            assert.equal(t1.y, 10);
            assert.equal(t1.z, 10);
            assert.equal(t2.x, 0);
            assert.equal(t2.y, 0);
            assert.equal(t2.z, 0);
        });
        test('subtractLG', function(){
            vector4.subtractLG(vector1, result);
            assert.ok(result.equal(vector3));
            assert.equal(result.x, 10);
            assert.equal(result.y, 10);
            assert.equal(result.z, 10);
            vector1.subtractLG(vector2, result);
            assert.ok(result.equal(origin));
            assert.equal(result.x, 0);
            assert.equal(result.y, 0);
            assert.equal(result.z, 0);
        });
        test('equal', function(){
            assert.equal(vector1.equal(vector2), true);
            assert.equal(vector1.equal(vector3), false);
        });
        test('angle', function(){
            assert.ok(nearlyEqual(vectorx.angle(vectory), Math.PI / 2));
            assert.ok(nearlyEqual(vectory.angle(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vectorx.angle(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vector1.angle(vector2), 0));
            assert.ok(nearlyEqual(vector1.angle(vector5), Math.PI));
        });
        test('angleLG', function(){
            assert.ok(nearlyEqual(vectorx.angleLG(vectory), Math.PI / 2));
            assert.ok(nearlyEqual(vectory.angleLG(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vectorx.angleLG(vectorz), Math.PI / 2));
            assert.ok(nearlyEqual(vector1.angleLG(vector2), 0));
            assert.ok(nearlyEqual(vector1.angleLG(vector5), Math.PI));
        });
        test('cosAngle', function(){
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngle(vectory)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectory.cosAngle(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngle(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngle(vector2)), 0));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngle(vector5)), Math.PI));
        });
        test('cosAngleLG', function(){
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngleLG(vectory)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectory.cosAngleLG(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vectorx.cosAngleLG(vectorz)), (Math.PI / 2)));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngleLG(vector2)), 0));
            assert.ok(nearlyEqual(Math.acos(vector1.cosAngleLG(vector5)), Math.PI));
        });
        test('magnitude', function(){
            assert.equal(vectorx.magnitude(), 1);
            assert.equal(vectory.magnitude(), 1);
            assert.equal(vectorz.magnitude(), 1);
            assert.ok(nearlyEqual(vector1.magnitude(), Math.sqrt(3)));
            assert.ok(nearlyEqual(vector5.magnitude(), Math.sqrt(3)));
            assert.ok(nearlyEqual(vector3.magnitude(), Math.sqrt(300)));
        });
        test('magnitudeSquared', function(){
            assert.equal(vectorx.magnitudeSquared(), 1);
            assert.equal(vectory.magnitudeSquared(), 1);
            assert.equal(vectorz.magnitudeSquared(), 1);
            assert.equal(vector1.magnitudeSquared(), 3);
            assert.equal(vector5.magnitudeSquared(), 3);
            assert.equal(vector3.magnitudeSquared(), 300);
        });
        test('dot', function(){
            assert.equal(vector1.dot(vector2), 3);
            assert.equal(vector2.dot(vector3), 30);
            assert.equal(vector3.dot(vector5), -30);
            assert.equal(vectorx.dot(vectory), 0);
            assert.equal(vectorx.dot(vectorz), 0);
            assert.equal(vectory.dot(vectorz), 0);
        });
        test('cross', function(){
            var t1 = vector123.cross(vector112);
            assert.ok(vectorx.cross(vectory).equal(vectorz));
            assert.ok(vectory.cross(vectorz).equal(vectorx));
            assert.ok(vectorz.cross(vectorx).equal(vectory));
            assert.ok(!vectory.cross(vectorx).equal(vectorz));
            assert.ok(!vectorz.cross(vectory).equal(vectorx));
            assert.ok(!vectorx.cross(vectorz).equal(vectory));
            assert.equal(vectorx.cross(vectory).z, 1);
            assert.equal(vectory.cross(vectorz).x, 1);
            assert.equal(vectorz.cross(vectorx).y, 1);
            assert.equal(t1.x, 1);
            assert.equal(t1.y, -5);
            assert.equal(t1.z, 3);
        });
        test('crossLG', function(){
            vector123.crossLG(vector112, result);
            assert.equal(result.x, 1);
            assert.equal(result.y, -5);
            assert.equal(result.z, 3);
            vectorx.crossLG(vectory, result);
            assert.equal(result.z, 1);
            assert.ok(result.equal(vectorz));
            vectory.crossLG(vectorz, result);
            assert.equal(result.x, 1);
            assert.ok(result.equal(vectorx));
            vectorz.crossLG(vectorx, result);
            assert.equal(result.y, 1);
            assert.ok(result.equal(vectory));
            vectory.crossLG(vectorx, result)
            assert.ok(!result.equal(vectorz));
            vectorz.crossLG(vectory, result)
            assert.ok(!result.equal(vectorx));
            vectorx.crossLG(vectorz, result)
            assert.ok(!result.equal(vectory));
        });
        test('normalize', function(){
            assert.equal(vector100x.normalize().x, 1);
            assert.equal(vector200y.normalize().y, 1);
            assert.equal(vector300z.normalize().z, 1);
        });
        test('normalizeLG', function(){
            vector100x.normalizeLG(result)
            assert.equal(result.x, 1);
            vector200y.normalizeLG(result)
            assert.equal(result.y, 1);
            vector300z.normalizeLG(result)
            assert.equal(result.z, 1);
        });
        test('scale', function(){
            assert.ok(vectorx.scale(100).equal(vector100x));
            assert.ok(vectory.scale(200).equal(vector200y));
            assert.ok(vectorz.scale(300).equal(vector300z));
            assert.ok(vector1.scale(10).equal(vector3));
            assert.ok(vector1.scale(11).equal(vector4));
        });
        test('scaleLG', function(){
            vectorx.scaleLG(100, result);
            assert.ok(result.equal(vector100x));
            vectory.scaleLG(200, result);
            assert.ok(result.equal(vector200y));
            vectorz.scaleLG(300, result);
            assert.ok(result.equal(vector300z));
            vector1.scaleLG(10, result);
            assert.ok(result.equal(vector3));
            vector1.scaleLG(11, result);
            assert.ok(result.equal(vector4));
        });
        test('negate', function(){
            assert.ok(vector1.negate().equal(vector5));
            assert.ok(vector1.negate().negate().equal(vector1));
        });
        test('negateLG', function(){
            vector1.negateLG(result);
            assert.ok(result.equal(vector5));
            vector1.negateLG(temp1);
            temp1.negateLG(result);
            assert.ok(result.equal(vector1));
        });
        test('vectorProjection', function(){
            var t1 = vectorx.vectorProjection(vectory);
            var t2 = vector1.vectorProjection(vector3);
            var t3 = vector123.vectorProjection(vector112);
            assert.ok(nearlyEqual(t1.x, 0));
            assert.ok(nearlyEqual(t1.y, 0));
            assert.ok(nearlyEqual(t1.z, 0));
            assert.ok(nearlyEqual(t2.x, 1));
            assert.ok(nearlyEqual(t2.y, 1));
            assert.ok(nearlyEqual(t2.z, 1));
            assert.ok(nearlyEqual(t3.x, -1.167));
            assert.ok(nearlyEqual(t3.y, 1.16));
            assert.ok(nearlyEqual(t3.z, 2.33));
        });
        test('vectorProjectionLG', function(){
            vectorx.vectorProjectionLG(vectory, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vector1.vectorProjectionLG(vector3, result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 1));
            assert.ok(nearlyEqual(result.z, 1));
            vector123.vectorProjectionLG(vector112, result);
            assert.ok(nearlyEqual(result.x, -1.167));
            assert.ok(nearlyEqual(result.y, 1.16));
            assert.ok(nearlyEqual(result.z, 2.33));
        });
        test('scalarProjection', function(){
            assert.ok(nearlyEqual(vectorx.scalarProjection(vectory), 0));
            assert.ok(nearlyEqual(vectory.scalarProjection(vectorz), 0));
            assert.ok(nearlyEqual(vectory.scalarProjection(vectorz), 0));
            assert.ok(nearlyEqual(vector1.scalarProjection(vector3), 1.73));
            assert.ok(nearlyEqual(vector123.scalarProjection(vector112), 2.85));
        });
        // test('transform', function(){
        //     // TODO: Think of test cases
        //     assert.equal(1, 2);
        // });
        // test('transformLG', function(){
        //     // TODO: Think of test cases
        //     assert.equal(1, 2);
        // });
        test('rotate', function(){
            var rot1 = vectorx.rotate(vectory, Math.PI / 2);
            var rot2 = vectorx.rotate(vectory, Math.PI);
            var rot3 = vectorx.rotate(vectory, ((3*Math.PI) / 2));
            var rot4 = vectorx.rotate(vectory, 2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
            assert.ok(nearlyEqual(rot2.x, -1));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 1));
            assert.ok(nearlyEqual(rot4.x, 1));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotate', function(){
            vectorx.rotateLG(vectory, Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
            vectorx.rotateLG(vectory, Math.PI, result);
            assert.ok(nearlyEqual(result.x, -1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectorx.rotateLG(vectory, ((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 1));
            vectorx.rotateLG(vectory, 2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
        });
        test('rotateX', function(){
            var rot1 = vectorz.rotateX(Math.PI / 2);
            var rot2 = vectorz.rotateX(Math.PI);
            var rot3 = vectorz.rotateX(((3*Math.PI) / 2));
            var rot4 = vectorz.rotateX(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, -1));
            assert.ok(nearlyEqual(rot1.z, 0));
            assert.ok(nearlyEqual(rot2.x, 0));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, -1));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 1));
            assert.ok(nearlyEqual(rot3.z, 0));
            assert.ok(nearlyEqual(rot4.x, 0));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 1));
        });
        test('rotateXLG', function(){
            vectorz.rotateXLG(Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, -1));
            assert.ok(nearlyEqual(result.z, 0));
            vectorz.rotateXLG(Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
            vectorz.rotateXLG(((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 1));
            assert.ok(nearlyEqual(result.z, 0));
            vectorz.rotateXLG(2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 1));
        });
        test('rotateY', function(){
            var rot1 = vectorx.rotateY(Math.PI / 2);
            var rot2 = vectorx.rotateY(Math.PI);
            var rot3 = vectorx.rotateY(((3*Math.PI) / 2));
            var rot4 = vectorx.rotateY(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
            assert.ok(nearlyEqual(rot2.x, -1));
            assert.ok(nearlyEqual(rot2.y, 0));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 0));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 1));
            assert.ok(nearlyEqual(rot4.x, 1));
            assert.ok(nearlyEqual(rot4.y, 0));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotateYLG', function(){
            vectorx.rotateYLG(Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
            vectorx.rotateYLG(Math.PI, result);
            assert.ok(nearlyEqual(result.x, -1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectorx.rotateYLG(((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 1));
            vectorx.rotateYLG(2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
        });
        test('rotateZ', function(){
            var rot1 = vectory.rotateZ(Math.PI / 2);
            var rot2 = vectory.rotateZ(Math.PI);
            var rot3 = vectory.rotateZ(((3*Math.PI) / 2));
            var rot4 = vectory.rotateZ(2*Math.PI);
            assert.ok(nearlyEqual(rot1.x, -1));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, 0));
            assert.ok(nearlyEqual(rot2.x, 0));
            assert.ok(nearlyEqual(rot2.y, -1));
            assert.ok(nearlyEqual(rot2.z, 0));
            assert.ok(nearlyEqual(rot3.x, 1));
            assert.ok(nearlyEqual(rot3.y, 0));
            assert.ok(nearlyEqual(rot3.z, 0));
            assert.ok(nearlyEqual(rot4.x, 0));
            assert.ok(nearlyEqual(rot4.y, 1));
            assert.ok(nearlyEqual(rot4.z, 0));
        });
        test('rotateZLG', function(){
            vectory.rotateZLG(Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, -1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectory.rotateZLG(Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, -1));
            assert.ok(nearlyEqual(result.z, 0));
            vectory.rotateZLG(((3*Math.PI) / 2), result);
            assert.ok(nearlyEqual(result.x, 1));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, 0));
            vectory.rotateZLG(2*Math.PI, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 1));
            assert.ok(nearlyEqual(result.z, 0));
        });
        test('rotatePitchYawRoll', function(){
            var rot1 = vectorx.rotatePitchYawRoll(Math.PI / 2, Math.PI / 2, Math.PI / 2);
            assert.ok(nearlyEqual(rot1.x, 0));
            assert.ok(nearlyEqual(rot1.y, 0));
            assert.ok(nearlyEqual(rot1.z, -1));
        });
        test('rotatePitchYawRollLG', function(){
            vectorx.rotatePitchYawRollLG(Math.PI / 2, Math.PI / 2, Math.PI / 2, result);
            assert.ok(nearlyEqual(result.x, 0));
            assert.ok(nearlyEqual(result.y, 0));
            assert.ok(nearlyEqual(result.z, -1));
        });
    });
});
},{"../../src/vector.js":7,"../helpers.js":9,"assert":1}]},{},[8])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9hc3NlcnQvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy9zcmMvbWF0cml4LmpzIiwiL2hvbWUvZWJlbnBhY2svRG9jdW1lbnRzL3dvcmsvbGluZWFyYWxnZWEuanMvc3JjL3ZlY3Rvci5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL3Rlc3QvZmFrZV82NTI4OTcxYi5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL3Rlc3RzL2hlbHBlcnMuanMiLCIvaG9tZS9lYmVucGFjay9Eb2N1bWVudHMvd29yay9saW5lYXJhbGdlYS5qcy90ZXN0cy9tYXRoL21hdHJpeC5qcyIsIi9ob21lL2ViZW5wYWNrL0RvY3VtZW50cy93b3JrL2xpbmVhcmFsZ2VhLmpzL3Rlc3RzL21hdGgvdmVjdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1a0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3J1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwZUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdmxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHdoZW4gdXNlZCBpbiBub2RlLCB0aGlzIHdpbGwgYWN0dWFsbHkgbG9hZCB0aGUgdXRpbCBtb2R1bGUgd2UgZGVwZW5kIG9uXG4vLyB2ZXJzdXMgbG9hZGluZyB0aGUgYnVpbHRpbiB1dGlsIG1vZHVsZSBhcyBoYXBwZW5zIG90aGVyd2lzZVxuLy8gdGhpcyBpcyBhIGJ1ZyBpbiBub2RlIG1vZHVsZSBsb2FkaW5nIGFzIGZhciBhcyBJIGFtIGNvbmNlcm5lZFxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xuXG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcblxuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IHN0YWNrU3RhcnRGdW5jdGlvbi5uYW1lO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICBpZiAodXRpbC5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgfVxuICBpZiAodXRpbC5pc051bWJlcih2YWx1ZSkgJiYgKGlzTmFOKHZhbHVlKSB8fCAhaXNGaW5pdGUodmFsdWUpKSkge1xuICAgIHJldHVybiB2YWx1ZS50b1N0cmluZygpO1xuICB9XG4gIGlmICh1dGlsLmlzRnVuY3Rpb24odmFsdWUpIHx8IHV0aWwuaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh1dGlsLmlzU3RyaW5nKHMpKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5hY3R1YWwsIHJlcGxhY2VyKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKEpTT04uc3RyaW5naWZ5KHNlbGYuZXhwZWN0ZWQsIHJlcGxhY2VyKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0J1ZmZlcihhY3R1YWwpICYmIHV0aWwuaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgaWYgKGFjdHVhbC5sZW5ndGggIT0gZXhwZWN0ZWQubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjdHVhbC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFjdHVhbFtpXSAhPT0gZXhwZWN0ZWRbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoIXV0aWwuaXNPYmplY3QoYWN0dWFsKSAmJiAhdXRpbC5pc09iamVjdChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIpIHtcbiAgaWYgKHV0aWwuaXNOdWxsT3JVbmRlZmluZWQoYSkgfHwgdXRpbC5pc051bGxPclVuZGVmaW5lZChiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS5cbiAgaWYgKGEucHJvdG90eXBlICE9PSBiLnByb3RvdHlwZSkgcmV0dXJuIGZhbHNlO1xuICAvL35+fkkndmUgbWFuYWdlZCB0byBicmVhayBPYmplY3Qua2V5cyB0aHJvdWdoIHNjcmV3eSBhcmd1bWVudHMgcGFzc2luZy5cbiAgLy8gICBDb252ZXJ0aW5nIHRvIGFycmF5IHNvbHZlcyB0aGUgcHJvYmxlbS5cbiAgaWYgKGlzQXJndW1lbnRzKGEpKSB7XG4gICAgaWYgKCFpc0FyZ3VtZW50cyhiKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIpO1xuICB9XG4gIHRyeSB7XG4gICAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgICAga2IgPSBvYmplY3RLZXlzKGIpLFxuICAgICAgICBrZXksIGk7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh1dGlsLmlzU3RyaW5nKGV4cGVjdGVkKSkge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhY3R1YWwgPSBlO1xuICB9XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoIXNob3VsZFRocm93ICYmIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQocFNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cy5hcHBseSh0aGlzLCBbZmFsc2VdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB7dGhyb3cgZXJyO319O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJ2YXIgVmVjdG9yID0gcmVxdWlyZSgnLi92ZWN0b3IuanMnKTtcblxuLyoqIFxuICogNHg0IG1hdHJpeC5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYXRyaXgoKXtcbiAgICBmb3IgKHZhciBpPTA7IGk8MTY7IGkrKyl7XG4gICAgICAgIHRoaXNbaV0gPSAwO1xuICAgIH1cbiAgICB0aGlzLmxlbmd0aCA9IDE2O1xufVxuLyoqXG4gKiBDb21wYXJlIG1hdHJpY2VzIGZvciBlcXVhbGl0eS5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuZXF1YWwgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgaWYgKHRoaXNbaV0gIT09IG1hdHJpeFtpXSl7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59O1xuLyoqXG4gKiBBZGQgbWF0cmljZXMuIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gdGhpc1tpXSArIG1hdHJpeFtpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBBZGQgbWF0cmljZXMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucHJvdG90eXBlLmFkZExHID0gZnVuY3Rpb24obWF0cml4LCByZXN1bHQpe1xuICAgIHJlc3VsdFswXSA9IHRoaXNbMF0gKyBtYXRyaXhbMF07XG4gICAgcmVzdWx0WzFdID0gdGhpc1sxXSArIG1hdHJpeFsxXTtcbiAgICByZXN1bHRbMl0gPSB0aGlzWzJdICsgbWF0cml4WzJdO1xuICAgIHJlc3VsdFszXSA9IHRoaXNbM10gKyBtYXRyaXhbM107XG4gICAgcmVzdWx0WzRdID0gdGhpc1s0XSArIG1hdHJpeFs0XTtcbiAgICByZXN1bHRbNV0gPSB0aGlzWzVdICsgbWF0cml4WzVdO1xuICAgIHJlc3VsdFs2XSA9IHRoaXNbNl0gKyBtYXRyaXhbNl07XG4gICAgcmVzdWx0WzddID0gdGhpc1s3XSArIG1hdHJpeFs3XTtcbiAgICByZXN1bHRbOF0gPSB0aGlzWzhdICsgbWF0cml4WzhdO1xuICAgIHJlc3VsdFs5XSA9IHRoaXNbOV0gKyBtYXRyaXhbOV07XG4gICAgcmVzdWx0WzEwXSA9IHRoaXNbMTBdICsgbWF0cml4WzEwXTtcbiAgICByZXN1bHRbMTFdID0gdGhpc1sxMV0gKyBtYXRyaXhbMTFdO1xuICAgIHJlc3VsdFsxMl0gPSB0aGlzWzEyXSArIG1hdHJpeFsxMl07XG4gICAgcmVzdWx0WzEzXSA9IHRoaXNbMTNdICsgbWF0cml4WzEzXTtcbiAgICByZXN1bHRbMTRdID0gdGhpc1sxNF0gKyBtYXRyaXhbMTRdO1xuICAgIHJlc3VsdFsxNV0gPSB0aGlzWzE1XSArIG1hdHJpeFsxNV07XG59O1xuLyoqXG4gKiBTdWJ0cmFjdCBtYXRyaWNlcy4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge01hdHJpeH0gbWF0cml4XG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuc3VidHJhY3QgPSBmdW5jdGlvbihtYXRyaXgpe1xuICAgIHZhciBuZXdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IHRoaXNbaV0gLSBtYXRyaXhbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogU3VidHJhY3QgbWF0cmljZXMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IG1hdHJpeFxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucHJvdG90eXBlLnN1YnRyYWN0TEcgPSBmdW5jdGlvbihtYXRyaXgsIHJlc3VsdCl7XG4gICAgcmVzdWx0WzBdID0gdGhpc1swXSAtIG1hdHJpeFswXTtcbiAgICByZXN1bHRbMV0gPSB0aGlzWzFdIC0gbWF0cml4WzFdO1xuICAgIHJlc3VsdFsyXSA9IHRoaXNbMl0gLSBtYXRyaXhbMl07XG4gICAgcmVzdWx0WzNdID0gdGhpc1szXSAtIG1hdHJpeFszXTtcbiAgICByZXN1bHRbNF0gPSB0aGlzWzRdIC0gbWF0cml4WzRdO1xuICAgIHJlc3VsdFs1XSA9IHRoaXNbNV0gLSBtYXRyaXhbNV07XG4gICAgcmVzdWx0WzZdID0gdGhpc1s2XSAtIG1hdHJpeFs2XTtcbiAgICByZXN1bHRbN10gPSB0aGlzWzddIC0gbWF0cml4WzddO1xuICAgIHJlc3VsdFs4XSA9IHRoaXNbOF0gLSBtYXRyaXhbOF07XG4gICAgcmVzdWx0WzldID0gdGhpc1s5XSAtIG1hdHJpeFs5XTtcbiAgICByZXN1bHRbMTBdID0gdGhpc1sxMF0gLSBtYXRyaXhbMTBdO1xuICAgIHJlc3VsdFsxMV0gPSB0aGlzWzExXSAtIG1hdHJpeFsxMV07XG4gICAgcmVzdWx0WzEyXSA9IHRoaXNbMTJdIC0gbWF0cml4WzEyXTtcbiAgICByZXN1bHRbMTNdID0gdGhpc1sxM10gLSBtYXRyaXhbMTNdO1xuICAgIHJlc3VsdFsxNF0gPSB0aGlzWzE0XSAtIG1hdHJpeFsxNF07XG4gICAgcmVzdWx0WzE1XSA9IHRoaXNbMTVdIC0gbWF0cml4WzE1XTtcbn07XG4vKipcbiAqIE11bHRpcGx5IG1hdHJpeCBieSBzY2FsYXIuIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm11bHRpcGx5U2NhbGFyID0gZnVuY3Rpb24oc2NhbGFyKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XG4gICAgICAgIG5ld19tYXRyaXhbaV0gPSB0aGlzW2ldICogc2NhbGFyO1xuICAgIH1cbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE11bHRpcGx5IG1hdHJpeCBieSBzY2FsYXIuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucHJvdG90eXBlLm11bHRpcGx5U2NhbGFyTEcgPSBmdW5jdGlvbihzY2FsYXIsIHJlc3VsdCl7XG4gICAgcmVzdWx0WzBdID0gdGhpc1swXSAqIHNjYWxhcjtcbiAgICByZXN1bHRbMV0gPSB0aGlzWzFdICogc2NhbGFyO1xuICAgIHJlc3VsdFsyXSA9IHRoaXNbMl0gKiBzY2FsYXI7XG4gICAgcmVzdWx0WzNdID0gdGhpc1szXSAqIHNjYWxhcjtcbiAgICByZXN1bHRbNF0gPSB0aGlzWzRdICogc2NhbGFyO1xuICAgIHJlc3VsdFs1XSA9IHRoaXNbNV0gKiBzY2FsYXI7XG4gICAgcmVzdWx0WzZdID0gdGhpc1s2XSAqIHNjYWxhcjtcbiAgICByZXN1bHRbN10gPSB0aGlzWzddICogc2NhbGFyO1xuICAgIHJlc3VsdFs4XSA9IHRoaXNbOF0gKiBzY2FsYXI7XG4gICAgcmVzdWx0WzldID0gdGhpc1s5XSAqIHNjYWxhcjtcbiAgICByZXN1bHRbMTBdID0gdGhpc1sxMF0gKiBzY2FsYXI7XG4gICAgcmVzdWx0WzExXSA9IHRoaXNbMTFdICogc2NhbGFyO1xuICAgIHJlc3VsdFsxMl0gPSB0aGlzWzEyXSAqIHNjYWxhcjtcbiAgICByZXN1bHRbMTNdID0gdGhpc1sxM10gKiBzY2FsYXI7XG4gICAgcmVzdWx0WzE0XSA9IHRoaXNbMTRdICogc2NhbGFyO1xuICAgIHJlc3VsdFsxNV0gPSB0aGlzWzE1XSAqIHNjYWxhcjtcbn07XG4vKipcbiAqIE11bHRpcGx5IG1hdHJpY2VzLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uKG1hdHJpeCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgbmV3X21hdHJpeFswXSA9ICh0aGlzWzBdICogbWF0cml4WzBdKSArICh0aGlzWzFdICogbWF0cml4WzRdKSArICh0aGlzWzJdICogbWF0cml4WzhdKSArICh0aGlzWzNdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFsxXSA9ICh0aGlzWzBdICogbWF0cml4WzFdKSArICh0aGlzWzFdICogbWF0cml4WzVdKSArICh0aGlzWzJdICogbWF0cml4WzldKSArICh0aGlzWzNdICogbWF0cml4WzEzXSk7XG4gICAgbmV3X21hdHJpeFsyXSA9ICh0aGlzWzBdICogbWF0cml4WzJdKSArICh0aGlzWzFdICogbWF0cml4WzZdKSArICh0aGlzWzJdICogbWF0cml4WzEwXSkgKyAodGhpc1szXSAqIG1hdHJpeFsxNF0pO1xuICAgIG5ld19tYXRyaXhbM10gPSAodGhpc1swXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs3XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTVdKTtcbiAgICBuZXdfbWF0cml4WzRdID0gKHRoaXNbNF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbNl0gKiBtYXRyaXhbOF0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTJdKTtcbiAgICBuZXdfbWF0cml4WzVdID0gKHRoaXNbNF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbNl0gKiBtYXRyaXhbOV0pICsgKHRoaXNbN10gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzZdID0gKHRoaXNbNF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbNl0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzddICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFs3XSA9ICh0aGlzWzRdICogbWF0cml4WzNdKSArICh0aGlzWzVdICogbWF0cml4WzddKSArICh0aGlzWzZdICogbWF0cml4WzExXSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbOF0gPSAodGhpc1s4XSAqIG1hdHJpeFswXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs0XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbOF0pICsgKHRoaXNbMTFdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFs5XSA9ICh0aGlzWzhdICogbWF0cml4WzFdKSArICh0aGlzWzldICogbWF0cml4WzVdKSArICh0aGlzWzEwXSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzEwXSA9ICh0aGlzWzhdICogbWF0cml4WzJdKSArICh0aGlzWzldICogbWF0cml4WzZdKSArICh0aGlzWzEwXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTFdICogbWF0cml4WzE0XSk7XG4gICAgbmV3X21hdHJpeFsxMV0gPSAodGhpc1s4XSAqIG1hdHJpeFszXSkgKyAodGhpc1s5XSAqIG1hdHJpeFs3XSkgKyAodGhpc1sxMF0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxNV0pO1xuICAgIG5ld19tYXRyaXhbMTJdID0gKHRoaXNbMTJdICogbWF0cml4WzBdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs0XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOF0pICsgKHRoaXNbMTVdICogbWF0cml4WzEyXSk7XG4gICAgbmV3X21hdHJpeFsxM10gPSAodGhpc1sxMl0gKiBtYXRyaXhbMV0pICsgKHRoaXNbMTNdICogbWF0cml4WzVdKSArICh0aGlzWzE0XSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTNdKTtcbiAgICBuZXdfbWF0cml4WzE0XSA9ICh0aGlzWzEyXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNl0pICsgKHRoaXNbMTRdICogbWF0cml4WzEwXSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTRdKTtcbiAgICBuZXdfbWF0cml4WzE1XSA9ICh0aGlzWzEyXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbN10pICsgKHRoaXNbMTRdICogbWF0cml4WzExXSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTVdKTtcbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIE11bHRpcGx5IG1hdHJpY2VzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSBtYXRyaXhcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnByb3RvdHlwZS5tdWx0aXBseUxHID0gZnVuY3Rpb24obWF0cml4LCByZXN1bHQpe1xuICAgIHJlc3VsdFswXSA9ICh0aGlzWzBdICogbWF0cml4WzBdKSArICh0aGlzWzFdICogbWF0cml4WzRdKSArICh0aGlzWzJdICogbWF0cml4WzhdKSArICh0aGlzWzNdICogbWF0cml4WzEyXSk7XG4gICAgcmVzdWx0WzFdID0gKHRoaXNbMF0gKiBtYXRyaXhbMV0pICsgKHRoaXNbMV0gKiBtYXRyaXhbNV0pICsgKHRoaXNbMl0gKiBtYXRyaXhbOV0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTNdKTtcbiAgICByZXN1bHRbMl0gPSAodGhpc1swXSAqIG1hdHJpeFsyXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs2XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTRdKTtcbiAgICByZXN1bHRbM10gPSAodGhpc1swXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxXSAqIG1hdHJpeFs3XSkgKyAodGhpc1syXSAqIG1hdHJpeFsxMV0pICsgKHRoaXNbM10gKiBtYXRyaXhbMTVdKTtcbiAgICByZXN1bHRbNF0gPSAodGhpc1s0XSAqIG1hdHJpeFswXSkgKyAodGhpc1s1XSAqIG1hdHJpeFs0XSkgKyAodGhpc1s2XSAqIG1hdHJpeFs4XSkgKyAodGhpc1s3XSAqIG1hdHJpeFsxMl0pO1xuICAgIHJlc3VsdFs1XSA9ICh0aGlzWzRdICogbWF0cml4WzFdKSArICh0aGlzWzVdICogbWF0cml4WzVdKSArICh0aGlzWzZdICogbWF0cml4WzldKSArICh0aGlzWzddICogbWF0cml4WzEzXSk7XG4gICAgcmVzdWx0WzZdID0gKHRoaXNbNF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbNV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbNl0gKiBtYXRyaXhbMTBdKSArICh0aGlzWzddICogbWF0cml4WzE0XSk7XG4gICAgcmVzdWx0WzddID0gKHRoaXNbNF0gKiBtYXRyaXhbM10pICsgKHRoaXNbNV0gKiBtYXRyaXhbN10pICsgKHRoaXNbNl0gKiBtYXRyaXhbMTFdKSArICh0aGlzWzddICogbWF0cml4WzE1XSk7XG4gICAgcmVzdWx0WzhdID0gKHRoaXNbOF0gKiBtYXRyaXhbMF0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNF0pICsgKHRoaXNbMTBdICogbWF0cml4WzhdKSArICh0aGlzWzExXSAqIG1hdHJpeFsxMl0pO1xuICAgIHJlc3VsdFs5XSA9ICh0aGlzWzhdICogbWF0cml4WzFdKSArICh0aGlzWzldICogbWF0cml4WzVdKSArICh0aGlzWzEwXSAqIG1hdHJpeFs5XSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTNdKTtcbiAgICByZXN1bHRbMTBdID0gKHRoaXNbOF0gKiBtYXRyaXhbMl0pICsgKHRoaXNbOV0gKiBtYXRyaXhbNl0pICsgKHRoaXNbMTBdICogbWF0cml4WzEwXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTRdKTtcbiAgICByZXN1bHRbMTFdID0gKHRoaXNbOF0gKiBtYXRyaXhbM10pICsgKHRoaXNbOV0gKiBtYXRyaXhbN10pICsgKHRoaXNbMTBdICogbWF0cml4WzExXSkgKyAodGhpc1sxMV0gKiBtYXRyaXhbMTVdKTtcbiAgICByZXN1bHRbMTJdID0gKHRoaXNbMTJdICogbWF0cml4WzBdKSArICh0aGlzWzEzXSAqIG1hdHJpeFs0XSkgKyAodGhpc1sxNF0gKiBtYXRyaXhbOF0pICsgKHRoaXNbMTVdICogbWF0cml4WzEyXSk7XG4gICAgcmVzdWx0WzEzXSA9ICh0aGlzWzEyXSAqIG1hdHJpeFsxXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbNV0pICsgKHRoaXNbMTRdICogbWF0cml4WzldKSArICh0aGlzWzE1XSAqIG1hdHJpeFsxM10pO1xuICAgIHJlc3VsdFsxNF0gPSAodGhpc1sxMl0gKiBtYXRyaXhbMl0pICsgKHRoaXNbMTNdICogbWF0cml4WzZdKSArICh0aGlzWzE0XSAqIG1hdHJpeFsxMF0pICsgKHRoaXNbMTVdICogbWF0cml4WzE0XSk7XG4gICAgcmVzdWx0WzE1XSA9ICh0aGlzWzEyXSAqIG1hdHJpeFszXSkgKyAodGhpc1sxM10gKiBtYXRyaXhbN10pICsgKHRoaXNbMTRdICogbWF0cml4WzExXSkgKyAodGhpc1sxNV0gKiBtYXRyaXhbMTVdKTtcbn07XG4vKipcbiAqIE5lZ2F0ZSBtYXRyaXguIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHNjYWxhclxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLm5lZ2F0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgICBuZXdfbWF0cml4W2ldID0gLXRoaXNbaV07XG4gICAgfVxuICAgIHJldHVybiBuZXdfbWF0cml4O1xufTtcbi8qKlxuICogTmVnYXRlIG1hdHJpeC4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGFyXG4gKiBAcGFyYW0ge01hdHJpeH0gcmVzdWx0XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUubmVnYXRlTEcgPSBmdW5jdGlvbihyZXN1bHQpe1xuICAgIHJlc3VsdFswXSA9IC10aGlzWzBdO1xuICAgIHJlc3VsdFsxXSA9IC10aGlzWzFdO1xuICAgIHJlc3VsdFsyXSA9IC10aGlzWzJdO1xuICAgIHJlc3VsdFszXSA9IC10aGlzWzNdO1xuICAgIHJlc3VsdFs0XSA9IC10aGlzWzRdO1xuICAgIHJlc3VsdFs1XSA9IC10aGlzWzVdO1xuICAgIHJlc3VsdFs2XSA9IC10aGlzWzZdO1xuICAgIHJlc3VsdFs3XSA9IC10aGlzWzddO1xuICAgIHJlc3VsdFs4XSA9IC10aGlzWzhdO1xuICAgIHJlc3VsdFs5XSA9IC10aGlzWzldO1xuICAgIHJlc3VsdFsxMF0gPSAtdGhpc1sxMF07XG4gICAgcmVzdWx0WzExXSA9IC10aGlzWzExXTtcbiAgICByZXN1bHRbMTJdID0gLXRoaXNbMTJdO1xuICAgIHJlc3VsdFsxM10gPSAtdGhpc1sxM107XG4gICAgcmVzdWx0WzE0XSA9IC10aGlzWzE0XTtcbiAgICByZXN1bHRbMTVdID0gLXRoaXNbMTVdO1xufTtcbi8qKlxuICogVHJhbnNwb3NlIG1hdHJpeC4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5wcm90b3R5cGUudHJhbnNwb3NlID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgbmV3X21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICBuZXdfbWF0cml4WzBdID0gdGhpc1swXTtcbiAgICBuZXdfbWF0cml4WzFdID0gdGhpc1s0XTtcbiAgICBuZXdfbWF0cml4WzJdID0gdGhpc1s4XTtcbiAgICBuZXdfbWF0cml4WzNdID0gdGhpc1sxMl07XG4gICAgbmV3X21hdHJpeFs0XSA9IHRoaXNbMV07XG4gICAgbmV3X21hdHJpeFs1XSA9IHRoaXNbNV07XG4gICAgbmV3X21hdHJpeFs2XSA9IHRoaXNbOV07XG4gICAgbmV3X21hdHJpeFs3XSA9IHRoaXNbMTNdO1xuICAgIG5ld19tYXRyaXhbOF0gPSB0aGlzWzJdO1xuICAgIG5ld19tYXRyaXhbOV0gPSB0aGlzWzZdO1xuICAgIG5ld19tYXRyaXhbMTBdID0gdGhpc1sxMF07XG4gICAgbmV3X21hdHJpeFsxMV0gPSB0aGlzWzE0XTtcbiAgICBuZXdfbWF0cml4WzEyXSA9IHRoaXNbM107XG4gICAgbmV3X21hdHJpeFsxM10gPSB0aGlzWzddO1xuICAgIG5ld19tYXRyaXhbMTRdID0gdGhpc1sxMV07XG4gICAgbmV3X21hdHJpeFsxNV0gPSB0aGlzWzE1XTtcbiAgICByZXR1cm4gbmV3X21hdHJpeDtcbn07XG4vKipcbiAqIFRyYW5zcG9zZSBtYXRyaXguIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucHJvdG90eXBlLnRyYW5zcG9zZUxHID0gZnVuY3Rpb24ocmVzdWx0KXtcbiAgICByZXN1bHRbMF0gPSB0aGlzWzBdO1xuICAgIHJlc3VsdFsxXSA9IHRoaXNbNF07XG4gICAgcmVzdWx0WzJdID0gdGhpc1s4XTtcbiAgICByZXN1bHRbM10gPSB0aGlzWzEyXTtcbiAgICByZXN1bHRbNF0gPSB0aGlzWzFdO1xuICAgIHJlc3VsdFs1XSA9IHRoaXNbNV07XG4gICAgcmVzdWx0WzZdID0gdGhpc1s5XTtcbiAgICByZXN1bHRbN10gPSB0aGlzWzEzXTtcbiAgICByZXN1bHRbOF0gPSB0aGlzWzJdO1xuICAgIHJlc3VsdFs5XSA9IHRoaXNbNl07XG4gICAgcmVzdWx0WzEwXSA9IHRoaXNbMTBdO1xuICAgIHJlc3VsdFsxMV0gPSB0aGlzWzE0XTtcbiAgICByZXN1bHRbMTJdID0gdGhpc1szXTtcbiAgICByZXN1bHRbMTNdID0gdGhpc1s3XTtcbiAgICByZXN1bHRbMTRdID0gdGhpc1sxMV07XG4gICAgcmVzdWx0WzE1XSA9IHRoaXNbMTVdO1xufTtcbi8qKlxuICogV3JpdGUgemVyb3MgdG8gYWxsIGVsZW1lbnRzIG9mIHRoZSBtYXRyaXguXG4gKiBAbWV0aG9kXG4gKi9cbk1hdHJpeC5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbigpe1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKXtcbiAgICAgICAgdGhpc1tpXSA9IDA7XG4gICAgfVxufTtcbi8qKlxuICogQ29weSBtYXRyaXggdmFsdWVzIHRvIGFub3RoZXIgbWF0cml4LlxuICogQG1ldGhvZFxuICogQHBhcmFtIHJlc3VsdFxuICpcbiAqL1xuTWF0cml4LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgIHJlc3VsdFtpXSA9IHRoaXNbaV07XG4gICAgfVxufTtcblxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeC1heGlzLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25YID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gY29zO1xuICAgIHJvdGF0aW9uX21hdHJpeFs2XSA9IC1zaW47XG4gICAgcm90YXRpb25fbWF0cml4WzldID0gc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeC1heGlzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucm90YXRpb25YTEcgPSBmdW5jdGlvbih0aGV0YSwgcmVzdWx0KXtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcmVzdWx0WzBdID0gMTtcbiAgICByZXN1bHRbMV0gPSAwO1xuICAgIHJlc3VsdFsyXSA9IDA7XG4gICAgcmVzdWx0WzNdID0gMDtcbiAgICByZXN1bHRbNF0gPSAwO1xuICAgIHJlc3VsdFs1XSA9IGNvcztcbiAgICByZXN1bHRbNl0gPSAtc2luO1xuICAgIHJlc3VsdFs3XSA9IDA7XG4gICAgcmVzdWx0WzhdID0gMDtcbiAgICByZXN1bHRbOV0gPSBzaW47XG4gICAgcmVzdWx0WzEwXSA9IGNvcztcbiAgICByZXN1bHRbMTFdID0gMDtcbiAgICByZXN1bHRbMTJdID0gMDtcbiAgICByZXN1bHRbMTNdID0gMDtcbiAgICByZXN1bHRbMTRdID0gMDtcbiAgICByZXN1bHRbMTVdID0gMTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeS1heGlzLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25ZID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMl0gPSBzaW47XG4gICAgcm90YXRpb25fbWF0cml4WzVdID0gMTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOF0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxMF0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgeS1heGlzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucm90YXRpb25ZTEcgPSBmdW5jdGlvbih0aGV0YSwgcmVzdWx0KXtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcmVzdWx0WzBdID0gY29zO1xuICAgIHJlc3VsdFsxXSA9IDA7XG4gICAgcmVzdWx0WzJdID0gc2luO1xuICAgIHJlc3VsdFszXSA9IDA7XG4gICAgcmVzdWx0WzRdID0gMDtcbiAgICByZXN1bHRbNV0gPSAxO1xuICAgIHJlc3VsdFs2XSA9IDA7XG4gICAgcmVzdWx0WzddID0gMDtcbiAgICByZXN1bHRbOF0gPSAtc2luO1xuICAgIHJlc3VsdFs5XSA9IDA7XG4gICAgcmVzdWx0WzEwXSA9IGNvcztcbiAgICByZXN1bHRbMTFdID0gMDtcbiAgICByZXN1bHRbMTJdID0gMDtcbiAgICByZXN1bHRbMTNdID0gMDtcbiAgICByZXN1bHRbMTRdID0gMDtcbiAgICByZXN1bHRbMTVdID0gMTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgei1heGlzLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgucm90YXRpb25aID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciByb3RhdGlvbl9tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFswXSA9IGNvcztcbiAgICByb3RhdGlvbl9tYXRyaXhbMV0gPSAtc2luO1xuICAgIHJvdGF0aW9uX21hdHJpeFs0XSA9IHNpbjtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3M7XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IDE7XG4gICAgcm90YXRpb25fbWF0cml4WzE1XSA9IDE7XG4gICAgcmV0dXJuIHJvdGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgei1heGlzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucm90YXRpb25aTEcgPSBmdW5jdGlvbih0aGV0YSwgcmVzdWx0KXtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgcmVzdWx0WzBdID0gY29zO1xuICAgIHJlc3VsdFsxXSA9IC1zaW47XG4gICAgcmVzdWx0WzJdID0gMDtcbiAgICByZXN1bHRbM10gPSAwO1xuICAgIHJlc3VsdFs0XSA9IHNpbjtcbiAgICByZXN1bHRbNV0gPSBjb3M7XG4gICAgcmVzdWx0WzZdID0gMDtcbiAgICByZXN1bHRbN10gPSAwO1xuICAgIHJlc3VsdFs4XSA9IDA7XG4gICAgcmVzdWx0WzldID0gMDtcbiAgICByZXN1bHRbMTBdID0gMTtcbiAgICByZXN1bHRbMTFdID0gMDtcbiAgICByZXN1bHRbMTJdID0gMDtcbiAgICByZXN1bHRbMTNdID0gMDtcbiAgICByZXN1bHRbMTRdID0gMDtcbiAgICByZXN1bHRbMTVdID0gMTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSByb3RhdGlvbiBtYXRyaXgsIHJvdGF0aW5nIGJ5IHRoZXRhIGFyb3VuZCB0aGUgYXhpcy4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5yb3RhdGlvbkF4aXMgPSBmdW5jdGlvbihheGlzLCB0aGV0YSl7XG4gICAgdmFyIHJvdGF0aW9uX21hdHJpeCA9IG5ldyBNYXRyaXgoKTtcbiAgICB2YXIgdSA9IGF4aXMubm9ybWFsaXplKCk7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBjb3MxID0gMS1jb3M7XG4gICAgdmFyIHV4ID0gdS54O1xuICAgIHZhciB1eSA9IHUueTtcbiAgICB2YXIgdXogPSB1Lno7XG4gICAgdmFyIHh5ID0gdXggKiB1eTtcbiAgICB2YXIgeHogPSB1eCAqIHV6O1xuICAgIHZhciB5eiA9IHV5ICogdXo7XG4gICAgcm90YXRpb25fbWF0cml4WzBdID0gY29zICsgKCh1eCp1eCkqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzFdID0gKHh5KmNvczEpIC0gKHV6KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzJdID0gKHh6KmNvczEpKyh1eSpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs0XSA9ICh4eSpjb3MxKSsodXoqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbNV0gPSBjb3MrKCh1eSp1eSkqY29zMSk7XG4gICAgcm90YXRpb25fbWF0cml4WzZdID0gKHl6KmNvczEpLSh1eCpzaW4pO1xuICAgIHJvdGF0aW9uX21hdHJpeFs4XSA9ICh4eipjb3MxKS0odXkqc2luKTtcbiAgICByb3RhdGlvbl9tYXRyaXhbOV0gPSAoeXoqY29zMSkrKHV4KnNpbik7XG4gICAgcm90YXRpb25fbWF0cml4WzEwXSA9IGNvcyArICgodXoqdXopKmNvczEpO1xuICAgIHJvdGF0aW9uX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiByb3RhdGlvbl9tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4LCByb3RhdGluZyBieSB0aGV0YSBhcm91bmQgdGhlIGF4aXMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucm90YXRpb25BeGlzTEcgPSBmdW5jdGlvbihheGlzLCB0aGV0YSwgcmVzdWx0KXtcbiAgICBheGlzLm5vcm1hbGl6ZUxHKHRlbXBfdmVjdG9yKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIGNvczEgPSAxLWNvcztcbiAgICB2YXIgdXggPSB0ZW1wX3ZlY3Rvci54O1xuICAgIHZhciB1eSA9IHRlbXBfdmVjdG9yLnk7XG4gICAgdmFyIHV6ID0gdGVtcF92ZWN0b3IuejtcbiAgICB2YXIgeHkgPSB1eCAqIHV5O1xuICAgIHZhciB4eiA9IHV4ICogdXo7XG4gICAgdmFyIHl6ID0gdXkgKiB1ejtcbiAgICByZXN1bHRbMF0gPSBjb3MgKyAoKHV4KnV4KSpjb3MxKTtcbiAgICByZXN1bHRbMV0gPSAoeHkqY29zMSkgLSAodXoqc2luKTtcbiAgICByZXN1bHRbMl0gPSAoeHoqY29zMSkrKHV5KnNpbik7XG4gICAgcmVzdWx0WzNdID0gMDtcbiAgICByZXN1bHRbNF0gPSAoeHkqY29zMSkrKHV6KnNpbik7XG4gICAgcmVzdWx0WzVdID0gY29zKygodXkqdXkpKmNvczEpO1xuICAgIHJlc3VsdFs2XSA9ICh5eipjb3MxKS0odXgqc2luKTtcbiAgICByZXN1bHRbN10gPSAwO1xuICAgIHJlc3VsdFs4XSA9ICh4eipjb3MxKS0odXkqc2luKTtcbiAgICByZXN1bHRbOV0gPSAoeXoqY29zMSkrKHV4KnNpbik7XG4gICAgcmVzdWx0WzEwXSA9IGNvcyArICgodXoqdXopKmNvczEpO1xuICAgIHJlc3VsdFsxMV0gPSAwO1xuICAgIHJlc3VsdFsxMl0gPSAwO1xuICAgIHJlc3VsdFsxM10gPSAwO1xuICAgIHJlc3VsdFsxNF0gPSAwO1xuICAgIHJlc3VsdFsxNV0gPSAxO1xufTtcbi8qKlxuICogQ29uc3RydWN0cyBhIHJvdGF0aW9uIG1hdHJpeCBmcm9tIHBpdGNoLCB5YXcsIGFuZCByb2xsLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSBwaXRjaFxuICogQHBhcmFtIHtudW1iZXJ9IHlhd1xuICogQHBhcmFtIHtudW1iZXJ9IHJvbGxcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnJvdGF0aW9uID0gZnVuY3Rpb24ocGl0Y2gsIHlhdywgcm9sbCl7XG4gICAgcmV0dXJuIE1hdHJpeC5yb3RhdGlvblgocm9sbCkubXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWih5YXcpKS5tdWx0aXBseShNYXRyaXgucm90YXRpb25ZKHBpdGNoKSk7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcm90YXRpb24gbWF0cml4IGZyb20gcGl0Y2gsIHlhdywgYW5kIHJvbGwuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHBpdGNoXG4gKiBAcGFyYW0ge251bWJlcn0geWF3XG4gKiBAcGFyYW0ge251bWJlcn0gcm9sbFxuICogQHBhcmFtIHtNYXRyaXh9IHJlc3VsdFxuICovXG5NYXRyaXgucm90YXRpb25MRyA9IGZ1bmN0aW9uKHBpdGNoLCB5YXcsIHJvbGwsIHJlc3VsdCl7XG4gICAgLy8gVE9ETzogQ2FuIEkgZ2V0IGF3YXkgd2l0aCB1c2luZyBmZXdlciB0ZW1wb3JhcnkgbWF0cmljZXM/XG4gICAgTWF0cml4LnJvdGF0aW9uWExHKHJvbGwsIHRlbXBfbWF0cml4MSk7XG4gICAgTWF0cml4LnJvdGF0aW9uWkxHKHlhdywgdGVtcF9tYXRyaXgyKTtcbiAgICBNYXRyaXgucm90YXRpb25ZTEcocGl0Y2gsIHRlbXBfbWF0cml4Myk7XG4gICAgdGVtcF9tYXRyaXgxLm11bHRpcGx5TEcodGVtcF9tYXRyaXgyLCB0ZW1wX21hdHJpeDQpO1xuICAgIHRlbXBfbWF0cml4NC5tdWx0aXBseUxHKHRlbXBfbWF0cml4MywgcmVzdWx0KTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB0cmFuc2xhdGlvbiBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBkaXN0YW5jZXMuIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHh0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHl0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHp0cmFuc1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgudHJhbnNsYXRpb24gPSBmdW5jdGlvbih4dHJhbnMsIHl0cmFucywgenRyYW5zKXtcbiAgICB2YXIgdHJhbnNsYXRpb25fbWF0cml4ID0gTWF0cml4LmlkZW50aXR5KCk7XG4gICAgdHJhbnNsYXRpb25fbWF0cml4WzEyXSA9IHh0cmFucztcbiAgICB0cmFuc2xhdGlvbl9tYXRyaXhbMTNdID0geXRyYW5zO1xuICAgIHRyYW5zbGF0aW9uX21hdHJpeFsxNF0gPSB6dHJhbnM7XG4gICAgcmV0dXJuIHRyYW5zbGF0aW9uX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB0cmFuc2xhdGlvbiBtYXRyaXggZnJvbSB4LCB5LCBhbmQgeiBkaXN0YW5jZXMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHBhcmFtIHtudW1iZXJ9IHh0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHl0cmFuc1xuICogQHBhcmFtIHtudW1iZXJ9IHp0cmFuc1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXgudHJhbnNsYXRpb25MRyA9IGZ1bmN0aW9uKHh0cmFucywgeXRyYW5zLCB6dHJhbnMsIHJlc3VsdCl7XG4gICAgcmVzdWx0WzBdID0gMTtcbiAgICByZXN1bHRbMV0gPSAwO1xuICAgIHJlc3VsdFsyXSA9IDA7XG4gICAgcmVzdWx0WzNdID0gMDtcbiAgICByZXN1bHRbNF0gPSAwO1xuICAgIHJlc3VsdFs1XSA9IDE7XG4gICAgcmVzdWx0WzZdID0gMDtcbiAgICByZXN1bHRbN10gPSAwO1xuICAgIHJlc3VsdFs4XSA9IDA7XG4gICAgcmVzdWx0WzldID0gMDtcbiAgICByZXN1bHRbMTBdID0gMTtcbiAgICByZXN1bHRbMTJdID0geHRyYW5zO1xuICAgIHJlc3VsdFsxM10gPSB5dHJhbnM7XG4gICAgcmVzdWx0WzE0XSA9IHp0cmFucztcbiAgICByZXN1bHRbMTVdID0gMTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSBzY2FsaW5nIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IHNjYWxlLiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LnNjYWxlID0gZnVuY3Rpb24oeHNjYWxlLCB5c2NhbGUsIHpzY2FsZSl7XG4gICAgdmFyIHNjYWxpbmdfbWF0cml4ID0gbmV3IE1hdHJpeCgpO1xuICAgIHNjYWxpbmdfbWF0cml4WzBdID0geHNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzVdID0geXNjYWxlO1xuICAgIHNjYWxpbmdfbWF0cml4WzEwXSA9IHpzY2FsZTtcbiAgICBzY2FsaW5nX21hdHJpeFsxNV0gPSAxO1xuICAgIHJldHVybiBzY2FsaW5nX21hdHJpeDtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSBzY2FsaW5nIG1hdHJpeCBmcm9tIHgsIHksIGFuZCB6IHNjYWxlLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB5dHJhbnNcbiAqIEBwYXJhbSB7bnVtYmVyfSB6dHJhbnNcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LnNjYWxlTEcgPSBmdW5jdGlvbih4c2NhbGUsIHlzY2FsZSwgenNjYWxlLCByZXN1bHQpe1xuICAgIHJlc3VsdFswXSA9IHhzY2FsZTtcbiAgICByZXN1bHRbMV0gPSAwO1xuICAgIHJlc3VsdFsyXSA9IDA7XG4gICAgcmVzdWx0WzNdID0gMDtcbiAgICByZXN1bHRbNF0gPSAwO1xuICAgIHJlc3VsdFs1XSA9IHlzY2FsZTtcbiAgICByZXN1bHRbNl0gPSAwO1xuICAgIHJlc3VsdFs3XSA9IDA7XG4gICAgcmVzdWx0WzhdID0gMDtcbiAgICByZXN1bHRbOV0gPSAwO1xuICAgIHJlc3VsdFsxMF0gPSB6c2NhbGU7XG4gICAgcmVzdWx0WzExXSA9IDA7XG4gICAgcmVzdWx0WzEyXSA9IDA7XG4gICAgcmVzdWx0WzEzXSA9IDA7XG4gICAgcmVzdWx0WzE0XSA9IDA7XG4gICAgcmVzdWx0WzE1XSA9IDE7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGFuIGlkZW50aXR5IG1hdHJpeC4gUmV0dXJucyBhIG5ldyBNYXRyaXguXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC5pZGVudGl0eSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGlkZW50aXR5ID0gbmV3IE1hdHJpeCgpO1xuICAgIGlkZW50aXR5WzBdID0gMTtcbiAgICBpZGVudGl0eVs1XSA9IDE7XG4gICAgaWRlbnRpdHlbMTBdID0gMTtcbiAgICBpZGVudGl0eVsxNV0gPSAxO1xuICAgIHJldHVybiBpZGVudGl0eTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYW4gaWRlbnRpdHkgbWF0cml4LiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LmlkZW50aXR5TEcgPSBmdW5jdGlvbihyZXN1bHQpe1xuICAgIHJlc3VsdFswXSA9IDE7XG4gICAgcmVzdWx0WzFdID0gMDtcbiAgICByZXN1bHRbMl0gPSAwO1xuICAgIHJlc3VsdFszXSA9IDA7XG4gICAgcmVzdWx0WzRdID0gMDtcbiAgICByZXN1bHRbNV0gPSAxO1xuICAgIHJlc3VsdFs2XSA9IDA7XG4gICAgcmVzdWx0WzddID0gMDtcbiAgICByZXN1bHRbOF0gPSAwO1xuICAgIHJlc3VsdFs5XSA9IDA7XG4gICAgcmVzdWx0WzEwXSA9IDE7XG4gICAgcmVzdWx0WzExXSA9IDA7XG4gICAgcmVzdWx0WzEyXSA9IDA7XG4gICAgcmVzdWx0WzEzXSA9IDA7XG4gICAgcmVzdWx0WzE0XSA9IDA7XG4gICAgcmVzdWx0WzE1XSA9IDE7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgemVybyBtYXRyaXguIFJldHVybnMgYSBuZXcgTWF0cml4LlxuICogQG1ldGhvZFxuICogQHN0YXRpY1xuICogQHJldHVybiB7TWF0cml4fVxuICovXG5NYXRyaXguemVybyA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIG5ldyBNYXRyaXgoKTtcbn07XG4vKipcbiAqIENvbnN0cnVjdHMgYSB6ZXJvIG1hdHJpeC4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAc3RhdGljXG4gKiBAcmV0dXJuIHtNYXRyaXh9XG4gKi9cbk1hdHJpeC56ZXJvTEcgPSBmdW5jdGlvbihyZXN1bHQpe1xuICAgIHJlc3VsdFswXSA9IDA7XG4gICAgcmVzdWx0WzFdID0gMDtcbiAgICByZXN1bHRbMl0gPSAwO1xuICAgIHJlc3VsdFszXSA9IDA7XG4gICAgcmVzdWx0WzRdID0gMDtcbiAgICByZXN1bHRbNV0gPSAwO1xuICAgIHJlc3VsdFs2XSA9IDA7XG4gICAgcmVzdWx0WzddID0gMDtcbiAgICByZXN1bHRbOF0gPSAwO1xuICAgIHJlc3VsdFs5XSA9IDA7XG4gICAgcmVzdWx0WzEwXSA9IDA7XG4gICAgcmVzdWx0WzExXSA9IDA7XG4gICAgcmVzdWx0WzEyXSA9IDA7XG4gICAgcmVzdWx0WzEzXSA9IDA7XG4gICAgcmVzdWx0WzE0XSA9IDA7XG4gICAgcmVzdWx0WzE1XSA9IDA7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IG1hdHJpeCBmcm9tIGFuIGFycmF5LiBSZXR1cm5zIGEgbmV3IE1hdHJpeC5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEByZXR1cm4ge01hdHJpeH1cbiAqL1xuTWF0cml4LmZyb21BcnJheSA9IGZ1bmN0aW9uKGFycil7XG4gICAgdmFyIG5ld19tYXRyaXggPSBuZXcgTWF0cml4KCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgbmV3X21hdHJpeFtpXSA9IGFycltpXTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld19tYXRyaXg7XG59O1xuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgbmV3IG1hdHJpeCBmcm9tIGFuIGFycmF5LiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7TWF0cml4fSByZXN1bHRcbiAqL1xuTWF0cml4LmZyb21BcnJheUxHID0gZnVuY3Rpb24oYXJyLCByZXN1bHQpe1xuICAgIHJlc3VsdFswXSA9IGFyclswXTtcbiAgICByZXN1bHRbMV0gPSBhcnJbMV07XG4gICAgcmVzdWx0WzJdID0gYXJyWzJdO1xuICAgIHJlc3VsdFszXSA9IGFyclszXTtcbiAgICByZXN1bHRbNF0gPSBhcnJbNF07XG4gICAgcmVzdWx0WzVdID0gYXJyWzVdO1xuICAgIHJlc3VsdFs2XSA9IGFycls2XTtcbiAgICByZXN1bHRbN10gPSBhcnJbN107XG4gICAgcmVzdWx0WzhdID0gYXJyWzhdO1xuICAgIHJlc3VsdFs5XSA9IGFycls5XTtcbiAgICByZXN1bHRbMTBdID0gYXJyWzEwXTtcbiAgICByZXN1bHRbMTFdID0gYXJyWzExXTtcbiAgICByZXN1bHRbMTJdID0gYXJyWzEyXTtcbiAgICByZXN1bHRbMTNdID0gYXJyWzEzXTtcbiAgICByZXN1bHRbMTRdID0gYXJyWzE0XTtcbiAgICByZXN1bHRbMTVdID0gYXJyWzE1XTtcbn07XG4vKipcbiAqIENvcHkgdmFsdWVzIGZyb20gb25lIG1hdHJpeCB0byBhbm90aGVyLlxuICogQHBhcmFtIG1hdHJpeDFcbiAqIEBwYXJhbSBtYXRyaXgyXG4gKi9cbk1hdHJpeC5jb3B5ID0gZnVuY3Rpb24obWF0cml4MSwgbWF0cml4Mil7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgIG1hdHJpeDJbaV0gPSBtYXRyaXgxW2ldO1xuICAgIH1cbn07XG5cbnZhciB0ZW1wX21hdHJpeDEgPSBuZXcgTWF0cml4KCk7XG52YXIgdGVtcF9tYXRyaXgyID0gbmV3IE1hdHJpeCgpO1xudmFyIHRlbXBfbWF0cml4MyA9IG5ldyBNYXRyaXgoKTtcbnZhciB0ZW1wX21hdHJpeDQgPSBuZXcgTWF0cml4KCk7XG52YXIgdGVtcF92ZWN0b3IgPSBuZXcgVmVjdG9yKDAsMCwwKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRyaXg7XG4iLCIvKipcbiAqIDNEIHZlY3Rvci5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtudW1iZXJ9IHggeCBjb29yZGluYXRlXG4gKiBAcGFyYW0ge251bWJlcn0geSB5IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7bnVtYmVyfSB6IHogY29vcmRpbmF0ZVxuICovXG5mdW5jdGlvbiBWZWN0b3IoeCwgeSwgeil7XG4gICAgaWYgKHR5cGVvZiB4ID09PSAndW5kZWZpbmVkJyB8fFxuICAgICAgICB0eXBlb2YgeSA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdHlwZW9mIHogPT09ICd1bmRlZmluZWQnKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnN1ZmZpY2llbnQgYXJndW1lbnRzLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMueiA9IHo7XG4gICAgfVxufVxuLyoqXG4gKiBBZGQgdmVjdG9ycy4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKyB2ZWN0b3IueCwgdGhpcy55ICsgdmVjdG9yLnksIHRoaXMueiArIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIEFkZCB2ZWN0b3JzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hZGRMRyA9IGZ1bmN0aW9uKHZlY3RvciwgcmVzdWx0KXtcbiAgICByZXN1bHQueCA9IHRoaXMueCArIHZlY3Rvci54O1xuICAgIHJlc3VsdC55ID0gdGhpcy55ICsgdmVjdG9yLnk7XG4gICAgcmVzdWx0LnogPSB0aGlzLnogKyB2ZWN0b3Iuejtcbn07XG4vKipcbiAqIFN1YnRyYWN0IHZlY3RvcnMuIFJldHVybnMgYSBuZXcgVmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggLSB2ZWN0b3IueCwgdGhpcy55IC0gdmVjdG9yLnksIHRoaXMueiAtIHZlY3Rvci56KTtcbn07XG4vKipcbiAqIFN1YnRyYWN0IHZlY3RvcnMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLnN1YnRyYWN0TEcgPSBmdW5jdGlvbih2ZWN0b3IsIHJlc3VsdCl7XG4gICAgcmVzdWx0LnggPSB0aGlzLnggLSB2ZWN0b3IueDtcbiAgICByZXN1bHQueSA9IHRoaXMueSAtIHZlY3Rvci55O1xuICAgIHJlc3VsdC56ID0gdGhpcy56IC0gdmVjdG9yLno7XG59O1xuLyoqXG4gKiBDb21wYXJlIHZlY3RvcnMgZm9yIGVxdWFsaXR5XG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5WZWN0b3IucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gdGhpcy54ID09PSB2ZWN0b3IueCAmJiB0aGlzLnkgPT09IHZlY3Rvci55ICYmIHRoaXMueiA9PT0gdmVjdG9yLno7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycy5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5hbmdsZSA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdmFyIGEgPSB0aGlzLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBiID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xuICAgIHZhciBhbWFnID0gYS5tYWduaXR1ZGUoKTtcbiAgICB2YXIgYm1hZyA9IGIubWFnbml0dWRlKCk7XG4gICAgaWYgKGFtYWcgPT09IDAgfHwgYm1hZyA9PT0gMCl7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgdGhldGEgPSBhLmRvdChiKSAvIChhbWFnICogYm1hZyApO1xuICAgIGlmICh0aGV0YSA8IC0xKSB7dGhldGEgPSAtMTt9XG4gICAgaWYgKHRoZXRhID4gMSkge3RoZXRhID0gMTt9XG4gICAgcmV0dXJuIE1hdGguYWNvcyh0aGV0YSk7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycy4gTG93IGdhcmJhZ2UgKGRvZXNuJ3QgY3JlYXRlIGFueSBpbnRlcm1lZGlhdGUgVmVjdG9ycykuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuYW5nbGVMRyA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdGhpcy5ub3JtYWxpemVMRyh0ZW1wX3ZlY3RvcjEpO1xuICAgIHZlY3Rvci5ub3JtYWxpemVMRyh0ZW1wX3ZlY3RvcjIpO1xuICAgIHZhciBhbWFnID0gdGVtcF92ZWN0b3IxLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gdGVtcF92ZWN0b3IyLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gdGVtcF92ZWN0b3IxLmRvdCh0ZW1wX3ZlY3RvcjIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gTWF0aC5hY29zKHRoZXRhKTtcbn07XG4vKipcbiAqIENhbGN1bGF0ZSB0aGUgY29zaW5lIG9mIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNvc0FuZ2xlID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICB2YXIgYSA9IHRoaXMubm9ybWFsaXplKCk7XG4gICAgdmFyIGIgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XG4gICAgdmFyIGFtYWcgPSBhLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gYi5tYWduaXR1ZGUoKTtcbiAgICBpZiAoYW1hZyA9PT0gMCB8fCBibWFnID09PSAwKXtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciB0aGV0YSA9IGEuZG90KGIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gdGhldGE7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgdGhlIGNvc2luZSBvZiB0aGUgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycy4gTG93IGdhcmJhZ2UgKGRvZXNuJ3QgY3JlYXRlIGFueSBpbnRlcm1lZGlhdGUgVmVjdG9ycykuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY29zQW5nbGVMRyA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgdGhpcy5ub3JtYWxpemVMRyh0ZW1wX3ZlY3RvcjEpO1xuICAgIHZlY3Rvci5ub3JtYWxpemVMRyh0ZW1wX3ZlY3RvcjIpO1xuICAgIHZhciBhbWFnID0gdGVtcF92ZWN0b3IxLm1hZ25pdHVkZSgpO1xuICAgIHZhciBibWFnID0gdGVtcF92ZWN0b3IyLm1hZ25pdHVkZSgpO1xuICAgIGlmIChhbWFnID09PSAwIHx8IGJtYWcgPT09IDApe1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIHRoZXRhID0gdGVtcF92ZWN0b3IxLmRvdCh0ZW1wX3ZlY3RvcjIpIC8gKGFtYWcgKiBibWFnICk7XG4gICAgaWYgKHRoZXRhIDwgLTEpIHt0aGV0YSA9IC0xO31cbiAgICBpZiAodGhldGEgPiAxKSB7dGhldGEgPSAxO31cbiAgICByZXR1cm4gdGhldGE7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgbWFnbml0dWRlIG9mIGEgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm1hZ25pdHVkZSA9IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIE1hdGguc3FydCgodGhpcy54ICogdGhpcy54KSArICh0aGlzLnkgKiB0aGlzLnkpICsgKHRoaXMueiAqIHRoaXMueikpO1xufTtcbi8qKlxuICogQ2FsY3VsYXRlIG1hZ25pdHVkZSBzcXVhcmVkIG9mIGEgdmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm1hZ25pdHVkZVNxdWFyZWQgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiAodGhpcy54ICogdGhpcy54KSArICh0aGlzLnkgKiB0aGlzLnkpICsgKHRoaXMueiAqIHRoaXMueik7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuZG90ID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gKHRoaXMueCAqIHZlY3Rvci54KSArICh0aGlzLnkgKiB2ZWN0b3IueSkgKyAodGhpcy56ICogdmVjdG9yLnopO1xufTtcbi8qKlxuICogQ2FsY3VsYXRlIGNyb3NzIHByb2R1Y3Qgb2YgdHdvIHZlY3RvcnMuIFJldHVybnMgYSBuZXcgVmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24odmVjdG9yKXtcbiAgICByZXR1cm4gbmV3IFZlY3RvcihcbiAgICAgICAgKHRoaXMueSAqIHZlY3Rvci56KSAtICh0aGlzLnogKiB2ZWN0b3IueSksXG4gICAgICAgICh0aGlzLnogKiB2ZWN0b3IueCkgLSAodGhpcy54ICogdmVjdG9yLnopLFxuICAgICAgICAodGhpcy54ICogdmVjdG9yLnkpIC0gKHRoaXMueSAqIHZlY3Rvci54KVxuICAgICk7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjdG9ycy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuY3Jvc3NMRyA9IGZ1bmN0aW9uKHZlY3RvciwgcmVzdWx0KXtcbiAgICByZXN1bHQueCA9ICh0aGlzLnkgKiB2ZWN0b3IueikgLSAodGhpcy56ICogdmVjdG9yLnkpO1xuICAgIHJlc3VsdC55ID0gKHRoaXMueiAqIHZlY3Rvci54KSAtICh0aGlzLnggKiB2ZWN0b3Iueik7XG4gICAgcmVzdWx0LnogPSAodGhpcy54ICogdmVjdG9yLnkpIC0gKHRoaXMueSAqIHZlY3Rvci54KTtcbn07XG4vKipcbiAqIE5vcm1hbGl6ZSB2ZWN0b3IuIFJldHVybnMgYSBuZXcgVmVjdG9yLlxuICogQG1ldGhvZFxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlKCk7XG4gICAgaWYgKG1hZ25pdHVkZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLngsIHRoaXMueSwgdGhpcy56KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54IC8gbWFnbml0dWRlLCB0aGlzLnkgLyBtYWduaXR1ZGUsIHRoaXMueiAvIG1hZ25pdHVkZSk7XG59O1xuLyoqXG4gKiBOb3JtYWxpemUgdmVjdG9yLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5ub3JtYWxpemVMRyA9IGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgdmFyIG1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlKCk7XG4gICAgaWYgKG1hZ25pdHVkZSA9PT0gMCkge1xuICAgICAgICByZXN1bHQueCA9IHRoaXMueDtcbiAgICAgICAgcmVzdWx0LnkgPSB0aGlzLnk7XG4gICAgICAgIHJlc3VsdC56ID0gdGhpcy56O1xuICAgIH1cbiAgICByZXN1bHQueCA9IHRoaXMueCAvIG1hZ25pdHVkZTtcbiAgICByZXN1bHQueSA9IHRoaXMueSAvIG1hZ25pdHVkZTtcbiAgICByZXN1bHQueiA9IHRoaXMueiAvIG1hZ25pdHVkZTtcbn07XG4vKipcbiAqIFNjYWxlIHZlY3RvciBieSBzY2FsaW5nIGZhY3Rvci4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGVcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih0aGlzLnggKiBzY2FsZSwgdGhpcy55ICogc2NhbGUsIHRoaXMueiAqIHNjYWxlKTtcbn07XG4vKipcbiAqIFNjYWxlIHZlY3RvciBieSBzY2FsaW5nIGZhY3Rvci4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gc2NhbGVcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5zY2FsZUxHID0gZnVuY3Rpb24oc2NhbGUsIHJlc3VsdCl7XG4gICAgcmVzdWx0LnggPSB0aGlzLnggKiBzY2FsZTtcbiAgICByZXN1bHQueSA9IHRoaXMueSAqIHNjYWxlO1xuICAgIHJlc3VsdC56ID0gdGhpcy56ICogc2NhbGU7XG59O1xuLyoqXG4gKiBOZWdhdGUgdmVjdG9yLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5uZWdhdGUgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKC10aGlzLngsIC10aGlzLnksIC10aGlzLnopO1xufTtcbi8qKlxuICogTmVnYXRlIHZlY3Rvci4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUubmVnYXRlTEcgPSBmdW5jdGlvbihyZXN1bHQpe1xuICAgIHJlc3VsdC54ID0gLXRoaXMueDtcbiAgICByZXN1bHQueSA9IC10aGlzLnk7XG4gICAgcmVzdWx0LnogPSAtdGhpcy56O1xufTtcbi8qKlxuICogQ2FsY3VsYXRlIHZlY3RvciBwcm9qZWN0aW9uIG9mIHR3byB2ZWN0b3JzLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IHZlY3RvclxuICogQHJldHVybiB7bnVtYmVyfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnZlY3RvclByb2plY3Rpb24gPSBmdW5jdGlvbih2ZWN0b3Ipe1xuICAgIHZhciBtYWcgPSB2ZWN0b3IubWFnbml0dWRlKCk7XG4gICAgcmV0dXJuIHZlY3Rvci5zY2FsZSh0aGlzLmRvdCh2ZWN0b3IpIC8gKG1hZyAqIG1hZykpO1xufTtcbi8qKlxuICogQ2FsY3VsYXRlIHZlY3RvciBwcm9qZWN0aW9uIG9mIHR3byB2ZWN0b3JzLiBEb2VzIG5vdCBjb25zdHJ1Y3QgYW55IG5ldyBWZWN0b3JzIGluIHRoZSBjb3Vyc2Ugb2YgaXRzIG9wZXJhdGlvbi5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7VmVjdG9yfSB2ZWN0b3JcbiAqIEBwYXJhbSB7VmVjdG9yfSB0ZW1wIEEgdGVtcG9yYXJ5IHZlY3RvciB1c2VkIGluIG9uZSBvZiB0aGUgaW50ZXJtZWRpYXJ5IHN0ZXBzIG9mIHRoZSBjYWxjdWxhdGlvbi5cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS52ZWN0b3JQcm9qZWN0aW9uTEcgPSBmdW5jdGlvbih2ZWN0b3IsIHJlc3VsdCl7XG4gICAgdmFyIG1hZyA9IHZlY3Rvci5tYWduaXR1ZGUoKTtcbiAgICB2ZWN0b3Iuc2NhbGVMRyh0aGlzLmRvdCh2ZWN0b3IpIC8gKG1hZyAqIG1hZyksIHJlc3VsdCk7XG59O1xuLyoqXG4gKiBDYWxjdWxhdGUgc2NhbGFyIHByb2plY3Rpb24gb2YgdHdvIHZlY3RvcnMuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gdmVjdG9yXG4gKiBAcmV0dXJuIHtudW1iZXJ9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUuc2NhbGFyUHJvamVjdGlvbiA9IGZ1bmN0aW9uKHZlY3Rvcil7XG4gICAgcmV0dXJuIHRoaXMuZG90KHZlY3RvcikgLyB2ZWN0b3IubWFnbml0dWRlKCk7XG59O1xuLyoqXG4gKiBQZXJmb3JtIGxpbmVhciB0cmFuZm9ybWF0aW9uIG9uIGEgdmVjdG9yLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7TWF0cml4fSB0cmFuc2Zvcm1fbWF0cml4XG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUudHJhbnNmb3JtID0gZnVuY3Rpb24odHJhbnNmb3JtX21hdHJpeCl7XG4gICAgdmFyIHggPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFswXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs0XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFs4XSkgKyB0cmFuc2Zvcm1fbWF0cml4WzEyXTtcbiAgICB2YXIgeSA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzFdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzVdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzldKSArIHRyYW5zZm9ybV9tYXRyaXhbMTNdO1xuICAgIHZhciB6ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMl0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNl0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbMTBdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTRdO1xuICAgIHZhciB3ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbM10pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbN10pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbMTFdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTVdO1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHggLyB3LCB5IC8gdywgeiAvIHcpO1xufTtcbi8qKlxuICogUGVyZm9ybSBsaW5lYXIgdHJhbmZvcm1hdGlvbiBvbiBhIHZlY3Rvci4gIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtNYXRyaXh9IHRyYW5zZm9ybV9tYXRyaXhcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS50cmFuc2Zvcm1MRyA9IGZ1bmN0aW9uKHRyYW5zZm9ybV9tYXRyaXgsIHJlc3VsdCl7XG4gICAgdmFyIHggPSAodGhpcy54ICogdHJhbnNmb3JtX21hdHJpeFswXSkgKyAodGhpcy55ICogdHJhbnNmb3JtX21hdHJpeFs0XSkgKyAodGhpcy56ICogdHJhbnNmb3JtX21hdHJpeFs4XSkgKyB0cmFuc2Zvcm1fbWF0cml4WzEyXTtcbiAgICB2YXIgeSA9ICh0aGlzLnggKiB0cmFuc2Zvcm1fbWF0cml4WzFdKSArICh0aGlzLnkgKiB0cmFuc2Zvcm1fbWF0cml4WzVdKSArICh0aGlzLnogKiB0cmFuc2Zvcm1fbWF0cml4WzldKSArIHRyYW5zZm9ybV9tYXRyaXhbMTNdO1xuICAgIHZhciB6ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbMl0pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbNl0pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbMTBdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTRdO1xuICAgIHZhciB3ID0gKHRoaXMueCAqIHRyYW5zZm9ybV9tYXRyaXhbM10pICsgKHRoaXMueSAqIHRyYW5zZm9ybV9tYXRyaXhbN10pICsgKHRoaXMueiAqIHRyYW5zZm9ybV9tYXRyaXhbMTFdKSArIHRyYW5zZm9ybV9tYXRyaXhbMTVdO1xuICAgIHJlc3VsdC54ID0geCAvIHc7XG4gICAgcmVzdWx0LnkgPSB5IC8gdztcbiAgICByZXN1bHQueiA9IHogLyB3O1xufTtcbi8qKlxuICogUm90YXRlIHZlY3RvciBieSB0aGV0YSBhcm91bmQgYXhpcy4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gYXhpc1xuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlID0gZnVuY3Rpb24oYXhpcywgdGhldGEpe1xuICAgIHZhciB1ID0gYXhpcy5ub3JtYWxpemUoKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIGNvczEgPSAxLWNvcztcbiAgICB2YXIgdXggPSB1Lng7XG4gICAgdmFyIHV5ID0gdS55O1xuICAgIHZhciB1eiA9IHUuejtcbiAgICB2YXIgeHkgPSB1LnggKiB1Lnk7XG4gICAgdmFyIHh6ID0gdS54ICogdS56O1xuICAgIHZhciB5eiA9IHUueSAqIHUuejtcbiAgICB2YXIgeCA9ICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy54KSArICgoKHh5KmNvczEpIC0gKHV6KnNpbikpICogdGhpcy55KSArICgoKHh6KmNvczEpKyh1eSpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHkgPSAoKCh4eSpjb3MxKSsodXoqc2luKSkgKiB0aGlzLngpICsgKChjb3MrKCh1eSp1eSkqY29zMSkpICogdGhpcy55KSArICgoKHl6KmNvczEpLSh1eCpzaW4pKSAqIHRoaXMueik7XG4gICAgdmFyIHogPSAoKCh4eipjb3MxKS0odXkqc2luKSkgKiB0aGlzLngpICsgKCgoeXoqY29zMSkrKHV4KnNpbikpICogdGhpcy55KSArICgoY29zICsgKCh1eCp1eCkqY29zMSkpICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSB2ZWN0b3IgYnkgdGhldGEgYXJvdW5kIGF4aXMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtWZWN0b3J9IGF4aXNcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZUxHID0gZnVuY3Rpb24oYXhpcywgdGhldGEsIHJlc3VsdCl7XG4gICAgYXhpcy5ub3JtYWxpemVMRyhyZXN1bHQpO1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgY29zMSA9IDEtY29zO1xuICAgIHZhciB1eCA9IHJlc3VsdC54O1xuICAgIHZhciB1eSA9IHJlc3VsdC55O1xuICAgIHZhciB1eiA9IHJlc3VsdC56O1xuICAgIHZhciB4eSA9IHJlc3VsdC54ICogcmVzdWx0Lnk7XG4gICAgdmFyIHh6ID0gcmVzdWx0LnggKiByZXN1bHQuejtcbiAgICB2YXIgeXogPSByZXN1bHQueSAqIHJlc3VsdC56O1xuICAgIHZhciB4ID0gKChjb3MgKyAoKHV4KnV4KSpjb3MxKSkgKiB0aGlzLngpICsgKCgoeHkqY29zMSkgLSAodXoqc2luKSkgKiB0aGlzLnkpICsgKCgoeHoqY29zMSkrKHV5KnNpbikpICogdGhpcy56KTtcbiAgICB2YXIgeSA9ICgoKHh5KmNvczEpKyh1eipzaW4pKSAqIHRoaXMueCkgKyAoKGNvcysoKHV5KnV5KSpjb3MxKSkgKiB0aGlzLnkpICsgKCgoeXoqY29zMSktKHV4KnNpbikpICogdGhpcy56KTtcbiAgICB2YXIgeiA9ICgoKHh6KmNvczEpLSh1eSpzaW4pKSAqIHRoaXMueCkgKyAoKCh5eipjb3MxKSsodXgqc2luKSkgKiB0aGlzLnkpICsgKChjb3MgKyAoKHV4KnV4KSpjb3MxKSkgKiB0aGlzLnopO1xuICAgIHJlc3VsdC54ID0geDtcbiAgICByZXN1bHQueSA9IHk7XG4gICAgcmVzdWx0LnogPSB6O1xufTtcbi8qKlxuICogUm90YXRlIHZlY3RvciBieSB0aGV0YSBhcm91bmQgeC1heGlzLiBSZXR1cm5zIGEgbmV3IFZlY3Rvci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHJldHVybiB7VmVjdG9yfVxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVggPSBmdW5jdGlvbih0aGV0YSl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gKGNvcyAqIHRoaXMueSkgLSAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeiA9IChzaW4gKiB0aGlzLnkpICsgKGNvcyAqIHRoaXMueik7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IoeCwgeSwgeik7XG59O1xuLyoqXG4gKiBSb3RhdGUgdmVjdG9yIGJ5IHRoZXRhIGFyb3VuZCB4LWF4aXMuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcGFyYW0ge1ZlY3Rvcn0gcmVzdWx0XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWExHID0gZnVuY3Rpb24odGhldGEsIHJlc3VsdCl7XG4gICAgdmFyIHNpbiA9IE1hdGguc2luKHRoZXRhKTtcbiAgICB2YXIgY29zID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gKGNvcyAqIHRoaXMueSkgLSAoc2luICogdGhpcy56KTtcbiAgICB2YXIgeiA9IChzaW4gKiB0aGlzLnkpICsgKGNvcyAqIHRoaXMueik7XG4gICAgcmVzdWx0LnggPSB4O1xuICAgIHJlc3VsdC55ID0geTtcbiAgICByZXN1bHQueiA9IHo7XG59O1xuLyoqXG4gKiBSb3RhdGUgdmVjdG9yIGJ5IHRoZXRhIGFyb3VuZCB5LWF4aXMuIFJldHVybnMgYSBuZXcgVmVjdG9yLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHRoZXRhXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlWSA9IGZ1bmN0aW9uKHRoZXRhKXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICp0aGlzLngpICsgKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSAtKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXR1cm4gbmV3IFZlY3Rvcih4LCB5LCB6KTtcbn07XG4vKipcbiAqIFJvdGF0ZSB2ZWN0b3IgYnkgdGhldGEgYXJvdW5kIHktYXhpcy4gUmVzdWx0IGlzIGFzc2lnbmVkIHRvIHJlc3VsdCBwYXJhbWV0ZXIuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVZTEcgPSBmdW5jdGlvbih0aGV0YSwgcmVzdWx0KXtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4odGhldGEpO1xuICAgIHZhciBjb3MgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgdmFyIHggPSAoY29zICp0aGlzLngpICsgKHNpbiAqIHRoaXMueik7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSAtKHNpbiAqIHRoaXMueCkgKyAoY29zICogdGhpcy56KTtcbiAgICByZXN1bHQueCA9IHg7XG4gICAgcmVzdWx0LnkgPSB5O1xuICAgIHJlc3VsdC56ID0gejtcbn07XG4vKipcbiAqIFJvdGF0ZSB2ZWN0b3IgYnkgdGhldGEgYXJvdW5kIHotYXhpcy4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gdGhldGFcbiAqIEByZXR1cm4ge1ZlY3Rvcn1cbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVaID0gZnVuY3Rpb24odGhldGEpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKiB0aGlzLngpIC0gKHNpbiAqIHRoaXMueSk7XG4gICAgdmFyIHkgPSAoc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnkpO1xuICAgIHZhciB6ID0gdGhpcy56O1xuICAgIHJldHVybiBuZXcgVmVjdG9yKHgsIHksIHopO1xufTtcbi8qKlxuICogUm90YXRlIHZlY3RvciBieSB0aGV0YSBhcm91bmQgei1heGlzLiBSZXN1bHQgaXMgYXNzaWduZWQgdG8gcmVzdWx0IHBhcmFtZXRlci5cbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aGV0YVxuICogQHBhcmFtIHtWZWN0b3J9IHJlc3VsdFxuICovXG5WZWN0b3IucHJvdG90eXBlLnJvdGF0ZVpMRyA9IGZ1bmN0aW9uKHRoZXRhLCByZXN1bHQpe1xuICAgIHZhciBzaW4gPSBNYXRoLnNpbih0aGV0YSk7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgeCA9IChjb3MgKiB0aGlzLngpIC0gKHNpbiAqIHRoaXMueSk7XG4gICAgdmFyIHkgPSAoc2luICogdGhpcy54KSArIChjb3MgKiB0aGlzLnkpO1xuICAgIHZhciB6ID0gdGhpcy56O1xuICAgIHJlc3VsdC54ID0geDtcbiAgICByZXN1bHQueSA9IHk7XG4gICAgcmVzdWx0LnogPSB6O1xufTtcbi8qKlxuICogUm90YXRlIHZlY3RvciBieSBwaXRjaCwgeWF3LCBhbmQgcm9sbC4gUmV0dXJucyBhIG5ldyBWZWN0b3IuXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge251bWJlcn0gcGl0Y2hcbiAqIEBwYXJhbSB7bnVtYmVyfSB5YXdcbiAqIEBwYXJhbSB7bnVtYmVyfSByb2xsXG4gKiBAcmV0dXJuIHtWZWN0b3J9XG4gKi9cblZlY3Rvci5wcm90b3R5cGUucm90YXRlUGl0Y2hZYXdSb2xsID0gZnVuY3Rpb24ocGl0Y2hfYW1udCwgeWF3X2FtbnQsIHJvbGxfYW1udCkge1xuICAgIHJldHVybiB0aGlzLnJvdGF0ZVgocm9sbF9hbW50KS5yb3RhdGVZKHBpdGNoX2FtbnQpLnJvdGF0ZVooeWF3X2FtbnQpO1xufTtcbi8qKiBcbiAqIFJvdGF0ZSB2ZWN0b3IgYnkgcGl0Y2gsIHlhdywgYW5kIHJvbGwuIFJlc3VsdCBpcyBhc3NpZ25lZCB0byByZXN1bHQgcGFyYW1ldGVyLlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtudW1iZXJ9IHBpdGNoXG4gKiBAcGFyYW0ge251bWJlcn0geWF3XG4gKiBAcGFyYW0ge251bWJlcn0gcm9sbFxuICogQHBhcmFtIHtWZWN0b3J9IHRlbXBcbiAqIEBwYXJhbSB7VmVjdG9yfSByZXN1bHRcbiAqL1xuVmVjdG9yLnByb3RvdHlwZS5yb3RhdGVQaXRjaFlhd1JvbGxMRyA9IGZ1bmN0aW9uKHBpdGNoX2FtbnQsIHlhd19hbW50LCByb2xsX2FtbnQsIHJlc3VsdCkge1xuICAgIHRoaXMucm90YXRlWExHKHJvbGxfYW1udCwgcmVzdWx0KTtcbiAgICByZXN1bHQucm90YXRlWUxHKHBpdGNoX2FtbnQsIHJlc3VsdCk7XG4gICAgcmVzdWx0LnJvdGF0ZVpMRyh5YXdfYW1udCwgcmVzdWx0KTtcbn07XG5cbnZhciB0ZW1wX3ZlY3RvcjEgPSBuZXcgVmVjdG9yKDAsMCwwKTtcbnZhciB0ZW1wX3ZlY3RvcjIgPSBuZXcgVmVjdG9yKDAsMCwwKTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7XG4iLCJyZXF1aXJlKCcuLy4uL3Rlc3RzL2hlbHBlcnMuanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC9tYXRyaXguanMnKTtcbnJlcXVpcmUoJy4vLi4vdGVzdHMvbWF0aC92ZWN0b3IuanMnKTtcbiIsImZ1bmN0aW9uIG5lYXJseUVxdWFsKGEsIGIsIGVwcyl7XG4gICAgaWYgKHR5cGVvZiBlcHMgPT09IFwidW5kZWZpbmVkXCIpIHtlcHMgPSAwLjAxO31cbiAgICB2YXIgZGlmZiA9IE1hdGguYWJzKGEgLSBiKTtcbiAgICByZXR1cm4gKGRpZmYgPCBlcHMpO1xufVxuXG52YXIgaGVscGVycyA9IG5ldyBPYmplY3QobnVsbCk7XG5cbmhlbHBlcnMubmVhcmx5RXF1YWwgPSBuZWFybHlFcXVhbDtcblxubW9kdWxlLmV4cG9ydHMgPSBoZWxwZXJzOyIsInZhciBNYXRyaXggPSByZXF1aXJlKCcuLi8uLi9zcmMvbWF0cml4LmpzJyk7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vc3JjL3ZlY3Rvci5qcycpO1xudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cbnN1aXRlKCdNYXRyaXgnLCBmdW5jdGlvbigpe1xuICAgIHZhciB6ZXJvLCB6ZXJvMiwgemVybzMsIGlkZW50aXR5LCBpZGVudGl0eTIsIGlkZW50aXR5Mywgb25lcywgbTAsIG0xLCBtMiwgbTMsIG00LCBtNSwgbTYsIG03LCBhbmdsZXM7XG4gICAgdmFyIHJlc3VsdCwgdGVtcF9tYXQsIHRlbXBfdmVjdG9yO1xuICAgIHNldHVwKGZ1bmN0aW9uKCl7XG4gICAgICAgIHJlc3VsdCA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgdGVtcF9tYXQgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIHRlbXBfdmVjdG9yID0gbmV3IFZlY3RvcigwLDAsMCk7XG4gICAgICAgIGFuZ2xlcyA9IFswLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSwgMypNYXRoLlBJIC8gMiwgTWF0aC5QSSAvIDJdO1xuICAgICAgICB6ZXJvID0gTWF0cml4Lnplcm8oKTtcbiAgICAgICAgemVybzIgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIHplcm8zID0gTWF0cml4LmZyb21BcnJheShbMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMF0pO1xuICAgICAgICBpZGVudGl0eSA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICBpZGVudGl0eTIgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIGlkZW50aXR5MyA9IE1hdHJpeC5mcm9tQXJyYXkoWzEsMCwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwwLDFdKTtcbiAgICAgICAgaWRlbnRpdHkyWzBdID0gMTtcbiAgICAgICAgaWRlbnRpdHkyWzVdID0gMTtcbiAgICAgICAgaWRlbnRpdHkyWzEwXSA9IDE7XG4gICAgICAgIGlkZW50aXR5MlsxNV0gPSAxO1xuICAgICAgICBvbmVzID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtMCA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTEgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG0yID0gbmV3IE1hdHJpeCgpO1xuICAgICAgICBtMyA9IG5ldyBNYXRyaXgoKTtcbiAgICAgICAgbTQgPSBuZXcgTWF0cml4KCk7XG4gICAgICAgIG00WzBdID0gMDtcbiAgICAgICAgbTRbMV0gPSAxO1xuICAgICAgICBtNFsyXSA9IDE7XG4gICAgICAgIG00WzNdID0gMjtcbiAgICAgICAgbTRbNF0gPSAzO1xuICAgICAgICBtNFs1XSA9IDU7XG4gICAgICAgIG00WzZdID0gODtcbiAgICAgICAgbTRbN10gPSAxMztcbiAgICAgICAgbTRbOF0gPSAyMTtcbiAgICAgICAgbTRbOV0gPSAzNDtcbiAgICAgICAgbTRbMTBdID0gNTU7XG4gICAgICAgIG00WzExXSA9IDg5O1xuICAgICAgICBtNFsxMl0gPSAxNDQ7XG4gICAgICAgIG00WzEzXSA9IDIzMztcbiAgICAgICAgbTRbMTRdID0gMzc3O1xuICAgICAgICBtNFsxNV0gPSA2MTA7XG4gICAgICAgIG01ID0gTWF0cml4LmZyb21BcnJheShbMCwgMSwgMSwgMiwgMywgNSwgOCwgMTMsIDIxLCAzNCwgNTUsIDg5LCAxNDQsIDIzMywgMzc3LCA2MTBdKTtcbiAgICAgICAgbTYgPSBNYXRyaXguZnJvbUFycmF5KFsxLCAyLCAzLCA0LCA1LCA2LCA3LCA4LCAxLCAyLCAzLCA0LCA1LCA2LCA3LCA4XSk7XG4gICAgICAgIG03ID0gTWF0cml4LmZyb21BcnJheShbMzQsIDQ0LCA1NCwgNjQsIDgyLCAxMDgsIDEzNCwgMTYwLCAzNCwgNDQsIDU0LCA2NCwgODIsIDEwOCwgMTM0LCAxNjBdKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgIG9uZXNbaV0gPSAxO1xuICAgICAgICAgICAgbTBbaV0gPSBpO1xuICAgICAgICAgICAgbTFbaV0gPSBpKzE7XG4gICAgICAgICAgICBtMltpXSA9IGkrMjtcbiAgICAgICAgICAgIG0zW2ldID0gaSoyO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgc3VpdGUoJ3Byb3BlcnRpZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICB0ZXN0KCdsZW5ndGgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHplcm8ubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVybzIubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVybzMubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaWRlbnRpdHkubGVuZ3RoLCAxNik7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwoaWRlbnRpdHkyLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG0xLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG0yLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG0zLmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG00Lmxlbmd0aCwgMTYpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKG01Lmxlbmd0aCwgMTYpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBzdWl0ZSgnbWV0aG9kcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2VxdWFsJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eS5lcXVhbChpZGVudGl0eTIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8yKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8yLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIWlkZW50aXR5LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhtNC5lcXVhbChtNSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCFtMC5lcXVhbChtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCFtMC5lcXVhbChtMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCFtMC5lcXVhbChtMykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnYWRkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHplcm8uYWRkKG0xKTtcbiAgICAgICAgICAgIHZhciB0MiA9IG0wLmFkZChvbmVzKTtcbiAgICAgICAgICAgIHZhciB0MyA9IG0wLmFkZChvbmVzKS5hZGQob25lcyk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwobTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKG0yKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdhZGRMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB6ZXJvLmFkZExHKG0xLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMSkpO1xuICAgICAgICAgICAgbTAuYWRkTEcob25lcywgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTEpKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbTAuYWRkTEcob25lcywgcmVzdWx0KVxuICAgICAgICAgICAgcmVzdWx0LmFkZExHKG9uZXMsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0yKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzdWJ0cmFjdCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSBtNC5zdWJ0cmFjdChtNSk7XG4gICAgICAgICAgICB2YXIgdDIgPSBtMS5zdWJ0cmFjdChvbmVzKTtcbiAgICAgICAgICAgIHZhciB0MyA9IG0yLnN1YnRyYWN0KG0xKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDIuZXF1YWwobTApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbChvbmVzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzdWJ0cmFjdExHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIG00LnN1YnRyYWN0TEcobTUsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIG0xLnN1YnRyYWN0TEcob25lcywgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTApKTtcbiAgICAgICAgICAgIG0yLnN1YnRyYWN0TEcobTEsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG9uZXMpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ211bHRpcGx5U2NhbGFyJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG0wLm11bHRpcGx5U2NhbGFyKDIpO1xuICAgICAgICAgICAgdmFyIHQyID0gemVyby5tdWx0aXBseVNjYWxhcigyMCk7XG4gICAgICAgICAgICB2YXIgdDMgPSBtMC5tdWx0aXBseVNjYWxhcigxKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbChtMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0My5lcXVhbChtMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbXVsdGlwbHlTY2FsYXJMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBtMC5tdWx0aXBseVNjYWxhckxHKDIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0zKSk7XG4gICAgICAgICAgICB6ZXJvLm11bHRpcGx5U2NhbGFyTEcoMjAsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIG0wLm11bHRpcGx5U2NhbGFyTEcoMSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ211bHRpcGx5JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IG02Lm11bHRpcGx5KG02KTtcbiAgICAgICAgICAgIHZhciB0MiA9IGlkZW50aXR5Lm11bHRpcGx5KGlkZW50aXR5KTtcbiAgICAgICAgICAgIHZhciB0MyA9IGlkZW50aXR5Lm11bHRpcGx5KHplcm8pO1xuICAgICAgICAgICAgdmFyIHQ0ID0gaWRlbnRpdHkubXVsdGlwbHkobTApO1xuICAgICAgICAgICAgdmFyIHQ1ID0gemVyby5tdWx0aXBseShtMCk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwobTcpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChpZGVudGl0eSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0NC5lcXVhbChtMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQ1LmVxdWFsKHplcm8pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ211bHRpcGx5TEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgbTYubXVsdGlwbHlMRyhtNiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTcpKTtcbiAgICAgICAgICAgIGlkZW50aXR5Lm11bHRpcGx5TEcoaWRlbnRpdHksIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKGlkZW50aXR5KSk7XG4gICAgICAgICAgICBpZGVudGl0eS5tdWx0aXBseUxHKHplcm8sIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgIGlkZW50aXR5Lm11bHRpcGx5TEcobTAsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0wKSk7XG4gICAgICAgICAgICB6ZXJvLm11bHRpcGx5TEcobTAsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ25lZ2F0ZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSBtMC5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0MiA9IG0xLm5lZ2F0ZSgpO1xuICAgICAgICAgICAgdmFyIHQzID0gbTIubmVnYXRlKCk7XG4gICAgICAgICAgICB2YXIgdDQgPSBtMy5uZWdhdGUoKTtcbiAgICAgICAgICAgIHZhciB0NSA9IHplcm8ubmVnYXRlKCk7XG4gICAgICAgICAgICB2YXIgdDYgPSBvbmVzLm5lZ2F0ZSgpO1xuXG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh0NSkpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbaV0sIC1tMFtpXSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyW2ldLCAtbTFbaV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0M1tpXSwgLW0yW2ldKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDRbaV0sIC1tM1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDE2OyBqKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MVtqXSwgLWopO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NltqXSwgLTEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnbmVnYXRlTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgemVyby5uZWdhdGVMRyhyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIG0wLm5lZ2F0ZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdFtpXSwgLW0wW2ldKTtcbiAgICAgICAgICAgICAgICBtMS5uZWdhdGVMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbaV0sIC1tMVtpXSk7XG4gICAgICAgICAgICAgICAgbTIubmVnYXRlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCAtbTJbaV0pO1xuICAgICAgICAgICAgICAgIG0zLm5lZ2F0ZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdFtpXSwgLW0zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMTY7IGorKyl7XG4gICAgICAgICAgICAgICAgbTAubmVnYXRlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2pdLCAtaik7XG4gICAgICAgICAgICAgICAgb25lcy5uZWdhdGVMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHRbal0sIC0xKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3RyYW5zcG9zZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJhbnNwb3NlX21hcCA9IHtcbiAgICAgICAgICAgICAgICAwOjAsIDE6NCwgMjo4LCAzOjEyLCA0OjEsIDU6NSwgNjo5LCA3OjEzLFxuICAgICAgICAgICAgICAgIDg6MiwgOTo2LCAxMDoxMCwgMTE6MTQsIDEyOjMsIDEzOjcsIDE0OjExLCAxNToxNVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHQxID0gaWRlbnRpdHkudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDIgPSBvbmVzLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQzID0gemVyby50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0NCA9IG0wLnRyYW5zcG9zZSgpO1xuICAgICAgICAgICAgdmFyIHQ1ID0gbTEudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICB2YXIgdDYgPSBtMi50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIHZhciB0NyA9IG0zLnRyYW5zcG9zZSgpO1xuXG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwoaWRlbnRpdHkpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh0Mi5lcXVhbChvbmVzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDMuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgdmFyIHQ0ID0gbTAudHJhbnNwb3NlKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspe1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NFtpXSwgbTBbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NVtpXSwgbTFbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0NltpXSwgbTJbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0N1tpXSwgbTNbdHJhbnNwb3NlX21hcFtpXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndHJhbnNwb3NlTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHRyYW5zcG9zZV9tYXAgPSB7XG4gICAgICAgICAgICAgICAgMDowLCAxOjQsIDI6OCwgMzoxMiwgNDoxLCA1OjUsIDY6OSwgNzoxMyxcbiAgICAgICAgICAgICAgICA4OjIsIDk6NiwgMTA6MTAsIDExOjE0LCAxMjozLCAxMzo3LCAxNDoxMSwgMTU6MTVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWRlbnRpdHkudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoaWRlbnRpdHkpKTtcbiAgICAgICAgICAgIG9uZXMudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwob25lcykpO1xuICAgICAgICAgICAgemVyby50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICB2YXIgdDQgPSBtMC50cmFuc3Bvc2UoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICAgICAgbTAudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCBtMFt0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICAgICAgbTEudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCBtMVt0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICAgICAgbTIudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCBtMlt0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICAgICAgbTMudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCBtM1t0cmFuc3Bvc2VfbWFwW2ldXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdlbXB0eScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgbTAudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXN1bHQuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgICAgICAgICBtMS50cmFuc3Bvc2VMRyhyZXN1bHQpO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5lbXB0eSgpO1xuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybykpO1xuICAgICAgICAgICAgICAgIG0yLnRyYW5zcG9zZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh6ZXJvKSk7XG4gICAgICAgICAgICAgICAgbTMudHJhbnNwb3NlTEcocmVzdWx0KTtcbiAgICAgICAgICAgICAgICByZXN1bHQuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHplcm8pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2NvcHknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgbTAuY29weShyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMCkpO1xuICAgICAgICAgICAgbTEuY29weShyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMSkpO1xuICAgICAgICAgICAgbTIuY29weShyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMikpO1xuICAgICAgICAgICAgbTMuY29weShyZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25YJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvblgodGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzVdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbNl0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbOV0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwodDIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uWExHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIE1hdHJpeC5yb3RhdGlvblhMRyh0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgICAgICAgICAgICB0Mls1XSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzZdID0gLU1hdGguc2luKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzldID0gTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMTBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25ZJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvblkodGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMl0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls4XSA9IC1NYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0MlsxMF0gPSBNYXRoLmNvcyh0aGV0YSlcbiAgICAgICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwodDIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uWUxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIE1hdHJpeC5yb3RhdGlvbllMRyh0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB2YXIgdDIgPSBNYXRyaXguaWRlbnRpdHkoKTtcbiAgICAgICAgICAgICAgICB0MlswXSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIHQyWzJdID0gTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbOF0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMTBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25aJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBtb3JlIHRlc3RzXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFuZ2xlcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHRoZXRhID0gYW5nbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvbloodGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMV0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbNF0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls1XSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25aTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgLy8gVE9ETzogQWRkIG1vcmUgdGVzdHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uWkxHKHRoZXRhLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5pZGVudGl0eSgpO1xuICAgICAgICAgICAgICAgIHQyWzBdID0gTWF0aC5jb3ModGhldGEpXG4gICAgICAgICAgICAgICAgdDJbMV0gPSAtTWF0aC5zaW4odGhldGEpXG4gICAgICAgICAgICAgICAgdDJbNF0gPSBNYXRoLnNpbih0aGV0YSlcbiAgICAgICAgICAgICAgICB0Mls1XSA9IE1hdGguY29zKHRoZXRhKVxuICAgICAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodDIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0aW9uQXhpcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbXVsdGktYXhpcyB0ZXN0cz9cbiAgICAgICAgICAgIHZhciB4YXhpcyA9IG5ldyBWZWN0b3IoMSwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgeWF4aXMgPSBuZXcgVmVjdG9yKDAsIDEsIDApO1xuICAgICAgICAgICAgdmFyIHpheGlzID0gbmV3IFZlY3RvcigwLCAwLCAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uQXhpcyh4YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0MiA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoeWF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDMgPSBNYXRyaXgucm90YXRpb25BeGlzKHpheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgdmFyIHQ0ID0gTWF0cml4LnJvdGF0aW9uQXhpcyh4YXhpcywgdGhldGEpO1xuICAgICAgICAgICAgICAgIHZhciB0NSA9IE1hdHJpeC5yb3RhdGlvbkF4aXMoeWF4aXMsIHRoZXRhKTtcbiAgICAgICAgICAgICAgICB2YXIgdDYgPSBNYXRyaXgucm90YXRpb25BeGlzKHpheGlzLCB0aGV0YSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQxLmVxdWFsKE1hdHJpeC5yb3RhdGlvblgodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKE1hdHJpeC5yb3RhdGlvblkodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQzLmVxdWFsKE1hdHJpeC5yb3RhdGlvbloodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQ0LmVxdWFsKE1hdHJpeC5yb3RhdGlvblgodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQ1LmVxdWFsKE1hdHJpeC5yb3RhdGlvblkodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgYXNzZXJ0Lm9rKHQ2LmVxdWFsKE1hdHJpeC5yb3RhdGlvbloodGhldGEpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbkF4aXNMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgbXVsdGktYXhpcyB0ZXN0cz9cbiAgICAgICAgICAgIHZhciB4YXhpcyA9IG5ldyBWZWN0b3IoMSwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgeWF4aXMgPSBuZXcgVmVjdG9yKDAsIDEsIDApO1xuICAgICAgICAgICAgdmFyIHpheGlzID0gbmV3IFZlY3RvcigwLCAwLCAxKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYW5nbGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgdGhldGEgPSBhbmdsZXNbaV07XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uQXhpc0xHKHhheGlzLCB0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKE1hdHJpeC5yb3RhdGlvblgodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uQXhpc0xHKHlheGlzLCB0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKE1hdHJpeC5yb3RhdGlvblkodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uQXhpc0xHKHpheGlzLCB0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKE1hdHJpeC5yb3RhdGlvbloodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uQXhpc0xHKHhheGlzLCB0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKE1hdHJpeC5yb3RhdGlvblgodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uQXhpc0xHKHlheGlzLCB0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKE1hdHJpeC5yb3RhdGlvblkodGhldGEpKSk7XG4gICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uQXhpc0xHKHpheGlzLCB0aGV0YSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKE1hdHJpeC5yb3RhdGlvbloodGhldGEpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgYmV0dGVyIHRlc3RzLCB0aGlzIGlzIGJhc2ljYWxseSBqdXN0IHJlY3JlYXRpbmcgdGhlIG1ldGhvZFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBwaXRjaCA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFuZ2xlcy5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5YXcgPSBhbmdsZXNbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgYW5nbGVzLmxlbmd0aDsgaysrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb2xsID0gYW5nbGVzW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnJvdGF0aW9uKHBpdGNoLCB5YXcsIHJvbGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQyID0gTWF0cml4LnJvdGF0aW9uWChyb2xsKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBseShNYXRyaXgucm90YXRpb25aKHlhdykpLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpcGx5KE1hdHJpeC5yb3RhdGlvblkocGl0Y2gpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFzc2VydC5vayh0MS5lcXVhbCh0MikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRpb25MRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGQgYmV0dGVyIHRlc3RzLCB0aGlzIGlzIGJhc2ljYWxseSBqdXN0IHJlY3JlYXRpbmcgdGhlIG1ldGhvZFxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbmdsZXMubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBwaXRjaCA9IGFuZ2xlc1tpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFuZ2xlcy5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5YXcgPSBhbmdsZXNbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgYW5nbGVzLmxlbmd0aDsgaysrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb2xsID0gYW5nbGVzW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgTWF0cml4LnJvdGF0aW9uTEcocGl0Y2gsIHlhdywgcm9sbCwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5yb3RhdGlvblgocm9sbCkuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbXVsdGlwbHkoTWF0cml4LnJvdGF0aW9uWih5YXcpKS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBseShNYXRyaXgucm90YXRpb25ZKHBpdGNoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHQxKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2xhdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdHJhbnMgPSBbMSwgMiwgMywgNSwgMTAsIDIwLCAzMCwgNDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFucy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHh0cmFucyA9IHRyYW5zW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdHJhbnMubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeXRyYW5zID0gdHJhbnNbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgdHJhbnMubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHp0cmFucyA9IHRyYW5zW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnRyYW5zbGF0aW9uKHh0cmFucywgeXRyYW5zLCB6dHJhbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAxMil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHh0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0geXRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB6dHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAwIHx8IG0gPT09IDUgfHwgbSA9PT0gMTAgfHwgbSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwodDFbbV0sIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd0cmFuc2xhdGlvbkxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0cmFucyA9IFsxLCAyLCAzLCA1LCAxMCwgMjAsIDMwLCA0MF07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRyYW5zLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICB2YXIgeHRyYW5zID0gdHJhbnNbaV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0cmFucy5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciB5dHJhbnMgPSB0cmFuc1tqXTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCB0cmFucy5sZW5ndGg7IGsrKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgenRyYW5zID0gdHJhbnNba107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdDEgPSBNYXRyaXgudHJhbnNsYXRpb25MRyh4dHJhbnMsIHl0cmFucywgenRyYW5zLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbSA9IDA7IG0gPCAxNjsgbSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtID09PSAxMil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHh0cmFucztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDEzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0geXRyYW5zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobSA9PT0gMTQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSB6dHJhbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAwIHx8IG0gPT09IDUgfHwgbSA9PT0gMTAgfHwgbSA9PT0gMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzLCByZXN1bHRbbV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHNjYWxlID0gWzEsIDIsIDMsIDUsIDEwLCAyMCwgMzAsIDQwXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NhbGUubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciB4c2NhbGUgPSBzY2FsZVtpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNjYWxlLmxlbmd0aDsgaisrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHlzY2FsZSA9IHNjYWxlW2pdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IHNjYWxlLmxlbmd0aDsgaysrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB6c2NhbGUgPSBzY2FsZVtrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0MSA9IE1hdHJpeC5zY2FsZSh4c2NhbGUsIHlzY2FsZSwgenNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gPSAwOyBtIDwgMTY7IG0rKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHhzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSB5c2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAxMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IHpzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDE1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxW21dLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGVMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSBbMSwgMiwgMywgNSwgMTAsIDIwLCAzMCwgNDBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2FsZS5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIHhzY2FsZSA9IHNjYWxlW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgc2NhbGUubGVuZ3RoOyBqKyspe1xuICAgICAgICAgICAgICAgICAgICB2YXIgeXNjYWxlID0gc2NhbGVbal07XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgc2NhbGUubGVuZ3RoOyBrKyspe1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHpzY2FsZSA9IHNjYWxlW2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHQxID0gTWF0cml4LnNjYWxlTEcoeHNjYWxlLCB5c2NhbGUsIHpzY2FsZSwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIG0gPSAwOyBtIDwgMTY7IG0rKyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobSA9PT0gMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHhzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSB5c2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChtID09PSAxMCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHpzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG0gPT09IDE1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdFttXSwgcmVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2lkZW50aXR5JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eS5lcXVhbChpZGVudGl0eTIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhpZGVudGl0eS5lcXVhbChpZGVudGl0eTMpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICAgICAgaWYgKGkgJSA1ID09PSAwKXtcbiAgICAgICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKGlkZW50aXR5W2ldLCAxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoaWRlbnRpdHlbaV0sIDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2lkZW50aXR5TEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgTWF0cml4LmlkZW50aXR5TEcocmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoaWRlbnRpdHkyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKGlkZW50aXR5MykpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBpZiAoaSAlIDUgPT09IDApe1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCAxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0W2ldLCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd6ZXJvJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayh6ZXJvLmVxdWFsKHplcm8yKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNjsgaSsrKXtcbiAgICAgICAgICAgICAgICBhc3NlcnQuZXF1YWwoemVyb1tpXSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd6ZXJvJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIE1hdHJpeC56ZXJvTEcocmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybzIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKyl7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdFtpXSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdmcm9tQXJyYXknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG01LmVxdWFsKG00KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soemVyby5lcXVhbCh6ZXJvMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHplcm8yLmVxdWFsKHplcm8zKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkuZXF1YWwoaWRlbnRpdHkzKSk7XG4gICAgICAgICAgICBhc3NlcnQub2soaWRlbnRpdHkyLmVxdWFsKGlkZW50aXR5MykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZnJvbUFycmF5TEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgTWF0cml4LmZyb21BcnJheUxHKFswLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwXSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybzMpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwoemVybzIpKTtcbiAgICAgICAgICAgIE1hdHJpeC5mcm9tQXJyYXlMRyhbMSwwLDAsMCwwLDEsMCwwLDAsMCwxLDAsMCwwLDAsMV0sIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKGlkZW50aXR5MikpO1xuICAgICAgICAgICAgTWF0cml4LmZyb21BcnJheUxHKFswLCAxLCAxLCAyLCAzLCA1LCA4LCAxMywgMjEsIDM0LCA1NSwgODksIDE0NCwgMjMzLCAzNzcsIDYxMF0sIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG00KSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdNYXRyaXguY29weScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBNYXRyaXguY29weShtMCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTApKTtcbiAgICAgICAgICAgIE1hdHJpeC5jb3B5KG0xLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbChtMSkpO1xuICAgICAgICAgICAgTWF0cml4LmNvcHkobTIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG0yKSk7XG4gICAgICAgICAgICBNYXRyaXguY29weShtMywgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwobTMpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcbiIsInZhciBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi9zcmMvdmVjdG9yLmpzJyk7XG52YXIgYXNzZXJ0ID0gcmVxdWlyZSgnYXNzZXJ0Jyk7XG52YXIgbmVhcmx5RXF1YWwgPSByZXF1aXJlKCcuLi9oZWxwZXJzLmpzJylbJ25lYXJseUVxdWFsJ107XG5cbnN1aXRlKCdWZWN0b3InLCBmdW5jdGlvbigpe1xuICAgIHZhciBvcmlnaW4sIHZlY3RvcjEsIHZlY3RvcjIsIHZlY3RvcjMsIHZlY3RvcjQsIHZlY3RvcjUsIHZlY3RvcngsIHZlY3RvcnksIHZlY3Rvcno7XG4gICAgdmFyIHZlY3RvcjEwMHgsIHZlY3RvcjIwMHksIHZlY3RvcjMwMHosIHZlY3RvcjEyMywgdmVjdG9yMTEyO1xuICAgIHZhciByZXN1bHQsIHRlbXAxLCB0ZW1wMjtcbiAgICBzZXR1cChmdW5jdGlvbigpe1xuICAgICAgICByZXN1bHQgPSBuZXcgVmVjdG9yKDAsIDAsIDApO1xuICAgICAgICB0ZW1wMSA9IG5ldyBWZWN0b3IoMCwgMCwgMCk7XG4gICAgICAgIHRlbXAyID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgb3JpZ2luID0gbmV3IFZlY3RvcigwLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yMSA9IG5ldyBWZWN0b3IoMSwgMSwgMSk7XG4gICAgICAgIHZlY3RvcjIgPSBuZXcgVmVjdG9yKDEsIDEsIDEpO1xuICAgICAgICB2ZWN0b3IzID0gbmV3IFZlY3RvcigxMCwgMTAsIDEwKTtcbiAgICAgICAgdmVjdG9yNCA9IG5ldyBWZWN0b3IoMTEsIDExLCAxMSk7XG4gICAgICAgIHZlY3RvcjUgPSBuZXcgVmVjdG9yKC0xLCAtMSwgLTEpO1xuICAgICAgICB2ZWN0b3J4ID0gbmV3IFZlY3RvcigxLCAwLCAwKTtcbiAgICAgICAgdmVjdG9yeSA9IG5ldyBWZWN0b3IoMCwgMSwgMCk7XG4gICAgICAgIHZlY3RvcnogPSBuZXcgVmVjdG9yKDAsIDAsIDEpO1xuICAgICAgICB2ZWN0b3IxMDB4ID0gbmV3IFZlY3RvcigxMDAsIDAsIDApO1xuICAgICAgICB2ZWN0b3IyMDB5ID0gbmV3IFZlY3RvcigwLCAyMDAsIDApO1xuICAgICAgICB2ZWN0b3IzMDB6ID0gbmV3IFZlY3RvcigwLCAwLCAzMDApO1xuICAgICAgICB2ZWN0b3IxMjMgPSBuZXcgVmVjdG9yKDEsIDIsIDMpO1xuICAgICAgICB2ZWN0b3IxMTIgPSBuZXcgVmVjdG9yKC0xLCAxLCAyKTtcbiAgICB9KTtcbiAgICBzdWl0ZSgncHJvcGVydGllcycsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRlc3QoJ2F4ZXMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe25ldyBWZWN0b3IoKTt9LCBFcnJvcik7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS54KTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3IxLnkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEueik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN1aXRlKCdtZXRob2RzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdGVzdCgnYWRkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHZlY3RvcjEuYWRkKHZlY3RvcjMpO1xuICAgICAgICAgICAgdmFyIHQyID0gdmVjdG9yMS5hZGQodmVjdG9yNSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwodmVjdG9yNCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLngsIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS55LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueiwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnYWRkTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yMS5hZGRMRyh2ZWN0b3IzLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC54LCAxMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LnksIDExKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueiwgMTEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3I0KSk7XG4gICAgICAgICAgICB2ZWN0b3IxLmFkZExHKHZlY3RvcjUsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3QnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHQxID0gdmVjdG9yNC5zdWJ0cmFjdCh2ZWN0b3IxKTtcbiAgICAgICAgICAgIHZhciB0MiA9IHZlY3RvcjEuc3VidHJhY3QodmVjdG9yMik7XG4gICAgICAgICAgICBhc3NlcnQub2sodDEuZXF1YWwodmVjdG9yMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHQyLmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLngsIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS55LCAxMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodDEueiwgMTApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLngsIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQyLnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc3VidHJhY3RMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3I0LnN1YnRyYWN0TEcodmVjdG9yMSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yMykpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC54LCAxMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LnksIDEwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueiwgMTApO1xuICAgICAgICAgICAgdmVjdG9yMS5zdWJ0cmFjdExHKHZlY3RvcjIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKG9yaWdpbikpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC54LCAwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LnosIDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZXF1YWwnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZXF1YWwodmVjdG9yMiksIHRydWUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjEuZXF1YWwodmVjdG9yMyksIGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2FuZ2xlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LmFuZ2xlKHZlY3RvcnkpLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnkuYW5nbGUodmVjdG9yeiksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeC5hbmdsZSh2ZWN0b3J6KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3IxLmFuZ2xlKHZlY3RvcjIpLCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5hbmdsZSh2ZWN0b3I1KSwgTWF0aC5QSSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnYW5nbGVMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeC5hbmdsZUxHKHZlY3RvcnkpLCBNYXRoLlBJIC8gMikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcnkuYW5nbGVMRyh2ZWN0b3J6KSwgTWF0aC5QSSAvIDIpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh2ZWN0b3J4LmFuZ2xlTEcodmVjdG9yeiksIE1hdGguUEkgLyAyKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5hbmdsZUxHKHZlY3RvcjIpLCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5hbmdsZUxHKHZlY3RvcjUpLCBNYXRoLlBJKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdjb3NBbmdsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcnguY29zQW5nbGUodmVjdG9yeSkpLCAoTWF0aC5QSSAvIDIpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcnkuY29zQW5nbGUodmVjdG9yeikpLCAoTWF0aC5QSSAvIDIpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcnguY29zQW5nbGUodmVjdG9yeikpLCAoTWF0aC5QSSAvIDIpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcjEuY29zQW5nbGUodmVjdG9yMikpLCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcjEuY29zQW5nbGUodmVjdG9yNSkpLCBNYXRoLlBJKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdjb3NBbmdsZUxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yeC5jb3NBbmdsZUxHKHZlY3RvcnkpKSwgKE1hdGguUEkgLyAyKSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKE1hdGguYWNvcyh2ZWN0b3J5LmNvc0FuZ2xlTEcodmVjdG9yeikpLCAoTWF0aC5QSSAvIDIpKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwoTWF0aC5hY29zKHZlY3RvcnguY29zQW5nbGVMRyh2ZWN0b3J6KSksIChNYXRoLlBJIC8gMikpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChNYXRoLmFjb3ModmVjdG9yMS5jb3NBbmdsZUxHKHZlY3RvcjIpKSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKE1hdGguYWNvcyh2ZWN0b3IxLmNvc0FuZ2xlTEcodmVjdG9yNSkpLCBNYXRoLlBJKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdtYWduaXR1ZGUnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcngubWFnbml0dWRlKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnkubWFnbml0dWRlKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnoubWFnbml0dWRlKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjEubWFnbml0dWRlKCksIE1hdGguc3FydCgzKSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjUubWFnbml0dWRlKCksIE1hdGguc3FydCgzKSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHZlY3RvcjMubWFnbml0dWRlKCksIE1hdGguc3FydCgzMDApKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdtYWduaXR1ZGVTcXVhcmVkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4Lm1hZ25pdHVkZVNxdWFyZWQoKSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5tYWduaXR1ZGVTcXVhcmVkKCksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnoubWFnbml0dWRlU3F1YXJlZCgpLCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLm1hZ25pdHVkZVNxdWFyZWQoKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yNS5tYWduaXR1ZGVTcXVhcmVkKCksIDMpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMubWFnbml0dWRlU3F1YXJlZCgpLCAzMDApO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnZG90JywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IxLmRvdCh2ZWN0b3IyKSwgMyk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMi5kb3QodmVjdG9yMyksIDMwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IzLmRvdCh2ZWN0b3I1KSwgLTMwKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J4LmRvdCh2ZWN0b3J5KSwgMCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeC5kb3QodmVjdG9yeiksIDApO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnkuZG90KHZlY3RvcnopLCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nyb3NzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciB0MSA9IHZlY3RvcjEyMy5jcm9zcyh2ZWN0b3IxMTIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcnguY3Jvc3ModmVjdG9yeSkuZXF1YWwodmVjdG9yeikpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcnkuY3Jvc3ModmVjdG9yeikuZXF1YWwodmVjdG9yeCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcnouY3Jvc3ModmVjdG9yeCkuZXF1YWwodmVjdG9yeSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKCF2ZWN0b3J5LmNyb3NzKHZlY3RvcngpLmVxdWFsKHZlY3RvcnopKTtcbiAgICAgICAgICAgIGFzc2VydC5vayghdmVjdG9yei5jcm9zcyh2ZWN0b3J5KS5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICBhc3NlcnQub2soIXZlY3RvcnguY3Jvc3ModmVjdG9yeikuZXF1YWwodmVjdG9yeSkpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcnguY3Jvc3ModmVjdG9yeSkueiwgMSk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yeS5jcm9zcyh2ZWN0b3J6KS54LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3J6LmNyb3NzKHZlY3RvcngpLnksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHQxLnksIC01KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh0MS56LCAzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ2Nyb3NzTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yMTIzLmNyb3NzTEcodmVjdG9yMTEyLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC54LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueSwgLTUpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC56LCAzKTtcbiAgICAgICAgICAgIHZlY3RvcnguY3Jvc3NMRyh2ZWN0b3J5LCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHJlc3VsdC56LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yeikpO1xuICAgICAgICAgICAgdmVjdG9yeS5jcm9zc0xHKHZlY3RvcnosIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwocmVzdWx0LngsIDEpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3J4KSk7XG4gICAgICAgICAgICB2ZWN0b3J6LmNyb3NzTEcodmVjdG9yeCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueSwgMSk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHZlY3RvcnkpKTtcbiAgICAgICAgICAgIHZlY3RvcnkuY3Jvc3NMRyh2ZWN0b3J4LCByZXN1bHQpXG4gICAgICAgICAgICBhc3NlcnQub2soIXJlc3VsdC5lcXVhbCh2ZWN0b3J6KSk7XG4gICAgICAgICAgICB2ZWN0b3J6LmNyb3NzTEcodmVjdG9yeSwgcmVzdWx0KVxuICAgICAgICAgICAgYXNzZXJ0Lm9rKCFyZXN1bHQuZXF1YWwodmVjdG9yeCkpO1xuICAgICAgICAgICAgdmVjdG9yeC5jcm9zc0xHKHZlY3RvcnosIHJlc3VsdClcbiAgICAgICAgICAgIGFzc2VydC5vayghcmVzdWx0LmVxdWFsKHZlY3RvcnkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ25vcm1hbGl6ZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQuZXF1YWwodmVjdG9yMTAweC5ub3JtYWxpemUoKS54LCAxKTtcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbCh2ZWN0b3IyMDB5Lm5vcm1hbGl6ZSgpLnksIDEpO1xuICAgICAgICAgICAgYXNzZXJ0LmVxdWFsKHZlY3RvcjMwMHoubm9ybWFsaXplKCkueiwgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdub3JtYWxpemVMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3IxMDB4Lm5vcm1hbGl6ZUxHKHJlc3VsdClcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueCwgMSk7XG4gICAgICAgICAgICB2ZWN0b3IyMDB5Lm5vcm1hbGl6ZUxHKHJlc3VsdClcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueSwgMSk7XG4gICAgICAgICAgICB2ZWN0b3IzMDB6Lm5vcm1hbGl6ZUxHKHJlc3VsdClcbiAgICAgICAgICAgIGFzc2VydC5lcXVhbChyZXN1bHQueiwgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdzY2FsZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yeC5zY2FsZSgxMDApLmVxdWFsKHZlY3RvcjEwMHgpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayh2ZWN0b3J5LnNjYWxlKDIwMCkuZXF1YWwodmVjdG9yMjAweSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3Rvcnouc2NhbGUoMzAwKS5lcXVhbCh2ZWN0b3IzMDB6KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5zY2FsZSgxMCkuZXF1YWwodmVjdG9yMykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHZlY3RvcjEuc2NhbGUoMTEpLmVxdWFsKHZlY3RvcjQpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3NjYWxlTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yeC5zY2FsZUxHKDEwMCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yMTAweCkpO1xuICAgICAgICAgICAgdmVjdG9yeS5zY2FsZUxHKDIwMCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yMjAweSkpO1xuICAgICAgICAgICAgdmVjdG9yei5zY2FsZUxHKDMwMCwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yMzAweikpO1xuICAgICAgICAgICAgdmVjdG9yMS5zY2FsZUxHKDEwLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKHJlc3VsdC5lcXVhbCh2ZWN0b3IzKSk7XG4gICAgICAgICAgICB2ZWN0b3IxLnNjYWxlTEcoMTEsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHZlY3RvcjQpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ25lZ2F0ZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5uZWdhdGUoKS5lcXVhbCh2ZWN0b3I1KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sodmVjdG9yMS5uZWdhdGUoKS5uZWdhdGUoKS5lcXVhbCh2ZWN0b3IxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCduZWdhdGVMRycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2ZWN0b3IxLm5lZ2F0ZUxHKHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2socmVzdWx0LmVxdWFsKHZlY3RvcjUpKTtcbiAgICAgICAgICAgIHZlY3RvcjEubmVnYXRlTEcodGVtcDEpO1xuICAgICAgICAgICAgdGVtcDEubmVnYXRlTEcocmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhyZXN1bHQuZXF1YWwodmVjdG9yMSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgndmVjdG9yUHJvamVjdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgdDEgPSB2ZWN0b3J4LnZlY3RvclByb2plY3Rpb24odmVjdG9yeSk7XG4gICAgICAgICAgICB2YXIgdDIgPSB2ZWN0b3IxLnZlY3RvclByb2plY3Rpb24odmVjdG9yMyk7XG4gICAgICAgICAgICB2YXIgdDMgPSB2ZWN0b3IxMjMudmVjdG9yUHJvamVjdGlvbih2ZWN0b3IxMTIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0MS55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDEueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQyLngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0Mi55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodDIueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLngsIC0xLjE2NykpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHQzLnksIDEuMTYpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbCh0My56LCAyLjMzKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCd2ZWN0b3JQcm9qZWN0aW9uTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yeC52ZWN0b3JQcm9qZWN0aW9uTEcodmVjdG9yeSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgICAgIHZlY3RvcjEudmVjdG9yUHJvamVjdGlvbkxHKHZlY3RvcjMsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LngsIDEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAxKSk7XG4gICAgICAgICAgICB2ZWN0b3IxMjMudmVjdG9yUHJvamVjdGlvbkxHKHZlY3RvcjExMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgLTEuMTY3KSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDEuMTYpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMi4zMykpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgnc2NhbGFyUHJvamVjdGlvbicsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeC5zY2FsYXJQcm9qZWN0aW9uKHZlY3RvcnkpLCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeS5zY2FsYXJQcm9qZWN0aW9uKHZlY3RvcnopLCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yeS5zY2FsYXJQcm9qZWN0aW9uKHZlY3RvcnopLCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMS5zY2FsYXJQcm9qZWN0aW9uKHZlY3RvcjMpLCAxLjczKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwodmVjdG9yMTIzLnNjYWxhclByb2plY3Rpb24odmVjdG9yMTEyKSwgMi44NSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gdGVzdCgndHJhbnNmb3JtJywgZnVuY3Rpb24oKXtcbiAgICAgICAgLy8gICAgIC8vIFRPRE86IFRoaW5rIG9mIHRlc3QgY2FzZXNcbiAgICAgICAgLy8gICAgIGFzc2VydC5lcXVhbCgxLCAyKTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIHRlc3QoJ3RyYW5zZm9ybUxHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgLy8gICAgIC8vIFRPRE86IFRoaW5rIG9mIHRlc3QgY2FzZXNcbiAgICAgICAgLy8gICAgIGFzc2VydC5lcXVhbCgxLCAyKTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksIE1hdGguUEkgLyAyKTtcbiAgICAgICAgICAgIHZhciByb3QyID0gdmVjdG9yeC5yb3RhdGUodmVjdG9yeSwgTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcngucm90YXRlKHZlY3RvcnksICgoMypNYXRoLlBJKSAvIDIpKTtcbiAgICAgICAgICAgIHZhciByb3Q0ID0gdmVjdG9yeC5yb3RhdGUodmVjdG9yeSwgMipNYXRoLlBJKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDIueiwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDMueiwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDQueiwgMCkpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGVzdCgncm90YXRlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZlY3Rvcngucm90YXRlTEcodmVjdG9yeSwgTWF0aC5QSSAvIDIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAtMSkpO1xuICAgICAgICAgICAgdmVjdG9yeC5yb3RhdGVMRyh2ZWN0b3J5LCBNYXRoLlBJLCByZXN1bHQpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC54LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgICAgIHZlY3Rvcngucm90YXRlTEcodmVjdG9yeSwgKCgzKk1hdGguUEkpIC8gMiksIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAxKSk7XG4gICAgICAgICAgICB2ZWN0b3J4LnJvdGF0ZUxHKHZlY3RvcnksIDIqTWF0aC5QSSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVgnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J6LnJvdGF0ZVgoTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcnoucm90YXRlWCgoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcnoucm90YXRlWCgyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnosIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAxKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVYTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yei5yb3RhdGVYTEcoTWF0aC5QSSAvIDIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICAgICAgdmVjdG9yei5yb3RhdGVYTEcoTWF0aC5QSSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIC0xKSk7XG4gICAgICAgICAgICB2ZWN0b3J6LnJvdGF0ZVhMRygoKDMqTWF0aC5QSSkgLyAyKSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgICAgIHZlY3Rvcnoucm90YXRlWExHKDIqTWF0aC5QSSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDEpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVknLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J4LnJvdGF0ZVkoTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J4LnJvdGF0ZVkoTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcngucm90YXRlWSgoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcngucm90YXRlWSgyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAwKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVZTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yeC5yb3RhdGVZTEcoTWF0aC5QSSAvIDIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAtMSkpO1xuICAgICAgICAgICAgdmVjdG9yeC5yb3RhdGVZTEcoTWF0aC5QSSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAwKSk7XG4gICAgICAgICAgICB2ZWN0b3J4LnJvdGF0ZVlMRygoKDMqTWF0aC5QSSkgLyAyKSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDEpKTtcbiAgICAgICAgICAgIHZlY3Rvcngucm90YXRlWUxHKDIqTWF0aC5QSSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVonLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHJvdDEgPSB2ZWN0b3J5LnJvdGF0ZVooTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgdmFyIHJvdDIgPSB2ZWN0b3J5LnJvdGF0ZVooTWF0aC5QSSk7XG4gICAgICAgICAgICB2YXIgcm90MyA9IHZlY3Rvcnkucm90YXRlWigoKDMqTWF0aC5QSSkgLyAyKSk7XG4gICAgICAgICAgICB2YXIgcm90NCA9IHZlY3Rvcnkucm90YXRlWigyKk1hdGguUEkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgLTEpKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QxLnosIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLngsIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyb3QyLnksIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90Mi56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My54LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90My56LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC54LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocm90NC56LCAwKSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0ZXN0KCdyb3RhdGVaTEcnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmVjdG9yeS5yb3RhdGVaTEcoTWF0aC5QSSAvIDIsIHJlc3VsdCk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LngsIC0xKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnksIDApKTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueiwgMCkpO1xuICAgICAgICAgICAgdmVjdG9yeS5yb3RhdGVaTEcoTWF0aC5QSSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAtMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC56LCAwKSk7XG4gICAgICAgICAgICB2ZWN0b3J5LnJvdGF0ZVpMRygoKDMqTWF0aC5QSSkgLyAyKSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMSkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgICAgIHZlY3Rvcnkucm90YXRlWkxHKDIqTWF0aC5QSSwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAxKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIDApKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVBpdGNoWWF3Um9sbCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgcm90MSA9IHZlY3Rvcngucm90YXRlUGl0Y2hZYXdSb2xsKE1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMiwgTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueSwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJvdDEueiwgLTEpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRlc3QoJ3JvdGF0ZVBpdGNoWWF3Um9sbExHJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZlY3Rvcngucm90YXRlUGl0Y2hZYXdSb2xsTEcoTWF0aC5QSSAvIDIsIE1hdGguUEkgLyAyLCBNYXRoLlBJIC8gMiwgcmVzdWx0KTtcbiAgICAgICAgICAgIGFzc2VydC5vayhuZWFybHlFcXVhbChyZXN1bHQueCwgMCkpO1xuICAgICAgICAgICAgYXNzZXJ0Lm9rKG5lYXJseUVxdWFsKHJlc3VsdC55LCAwKSk7XG4gICAgICAgICAgICBhc3NlcnQub2sobmVhcmx5RXF1YWwocmVzdWx0LnosIC0xKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7Il19
(8)
});
