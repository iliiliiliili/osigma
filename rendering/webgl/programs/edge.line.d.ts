/**
 * osigma.js WebGL Renderer Fast Edge Program
 * ==========================================
 *
 * Program rendering edges using GL_LINES which is presumably very fast but
 * won't render thickness correctly on some GPUs and has some quirks.
 * @module
 */
import { NodeDisplayData, EdgeDisplayData, RenderParams } from "../../../types";
import { EdgeProgram } from "./common/edge";
declare const UNIFORMS: readonly ["u_matrix"];
export default class EdgeLineProgram extends EdgeProgram<typeof UNIFORMS[number]> {
    getDefinition(): {
        VERTICES: number;
        ARRAY_ITEMS_PER_VERTEX: number;
        VERTEX_SHADER_SOURCE: string;
        FRAGMENT_SHADER_SOURCE: string;
        UNIFORMS: readonly ["u_matrix"];
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
