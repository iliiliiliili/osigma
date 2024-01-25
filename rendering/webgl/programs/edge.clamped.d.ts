/**
 * osigma.js WebGL Renderer Edge Program
 * =====================================
 *
 * Program rendering edges as thick lines but with a twist: the end of edge
 * does not sit in the middle of target node but instead stays by some margin.
 *
 * This is useful when combined with arrows to draw directed edges.
 * @module
 */
import EdgeRectangleProgram from "./edge.rectangle";
import { EdgeDisplayData, NodeDisplayData } from "../../../types";
export default class EdgeClampedProgram extends EdgeRectangleProgram {
    getDefinition(): {
        ARRAY_ITEMS_PER_VERTEX: number;
        VERTEX_SHADER_SOURCE: string;
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
        VERTICES: number;
        FRAGMENT_SHADER_SOURCE: string;
        UNIFORMS: readonly ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio"];
    };
    processVisibleItem(i: number, sourceData: NodeDisplayData, targetData: NodeDisplayData, data: EdgeDisplayData): void;
}
