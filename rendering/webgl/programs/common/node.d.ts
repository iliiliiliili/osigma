/**
 * osigma.js WebGL Abstract Node Program
 * =====================================
 *
 * @module
 */
import osigma from "../../../../osigma";
import { AbstractProgram, Program } from "./program";
import { NodeDisplayData } from "../../../../types";
export declare abstract class AbstractNodeProgram extends AbstractProgram {
    abstract process(offset: number, data: NodeDisplayData): void;
}
export declare abstract class NodeProgram<Uniform extends string = string> extends Program<Uniform> implements AbstractNodeProgram {
    process(offset: number, data: NodeDisplayData): void;
    abstract processVisibleItem(i: number, data: NodeDisplayData): void;
}
export interface NodeProgramConstructor {
    new (gl: WebGLRenderingContext, renderer: osigma): AbstractNodeProgram;
}
/**
 * Helper function combining two or more programs into a single compound one.
 * Note that this is more a quick & easy way to combine program than a really
 * performant option. More performant programs can be written entirely.
 *
 * @param  {array}    programClasses - Program classes to combine.
 * @return {function}
 */
export declare function createNodeCompoundProgram(programClasses: Array<NodeProgramConstructor>): NodeProgramConstructor;
