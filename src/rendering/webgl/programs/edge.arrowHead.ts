/**
 * osigma.js WebGL Renderer Arrow Program
 * ======================================
 *
 * Program rendering direction arrows as a simple triangle.
 * @module
 */
import { NodeDisplayData, EdgeDisplayData, RenderParams } from "../../../types";
import { TypedArray } from "../../../core/ograph";
import { floatColor } from "../../../utils";
import { decodeColor } from "../../../value-choices";
import { EdgeProgram } from "./common/edge";
import VERTEX_SHADER_SOURCE from "../shaders/edge.arrowHead.vert.glsl";
import FRAGMENT_SHADER_SOURCE from "../shaders/edge.arrowHead.frag.glsl";

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

const UNIFORMS = ["u_matrix", "u_sizeRatio", "u_correctionRatio"] as const;

export default class EdgeArrowHeadProgram<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> extends EdgeProgram<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures,
    (typeof UNIFORMS)[number]
> {
    getDefinition() {
        return {
            VERTICES: 3,
            ARRAY_ITEMS_PER_VERTEX: 9,
            VERTEX_SHADER_SOURCE,
            FRAGMENT_SHADER_SOURCE,
            UNIFORMS,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                { name: "a_normal", size: 2, type: FLOAT },
                { name: "a_radius", size: 1, type: FLOAT },
                {
                    name: "a_color",
                    size: 4,
                    type: UNSIGNED_BYTE,
                    normalized: true,
                },
                { name: "a_barycentric", size: 3, type: FLOAT },
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

        const radius =
            this.graph.nodes.features[this.renderer.nodeSizeFeatureId][edgeId];

        // Computing normals
        const dx = x2 - x1;
        const dy = y2 - y1;

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
        array[i++] = x2;
        array[i++] = y2;
        array[i++] = -n1;
        array[i++] = -n2;
        array[i++] = radius;
        array[i++] = color;
        array[i++] = 1;
        array[i++] = 0;
        array[i++] = 0;

        // Second point
        array[i++] = x2;
        array[i++] = y2;
        array[i++] = -n1;
        array[i++] = -n2;
        array[i++] = radius;
        array[i++] = color;
        array[i++] = 0;
        array[i++] = 1;
        array[i++] = 0;

        // Third point
        array[i++] = x2;
        array[i++] = y2;
        array[i++] = -n1;
        array[i++] = -n2;
        array[i++] = radius;
        array[i++] = color;
        array[i++] = 0;
        array[i++] = 0;
        array[i] = 1;
    }

    draw(params: RenderParams): void {

        const { u_matrix, u_sizeRatio, u_correctionRatio } =
            this.uniformLocations;

        this.gl?.uniformMatrix3fv(u_matrix, false, params.matrix);
        this.gl?.uniform1f(u_sizeRatio, params.sizeRatio);
        this.gl?.uniform1f(u_correctionRatio, params.correctionRatio);

        this.gl?.drawArrays(this.gl.TRIANGLES, 0, this.verticesCount);
    }
}
