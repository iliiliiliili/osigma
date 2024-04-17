// export default function applyForceAtlas2() {return 1;}

import OSigma from "../osigma";
import { TConnectionVisual, TNodeVisual } from "../types";
import type { OGraph, TypedArray } from "./ograph";

const MAX_FORCE = 10;

export function forceAtlas2Step<
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
    options: {
        adjustSizes?: boolean;
        // barnesHutOptimize?: boolean;
        // barnesHutTheta?: number;
        edgeWeightInfluence?: number;
        gravity?: number;
        linLogMode?: boolean;
        outboundAttractionDistribution?: boolean;
        scalingRatio?: number;
        slowDown?: number;
        strongGravityMode?: boolean;
        nodeOldDxArray: TCoordinates;
        nodeOldDyArray: TCoordinates;
        nodeNewDxArray: TCoordinates;
        nodeNewDyArray: TCoordinates;
        nodeMass: TNodeMass;
        nodeConvergence: TCoordinates;
        debug?: boolean;
    }
) {
    const order = graph.nodeCount,
        size = graph.connectionCount;

    let outboundAttCompensation: number,
        coefficient: number,
        xDist: number,
        yDist: number,
        ewc: number,
        distance: number,
        factor: number;

    const adjustSizes = options.adjustSizes ?? false;
    const edgeWeightInfluence = options.edgeWeightInfluence ?? 1;
    const gravity = options.gravity ?? 1;
    const linLogMode = options.linLogMode ?? false;
    const outboundAttractionDistribution =
        options.outboundAttractionDistribution ?? false;
    const scalingRatio = options.scalingRatio ?? 1;
    const slowDown = options.slowDown ?? 1;
    const strongGravityMode = options.strongGravityMode ?? false;

    const debug = options.debug ?? false;

    const debugLog = debug
        ? (state: string) => {
              console.log({
                  state,
                  fdx: options.nodeNewDxArray[0],
                  fdy: options.nodeNewDyArray[0],
                  dx: options.nodeNewDxArray.slice(0, 10),
                  dy: options.nodeNewDyArray.slice(0, 10),
                  x: graph.nodes.xCoordinates.slice(0, 10),
                  y: graph.nodes.yCoordinates.slice(0, 10),
                  mass: options.nodeMass,
              });
          }
        : (_: string) => false;

    debugLog("start");

    const nodeSizeFeatureId = OSigma.getNodeSizeFeatureId(
        graph.nodes.features.length
    );

    // 1) Initializing layout data
    //-----------------------------

    // Resetting positions & computing max values
    for (let n = 0; n < order; n++) {
        options.nodeOldDxArray[n] = options.nodeNewDxArray[n];
        options.nodeOldDyArray[n] = options.nodeNewDyArray[n];
    }

    options.nodeNewDxArray.fill(0);
    options.nodeNewDyArray.fill(0);

    // If outbound attraction distribution, compensate
    outboundAttCompensation = 0;
    if (outboundAttractionDistribution) {
        for (let n = 0; n < order; n++) {
            outboundAttCompensation += options.nodeMass[n] / order;
        }
    }

    if (debug) {
        console.log({
            outboundAttractionDistribution,
            outboundAttCompensation,
        });
    }

    // 2) Repulsion
    //--------------
    // NOTES: adjustSizes = antiCollision & scalingRatio = coefficient
    if (true == true || true) {
        coefficient = scalingRatio;

        factor = 0;

        // Square iteration
        for (let n1 = 0; n1 < order; n1++) {
            for (let n2 = 0; n2 < n1; n2++) {
                // Common to both methods
                xDist =
                    graph.nodes.xCoordinates[n1] - graph.nodes.xCoordinates[n2];
                yDist =
                    graph.nodes.yCoordinates[n1] - graph.nodes.yCoordinates[n2];

                if (adjustSizes === true) {
                    //-- Anticollision Linear Repulsion
                    distance =
                        Math.sqrt(xDist * xDist + yDist * yDist) -
                        graph.nodes.features[nodeSizeFeatureId][n1] -
                        graph.nodes.features[nodeSizeFeatureId][n2];

                    if (distance > 0) {
                        factor =
                            (coefficient *
                                options.nodeMass[n1] *
                                options.nodeMass[n2]) /
                            distance /
                            distance;

                        // Updating nodes' dx and dy
                        options.nodeNewDxArray[n1] += xDist * factor;
                        options.nodeNewDyArray[n1] += yDist * factor;

                        options.nodeNewDxArray[n2] -= xDist * factor;
                        options.nodeNewDyArray[n2] -= yDist * factor;
                    } else if (distance < 0) {
                        factor =
                            100 *
                            coefficient *
                            options.nodeMass[n1] *
                            options.nodeMass[n2];

                        // Updating nodes' dx and dy
                        options.nodeNewDxArray[n1] += xDist * factor;
                        options.nodeNewDyArray[n1] += yDist * factor;

                        options.nodeNewDxArray[n2] -= xDist * factor;
                        options.nodeNewDyArray[n2] -= yDist * factor;
                    }
                } else {
                    //-- Linear Repulsion
                    distance = Math.sqrt(xDist * xDist + yDist * yDist);

                    if (distance > 0) {
                        factor =
                            (coefficient *
                                options.nodeMass[n1] *
                                options.nodeMass[n2]) /
                            distance;

                        // Updating nodes' dx and dy
                        options.nodeNewDxArray[n1] += xDist * factor;
                        options.nodeNewDyArray[n1] += yDist * factor;

                        options.nodeNewDxArray[n2] -= xDist * factor;
                        options.nodeNewDyArray[n2] -= yDist * factor;
                    }
                }

                if (debug && n2 == 0 && n1 < 4) {
                    console.log({
                        state: `repulsion values ${n1} ${n2}`,
                        xDist,
                        yDist,
                        factor,
                        m1: options.nodeMass[n1],
                        m2: options.nodeMass[n2],
                    });
                }
            }
        }
    }

    debugLog("repulsed");

    // 3) Gravity
    //------------
    const g = gravity / scalingRatio;
    coefficient = scalingRatio;
    for (let n = 0; n < order; n++) {
        factor = 0;

        // Common to both methods
        xDist = graph.nodes.xCoordinates[n];
        yDist = graph.nodes.yCoordinates[n];
        distance = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

        if (strongGravityMode) {
            //-- Strong gravity
            if (distance > 0) factor = coefficient * options.nodeMass[n] * g;
        } else {
            //-- Linear Anti-collision Repulsion n
            if (distance > 0)
                factor = (coefficient * options.nodeMass[n] * g) / distance;
        }

        // Updating node's dx and dy
        options.nodeNewDxArray[n] -= xDist * factor;
        options.nodeNewDyArray[n] -= yDist * factor;
    }

    debugLog("applied gravity");

    // 4) Attraction
    //---------------
    coefficient =
        1 * (outboundAttractionDistribution ? outboundAttCompensation : 1);

    // TODO: simplify distance
    // TODO: coefficient is always used as -c --> optimize?
    for (let e = 0; e < size; e++) {
        const n1 = graph.connections.from[e];
        const n2 = graph.connections.to[e];
        const w = graph.connections.value[e];

        // Edge weight influence
        ewc = Math.pow(w, edgeWeightInfluence);

        // Common measures
        xDist = graph.nodes.xCoordinates[n1] - graph.nodes.xCoordinates[n2];
        yDist = graph.nodes.yCoordinates[n1] - graph.nodes.yCoordinates[n2];

        factor = 1;

        // Applying attraction to nodes
        if (adjustSizes === true) {
            distance =
                Math.sqrt(xDist * xDist + yDist * yDist) -
                graph.nodes.features[nodeSizeFeatureId][n1] -
                graph.nodes.features[nodeSizeFeatureId][n2];

            if (linLogMode) {
                if (outboundAttractionDistribution) {
                    //-- LinLog Degree Distributed Anti-collision Attraction
                    if (distance > 0) {
                        factor =
                            (-coefficient * ewc * Math.log(1 + distance)) /
                            distance /
                            options.nodeMass[n1];
                    }
                } else {
                    //-- LinLog Anti-collision Attraction
                    if (distance > 0) {
                        factor =
                            (-coefficient * ewc * Math.log(1 + distance)) /
                            distance;
                    }
                }
            } else {
                if (outboundAttractionDistribution) {
                    //-- Linear Degree Distributed Anti-collision Attraction
                    if (distance > 0) {
                        factor = (-coefficient * ewc) / options.nodeMass[n1];
                    }
                } else {
                    //-- Linear Anti-collision Attraction
                    if (distance > 0) {
                        factor = -coefficient * ewc;
                    }
                }
            }
        } else {
            distance = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));

            if (linLogMode) {
                if (outboundAttractionDistribution) {
                    //-- LinLog Degree Distributed Attraction
                    if (distance > 0) {
                        factor =
                            (-coefficient * ewc * Math.log(1 + distance)) /
                            distance /
                            options.nodeMass[n1];
                    }
                } else {
                    //-- LinLog Attraction
                    if (distance > 0)
                        factor =
                            (-coefficient * ewc * Math.log(1 + distance)) /
                            distance;
                }
            } else {
                if (outboundAttractionDistribution) {
                    //-- Linear Attraction Mass Distributed
                    // NOTE: Distance is set to 1 to override next condition
                    distance = 1;
                    factor = (-coefficient * ewc) / options.nodeMass[n1];
                } else {
                    //-- Linear Attraction
                    // NOTE: Distance is set to 1 to override next condition
                    distance = 1;
                    factor = -coefficient * ewc;
                }
            }
        }

        // Updating nodes' dx and dy
        // TODO: if condition or factor = 1?
        if (distance > 0) {
            // Updating nodes' dx and dy
            options.nodeNewDxArray[n1] += xDist * factor;
            options.nodeNewDyArray[n1] += yDist * factor;

            options.nodeNewDxArray[n2] -= xDist * factor;
            options.nodeNewDyArray[n2] -= yDist * factor;
        }
    }

    debugLog("applied attraction");

    // 5) Apply Forces
    //-----------------
    let force: number,
        swinging: number,
        traction: number,
        nodespeed: number,
        newX: number,
        newY: number;

    // MATH: sqrt and square distances
    if (adjustSizes) {
        for (let n = 0; n < order; n++) {
            force = Math.sqrt(
                Math.pow(graph.nodes.xCoordinates[n], 2) +
                    Math.pow(graph.nodes.yCoordinates[n], 2)
            );

            if (force > MAX_FORCE) {
                options.nodeNewDxArray[n] =
                    (options.nodeNewDxArray[n] * MAX_FORCE) / force;
                options.nodeNewDyArray[n] =
                    (options.nodeNewDyArray[n] * MAX_FORCE) / force;
            }

            swinging =
                options.nodeMass[n] *
                Math.sqrt(
                    (options.nodeOldDxArray[n] - options.nodeNewDxArray[n]) *
                        (options.nodeOldDxArray[n] -
                            options.nodeNewDxArray[n]) +
                        (options.nodeOldDyArray[n] -
                            options.nodeNewDyArray[n]) *
                            (options.nodeOldDyArray[n] -
                                options.nodeNewDyArray[n])
                );

            traction =
                Math.sqrt(
                    (options.nodeOldDxArray[n] + options.nodeNewDxArray[n]) *
                        (options.nodeOldDxArray[n] +
                            options.nodeNewDxArray[n]) +
                        (options.nodeOldDyArray[n] +
                            options.nodeNewDyArray[n]) *
                            (options.nodeOldDyArray[n] +
                                options.nodeNewDyArray[n])
                ) / 2;

            nodespeed =
                (0.1 * Math.log(1 + traction)) / (1 + Math.sqrt(swinging));

            // Updating node's positon
            newX =
                options.nodeNewDxArray[n] +
                options.nodeOldDxArray[n] * (nodespeed / slowDown);
            graph.nodes.xCoordinates[n] = newX;

            newY =
                options.nodeNewDyArray[n] +
                options.nodeOldDyArray[n] * (nodespeed / slowDown);
            graph.nodes.yCoordinates[n] = newY;
        }
    } else {
        for (let n = 0; n < order; n++) {
            swinging =
                options.nodeMass[n] *
                Math.sqrt(
                    (options.nodeOldDxArray[n] - options.nodeNewDxArray[n]) *
                        (options.nodeOldDxArray[n] -
                            options.nodeNewDxArray[n]) +
                        (options.nodeOldDyArray[n] -
                            options.nodeNewDyArray[n]) *
                            (options.nodeOldDyArray[n] -
                                options.nodeNewDyArray[n])
                );

            traction =
                Math.sqrt(
                    (options.nodeOldDxArray[n] + options.nodeNewDxArray[n]) *
                        (options.nodeOldDxArray[n] +
                            options.nodeNewDxArray[n]) +
                        (options.nodeOldDyArray[n] +
                            options.nodeNewDyArray[n]) *
                            (options.nodeOldDyArray[n] +
                                options.nodeNewDyArray[n])
                ) / 2;

            nodespeed =
                (options.nodeConvergence[n] * Math.log(1 + traction)) /
                (1 + Math.sqrt(swinging));

            // Updating node convergence
            options.nodeConvergence[n] = Math.min(
                1,
                Math.sqrt(
                    (nodespeed *
                        (Math.pow(options.nodeNewDxArray[n], 2) +
                            Math.pow(options.nodeNewDyArray[n], 2))) /
                        (1 + Math.sqrt(swinging))
                )
            );

            // Updating node's positon
            newX =
                options.nodeNewDxArray[n] +
                options.nodeOldDxArray[n] * (nodespeed / slowDown);
            graph.nodes.xCoordinates[n] = newX;

            newY =
                options.nodeNewDyArray[n] +
                options.nodeOldDyArray[n] * (nodespeed / slowDown);
            graph.nodes.yCoordinates[n] = newY;
        }
    }

    debugLog("applied forces");
}

export default function applyForceAtlas2<
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
    options: {
        steps?: number;
        adjustSizes?: boolean;
        // barnesHutOptimize?: boolean;
        // barnesHutTheta?: number;
        edgeWeightInfluence?: number;
        gravity?: number;
        linLogMode?: boolean;
        outboundAttractionDistribution?: boolean;
        scalingRatio?: number;
        slowDown?: number;
        strongGravityMode?: boolean;
        nodeMassCreator: (count: number) => TNodeMass;
        coordinatesCreator: (count: number) => TCoordinates;
        verbose?: boolean;
        debug?: boolean;
    }
) {
    const steps = options.steps ?? 50;
    const verbose = options.verbose ?? true;

    const nodeOldDxArray = options.coordinatesCreator(graph.nodeCount).fill(0);
    const nodeOldDyArray = options.coordinatesCreator(graph.nodeCount).fill(0);
    const nodeNewDxArray = options.coordinatesCreator(graph.nodeCount).fill(0);
    const nodeNewDyArray = options.coordinatesCreator(graph.nodeCount).fill(0);
    const nodeMass = options.nodeMassCreator(graph.nodeCount).fill(1);
    const nodeConvergence = options.coordinatesCreator(graph.nodeCount).fill(1);

    if (verbose) {
        console.log("ForceAtlas2: Computing mass");
    }

    // for (let i = 0; i < graph.connectionCount; i++) {
    //     const from = graph.connections.from[i];
    //     const to = graph.connections.to[i];
    //     const value = graph.connections.value[i];

    //     nodeMass[from] += value;
    //     nodeMass[to] += value;
    // }

    // for (let i = 0; i < graph.nodeCount; i++) {
    //     nodeMass[i] = Math.sqrt(nodeMass[i]);
    // }

    if (verbose) {
        console.log("ForceAtlas2: Computing steps");
    }

    for (let i = 0; i < steps; i++) {
        if (verbose) {
            console.log("ForceAtlas2: step");
        }

        forceAtlas2Step(graph, {
            ...options,
            nodeOldDxArray,
            nodeOldDyArray,
            nodeNewDxArray,
            nodeNewDyArray,
            nodeMass,
            nodeConvergence,
        });
    }

    if (verbose) {
        console.log("ForceAtlas2: done");
    }
}
