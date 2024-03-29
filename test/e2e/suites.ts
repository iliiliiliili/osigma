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
        name: "visual-from-spatial",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {
                const {
                    OSigma,
                    OGraph,
                    container,
                } = dependencies;

                const graph = new OGraph<
                    TId,
                    TConnectionWeight,
                    TCoordinates,
                    TZIndex,
                    TNodeFeatures,
                    TConnectionFeatures
                >(
                    {
                        features: [new Int8Array([10, 11, 12, 13])],
                        xCoordinates: new Float32Array([0, 0, 10, 10]),
                        yCoordinates: new Float32Array([0, 10, 10, 0]),
                        zIndex: new Uint8Array([0, 0, 0, 0]),
                    },
                    {
                        from: new Int32Array([0, 1, 2, 3, 0, 1]),
                        to: new Int32Array([1, 2, 3, 0, 2, 3]),
                        value: new Uint8Array([0, 2, 1, 2, 4, 5]),
                        zIndex: new Uint8Array([0, 0, 0, 0, 0, 0]),
                        features: [],
                    }
                );

                new OSigma(
                    OSigma.makeVisualGraph(graph),
                    container,
                    {},
                    true,
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
    {
        name: "programs",
        scenario: async (page: Page): Promise<void> => {
            await page.evaluate(() => {

                const {
                    OSigma,
                    OGraph,
                    ValueChoices,
                    container,
                    nodeVisualConstructorFromData,
                    connectionVisualConstructorFromData,
                    programs,
                } = dependencies;

                const NodeCircleProgram = programs["NodeCircleProgram"];
                const NodePointProgram = programs["NodePointProgram"];
                // const getNodeImageProgram = programs["getNodeImageProgram"];
                const EdgeLineProgram = programs["EdgeLineProgram"];
                const EdgeRectangleProgram = programs["EdgeRectangleProgram"];
                const EdgeArrowProgram = programs["EdgeArrowProgram"];
                const EdgeTriangleProgram = programs["EdgeTriangleProgram"];

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
                        [10, 50, 5, 13],
                        [
                            OSigma.encodeNodeFlags(false, false, false, 0),
                            OSigma.encodeNodeFlags(false, false, false, 1),
                            OSigma.encodeNodeFlags(false, false, false, 0),
                            OSigma.encodeNodeFlags(false, false, false, 1),
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
                                [
                                    OSigma.encodeEdgeFlags(false, false, 0),
                                    OSigma.encodeEdgeFlags(false, false, 1),
                                    OSigma.encodeEdgeFlags(false, false, 2),
                                    OSigma.encodeEdgeFlags(false, false, 3),
                                ]
                            ),
                    }
                );

                new OSigma(graph, container, {
                    nodeProgramClasses: {
                        0: NodeCircleProgram,
                        1: NodePointProgram,
                    },
                    edgeProgramClasses: {
                        0: EdgeLineProgram,
                        1: EdgeRectangleProgram,
                        2: EdgeArrowProgram,
                        3: EdgeTriangleProgram,
                    }
                }, false, new ValueChoices(labels));
            });
        },
    },
];
