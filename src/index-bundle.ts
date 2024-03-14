/**
 * osigma.js Bundle Endpoint
 * ========================
 *
 * The library endpoint.
 * Will be built so that it exports a global `osigma` class, that also exposes
 * useful classes as static properties.
 * @module
 */
import OSigmaClass from "./osigma";
import Camera from "./core/camera";
import QuadTree from "./core/quadtree";
import MouseCaptor from "./core/captors/mouse";
import { TypedArray } from "./core/ograph";

class OSigma<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> extends OSigmaClass<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures
> {
    static Camera = Camera;
    static QuadTree = QuadTree;
    static MouseCaptor = MouseCaptor;
    static osigma = OSigmaClass;
}

module.exports = OSigma;
