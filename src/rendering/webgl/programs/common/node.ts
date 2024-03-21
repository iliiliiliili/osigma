/**
 * osigma.js WebGL Abstract Node Program
 * =====================================
 *
 * @module
 */
import OSigma from "../../../../osigma";
import { TypedArray } from "../../../../core/ograph";
import { AbstractProgram, Program } from "./program";
import { NodeDisplayData, RenderParams } from "../../../../types";

export abstract class AbstractNodeProgram<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> extends AbstractProgram<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures
> {
    abstract process(offset: number, nodeId: number): void;
}

export abstract class NodeProgram<
        TId extends TypedArray,
        TConnectionWeight extends TypedArray,
        TCoordinates extends TypedArray,
        TZIndex extends TypedArray,
        TNodeFeatures extends TypedArray[],
        TConnectionFeatures extends TypedArray[],
        Uniform extends string = string
    >
    extends Program<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures,
        Uniform
    >
    implements
        AbstractNodeProgram<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
{
    process(offset: number, nodeId: number): void {
        let i = offset * this.STRIDE;
        // NOTE: dealing with hidden items automatically
        if (this.renderer.isNodeHidden(nodeId)) {
            for (let l = i + this.STRIDE; i < l; i++) {
                this.array[i] = 0;
            }
            return;
        }

        return this.processVisibleItem(i, nodeId);
    }
    abstract processVisibleItem(i: number, data: number): void;
}

export interface NodeProgramConstructor<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> {
    new (
        gl: WebGLRenderingContext,
        renderer: OSigma<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    ): AbstractNodeProgram<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >;
}

/**
 * Helper function combining two or more programs into a single compound one.
 * Note that this is more a quick & easy way to combine program than a really
 * performant option. More performant programs can be written entirely.
 *
 * @param  {array}    programClasses - Program classes to combine.
 * @return {function}
 */
export function createNodeCompoundProgram<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(
    programClasses: Array<
        NodeProgramConstructor<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    >
): NodeProgramConstructor<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures
> {
    return class NodeCompoundProgram
        implements
            AbstractNodeProgram<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                TNodeFeatures,
                TConnectionFeatures
            >
    {
        programs: Array<
            AbstractNodeProgram<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                TNodeFeatures,
                TConnectionFeatures
            >
        >;

        constructor(
            gl: WebGLRenderingContext,
            renderer: OSigma<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                TNodeFeatures,
                TConnectionFeatures
            >
        ) {
            this.programs = programClasses.map((Program) => {
                return new Program(gl, renderer);
            });
        }

        reallocate(capacity: number): void {
            this.programs.forEach((program) => program.reallocate(capacity));
        }

        process(offset: number, nodeId: number): void {
            this.programs.forEach((program) => program.process(offset, nodeId));
        }

        render(params: RenderParams): void {
            this.programs.forEach((program) => program.render(params));
        }
    };
}
