/**
 * osigma.js Settings
 * =================================
 *
 * The list of settings and some handy functions.
 * @module
 */
import { TypedArray } from "./core/ograph";
import { assign } from "./utils";
import drawLabel from "./rendering/canvas/label";
import drawHover from "./rendering/canvas/hover";
import drawEdgeLabel from "./rendering/canvas/edge-label";
// import { EdgeDisplayData, NodeDisplayData } from "./types";
// import EdgeRectangleProgram from "./rendering/webgl/programs/edge.rectangle";
// import EdgeArrowProgram from "./rendering/webgl/programs/edge.arrow";
import { EdgeProgramConstructor } from "./rendering/webgl/programs/common/edge";
import { NodeProgramConstructor } from "./rendering/webgl/programs/common/node";
import EdgeLineProgram from "./rendering/webgl/programs/edge.line";
import NodePointProgram from "./rendering/webgl/programs/node.point";
import EdgeArrowProgram from "./rendering/webgl/programs/edge.arrow";

/**
 * osigma.js settings
 * =================================
 */
export interface ValueSettings {
    // Performance
    hideEdgesOnMove: boolean;
    hideLabelsOnMove: boolean;
    renderLabels: boolean;
    renderEdgeLabels: boolean;
    enableEdgeClickEvents: boolean;
    enableEdgeWheelEvents: boolean;
    enableEdgeHoverEvents: boolean | "debounce";
    // Component rendering
    defaultNodeColor: number;
    defaultNodeSize: number;
    defaultNodeType: number;
    defaultEdgeColor: number;
    defaultEdgeType: number;
    labelFont: string;
    labelSize: number;
    labelWeight: string;
    labelColor:
        | { attribute: string; color?: string }
        | { color: string; attribute?: undefined };
    edgeLabelFont: string;
    edgeLabelSize: number;
    edgeLabelWeight: string;
    edgeLabelColor:
        | { attribute: string; color?: string }
        | { color: string; attribute?: undefined };
    stagePadding: number;
    zoomToSizeRatioFunction: (ratio: number) => number;
    itemSizesReference: "screen" | "positions";
    // Labels
    labelDensity: number;
    labelGridCellSize: number;
    labelRenderedSizeThreshold: number;
    // Features
    zIndex: boolean;
    minCameraRatio: null | number;
    maxCameraRatio: null | number;
    // Renderers
    labelRenderer: typeof drawLabel;
    hoverRenderer: typeof drawHover;
    edgeLabelRenderer: typeof drawEdgeLabel;
    // Lifecycle
    allowInvalidContainer: boolean;
}


export interface Settings<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> extends ValueSettings {
    // Reducers
    // nodeReducer:
    //     | null
    //     | ((node: string, data: Attributes) => Partial<NodeDisplayData>);
    // edgeReducer:
    //     | null
    //     | ((edge: string, data: Attributes) => Partial<EdgeDisplayData>);

    // Program classes
    nodeProgramClasses: {
        [type: number]: NodeProgramConstructor<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >;
    };
    nodeHoverProgramClasses: {
        [type: number]: NodeProgramConstructor<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >;
    };
    edgeProgramClasses: {
        [type: number]: EdgeProgramConstructor<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >;
    };
}

export const createDefaultSettings = <
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(): Settings<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures
> => ({
    // Performance
    hideEdgesOnMove: false,
    hideLabelsOnMove: false,
    renderLabels: true,
    renderEdgeLabels: false,
    enableEdgeClickEvents: false,
    enableEdgeWheelEvents: false,
    enableEdgeHoverEvents: false,

    // Component rendering
    defaultNodeColor: 1,
    defaultNodeSize: 10,
    defaultNodeType: 0,
    defaultEdgeColor: 2,
    defaultEdgeType: 0,
    labelFont: "Arial",
    labelSize: 14,
    labelWeight: "normal",
    labelColor: { color: "#000" },
    edgeLabelFont: "Arial",
    edgeLabelSize: 14,
    edgeLabelWeight: "normal",
    edgeLabelColor: { attribute: "color" },
    stagePadding: 30,
    zoomToSizeRatioFunction: Math.sqrt,
    itemSizesReference: "screen",

    // Labels
    labelDensity: 1,
    labelGridCellSize: 100,
    labelRenderedSizeThreshold: 6,

    // Reducers
    // nodeReducer: null,
    // edgeReducer: null,

    // Features
    zIndex: false,
    minCameraRatio: null,
    maxCameraRatio: null,

    // Renderers
    labelRenderer: drawLabel,
    hoverRenderer: drawHover,
    edgeLabelRenderer: drawEdgeLabel,

    // Lifecycle
    allowInvalidContainer: false,

    // Program classes
    nodeProgramClasses: {},
    nodeHoverProgramClasses: {},
    edgeProgramClasses: {},
});

export function validateSettings<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(
    settings: Settings<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >
): void {
    if (
        typeof settings.labelDensity !== "number" ||
        settings.labelDensity < 0
    ) {
        throw new Error(
            "Settings: invalid `labelDensity`. Expecting a positive number."
        );
    }

    const { minCameraRatio, maxCameraRatio } = settings;
    if (
        typeof minCameraRatio === "number" &&
        typeof maxCameraRatio === "number" &&
        maxCameraRatio < minCameraRatio
    ) {
        throw new Error(
            "Settings: invalid camera ratio boundaries. Expecting `maxCameraRatio` to be greater than `minCameraRatio`."
        );
    }
}

export function resolveSettings<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(
    settings: Partial<
        Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    >
): Settings<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures
> {

    const default_node_program_class = {
        0: NodePointProgram,
    };
    
    const default_edge_prograam_class = {
        0: EdgeLineProgram,
        1: EdgeArrowProgram,
    };

    const default_settings = createDefaultSettings();
    const resolvedSettings = assign({}, default_settings, settings);

    resolvedSettings.nodeProgramClasses = assign(
        {},
        default_node_program_class,
        resolvedSettings.nodeProgramClasses
    );
    resolvedSettings.edgeProgramClasses = assign(
        {},
        default_edge_prograam_class,
        resolvedSettings.edgeProgramClasses
    );

    return resolvedSettings;
}
