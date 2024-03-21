/**
 * osigma.js WebGL Abstract Edge Program
 * =====================================
 *
 * @module
 */
import OSigma from "../../../../osigma";
import { AbstractProgram, Program } from "./program";
import { TypedArray } from "../../../../core/ograph";
import {
    NodeDisplayData,
    EdgeDisplayData,
    RenderParams,
} from "../../../../types";

export abstract class AbstractEdgeProgram<
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
    abstract process(offset: number, edgeId: number): void;
}

export abstract class EdgeProgram<
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
        AbstractEdgeProgram<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
{
    process(offset: number, edgeId: number): void {
        let i = offset * this.STRIDE;
        // NOTE: dealing with hidden items automatically
        if (
            this.renderer.isEdgeHidden(edgeId) ||
            this.renderer.isNodeHidden(this.graph.connections.from[edgeId]) ||
            this.renderer.isNodeHidden(this.graph.connections.to[edgeId])
        ) {
            for (let l = i + this.STRIDE; i < l; i++) {
                this.array[i] = 0;
            }
            return;
        }

        return this.processVisibleItem(i, edgeId);
    }
    abstract processVisibleItem(i: number, edgeId: number): void;
}

export interface EdgeProgramConstructor<
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
    ): AbstractEdgeProgram<
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
export function createEdgeCompoundProgram<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
>(
    programClasses: Array<
        EdgeProgramConstructor<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    >
): EdgeProgramConstructor<
    TId,
    TConnectionWeight,
    TCoordinates,
    TZIndex,
    TNodeFeatures,
    TConnectionFeatures
> {
    return class EdgeCompoundProgram
        implements
            AbstractEdgeProgram<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                TNodeFeatures,
                TConnectionFeatures
            >
    {
        programs: Array<
            AbstractEdgeProgram<
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

        process(
            offset: number,
            edgeId: number,
        ): void {
            this.programs.forEach((program) =>
                program.process(offset, edgeId)
            );
        }

        render(params: RenderParams): void {
            this.programs.forEach((program) => program.render(params));
        }
    };
}
