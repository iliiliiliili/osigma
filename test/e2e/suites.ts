import { Page } from "puppeteer";

import OSigma from "../../src";
import { OGraph, TypedArray } from "../../src/core/ograph";
import {
    NodeDisplayData,
    EdgeDisplayData,
    TNodeVisual,
    TConnectionVisual,
    nodeVisualConstructorFromData,
    connectionVisualConstructorFromData,
} from "../../src/types";
import { ValueChoices } from "../../src/value-choices";

type TId = Int32Array;
type TConnectionWeight = Uint8Array;
type TCoordinates = Float32Array;
type TZIndex = Uint8Array;
type TNodeFeatures = [Int8Array];
type TConnectionFeatures = [];

type TestDependencies = {
    OSigma: typeof OSigma;
    OGraph: typeof OGraph;
    ValueChoices: typeof ValueChoices;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    programs: { [key: string]: any };
    data: {
        arcticBig: [
            OGraph<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                [...TNodeFeatures, ...TNodeVisual],
                [...TConnectionFeatures, ...TConnectionVisual]
            >,
            ValueChoices
        ];
        arcticSmall: [
            OGraph<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                [...TNodeFeatures, ...TNodeVisual],
                [...TConnectionFeatures, ...TConnectionVisual]
            >,
            ValueChoices
        ];
        lesBig: [
            OGraph<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                [...TNodeFeatures, ...TNodeVisual],
                [...TConnectionFeatures, ...TConnectionVisual]
            >,
            ValueChoices
        ];
        lesSmall: [
            OGraph<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                [...TNodeFeatures, ...TNodeVisual],
                [...TConnectionFeatures, ...TConnectionVisual]
            >,
            ValueChoices
        ];
    };
    nodeVisualConstructorFromData: typeof nodeVisualConstructorFromData;
    connectionVisualConstructorFromData: typeof connectionVisualConstructorFromData;
    container: HTMLElement;
};

declare global {
    const dependencies: TestDependencies;
}

export type Tests = Array<{
    name: string; // Name of the screenshot, without the extension like for example 'example-basic'
    waitFor?: number; // Time to wait in ms before to take the screenshot
    scenario: (page: Page) => Promise<void>;
    failureThreshold?: number; // between 0 and 1, it's a percent. By default it's a small epsilon.
    dimensions?: { width: number; height: number };
}>;

export const tests: Tests = [
    {
        name: "single-node",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    0
                );

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [new Int8Array([10])];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [111],
                        [0],
                        [10],
                        [defaultNodeFlags]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([0]),
                        yCoordinates: new Float32Array([0]),
                        zIndex: new Uint8Array([0]),
                    },
                    {
                        from: new Int32Array([0]),
                        to: new Int32Array([0]),
                        value: new Uint8Array([0]),
                        zIndex: new Uint8Array([0]),
                        features: connectionVisualConstructorFromData(
                            [2],
                            [0],
                            [10],
                            [defaultEdgeFlags]
                        ),
                    }
                );

                new OSigma(graph, container, {}, false);
            });
        },
    },
    {
        name: "square",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    0
                );

                const arrowEdgeFlags = OSigma.encodeEdgeFlags(false, false, 1);

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [
                    new Int8Array([10, 11, 12, 13]),
                ];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [111, 112, 113, 114],
                        [1, 2, 3, 4],
                        [10, 10, 10, 10],
                        [
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                        ]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([0, 0, 10, 10]),
                        yCoordinates: new Float32Array([0, 10, 10, 0]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1, 2, 3, 0, 1]),
                        to: new Int32Array([1, 2, 3, 0, 2, 3]),
                        value: new Uint8Array([0, 2, 1, 2, 4, 5]),
                        zIndex: new Uint8Array([0, 0, 0, 0, 0, 0]),
                        features:
                            // TColor, TLabel, TSize, TEdgeFlags
                            connectionVisualConstructorFromData(
                                [129, 129, 129, 129, 111, 111],
                                [0, 0, 0, 0, 0, 0],
                                [5, 5, 5, 5, 5, 5],
                                [
                                    arrowEdgeFlags,
                                    arrowEdgeFlags,
                                    arrowEdgeFlags,
                                    arrowEdgeFlags,
                                    defaultEdgeFlags,
                                    defaultEdgeFlags,
                                ]
                            ),
                    }
                );

                new OSigma(
                    graph,
                    container,
                    {
                        // renderEdgeLabels: true,
                        // labelRenderedSizeThreshold: -Infinity,
                    },
                    false
                );
            });
        },
    },
    {
        name: "aspect-ratio-vertical-graph-horizontal-container",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    0
                );

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [
                    new Int8Array([10, 11, 12, 13]),
                ];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [111, 112, 113, 114],
                        [1, 2, 3, 4],
                        [10, 10, 10, 10],
                        [
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                        ]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([0, 0, 5, 5]),
                        yCoordinates: new Float32Array([0, 10, 10, 0]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1]),
                        to: new Int32Array([2, 3]),
                        value: new Uint8Array([4, 5]),
                        zIndex: new Uint8Array([0, 0]),
                        features:
                            // TColor, TLabel, TSize, TEdgeFlags
                            connectionVisualConstructorFromData(
                                [129, 129],
                                [0, 0],
                                [5, 5],
                                [defaultEdgeFlags, defaultEdgeFlags]
                            ),
                    }
                );

                new OSigma(graph, container, {}, false);
            });
        },
        dimensions: { width: 800, height: 400 },
    },
    {
        name: "aspect-ratio-horizontal-graph-horizontal-container",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    0
                );

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [
                    new Int8Array([10, 11, 12, 13]),
                ];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [111, 112, 113, 114],
                        [1, 2, 3, 4],
                        [10, 10, 10, 10],
                        [
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                        ]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([0, 0, 10, 10]),
                        yCoordinates: new Float32Array([0, 5, 5, 0]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1]),
                        to: new Int32Array([2, 3]),
                        value: new Uint8Array([4, 5]),
                        zIndex: new Uint8Array([0, 0]),
                        features:
                            // TColor, TLabel, TSize, TEdgeFlags
                            connectionVisualConstructorFromData(
                                [129, 129],
                                [0, 0],
                                [5, 5],
                                [defaultEdgeFlags, defaultEdgeFlags]
                            ),
                    }
                );

                new OSigma(graph, container, {}, false);
            });
        },
        dimensions: { width: 800, height: 400 },
    },
    {
        name: "aspect-ratio-horizontal-graph-vertical-container",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    0
                );

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [
                    new Int8Array([10, 11, 12, 13]),
                ];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [111, 112, 113, 114],
                        [1, 2, 3, 4],
                        [10, 10, 10, 10],
                        [
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                        ]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([0, 0, 10, 10]),
                        yCoordinates: new Float32Array([0, 5, 5, 0]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1]),
                        to: new Int32Array([2, 3]),
                        value: new Uint8Array([4, 5]),
                        zIndex: new Uint8Array([0, 0]),
                        features:
                            // TColor, TLabel, TSize, TEdgeFlags
                            connectionVisualConstructorFromData(
                                [129, 129],
                                [0, 0],
                                [5, 5],
                                [defaultEdgeFlags, defaultEdgeFlags]
                            ),
                    }
                );

                new OSigma(graph, container, {}, false);
            });
        },
        dimensions: { width: 400, height: 800 },
    },
    {
        name: "aspect-ratio-vertical-graph-vertical-container",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    0
                );

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [
                    new Int8Array([10, 11, 12, 13]),
                ];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [111, 112, 113, 114],
                        [1, 2, 3, 4],
                        [10, 10, 10, 10],
                        [
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                        ]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([0, 0, 5, 5]),
                        yCoordinates: new Float32Array([0, 10, 10, 0]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1]),
                        to: new Int32Array([2, 3]),
                        value: new Uint8Array([4, 5]),
                        zIndex: new Uint8Array([0, 0]),
                        features:
                            // TColor, TLabel, TSize, TEdgeFlags
                            connectionVisualConstructorFromData(
                                [129, 129],
                                [0, 0],
                                [5, 5],
                                [defaultEdgeFlags, defaultEdgeFlags]
                            ),
                    }
                );

                new OSigma(graph, container, {}, false);
            });
        },
        dimensions: { width: 400, height: 800 },
    },
    {
        name: "settings",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    0
                );

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [
                    new Int8Array([10, 11, 12, 13]),
                ];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [0, 0, 0, 0],
                        [1, 2, 3, 4],
                        [10, 10, 10, 10],
                        [
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                            defaultNodeFlags,
                        ]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([0, 0, 5, 5]),
                        yCoordinates: new Float32Array([0, 10, 10, 0]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1]),
                        to: new Int32Array([2, 3]),
                        value: new Uint8Array([4, 5]),
                        zIndex: new Uint8Array([0, 0]),
                        features:
                            // TColor, TLabel, TSize, TEdgeFlags
                            connectionVisualConstructorFromData(
                                [0, 0],
                                [0, 0],
                                [5, 5],
                                [defaultEdgeFlags, defaultEdgeFlags]
                            ),
                    }
                );

                new OSigma(
                    graph,
                    container,
                    {
                        defaultNodeColor: 120,
                        defaultEdgeColor: 129,
                    },
                    true
                );
            });
        },
    },
    {
        name: "les-miserables-small",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { lesSmall },
                } = dependencies;

                const graph = lesSmall[0];
                const valueChoices = lesSmall[1];

                new OSigma(graph, container, {}, false, valueChoices);
            });
        },
    },
    {
        name: "les-miserables-big",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { lesBig },
                } = dependencies;

                const graph = lesBig[0];
                const valueChoices = lesBig[1];

                new OSigma(graph, container, {}, false, valueChoices);
            });
        },
        dimensions: { width: 5400, height: 5800 },
    },
    {
        name: "arctic-small",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { arcticSmall },
                } = dependencies;

                const graph = arcticSmall[0];
                const valueChoices = arcticSmall[1];

                new OSigma(graph, container, {}, false, valueChoices);
            });
        },
    },
    {
        name: "arctic-big",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { arcticBig },
                } = dependencies;

                const graph = arcticBig[0];
                const valueChoices = arcticBig[1];

                new OSigma(graph, container, {}, false, valueChoices);
            });
        },
        dimensions: { width: 5400, height: 5800 },
    },
    {
        name: "camera-state-unzoom-pan",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { lesSmall },
                } = dependencies;

                const graph = lesSmall[0];
                const valueChoices = lesSmall[1];

                const renderer = new OSigma(
                    graph,
                    container,
                    {},
                    false,
                    valueChoices
                );

                renderer.getCamera().setState({ ratio: 3, x: 0.8, y: 0.7 });

            });
        },
    },
    {
        name: "camera-state-zoom-pan",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { lesSmall },
                } = dependencies;

                const graph = lesSmall[0];
                const valueChoices = lesSmall[1];

                const renderer = new OSigma(
                    graph,
                    container,
                    {},
                    false,
                    valueChoices
                );

                renderer.getCamera().setState({ ratio: 1 / 3, x: 0.8, y: 0.7 });

            });
        },
    },
    {
        name: "custom-zoomToSizeRatioFunction",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { lesSmall },
                } = dependencies;

                const graph = lesSmall[0];
                const valueChoices = lesSmall[1];

                const renderer = new OSigma(
                    graph,
                    container,
                    {
                        zoomToSizeRatioFunction: (x) => x,
                    },
                    false,
                    valueChoices
                );

                renderer.getCamera().setState({ ratio: 3, x: 0.8, y: 0.7 });

            });
        },
    },
    {
        name: "camera-state-rotation",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { arcticSmall },
                } = dependencies;

                const graph = arcticSmall[0];
                const valueChoices = arcticSmall[1];

                const renderer = new OSigma(
                    graph,
                    container,
                    {},
                    false,
                    valueChoices
                );

                renderer.getCamera().setState({ angle: 30 });

            });
        },
    },
    {
        name: "les-miserables-mouse-wheel",
        waitFor: 5000,
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    container,
                    data: { lesSmall },
                } = dependencies;

                const graph = lesSmall[0];
                const valueChoices = lesSmall[1];

                new OSigma(
                    graph,
                    container,
                    {},
                    false,
                    valueChoices
                );

                const element = document.getElementsByClassName("osigma-mouse")[0];
                const cEvent: Event & { clientX?: number; clientY?: number; deltaY?: number } = new Event("wheel");
                cEvent.clientX = 0;
                cEvent.clientY = 0;
                cEvent.deltaY = -100;
                element.dispatchEvent(cEvent);

            });
        },
    },
    {
        name: "node-edge-state",
        waitFor: 2000,
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {

                const {
                    OSigma,
                    OGraph,
                    ValueChoices,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                } = dependencies;

                const defaultNodeFlags = OSigma.encodeNodeFlags(
                    false,
                    false,
                    false,
                    0
                );

                const defaultEdgeFlags = OSigma.encodeEdgeFlags(
                    false,
                    false,
                    1
                );

                // Feature0, TColor, TLabel, TSize, TEdgeFlags
                const features: TypedArray[] = [
                    new Int8Array([10, 11, 12, 13]),
                ];

                const labels = ["", "Alice", "Bob", "Charles", "Deborah"];

                // eslint-disable-next-line prefer-spread
                features.push.apply(
                    features,
                    nodeVisualConstructorFromData(
                        [11, 112, 213, 64],
                        [1, 2, 3, 4],
                        [10, 50, 5, 5],
                        [
                            OSigma.encodeNodeFlags(false, true, false, 0),
                            defaultNodeFlags,
                            defaultNodeFlags,
                            OSigma.encodeNodeFlags(true, false, false, 0),
                        ]
                    )
                );

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    [...TNodeFeatures, ...TNodeVisual],
                    [...TConnectionFeatures, ...TConnectionVisual]
                >(
                    {
                        features: features as [
                            ...TNodeFeatures,
                            ...TNodeVisual
                        ],
                        xCoordinates: new Float32Array([-2, 1, 2, -1]),
                        yCoordinates: new Float32Array([1, 2, -1, -2]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1, 2, 3]),
                        to: new Int32Array([1, 2, 3, 0]),
                        value: new Uint8Array([4, 5, 1, 2]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                        features:
                            // TColor, TLabel, TSize, TEdgeFlags
                            connectionVisualConstructorFromData(
                                [129, 129, 129, 129],
                                [0, 0, 0, 0],
                                [1, 2, 3, 20],
                                [OSigma.encodeEdgeFlags(true, false, 1), defaultEdgeFlags, defaultEdgeFlags, defaultEdgeFlags]
                            ),
                    }
                );

                new OSigma(graph, container, {}, false, new ValueChoices(labels));

            });
        },
    },
    // {
    //     name: "programs",
    //     scenario: async (page: Page): Promise<void> => {
    //         await page.evaluate(() => {
    //             // const { Graph, osigma, container, programs } = dependencies;
    //             // const {
    //             //     NodeCircleProgram,
    //             //     NodePointProgram,
    //             //     getNodeImageProgram,
    //             //     EdgeRectangleProgram,
    //             //     EdgeLineProgram,
    //             //     EdgeArrowProgram,
    //             //     EdgeTriangleProgram,
    //             // } = programs;

    //             // const graph = new Graph();
    //             // graph.addNode("n1", {
    //             //     x: 30,
    //             //     y: 120,
    //             //     size: 15,
    //             //     label: "Node 1",
    //             //     type: "node",
    //             //     color: "#ffcc00",
    //             // });
    //             // graph.addNode("n2", {
    //             //     x: 120,
    //             //     y: -30,
    //             //     size: 15,
    //             //     label: "Node 2",
    //             //     type: "fast",
    //             //     color: "#00ffcc",
    //             // });
    //             // graph.addNode("n3", {
    //             //     x: -30,
    //             //     y: -120,
    //             //     size: 15,
    //             //     label: "Node 3",
    //             //     type: "image",
    //             //     color: "#cc00ff",
    //             // });
    //             // graph.addNode("n4", {
    //             //     x: -120,
    //             //     y: 30,
    //             //     size: 15,
    //             //     label: "Node 4",
    //             //     type: "image",
    //             //     image: "data:image/png;base64,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",
    //             //     color: "#ccff00",
    //             // });

    //             // graph.addEdge("n1", "n2", { type: "edge", size: 30 });
    //             // graph.addEdge("n2", "n3", { type: "fast", size: 30 });
    //             // graph.addEdge("n3", "n4", { type: "arrow", size: 30 });
    //             // graph.addEdge("n4", "n1", { type: "triangle", size: 30 });

    //             // new osigma(graph, container, {
    //             //     nodeProgramClasses: {
    //             //         node: NodeCircleProgram,
    //             //         fast: NodePointProgram,
    //             //         image: getNodeImageProgram(),
    //             //     },
    //             //     edgeProgramClasses: {
    //             //         edge: EdgeRectangleProgram,
    //             //         fast: EdgeLineProgram,
    //             //         arrow: EdgeArrowProgram,
    //             //         triangle: EdgeTriangleProgram,
    //             //     },
    //             // });
    //         });
    //     },
    // },
    // {
    //     name: "force-labels",
    //     scenario: async (page: Page): Promise<void> => {
    //         await page.evaluate(() => {
    //             // const { Graph, osigma, container } = dependencies;

    //             // const graph = new Graph();
    //             // graph.addNode("upper-left", {
    //             //     x: 0,
    //             //     y: 0,
    //             //     size: 5,
    //             //     label: "upper left",
    //             //     forceLabel: true,
    //             // });
    //             // graph.addNode("upper-right", {
    //             //     x: 10,
    //             //     y: 0,
    //             //     size: 5,
    //             //     label: "upper right",
    //             //     forceLabel: true,
    //             // });
    //             // graph.addNode("lower-left", {
    //             //     x: 0,
    //             //     y: 10,
    //             //     size: 5,
    //             //     label: "lower left",
    //             // });
    //             // graph.addNode("lower-right", {
    //             //     x: 10,
    //             //     y: 10,
    //             //     size: 15,
    //             //     label: "lower right",
    //             // });

    //             // graph.addEdge("upper-left", "upper-right", {
    //             //     type: "arrow",
    //             //     size: 5,
    //             //     label: "right",
    //             // });
    //             // graph.addEdge("upper-right", "lower-right", {
    //             //     type: "arrow",
    //             //     size: 5,
    //             //     label: "down",
    //             // });
    //             // graph.addEdge("lower-right", "lower-left", {
    //             //     type: "arrow",
    //             //     size: 5,
    //             //     label: "left",
    //             //     forceLabel: true,
    //             // });
    //             // graph.addEdge("lower-left", "upper-left", {
    //             //     type: "arrow",
    //             //     size: 5,
    //             //     label: "up",
    //             //     forceLabel: true,
    //             // });

    //             // new osigma(graph, container, {
    //             //     renderEdgeLabels: true,
    //             //     labelRenderedSizeThreshold: 10,
    //             // });
    //         });
    //     },
    // },
];
