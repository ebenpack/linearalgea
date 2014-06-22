var Vector = require('./vector.js');
var Mesh = require('./mesh.js');
var Matrix = require('./matrix.js');
var Face = require('./face.js');

var math = Object.create(null);

math.Vector = Vector;
math.Vertex = Vertex;
math.Mesh = Mesh;
math.Matrix = Matrix;
math.Face = Face;

module.exports = math;