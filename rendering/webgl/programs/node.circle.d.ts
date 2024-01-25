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
import { NodeProgram } from "./common/node";
declare const UNIFORMS: readonly ["u_sizeRatio", "u_correctionRatio", "u_matrix"];
export default class NodeCircleProgram extends NodeProgram<typeof UNIFORMS[number]> {
    static readonly ANGLE_1 = 0;
    static readonly ANGLE_2: number;
    static readonly ANGLE_3: number;
    getDefinition(): {
        VERTICES: number;
        ARRAY_ITEMS_PER_VERTEX: number;
        VERTEX_SHADER_SOURCE: string;
        FRAGMENT_SHADER_SOURCE: string;
        UNIFORMS: readonly ["u_sizeRatio", "u_correctionRatio", "u_matrix"];
        ATTRIBUTES: ({
            name: string;
            size: number;
            type: number;
            normalized?: undefined;
        } | {
            name: string;
            size: number;
            type: number;
            normalized: boolean;
        })[];
    };
    processVisibleItem(i: number, data: NodeDisplayData): void;
    draw(params: RenderParams): void;
}
export {};
