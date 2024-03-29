/**
 * osigma.js WebGL Renderer Node Program
 * =====================================
 *
 * Simple program rendering nodes as discs, shaped by triangles using the
 * `gl.TRIANGLES` display mode. So, to draw one node, it will need to store
 * three times the center of the node, with the color, the size and an angle
 * indicating which "corner" of the triangle to draw.
 * @module
 */
import { NodeDisplayData, RenderParams } from "../../../types";
import { TypedArray } from "../../../core/ograph";
import { floatColor } from "../../../utils";
import { NodeProgram } from "./common/node";
import VERTEX_SHADER_SOURCE from "../shaders/node.circle.vert.glsl";
import FRAGMENT_SHADER_SOURCE from "../shaders/node.circle.frag.glsl";
import { UncertainWebGL2RenderingContext } from "./common/program";

const { UNSIGNED_BYTE, FLOAT } = UncertainWebGL2RenderingContext;

const UNIFORMS = ["u_sizeRatio", "u_correctionRatio", "u_matrix"] as const;

export default class NodeCircleProgram<
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
    static readonly ANGLE_1 = 0;
    static readonly ANGLE_2 = (2 * Math.PI) / 3;
    static readonly ANGLE_3 = (4 * Math.PI) / 3;

    getDefinition() {
        return {
            VERTICES: 3,
            ARRAY_ITEMS_PER_VERTEX: 5,
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
                { name: "a_angle", size: 1, type: FLOAT },
            ],
        };
    }

    processVisibleItem(i: number, nodeId: number) {
        const array = this.array;

        const color = floatColor(
            this.renderer.valueChoices.decodeColor(
                this.graph.nodes.features[this.renderer.nodeColorFeatureId][
                    nodeId
                ]
            )
        );

        array[i++] = this.graph.nodes.xCoordinates[nodeId];
        array[i++] = this.graph.nodes.yCoordinates[nodeId];
        array[i++] =
            this.graph.nodes.features[this.renderer.nodeSizeFeatureId][nodeId];
        array[i++] = color;
        array[i++] = NodeCircleProgram.ANGLE_1;

        array[i++] = this.graph.nodes.xCoordinates[nodeId];
        array[i++] = this.graph.nodes.yCoordinates[nodeId];
        array[i++] =
            this.graph.nodes.features[this.renderer.nodeSizeFeatureId][nodeId];
        array[i++] = color;
        array[i++] = NodeCircleProgram.ANGLE_2;

        array[i++] = this.graph.nodes.xCoordinates[nodeId];
        array[i++] = this.graph.nodes.yCoordinates[nodeId];
        array[i++] =
            this.graph.nodes.features[this.renderer.nodeSizeFeatureId][nodeId];
        array[i++] = color;
        array[i] = NodeCircleProgram.ANGLE_3;
    }

    draw(params: RenderParams): void {
        const { u_sizeRatio, u_correctionRatio, u_matrix } =
            this.uniformLocations;

        this.gl?.uniform1f(u_sizeRatio, params.sizeRatio);
        this.gl?.uniform1f(u_correctionRatio, params.correctionRatio);
        this.gl?.uniformMatrix3fv(u_matrix, false, params.matrix);

        this.gl?.drawArrays(this.gl.TRIANGLES, 0, this.verticesCount);
    }
}
