/**
 * osigma Unit Tests
 * =============================
 */
import assert from "assert";

import OSigma from "../../src";
import { OGraph } from "../../src/core/ograph";
import { TNodeVisual, TConnectionVisual } from "../../src/types";

type TId = Int32Array;
type TConnectionWeight = Uint8Array;
type TCoordinates = Float32Array;
type TZIndex = Uint8Array;
type TNodeFeatures = [Int8Array];
type TConnectionFeatures = [];

const createDefaultGraph = () =>
    new OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    >(
        {
            features: [
                new Int8Array([10]),
                new Uint8Array([2]),
                new Uint8Array([0]),
                new Uint8Array([10]),
                new Uint8Array([0]),
            ],
            xCoordinates: new Float32Array([20]),
            yCoordinates: new Float32Array([15]),
            zIndex: new Uint8Array([1.5]),
        },
        {
            from: new Int32Array([0]),
            to: new Int32Array([0]),
            value: new Uint8Array([0]),
            zIndex: new Uint8Array([1.5]),
            features: [
                new Uint8Array([2]),
                new Uint8Array([0]),
                new Uint8Array([10]),
                new Uint8Array([0]),
            ],
        }
    );

describe("osigma internal functions", () => {
    it("should encode and decode node flags correctly", () => {
        const graph = createDefaultGraph();

        const osigma = new OSigma(graph, null);

        const allHidden = [true, false];
        const allHighlighted = [true, false];
        const allForceLabel = [true, false];
        const allNodeType = [0, 1, 2, 3];

        allHidden.forEach((hidden) => {
            allHighlighted.forEach((highlighted) => {
                allForceLabel.forEach((forceLabel) => {
                    allNodeType.forEach((nodeType) => {
                        const input = [
                            hidden,
                            highlighted,
                            forceLabel,
                            nodeType,
                        ] as const;

                        const encoded = OSigma.encodeNodeFlags(...input);

                        const decoded = OSigma.decodeNodeFlags(encoded);

                        assert.deepEqual(
                            input,
                            decoded,
                            `${input} have been encode-decoded into ${decoded} via flags=${encoded}`
                        );
                    });
                });
            });
        });
    });
    it("should get separate node flag properties correctly", () => {
        const graph = createDefaultGraph();

        const osigma = new OSigma(graph, null);

        const allHidden = [true, false];
        const allHighlighted = [true, false];
        const allForceLabel = [true, false];
        const allNodeType = [0, 1, 2, 3];

        allHidden.forEach((hidden) => {
            allHighlighted.forEach((highlighted) => {
                allForceLabel.forEach((forceLabel) => {
                    allNodeType.forEach((nodeType) => {
                        const input = [
                            hidden,
                            highlighted,
                            forceLabel,
                            nodeType,
                        ] as const;

                        const encoded = OSigma.encodeNodeFlags(...input);
                        const nodeId = 0;
                        
                        osigma.getGraph().nodes.features[osigma.nodeFlagsFeatureId][nodeId] = encoded;

                        const decoded = [
                            osigma.isNodeHidden(nodeId),
                            osigma.isNodeHighlighted(nodeId),
                            osigma.isNodeForceLabeled(nodeId),
                            osigma.getNodeType(nodeId),
                        ];

                        assert.deepEqual(
                            input,
                            decoded,
                            `${input} have been encode-decoded into ${decoded} via flags=${encoded}`
                        );
                    });
                });
            });
        });
    });
    it("should encode and decode edge flags correctly", () => {
        const graph = createDefaultGraph();

        const osigma = new OSigma(graph, null);

        const allHidden = [true, false];
        const allForceLabel = [true, false];
        const allEdgeType = new Array(8).map((_, i) => i);

        allHidden.forEach((hidden) => {
            allForceLabel.forEach((forceLabel) => {
                allEdgeType.forEach((edgeType) => {
                    const input = [
                        hidden,
                        forceLabel,
                        edgeType,
                    ] as const;

                    const encoded = OSigma.encodeEdgeFlags(...input);

                    const decoded = OSigma.decodeEdgeFlags(encoded);

                    assert.deepEqual(
                        input,
                        decoded,
                        `${input} have been encode-decoded into ${decoded} via flags=${encoded}`
                    );
                });
            });
        });
    });
    it("should get separate edge flag properties correctly", () => {
        const graph = createDefaultGraph();

        const osigma = new OSigma(graph, null);

        const allHidden = [true, false];
        const allForceLabel = [true, false];
        const allEdgeType = new Array(8).map((_, i) => i);

        allHidden.forEach((hidden) => {
            allForceLabel.forEach((forceLabel) => {
                allEdgeType.forEach((edgeType) => {
                    const input = [
                        hidden,
                        forceLabel,
                        edgeType,
                    ] as const;

                    const encoded = OSigma.encodeEdgeFlags(...input);
                    const connectionId = 0;
                    
                    osigma.getGraph().nodes.features[osigma.nodeFlagsFeatureId][connectionId] = encoded;

                    const decoded = [
                        osigma.isEdgeHidden(connectionId),
                        osigma.isNodeHighlighted(connectionId),
                        osigma.getEdgeType(connectionId),
                    ];

                    assert.deepEqual(
                        input,
                        decoded,
                        `${input} have been encode-decoded into ${decoded} via flags=${encoded}`
                    );
                });
            });
        });
    });
});
