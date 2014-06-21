/** 
 * 4x4 matrix.
 * @constructor
 * @this {Matrix}
 */
function Matrix(){
    /** @type {Array.<number>} */
    this.m = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}
/**
 * Compare matrix with self for equality.
 * @method
 * @param {Matrix} matrix
 * @return {boolean}
 */
Matrix.prototype.equals = function(matrix){
    for (var i = 0, len = this.m.length; i < len; i++){
        if (this.m[i] !== matrix.m[i]){
            return false;
        }
    }
    return true;
};
/**
 * Add matrix to self.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.add = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.m.length; i < len; i++){
        new_matrix.m[i] = this.m[i] + matrix.m[i];
    }
    return new_matrix;
};
/**
 * Subtract matrix from self.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.subtract = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.m.length; i < len; i++){
        this.m[i] = this.m[i] - matrix.m[i];
    }
    return new_matrix;
};
/**
 * Multiply self by scalar.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.multiplyScalar = function(scalar){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.m.length; i < len; i++){
        this.m[i] = this.m[i] * scalar;
    }
    return new_matrix;
};
/**
 * Multiply self by matrix.
 * @method
 * @param {Matrix} matrix
 * @return {Matrix}
 */
Matrix.prototype.multiply = function(matrix){
    var new_matrix = new Matrix();
    new_matrix.m[0] = (this.m[0] * matrix.m[0]) + (this.m[1] * matrix.m[4]) + (this.m[2] * matrix.m[8]) + (this.m[3] * matrix.m[12]);
    new_matrix.m[1] = (this.m[0] * matrix.m[1]) + (this.m[1] * matrix.m[5]) + (this.m[2] * matrix.m[9]) + (this.m[3] * matrix.m[13]);
    new_matrix.m[2] = (this.m[0] * matrix.m[2]) + (this.m[1] * matrix.m[6]) + (this.m[2] * matrix.m[10]) + (this.m[3] * matrix.m[14]);
    new_matrix.m[3] = (this.m[0] * matrix.m[3]) + (this.m[1] * matrix.m[7]) + (this.m[2] * matrix.m[11]) + (this.m[3] * matrix.m[15]);
    new_matrix.m[4] = (this.m[4] * matrix.m[0]) + (this.m[5] * matrix.m[4]) + (this.m[6] * matrix.m[8]) + (this.m[7] * matrix.m[12]);
    new_matrix.m[5] = (this.m[4] * matrix.m[1]) + (this.m[5] * matrix.m[5]) + (this.m[6] * matrix.m[9]) + (this.m[7] * matrix.m[13]);
    new_matrix.m[6] = (this.m[4] * matrix.m[2]) + (this.m[5] * matrix.m[6]) + (this.m[6] * matrix.m[10]) + (this.m[7] * matrix.m[14]);
    new_matrix.m[7] = (this.m[4] * matrix.m[3]) + (this.m[5] * matrix.m[7]) + (this.m[6] * matrix.m[11]) + (this.m[7] * matrix.m[15]);
    new_matrix.m[8] = (this.m[8] * matrix.m[0]) + (this.m[9] * matrix.m[4]) + (this.m[10] * matrix.m[8]) + (this.m[11] * matrix.m[12]);
    new_matrix.m[9] = (this.m[8] * matrix.m[1]) + (this.m[9] * matrix.m[5]) + (this.m[10] * matrix.m[9]) + (this.m[11] * matrix.m[13]);
    new_matrix.m[10] = (this.m[8] * matrix.m[2]) + (this.m[9] * matrix.m[6]) + (this.m[10] * matrix.m[10]) + (this.m[11] * matrix.m[14]);
    new_matrix.m[11] = (this.m[8] * matrix.m[3]) + (this.m[9] * matrix.m[7]) + (this.m[10] * matrix.m[11]) + (this.m[11] * matrix.m[15]);
    new_matrix.m[12] = (this.m[12] * matrix.m[0]) + (this.m[13] * matrix.m[4]) + (this.m[14] * matrix.m[8]) + (this.m[15] * matrix.m[12]);
    new_matrix.m[13] = (this.m[12] * matrix.m[1]) + (this.m[13] * matrix.m[5]) + (this.m[14] * matrix.m[9]) + (this.m[15] * matrix.m[13]);
    new_matrix.m[14] = (this.m[12] * matrix.m[2]) + (this.m[13] * matrix.m[6]) + (this.m[14] * matrix.m[10]) + (this.m[15] * matrix.m[14]);
    new_matrix.m[15] = (this.m[12] * matrix.m[3]) + (this.m[13] * matrix.m[7]) + (this.m[14] * matrix.m[11]) + (this.m[15] * matrix.m[15]);
    return new_matrix;
};
/**
 * Negate self.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.negate = function(matrix){
    var new_matrix = new Matrix();
    for (var i = 0, len = this.matrix.length; i < len; i++){
        this.matrix.m[i] = -this.matrix.m[i];
    }
    return new_matrix;
};
/**
 * Transpose self.
 * @method
 * @param {number} scalar
 * @return {Matrix}
 */
Matrix.prototype.transpose = function(){
    var new_matrix = new Matrix();
    new_matrix.m[0] = this.m[0];
    new_matrix.m[1] = this.m[4];
    new_matrix.m[2] = this.m[8];
    new_matrix.m[3] = this.m[12];
    new_matrix.m[4] = this.m[1];
    new_matrix.m[5] = this.m[5];
    new_matrix.m[6] = this.m[9];
    new_matrix.m[7] = this.m[13];
    new_matrix.m[8] = this.m[2];
    new_matrix.m[9] = this.m[6];
    new_matrix.m[10] = this.m[10];
    new_matrix.m[11] = this.m[14];
    new_matrix.m[12] = this.m[3];
    new_matrix.m[13] = this.m[7];
    new_matrix.m[14] = this.m[11];
    new_matrix.m[15] = this.m[15];
    return new_matrix;
};

/**
 * Constructs a rotation matrix, rotating by theta around the x-axis
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationX = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix.m[0] = 1;
    rotation_matrix.m[5] = cos;
    rotation_matrix.m[6] = -sin;
    rotation_matrix.m[9] = sin;
    rotation_matrix.m[10] = cos;
    rotation_matrix.m[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the y-axis
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationY = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix.m[0] = cos;
    rotation_matrix.m[2] = sin;
    rotation_matrix.m[5] = 1;
    rotation_matrix.m[8] = -sin;
    rotation_matrix.m[10] = cos;
    rotation_matrix.m[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the z-axis
 * @method
 * @static
 * @param {number} theta
 * @return {Matrix}
 */
Matrix.rotationZ = function(theta){
    var rotation_matrix = new Matrix();
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
    rotation_matrix.m[0] = cos;
    rotation_matrix.m[1] = -sin;
    rotation_matrix.m[4] = sin;
    rotation_matrix.m[5] = cos;
    rotation_matrix.m[10] = 1;
    rotation_matrix.m[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix, rotating by theta around the axis
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
    rotation_matrix.m[0] = cos + ((ux*ux)*cos1);
    rotation_matrix.m[1] = (xy*cos1) - (uz*sin);
    rotation_matrix.m[2] = (xz*cos1)+(uy*sin);
    rotation_matrix.m[4] = (xy*cos1)+(uz*sin);
    rotation_matrix.m[5] = cos+((uy*uy)*cos1);
    rotation_matrix.m[6] = (yz*cos1)-(ux*sin);
    rotation_matrix.m[8] = (xz*cos1)-(uy*sin);
    rotation_matrix.m[9] = (yz*cos1)+(ux*sin);
    rotation_matrix.m[10] = cos + ((uz*uz)*cos1);
    rotation_matrix.m[15] = 1;
    return rotation_matrix;
};
/**
 * Constructs a rotation matrix from pitch, yaw, and roll
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
 * Constructs a translation matrix from x, y, and z distances
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.translation = function(xtrans, ytrans, ztrans){
    var translation_matrix = Matrix.identity();
    translation_matrix.m[12] = xtrans;
    translation_matrix.m[13] = ytrans;
    translation_matrix.m[14] = ztrans;
    return translation_matrix;
};
/**
 * Constructs a scaling matrix from x, y, and z scale
 * @method
 * @static
 * @param {number} xtrans
 * @param {number} ytrans
 * @param {number} ztrans
 * @return {Matrix}
 */
Matrix.scale = function(xscale, yscale, zscale){
    var scaling_matrix = new Matrix();
    scaling_matrix.m[0] = xscale;
    scaling_matrix.m[5] = yscale;
    scaling_matrix.m[10] = zscale;
    scaling_matrix.m[15] = 1;
    return scaling_matrix;
};
/**
 * Constructs an identity matrix
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.identity = function(){
    var identity = new Matrix();
    identity.m[0] = 1;
    identity.m[5] = 1;
    identity.m[10] = 1;
    identity.m[15] = 1;
    return identity;
};
/**
 * Constructs a zero matrix
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.zero = function(){
    return new Matrix();
};
/**
 * Constructs a new matrix from an array
 * @method
 * @static
 * @return {Matrix}
 */
Matrix.fromArray = function(arr){
    var new_matrix = new Matrix();
    for (var i = 0; i < 16; i++){
        new_matrix.m[i] = arr[i];
    }
    return new_matrix;
};

module.exports = Matrix;