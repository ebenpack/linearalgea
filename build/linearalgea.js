!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.linearalgea=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * @license
 * Copyright (c) 2014 Eben Packwood. All rights reserved.
 * MIT License
 *
 */

/** @ignore */
var Vector = _dereq_('./vector.js');
var Matrix = _dereq_('./matrix.js');

var math = Object.create(null);

math.Vector = Vector;
math.Matrix = Matrix;

module.exports = math;

},{"./matrix.js":2,"./vector.js":3}],2:[function(_dereq_,module,exports){
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
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = this[i] + matrix[i];
    }
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
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = this[i] - matrix[i];
    }
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
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = this[i] * scalar;
    }
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
    for (var i = 0, len = this.length; i < len; i++){
        result[i] = -this[i];
    }
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
    result.empty();
    result[0] = 1;
    result[5] = cos;
    result[6] = -sin;
    result[9] = sin;
    result[10] = cos;
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
    result.empty();
    result[0] = cos;
    result[2] = sin;
    result[5] = 1;
    result[8] = -sin;
    result[10] = cos;
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
    result.empty();
    result[0] = cos;
    result[1] = -sin;
    result[4] = sin;
    result[5] = cos;
    result[10] = 1;
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
    result.empty();
    result[0] = cos + ((ux*ux)*cos1);
    result[1] = (xy*cos1) - (uz*sin);
    result[2] = (xz*cos1)+(uy*sin);
    result[4] = (xy*cos1)+(uz*sin);
    result[5] = cos+((uy*uy)*cos1);
    result[6] = (yz*cos1)-(ux*sin);
    result[8] = (xz*cos1)-(uy*sin);
    result[9] = (yz*cos1)+(ux*sin);
    result[10] = cos + ((uz*uz)*cos1);
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
    temp_matrix1.empty();
    temp_matrix2.empty();
    temp_matrix3.empty();
    temp_matrix4.empty();
    result.empty();    
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
    Matrix.identityLG(result);
    result[12] = xtrans;
    result[13] = ytrans;
    result[14] = ztrans;
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
    Matrix.zeroLG(result);
    result[0] = xscale;
    result[5] = yscale;
    result[10] = zscale;
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
    for (var i = 0; i < 16; i++){
       result[i] = 0; 
    }
    result[0] = 1;
    result[5] = 1;
    result[10] = 1;
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
    for (var i = 0; i < 16; i++){
       result[i] = 0; 
    }
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
    for (var i = 0; i < 16; i++){
        result[i] = arr[i];
    }
};

var temp_matrix1 = new Matrix();
var temp_matrix2 = new Matrix();
var temp_matrix3 = new Matrix();
var temp_matrix4 = new Matrix();
var temp_vector = new Vector(0,0,0);

module.exports = Matrix;

},{"./vector.js":3}],3:[function(_dereq_,module,exports){
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

},{}]},{},[1])
(1)
});