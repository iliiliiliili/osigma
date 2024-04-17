/**
 * Graphology ForceAtlas2 Helpers
 * ===============================
 *
 * Miscellaneous helper functions.
 */

import OSigma from "../../osigma";
import { TConnectionVisual, TNodeVisual } from "../../types";
import type { OGraph, TypedArray } from "../ograph";
import iterate from "./iterate";

/**
 * Constants.
 */
const PPN = 10;
const PPE = 3;

// /**
//  * Very simple Object.assign-like function.
//  *
//  * @param  {object} target       - First object.
//  * @param  {object} [...objects] - Objects to merge.
//  * @return {object}
//  */
// exports.assign = function (target) {
//     target = target || {};

//     let objects = Array.prototype.slice.call(arguments).slice(1),
//         i,
//         k,
//         l;

//     for (i = 0, l = objects.length; i < l; i++) {
//         if (!objects[i]) continue;

//         for (k in objects[i]) target[k] = objects[i][k];
//     }

//     return target;
// };

// /**
//  * Function used to validate the given settings.
//  *
//  * @param  {object}      settings - Settings to validate.
//  * @return {object|null}
//  */
// exports.validateSettings = function (settings) {
//     if ("linLogMode" in settings && typeof settings.linLogMode !== "boolean")
//         return { message: "the `linLogMode` setting should be a boolean." };

//     if (
//         "outboundAttractionDistribution" in settings &&
//         typeof settings.outboundAttractionDistribution !== "boolean"
//     )
//         return {
//             message:
//                 "the `outboundAttractionDistribution` setting should be a boolean.",
//         };

//     if ("adjustSizes" in settings && typeof settings.adjustSizes !== "boolean")
//         return { message: "the `adjustSizes` setting should be a boolean." };

//     if (
//         "edgeWeightInfluence" in settings &&
//         typeof settings.edgeWeightInfluence !== "number"
//     )
//         return {
//             message: "the `edgeWeightInfluence` setting should be a number.",
//         };

//     if (
//         "scalingRatio" in settings &&
//         !(
//             typeof settings.scalingRatio === "number" &&
//             settings.scalingRatio >= 0
//         )
//     )
//         return {
//             message: "the `scalingRatio` setting should be a number >= 0.",
//         };

//     if (
//         "strongGravityMode" in settings &&
//         typeof settings.strongGravityMode !== "boolean"
//     )
//         return {
//             message: "the `strongGravityMode` setting should be a boolean.",
//         };

//     if (
//         "gravity" in settings &&
//         !(typeof settings.gravity === "number" && settings.gravity >= 0)
//     )
//         return { message: "the `gravity` setting should be a number >= 0." };

//     if (
//         "slowDown" in settings &&
//         !(typeof settings.slowDown === "number" || settings.slowDown >= 0)
//     )
//         return { message: "the `slowDown` setting should be a number >= 0." };

//     if (
//         "barnesHutOptimize" in settings &&
//         typeof settings.barnesHutOptimize !== "boolean"
//     )
//         return {
//             message: "the `barnesHutOptimize` setting should be a boolean.",
//         };

//     if (
//         "barnesHutTheta" in settings &&
//         !(
//             typeof settings.barnesHutTheta === "number" &&
//             settings.barnesHutTheta >= 0
//         )
//     )
//         return {
//             message: "the `barnesHutTheta` setting should be a number >= 0.",
//         };

//     return null;
// };

/**
 * Function generating a flat matrix for both nodes & edges of the given graph.
 *
 * @param  {Graph}    graph         - Target graph.
 * @param  {function} getEdgeWeight - Edge weight getter function.
 * @return {object}                 - Both matrices.
 */
export const graphToByteArrays = function <
    TNodeMass extends TypedArray,
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(
    graph: OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    >
) {
    const order = graph.order;
    const size = graph.connectionCount;
    const index: {[key: number]: number} = {};
    let j;

    // NOTE: float32 could lead to issues if edge array needs to index large
    // number of nodes.
    const NodeMatrix = new Float32Array(order * PPN);
    const EdgeMatrix = new Float32Array(size * PPE);

    // Iterate through nodes
    j = 0;

    for (let i = 0; i < graph.nodeCount; i++) {
        index[i] = j;

        // Populating byte array
        NodeMatrix[j] = graph.nodes.xCoordinates[i];
        NodeMatrix[j + 1] = graph.nodes.yCoordinates[i];
        NodeMatrix[j + 2] = 0; // dx
        NodeMatrix[j + 3] = 0; // dy
        NodeMatrix[j + 4] = 0; // old_dx
        NodeMatrix[j + 5] = 0; // old_dy
        NodeMatrix[j + 6] = 1; // mass
        NodeMatrix[j + 7] = 1; // convergence
        NodeMatrix[j + 8] = OSigma.getNodeSizeFeatureId(
            graph.nodes.features.length
        );
        NodeMatrix[j + 9] = 0;
        j += PPN;
    }

    // Iterate through edges
    j = 0;
    for (let i = 0; i < graph.connectionCount; i++) {
        const sj = index[graph.connections.from[i]];
        const tj = index[graph.connections.to[i]];

        const weight = graph.connections.value[i];

        // Incrementing mass to be a node's weighted degree
        NodeMatrix[sj + 6] += weight;
        NodeMatrix[tj + 6] += weight;

        // Populating byte array
        EdgeMatrix[j] = sj;
        EdgeMatrix[j + 1] = tj;
        EdgeMatrix[j + 2] = weight;
        j += PPE;
    }

    return {
        nodes: NodeMatrix,
        edges: EdgeMatrix,
    };
};

/**
 * Function applying the layout back to the graph.
 *
 * @param {Graph}         graph         - Target graph.
 * @param {Float32Array}  NodeMatrix    - Node matrix.
 * @param {function|null} outputReducer - A node reducer.
 */
export const assignLayoutChanges = function <
    TNodeMass extends TypedArray,
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(
    graph: OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    >,
    NodeMatrix: Float32Array,
) {
    let j = 0;

    
    for (let i = 0; i < graph.nodeCount; i++) {
        graph.nodes.xCoordinates[i] = NodeMatrix[j];
        graph.nodes.yCoordinates[i] = NodeMatrix[j + 1];

        j += PPN;
    }
};

/**
 * Function reading the positions (only) from the graph, to write them in the matrix.
 *
 * @param {Graph}        graph      - Target graph.
 * @param {Float32Array} NodeMatrix - Node matrix.
 */
export const readGraphPositions = function (graph: { forEachNode: (arg0: (node: any, attr: any) => void) => void; }, NodeMatrix: any[]) {
    let i = 0;

    graph.forEachNode(function (node: any, attr: { x: any; y: any; }) {
        NodeMatrix[i] = attr.x;
        NodeMatrix[i + 1] = attr.y;

        i += PPN;
    });
};

// /**
//  * Function collecting the layout positions.
//  *
//  * @param  {Graph}         graph         - Target graph.
//  * @param  {Float32Array}  NodeMatrix    - Node matrix.
//  * @param  {function|null} outputReducer - A nodes reducer.
//  * @return {object}                      - Map to node positions.
//  */
// export const collectLayoutChanges = function (
//     graph: { nodes: () => any; getNodeAttributes: (arg0: any) => any; },
//     NodeMatrix: string | any[],
//     outputReducer: (arg0: any, arg1: any) => any
// ) {
//     const nodes = graph.nodes(),
//         positions = {};

//     for (let i = 0, j = 0, l = NodeMatrix.length; i < l; i += PPN) {
//         if (outputReducer) {
//             let newAttr = Object.assign({}, graph.getNodeAttributes(nodes[j]));
//             newAttr.x = NodeMatrix[i];
//             newAttr.y = NodeMatrix[i + 1];
//             newAttr = outputReducer(nodes[j], newAttr);
//             positions[nodes[j]] = {
//                 x: newAttr.x,
//                 y: newAttr.y,
//             };
//         } else {
//             positions[nodes[j]] = {
//                 x: NodeMatrix[i],
//                 y: NodeMatrix[i + 1],
//             };
//         }

//         j++;
//     }

//     return positions;
// };

/**
 * Function returning a web worker from the given function.
 *
 * @param  {function}  fn - Function for the worker.
 * @return {DOMString}
 */
export const createWorker = function createWorker(fn: { toString: () => any; }) {
    const xURL = window.URL || window.webkitURL;
    const code = fn.toString();
    const objectUrl = xURL.createObjectURL(
        new Blob(["(" + code + ").call(this);"], { type: "text/javascript" })
    );
    const worker = new Worker(objectUrl);
    xURL.revokeObjectURL(objectUrl);

    return worker;
};

export default function applyGfa2<
    TNodeMass extends TypedArray,
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(
    graph: OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    >,
    params = {
        linLogMode: false,
        outboundAttractionDistribution: false,
        adjustSizes: false,
        edgeWeightInfluence: 1,
        scalingRatio: 1,
        strongGravityMode: false,
        gravity: 1,
        slowDown: 1,
        barnesHutOptimize: false,
        barnesHutTheta: 0.5,
        iterations: 50,
    }
) {
    const iterations = params.iterations;

    if (typeof iterations !== "number")
        throw new Error(
            "graphology-layout-forceatlas2: invalid number of iterations."
        );

    if (iterations <= 0)
        throw new Error(
            "graphology-layout-forceatlas2: you should provide a positive number of iterations."
        );

    // Building matrices
    const matrices = graphToByteArrays(graph);

    let i;

    // Iterating
    for (i = 0; i < iterations; i++)
        iterate(params, matrices.nodes, matrices.edges);

    assignLayoutChanges(graph, matrices.nodes);
}
