/**
 * osigma.js WebGL Renderer Edge Program
 * =====================================
 *
 * Program rendering edges as thick lines but with a twist: the end of edge
 * does not sit in the middle of target node but instead stays by some margin.
 *
 * This is useful when combined with arrows to draw directed edges.
 * @module
 */
import EdgeRectangleProgram from "./edge.rectangle";
import VERTEX_SHADER_SOURCE from "../shaders/edge.clamped.vert.glsl";
import { EdgeDisplayData, NodeDisplayData } from "../../../types";
import { TypedArray } from "../../../core/ograph";
import { floatColor } from "../../../utils";
import { decodeColor } from "../../../value-choices";

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

export default class EdgeClampedProgram<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> extends EdgeRectangleProgram<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures
> {
    getDefinition() {
        return {
            ...super.getDefinition(),
            ARRAY_ITEMS_PER_VERTEX: 6,
            VERTEX_SHADER_SOURCE,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                { name: "a_normal", size: 2, type: FLOAT },
                {
                    name: "a_color",
                    size: 4,
                    type: UNSIGNED_BYTE,
                    normalized: true,
                },
                { name: "a_radius", size: 1, type: FLOAT },
            ],
        };
    }

    processVisibleItem(i: number, edgeId: number) {
        const fromId = this.graph.connections.from[edgeId];
        const toId = this.graph.connections.to[edgeId];
        const color = floatColor(
            decodeColor(
                this.graph.connections.features[
                    this.renderer.connectionColorFeatureId
                ][edgeId]
            )
        );

        const thickness =
            this.graph.connections.features[
                this.renderer.connectionFlagsFeatureId
            ][edgeId];
        const x1 = this.graph.nodes.xCoordinates[fromId];
        const y1 = this.graph.nodes.yCoordinates[fromId];
        const x2 = this.graph.nodes.xCoordinates[toId];
        const y2 = this.graph.nodes.yCoordinates[toId];

        // Computing normals
        const dx = x2 - x1;
        const dy = y2 - y1;

        const radius =
            this.graph.nodes.features[this.renderer.nodeSizeFeatureId][edgeId];

        let len = dx * dx + dy * dy;
        let n1 = 0;
        let n2 = 0;

        if (len) {
            len = 1 / Math.sqrt(len);

            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
        }

        const array = this.array;

        // First point
        array[i++] = x1;
        array[i++] = y1;
        array[i++] = n1;
        array[i++] = n2;
        array[i++] = color;
        array[i++] = 0;

        // First point flipped
        array[i++] = x1;
        array[i++] = y1;
        array[i++] = -n1;
        array[i++] = -n2;
        array[i++] = color;
        array[i++] = 0;

        // Second point
        array[i++] = x2;
        array[i++] = y2;
        array[i++] = n1;
        array[i++] = n2;
        array[i++] = color;
        array[i++] = radius;

        // Second point flipped
        array[i++] = x2;
        array[i++] = y2;
        array[i++] = -n1;
        array[i++] = -n2;
        array[i++] = color;
        array[i] = -radius;
    }
}
