var Vector = require('./vector.js');
var Face = require('./face.js');

/**
 * @constructor
 * @this {Mesh}
 * @param {string} name
 * @param {Array.<Vertex>} vertices
 * @param {Array.<{edge: Array.<number>, color: string}>} edges
 */
function Mesh(name, vertices, faces){
    this.name = name;
    this.vertices = vertices;
    this.faces = faces;
    this.position = new Vector(0, 0, 0);
    this.rotation = {'yaw': 0, 'pitch': 0, 'roll': 0};
    this.scale = {'x': 1, 'y': 1, 'z': 1};
    for (var i = 0; i < this.faces.length; i++){
        var face = this.faces[i];
        var a = this.vertices[face.face[0]];
        var b = this.vertices[face.face[1]];
        var c = this.vertices[face.face[2]];
        this.faces[i].normal = Mesh.normal(a,b,c);
        this.faces[i].centroid = Mesh.centroid(a,b,c);
    }
}
/**
 * Returns the centroid vector for the given face.
 * @param  {Vector} a
 * @param  {Vector} b
 * @param  {Vector} c
 * @return {Vector}
 */
Mesh.centroid = function(a, b, c){
    return new Vector((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3);
};
/**
 * Returns the normal vector for a face with the given vertices.
 * @param  {Vector} a
 * @param  {Vector} b
 * @param  {Vector} c
 * @return {Vector}
 */
Mesh.normal = function(a, b, c){
    var side1 = b.subtract(a);
    var side2 = c.subtract(a);
    var norm = side1.cross(side2);
    if (norm.magnitude() <= 0.00000001){
        return norm;
    } else {
        return norm.normalize();
    }
};
Mesh.fromJSON = function(json){
    var vertices = [];
    var faces = [];
    for (var i = 0, len = json.vertices.length; i < len; i++){
        var vertex = json.vertices[i];
        vertices.push(new Vector(vertex[0], vertex[1], vertex[2]));
    }
    for (var j = 0, ln = json.faces.length; j < ln; j++){
        var face = json.faces[j];
        faces.push(new Face(face.face[0], face.face[1], face.face[2], face.color));
    }
    return new Mesh(json.name, vertices, faces);
};

module.exports = Mesh;
