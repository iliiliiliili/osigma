/**
 * osigma.js WebGL Renderer Node Program
 * =====================================
 *
 * Simple program rendering nodes using GL_POINTS. This is faster than the
 * three triangle option but has some quirks and is not supported equally by
 * every GPU.
 * @module
 */
import { NodeDisplayData, RenderParams } from "../../../types";
import { TypedArray } from "../../../core/ograph";
import { decodeColor } from "../../../value-choices";
import { floatColor } from "../../../utils";
import { NodeProgram } from "./common/node";
import { UncertainWebGL2RenderingContext } from "./common/program";
// import VERTEX_SHADER_SOURCE from "../shaders/node.point.vert.glsl";
// import FRAGMENT_SHADER_SOURCE from "../shaders/node.point.frag.glsl";

const VERTEX_SHADER_SOURCE = "";
const FRAGMENT_SHADER_SOURCE = "";

const { UNSIGNED_BYTE, FLOAT } = UncertainWebGL2RenderingContext;

const UNIFORMS = ["u_sizeRatio", "u_pixelRatio", "u_matrix"] as const;

export default class NodePointProgram<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> extends NodeProgram<
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
            VERTICES: 1,
            ARRAY_ITEMS_PER_VERTEX: 4,
            VERTEX_SHADER_SOURCE,
            FRAGMENT_SHADER_SOURCE,
            UNIFORMS,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                { name: "a_size", size: 1, type: FLOAT },
                {
                    name: "a_color",
                    size: 4,
                    type: UNSIGNED_BYTE,
                    normalized: true,
                },
            ],
        };
    }

    processVisibleItem(i: number, nodeId: number) {
        const array = this.array;

        array[i++] = this.graph.nodes.xCoordinates[nodeId];
        array[i++] = this.graph.nodes.yCoordinates[nodeId];
        array[i++] = this.graph.nodes.features[this.renderer.nodeSizeFeatureId][nodeId];
        array[i] = floatColor(decodeColor(this.graph.nodes.features[this.renderer.nodeColorFeatureId][nodeId]));
    }

    draw(params: RenderParams): void {
        const gl = this.gl;

        const { u_sizeRatio, u_pixelRatio, u_matrix } = this.uniformLocations;

        gl?.uniform1f(u_sizeRatio, params.sizeRatio);
        gl?.uniform1f(u_pixelRatio, params.pixelRatio);
        gl?.uniformMatrix3fv(u_matrix, false, params.matrix);

        gl?.drawArrays(gl.POINTS, 0, this.verticesCount);
    }
}
