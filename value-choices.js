"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeColor = exports.decodeLabel = exports.colorChoices = exports.labelChoices = void 0;
exports.labelChoices = (function () {
    var result = [""];
    for (var i = 1; i < 256; i++) {
        result.push("l".concat(i));
    }
    return result;
})();
exports.colorChoices = (function () {
    var result = [];
    var maxChoicesPerColor = 6;
    var encodeColor = "0123456789ABCDEF";
    for (var ri = 0; ri < maxChoicesPerColor; ri++) {
        for (var gi = 0; gi < maxChoicesPerColor; gi++) {
            for (var bi = 0; bi < maxChoicesPerColor; bi++) {
                var r = encodeColor[Math.floor(16 * ri / maxChoicesPerColor)];
                var g = encodeColor[Math.floor(16 * gi / maxChoicesPerColor)];
                var b = encodeColor[Math.floor(16 * bi / maxChoicesPerColor)];
                result.push("#".concat(r).concat(g).concat(b));
            }
        }
    }
    return result;
})();

var decodeLabel = function (encoded) {return exports.labelChoices[encoded]; };
exports.decodeLabel = decodeLabel;
var decodeColor = function (encoded) { return exports.colorChoices[encoded]; };
exports.decodeColor = decodeColor;
