/**
 * osigma.js Library Endpoint
 * =========================
 *
 * The library endpoint.
 * @module
 */
import osigma from "./osigma";
import Camera from "./core/camera";
import QuadTree from "./core/quadtree";
import MouseCaptor from "./core/captors/mouse";

export default osigma;
export { Camera, QuadTree, MouseCaptor, osigma };
