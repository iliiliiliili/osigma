/**
 * osigma.js WebGL Abstract Edge Program
 * =====================================
 *
 * @module
 */
import osigma from "../../../../osigma";
import { AbstractProgram, Program } from "./program";
import { NodeDisplayData, EdgeDisplayData } from "../../../../types";
export declare abstract class AbstractEdgeProgram extends AbstractProgram {
    abstract process(offset: number, sourceData: NodeDisplayData, targetData: NodeDisplayData, data: EdgeDisplayData): void;
}
export declare abstract class EdgeProgram<Uniform extends string = string> extends Program<Uniform> implements AbstractEdgeProgram {
    process(offset: number, sourceData: NodeDisplayData, targetData: NodeDisplayData, data: EdgeDisplayData): void;
    abstract processVisibleItem(i: number, sourceData: NodeDisplayData, targetData: NodeDisplayData, data: EdgeDisplayData): void;
}
export interface EdgeProgramConstructor {
    new (gl: WebGLRenderingContext, renderer: osigma): AbstractEdgeProgram;
}
/**
 * Helper function combining two or more programs into a single compound one.
 * Note that this is more a quick & easy way to combine program than a really
 * performant option. More performant programs can be written entirely.
 *
 * @param  {array}    programClasses - Program classes to combine.
 * @return {function}
 */
export declare function createEdgeCompoundProgram(programClasses: Array<EdgeProgramConstructor>): EdgeProgramConstructor;
