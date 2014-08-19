var Vector = require('./vector.js');
var Matrix = require('./matrix.js');

var math = Object.create(null);

math.Vector = Vector;
math.Matrix = Matrix;

module.exports = math;
