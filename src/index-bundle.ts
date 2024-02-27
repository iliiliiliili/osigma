/**
 * osigma.js Bundle Endpoint
 * ========================
 *
 * The library endpoint.
 * Will be built so that it exports a global `osigma` class, that also exposes
 * useful classes as static properties.
 * @module
 */
import OsigmaClass from "./osigma";
import Camera from "./core/camera";
import QuadTree from "./core/quadtree";
import MouseCaptor from "./core/captors/mouse";

class osigma extends OsigmaClass {
    static Camera = Camera;
    static QuadTree = QuadTree;
    static MouseCaptor = MouseCaptor;
    static osigma = OsigmaClass;
}

module.exports = osigma;
