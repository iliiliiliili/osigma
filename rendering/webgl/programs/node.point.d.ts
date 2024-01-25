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
import { NodeProgram } from "./common/node";
declare const UNIFORMS: readonly ["u_sizeRatio", "u_pixelRatio", "u_matrix"];
export default class NodePointProgram extends NodeProgram<typeof UNIFORMS[number]> {
    getDefinition(): {
        VERTICES: number;
        ARRAY_ITEMS_PER_VERTEX: number;
        VERTEX_SHADER_SOURCE: string;
        FRAGMENT_SHADER_SOURCE: string;
        UNIFORMS: readonly ["u_sizeRatio", "u_pixelRatio", "u_matrix"];
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
