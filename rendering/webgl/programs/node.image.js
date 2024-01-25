"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../../utils");
var node_image_vert_glsl_1 = __importDefault(require("../shaders/node.image.vert.glsl.js"));
var node_image_frag_glsl_1 = __importDefault(require("../shaders/node.image.frag.glsl.js"));
var node_1 = require("./common/node");
// maximum size of single texture in atlas
var MAX_TEXTURE_SIZE = 192;
// maximum width of atlas texture (limited by browser)
// low setting of 3072 works on phones & tablets
var MAX_CANVAS_WIDTH = 3072;
/**
 * To share the texture between the program instances of the graph and the
 * hovered nodes (to prevent some flickering, mostly), this program must be
 * "built" for each osigma instance:
 */
function getNodeImageProgram() {
    /**
     * These attributes are shared between all instances of this exact class,
     * returned by this call to getNodeProgramImage:
     */
    var rebindTextureFns = [];
    var images = {};
    var textureImage;
    var hasReceivedImages = false;
    var pendingImagesFrameID = undefined;
    // next write position in texture
    var writePositionX = 0;
    var writePositionY = 0;
    // height of current row
    var writeRowHeight = 0;
    /**
     * Helper to load an image:
     */
    function loadImage(imageSource) {
        if (images[imageSource])
            return;
        var image = new Image();
        image.addEventListener("load", function () {
            images[imageSource] = {
                status: "pending",
                image: image,
            };
            if (typeof pendingImagesFrameID !== "number") {
                pendingImagesFrameID = requestAnimationFrame(function () { return finalizePendingImages(); });
            }
        });
        image.addEventListener("error", function () {
            images[imageSource] = { status: "error" };
        });
        images[imageSource] = { status: "loading" };
        // Load image:
        image.setAttribute("crossOrigin", "");
        image.src = imageSource;
    }
    /**
     * Helper that takes all pending images and adds them into the texture:
     */
    function finalizePendingImages() {
        pendingImagesFrameID = undefined;
        var pendingImages = [];
        // List all pending images:
        for (var id in images) {
            var state = images[id];
            if (state.status === "pending") {
                pendingImages.push({
                    id: id,
                    image: state.image,
                    size: Math.min(state.image.width, state.image.height) || 1,
                });
            }
        }
        // Add images to texture:
        var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d", { willReadFrequently: true });
        // limit canvas size to avoid browser and platform limits
        var totalWidth = hasReceivedImages ? textureImage.width : 0;
        var totalHeight = hasReceivedImages ? textureImage.height : 0;
        // initialize image drawing offsets with current write position
        var xOffset = writePositionX;
        var yOffset = writePositionY;
        /**
         * Draws a (full or partial) row of images into the atlas texture
         * @param pendingImages
         */
        var drawRow = function (pendingImages) {
            // update canvas size before drawing
            if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
                canvas.width = Math.min(MAX_CANVAS_WIDTH, totalWidth);
                canvas.height = totalHeight;
                // draw previous texture into resized canvas
                if (hasReceivedImages) {
                    ctx.putImageData(textureImage, 0, 0);
                }
            }
            pendingImages.forEach(function (_a) {
                var id = _a.id, image = _a.image, size = _a.size;
                var imageSizeInTexture = Math.min(MAX_TEXTURE_SIZE, size);
                // Crop image, to only keep the biggest square, centered:
                var dx = 0, dy = 0;
                if ((image.width || 0) > (image.height || 0)) {
                    dx = (image.width - image.height) / 2;
                }
                else {
                    dy = (image.height - image.width) / 2;
                }
                ctx.drawImage(image, dx, dy, size, size, xOffset, yOffset, imageSizeInTexture, imageSizeInTexture);
                // Update image state:
                images[id] = {
                    status: "ready",
                    x: xOffset,
                    y: yOffset,
                    width: imageSizeInTexture,
                    height: imageSizeInTexture,
                };
                xOffset += imageSizeInTexture;
            });
            hasReceivedImages = true;
            textureImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        };
        var rowImages = [];
        pendingImages.forEach(function (image) {
            var size = image.size;
            var imageSizeInTexture = Math.min(size, MAX_TEXTURE_SIZE);
            if (writePositionX + imageSizeInTexture > MAX_CANVAS_WIDTH) {
                // existing row is full: flush row and continue on next line
                if (rowImages.length > 0) {
                    totalWidth = Math.max(writePositionX, totalWidth);
                    totalHeight = Math.max(writePositionY + writeRowHeight, totalHeight);
                    drawRow(rowImages);
                    rowImages = [];
                    writeRowHeight = 0;
                }
                writePositionX = 0;
                writePositionY = totalHeight;
                xOffset = 0;
                yOffset = totalHeight;
            }
            // add image to row
            rowImages.push(image);
            // advance write position and update maximum row height
            writePositionX += imageSizeInTexture;
            writeRowHeight = Math.max(writeRowHeight, imageSizeInTexture);
        });
        // flush pending images in row - keep write position (and drawing cursor)
        totalWidth = Math.max(writePositionX, totalWidth);
        totalHeight = Math.max(writePositionY + writeRowHeight, totalHeight);
        drawRow(rowImages);
        rowImages = [];
        rebindTextureFns.forEach(function (fn) { return fn(); });
    }
    var UNSIGNED_BYTE = WebGLRenderingContext.UNSIGNED_BYTE, FLOAT = WebGLRenderingContext.FLOAT;
    var UNIFORMS = ["u_sizeRatio", "u_pixelRatio", "u_matrix", "u_atlas"];
    return /** @class */ (function (_super) {
        __extends(NodeImageProgram, _super);
        function NodeImageProgram(gl, renderer) {
            var _this = _super.call(this, gl, renderer) || this;
            rebindTextureFns.push(function () {
                if (_this && _this.rebindTexture)
                    _this.rebindTexture();
                if (renderer && renderer.refresh)
                    renderer.refresh();
            });
            textureImage = new ImageData(1, 1);
            _this.texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, _this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
            return _this;
        }
        NodeImageProgram.prototype.getDefinition = function () {
            return {
                VERTICES: 1,
                ARRAY_ITEMS_PER_VERTEX: 8,
                VERTEX_SHADER_SOURCE: node_image_vert_glsl_1.default,
                FRAGMENT_SHADER_SOURCE: node_image_frag_glsl_1.default,
                UNIFORMS: UNIFORMS,
                ATTRIBUTES: [
                    { name: "a_position", size: 2, type: FLOAT },
                    { name: "a_size", size: 1, type: FLOAT },
                    { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
                    { name: "a_texture", size: 4, type: FLOAT },
                ],
            };
        };
        NodeImageProgram.prototype.rebindTexture = function () {
            var gl = this.gl;
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
            gl.generateMipmap(gl.TEXTURE_2D);
            if (this.latestRenderParams)
                this.render(this.latestRenderParams);
        };
        NodeImageProgram.prototype.processVisibleItem = function (i, data) {
            var array = this.array;
            var imageSource = data.image;
            var imageState = imageSource && images[imageSource];
            if (typeof imageSource === "string" && !imageState)
                loadImage(imageSource);
            array[i++] = data.x;
            array[i++] = data.y;
            array[i++] = data.size;
            array[i++] = (0, utils_1.floatColor)(data.color);
            // Reference texture:
            if (imageState && imageState.status === "ready") {
                var width = textureImage.width, height = textureImage.height;
                array[i++] = imageState.x / width;
                array[i++] = imageState.y / height;
                array[i++] = imageState.width / width;
                array[i++] = imageState.height / height;
            }
            else {
                array[i++] = 0;
                array[i++] = 0;
                array[i++] = 0;
                array[i++] = 0;
            }
        };
        NodeImageProgram.prototype.draw = function (params) {
            this.latestRenderParams = params;
            var gl = this.gl;
            var _a = this.uniformLocations, u_sizeRatio = _a.u_sizeRatio, u_pixelRatio = _a.u_pixelRatio, u_matrix = _a.u_matrix, u_atlas = _a.u_atlas;
            gl.uniform1f(u_sizeRatio, params.sizeRatio);
            gl.uniform1f(u_pixelRatio, params.pixelRatio);
            gl.uniformMatrix3fv(u_matrix, false, params.matrix);
            gl.uniform1i(u_atlas, 0);
            gl.drawArrays(gl.POINTS, 0, this.verticesCount);
        };
        return NodeImageProgram;
    }(node_1.NodeProgram));
}
exports.default = getNodeImageProgram;
