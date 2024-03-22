/**
 * osigma.js WebGL Renderer Fast Edge Program
 * ==========================================
 *
 * Program rendering edges using GL_LINES which is presumably very fast but
 * won't render thickness correctly on some GPUs and has some quirks.
 * @module
 */
import { NodeDisplayData, EdgeDisplayData, RenderParams } from "../../../types";
import { TypedArray } from "../../../core/ograph";
import { floatColor } from "../../../utils";
import { decodeColor } from "../../../value-choices";
import { EdgeProgram } from "./common/edge";
import { UncertainWebGL2RenderingContext } from "./common/program";
import VERTEX_SHADER_SOURCE from "../shaders/edge.line.vert.glsl";
import FRAGMENT_SHADER_SOURCE from "../shaders/edge.line.frag.glsl";

const { UNSIGNED_BYTE, FLOAT } = UncertainWebGL2RenderingContext;

const UNIFORMS = ["u_matrix"] as const;

export default class EdgeLineProgram<
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
            VERTICES: 2,
            ARRAY_ITEMS_PER_VERTEX: 3,
            VERTEX_SHADER_SOURCE,
            FRAGMENT_SHADER_SOURCE,
            UNIFORMS,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                {
                    name: "a_color",
                    size: 4,
                    type: UNSIGNED_BYTE,
                    normalized: true,
                },
            ],
        };
    }

    processVisibleItem(i: number, edgeId: number) {
        const array = this.array;

        const fromId = this.graph.connections.from[edgeId];
        const toId = this.graph.connections.to[edgeId];
        const color = floatColor(
            decodeColor(
                this.graph.connections.features[
                    this.renderer.connectionColorFeatureId
                ][edgeId]
            )
        );

        // First point
        array[i++] = this.graph.nodes.xCoordinates[fromId];
        array[i++] = this.graph.nodes.yCoordinates[fromId];
        array[i++] = color;

        // Second point
        array[i++] = this.graph.nodes.xCoordinates[toId];
        array[i++] = this.graph.nodes.yCoordinates[toId];
        array[i] = color;
    }

    draw(params: RenderParams): void {
        const gl = this.gl;

        const { u_matrix } = this.uniformLocations;

        gl?.uniformMatrix3fv(u_matrix, false, params.matrix);

        gl?.drawArrays(gl.LINES, 0, this.verticesCount);
    }
}
