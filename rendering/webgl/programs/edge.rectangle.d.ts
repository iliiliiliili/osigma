/**
 * osigma.js WebGL Renderer Edge Program
 * =====================================
 *
 * Program rendering edges as thick lines using four points translated
 * orthogonally from the source & target's centers by half thickness.
 *
 * Rendering two triangles by using only four points is made possible through
 * the use of indices.
 *
 * This method should be faster than the 6 points / 2 triangles approach and
 * should handle thickness better than with gl.LINES.
 *
 * This version of the shader balances geometry computation evenly between
 * the CPU & GPU (normals are computed on the CPU side).
 * @module
 */
import { NodeDisplayData, EdgeDisplayData, RenderParams } from "../../../types";
import { EdgeProgram } from "./common/edge";
declare const UNIFORMS: readonly ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio"];
export default class EdgeRectangleProgram extends EdgeProgram<typeof UNIFORMS[number]> {
    getDefinition(): {
        VERTICES: number;
        ARRAY_ITEMS_PER_VERTEX: number;
        VERTEX_SHADER_SOURCE: string;
        FRAGMENT_SHADER_SOURCE: string;
        UNIFORMS: readonly ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio"];
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
    reallocateIndices(): void;
    processVisibleItem(i: number, sourceData: NodeDisplayData, targetData: NodeDisplayData, data: EdgeDisplayData): void;
    draw(params: RenderParams): void;
}
export {};
