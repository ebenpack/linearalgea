var Color = require('../utility/color.js');
var Vector = require('./vector.js');

/**
 * A 3D triangle
 * @param {number} a     [description]
 * @param {number} b     [description]
 * @param {number} c     [description]
 * @param {string} color [description]
 */
function Face(a, b, c, color){
    this.face = [a, b, c];
    this.color = new Color(color);
}
/**
 * [normalVector description]
 * @return {Vector} [description]
 */
Face.prototype.normalVector = function(){
    //return Vector(0,0,0);
};

module.exports = Face;