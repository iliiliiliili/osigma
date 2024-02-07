/**
 * osigma.js WebGL Renderer Triangle Edge Program
 * ==============================================
 *
 * Program rendering directed edges as a single triangle.
 * @module
 */
import { NodeDisplayData, EdgeDisplayData, RenderParams } from "../../../types";
import { floatColor } from "../../../utils";
import { EdgeProgram } from "./common/edge";
import VERTEX_SHADER_SOURCE from "../shaders/edge.triangle.vert.glsl";
import FRAGMENT_SHADER_SOURCE from "../shaders/edge.triangle.frag.glsl";

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

const UNIFORMS = ["u_matrix", "u_sizeRatio", "u_correctionRatio"] as const;

export default class EdgeTriangleProgram extends EdgeProgram<typeof UNIFORMS[number]> {
    getDefinition() {
        return {
            VERTICES: 3,
            ARRAY_ITEMS_PER_VERTEX: 5,
            VERTEX_SHADER_SOURCE,
            FRAGMENT_SHADER_SOURCE,
            UNIFORMS,
            ATTRIBUTES: [
                { name: "a_position", size: 2, type: FLOAT },
                { name: "a_normal", size: 2, type: FLOAT },
                { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
            ],
        };
    }

    processVisibleItem(i: number, sourceData: NodeDisplayData, targetData: NodeDisplayData, data: EdgeDisplayData) {
        const thickness = data.size || 1;
        const x1 = sourceData.x;
        const y1 = sourceData.y;
        const x2 = targetData.x;
        const y2 = targetData.y;
        const color = floatColor(data.color);

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
        array[i++] = x1;
        array[i++] = y1;
        array[i++] = n1;
        array[i++] = n2;
        array[i++] = color;

        array[i++] = x1;
        array[i++] = y1;
        array[i++] = -n1;
        array[i++] = -n2;
        array[i++] = color;

        array[i++] = x2;
        array[i++] = y2;
        array[i++] = 0;
        array[i++] = 0;
        array[i] = color;
    }

    draw(params: RenderParams): void {
        const gl = this.gl;

        const { u_matrix, u_sizeRatio, u_correctionRatio } = this.uniformLocations;

        gl.uniformMatrix3fv(u_matrix, false, params.matrix);
        gl.uniform1f(u_sizeRatio, params.sizeRatio);
        gl.uniform1f(u_correctionRatio, params.correctionRatio);

        gl.drawArrays(gl.TRIANGLES, 0, this.verticesCount);
    }
}
