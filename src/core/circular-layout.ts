import { TNodeVisual, TConnectionVisual } from "../types";
import { OGraph, TypedArray } from "./ograph";

export default function applyCircularLayout<
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
    options: { center: number; scale: number } = {
        center: 0.5,
        scale: 1,
    }
) {
    const center = options.center;
    const scale = options.scale;
    const tau = Math.PI * 2;

    const offset = (center - 0.5) * scale;
    const l = graph.order;

    for (let i = 0; i < graph.nodeCount; i++) {

        graph.nodes.xCoordinates[i] = scale * Math.cos((i * tau) / l) + offset;
        graph.nodes.yCoordinates[i] = scale * Math.sin((i * tau) / l) + offset;
    }
}
