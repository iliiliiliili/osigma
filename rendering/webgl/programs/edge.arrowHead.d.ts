/**
 * osigma.js WebGL Renderer Arrow Program
 * ======================================
 *
 * Program rendering direction arrows as a simple triangle.
 * @module
 */
import { NodeDisplayData, EdgeDisplayData, RenderParams } from "../../../types";
import { EdgeProgram } from "./common/edge";
declare const UNIFORMS: readonly ["u_matrix", "u_sizeRatio", "u_correctionRatio"];
export default class EdgeArrowHeadProgram extends EdgeProgram<typeof UNIFORMS[number]> {
    getDefinition(): {
        VERTICES: number;
        ARRAY_ITEMS_PER_VERTEX: number;
        VERTEX_SHADER_SOURCE: string;
        FRAGMENT_SHADER_SOURCE: string;
        UNIFORMS: readonly ["u_matrix", "u_sizeRatio", "u_correctionRatio"];
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
    processVisibleItem(i: number, sourceData: NodeDisplayData, targetData: NodeDisplayData, data: EdgeDisplayData): void;
    draw(params: RenderParams): void;
}
export {};
