// Dependencies
import OSigma from "../../../src";
import { OGraph } from "../../../src/core/ograph";
import {
    JsonVerboseGraph,
    jsonVerboseToVisualOGraph,
} from "../../../src/core/ograph-loaders";

// Programs to test
import NodeCircleProgram from "../../../src/rendering/webgl/programs/node.circle";
import NodePointProgram from "../../../src/rendering/webgl/programs/node.point";
import getNodeImageProgram from "../../../src/rendering/webgl/programs/node.image";
import EdgeRectangleProgram from "../../../src/rendering/webgl/programs/edge.rectangle";
import EdgeLineProgram from "../../../src/rendering/webgl/programs/edge.line";
import EdgeArrowProgram from "../../../src/rendering/webgl/programs/edge.arrow";
import EdgeTriangleProgram from "../../../src/rendering/webgl/programs/edge.triangle";
import {
    TConnectionVisual,
    TNodeVisual,
    connectionVisualConstructor,
    nodeVisualConstructor,
    nodeVisualConstructorFromData,
    connectionVisualConstructorFromData,
} from "../../../src/types";
import { ValueChoices, maxChoicesPerColor } from "../../../src/value-choices";

// Useful data
import ARCTIC from "./resources/arctic.json";
import LES_MISERABLES from "./resources/les-miserables.json";

type TId = Int32Array;
type TConnectionWeight = Uint8Array;
type TCoordinates = Float32Array;
type TZIndex = Uint8Array;
type TNodeFeatures = [Int8Array];
type TConnectionFeatures = [];

const loadArcticOrLesMiserables = (json: JsonVerboseGraph, isBig: boolean) => {
    const mapColorChannel = (x: number, i: number) =>
        Math.floor((x * maxChoicesPerColor) / 256) * Math.pow(maxChoicesPerColor, 2 - i);

    console.log("Loading Arctic");

    return jsonVerboseToVisualOGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    >({
        json: json,
        nodeFeatureFields: ["occurrences"],
        connectionFeatureFields: [],
        nodeColorField: "color",
        nodeSizeField: "size",
        connectionFromField: "source",
        connectionToField: "target",
        nodeFeaturesConstructor: (count) => [
            new Int8Array(count),
            ...nodeVisualConstructor(
                count,
                undefined,
                undefined,
                undefined,
                OSigma.encodeNodeFlags(false, false, isBig, 0)
            ),
        ],
        connectionFeaturesConstructor: (count) =>
            connectionVisualConstructor(count, 129),
        coordinatesConstructor: (count) => new Float32Array(count),
        zIndexConstructor: (count) => new Uint8Array(count),
        idConstructor: (count) => new Int32Array(count),
        connectionWeightConstructor: (count) => new Uint8Array(count),
        parseColor: (a) =>
            a
                .replace("rgb(", "")
                .replace(")", "")
                .split(",")
                .map((x, i) => mapColorChannel(parseInt(x), i))
                .reduce((acc, val) => acc + val),
        parseSize: (x) => Math.floor(x * (isBig ? 4 : 1)),
        parseX: Math.floor,
        parseY: Math.floor,
        parseZ: Math.floor,
    });
};


const arcticSmall = loadArcticOrLesMiserables(ARCTIC as JsonVerboseGraph, false);
const arcticBig = loadArcticOrLesMiserables(ARCTIC as JsonVerboseGraph, true);
const lesSmall = loadArcticOrLesMiserables(LES_MISERABLES as JsonVerboseGraph, false);
const lesBig = loadArcticOrLesMiserables(LES_MISERABLES as JsonVerboseGraph, true);
// const lesMiserables = Graph.from(LES_MISERABLES as SerializedGraph);
const container = document.getElementById("container") as HTMLElement;

function globalize(variables: Record<string, unknown>): void {
    for (const key in variables) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window[key] = variables[key];
    }
}

globalize({
    dependencies: {
        OGraph,
        OSigma,
        ValueChoices,
        data: { arcticSmall, arcticBig, lesSmall, lesBig },
        nodeVisualConstructorFromData,
        connectionVisualConstructorFromData,
        programs: {
            NodeCircleProgram,
            NodePointProgram,
            getNodeImageProgram,
            EdgeLineProgram,
            EdgeRectangleProgram,
            EdgeArrowProgram,
            EdgeTriangleProgram,
        },
        container,
    },
});
