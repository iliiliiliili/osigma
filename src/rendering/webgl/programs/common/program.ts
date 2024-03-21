/**
 * osigma.js WebGL Renderer Program
 * ================================
 *
 * Class representing a single WebGL program used by osigma's WebGL renderer.
 * @module
 */
import type OSigma from "../../../../osigma";
import { OGraph, TypedArray } from "../../../../core/ograph";
import { TNodeVisual, TConnectionVisual } from "../../../../types";

import type { RenderParams } from "../../../../types";
import { canUse32BitsIndices } from "../../../../utils";
import {
    loadVertexShader,
    loadFragmentShader,
    loadProgram,
} from "../../shaders/utils";

export const UncertainWebGL2RenderingContext =
    typeof WebGL2RenderingContext !== "undefined"
        ? WebGL2RenderingContext
        : {
              BOOL: 0,
              BYTE: 0,
              UNSIGNED_BYTE: 0,
              SHORT: 0,
              UNSIGNED_SHORT: 0,
              INT: 0,
              UNSIGNED_INT: 0,
              FLOAT: 0,
          };

const SIZE_FACTOR_PER_ATTRIBUTE_TYPE: { [key: number]: number } = {
    [UncertainWebGL2RenderingContext.BOOL]: 1,
    [UncertainWebGL2RenderingContext.BYTE]: 1,
    [UncertainWebGL2RenderingContext.UNSIGNED_BYTE]: 1,
    [UncertainWebGL2RenderingContext.SHORT]: 2,
    [UncertainWebGL2RenderingContext.UNSIGNED_SHORT]: 2,
    [UncertainWebGL2RenderingContext.INT]: 4,
    [UncertainWebGL2RenderingContext.UNSIGNED_INT]: 4,
    [UncertainWebGL2RenderingContext.FLOAT]: 4,
};

export interface ProgramAttributeSpecification {
    name: string;
    size: number;
    type: number;
    normalized?: boolean;
}

export interface ProgramDefinition<TUniform extends string = string> {
    VERTICES: number;
    ARRAY_ITEMS_PER_VERTEX: number;
    VERTEX_SHADER_SOURCE: string;
    FRAGMENT_SHADER_SOURCE: string;
    UNIFORMS: ReadonlyArray<TUniform>;
    ATTRIBUTES: Array<ProgramAttributeSpecification>;
}

export abstract class AbstractProgram<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> {
    constructor(
        _gl: WebGLRenderingContext,
        _renderer: OSigma<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
        // eslint-disable-next-line @typescript-eslint/no-empty-function
    ) {}
    abstract reallocate(capacity: number): void;
    abstract render(params: RenderParams): void;
}

export abstract class Program<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[],
    TUniform extends string = string
> implements
        AbstractProgram<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >,
        ProgramDefinition
{
    VERTICES: number;
    ARRAY_ITEMS_PER_VERTEX: number;
    VERTEX_SHADER_SOURCE: string;
    FRAGMENT_SHADER_SOURCE: string;
    UNIFORMS: ReadonlyArray<TUniform>;
    ATTRIBUTES: Array<ProgramAttributeSpecification>;
    STRIDE: number;

    renderer: OSigma<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >;
    graph: OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    >;
    gl: WebGLRenderingContext | null = null;
    buffer: WebGLBuffer | null = null;
    array: Float32Array = new Float32Array();
    canUse32BitsIndices: boolean | null = null;
    indicesType: number | null = null;
    indicesBuffer: WebGLBuffer | null = null;
    IndicesArray: Uint16ArrayConstructor | Uint32ArrayConstructor | null = null;
    indicesArray: Uint16Array | Uint32Array | null = null;
    vertexShader: WebGLShader | null = null;
    fragmentShader: WebGLShader | null = null;
    program: WebGLProgram | null = null;
    uniformLocations = {} as Record<TUniform, WebGLUniformLocation>;
    attributeLocations: Record<string, GLint> = {};
    capacity = 0;
    verticesCount = 0;

    abstract getDefinition(): ProgramDefinition<TUniform>;

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
        // Reading program definition
        const definition = this.getDefinition();

        this.VERTICES = definition.VERTICES;
        this.ARRAY_ITEMS_PER_VERTEX = definition.ARRAY_ITEMS_PER_VERTEX;
        this.VERTEX_SHADER_SOURCE = definition.VERTEX_SHADER_SOURCE;
        this.FRAGMENT_SHADER_SOURCE = definition.FRAGMENT_SHADER_SOURCE;
        this.UNIFORMS = definition.UNIFORMS;
        this.ATTRIBUTES = definition.ATTRIBUTES;

        // Computing stride
        this.STRIDE = this.VERTICES * this.ARRAY_ITEMS_PER_VERTEX;

        // Members
        this.gl = gl;
        this.renderer = renderer;
        this.graph = renderer.getGraph();

        if (typeof gl === "undefined") {
            return;
        }

        // Webgl buffers
        const buffer = gl.createBuffer();
        if (buffer === null)
            throw new Error("Program: error while creating the webgl buffer.");
        this.buffer = buffer;

        const indicesBuffer = gl.createBuffer();
        if (indicesBuffer === null)
            throw new Error(
                "Program: error while creating the webgl indices buffer."
            );
        this.indicesBuffer = indicesBuffer;

        // Shaders and program
        this.vertexShader = loadVertexShader(
            this.gl,
            this.VERTEX_SHADER_SOURCE
        );
        this.fragmentShader = loadFragmentShader(
            this.gl,
            this.FRAGMENT_SHADER_SOURCE
        );
        this.program = loadProgram(this.gl, [
            this.vertexShader,
            this.fragmentShader,
        ]);

        // Indices
        this.canUse32BitsIndices = canUse32BitsIndices(this.gl);
        this.indicesType = this.canUse32BitsIndices
            ? gl.UNSIGNED_INT
            : gl.UNSIGNED_SHORT;
        this.IndicesArray = this.canUse32BitsIndices
            ? Uint32Array
            : Uint16Array;

        // Initializing locations
        this.UNIFORMS.forEach((uniformName) => {
            const location =
                this.program == null
                    ? null
                    : this.gl?.getUniformLocation(this.program, uniformName);
            if (location === null)
                throw new Error(
                    `Program: error while getting location for uniform "${uniformName}".`
                );

            if (this.uniformLocations != null && location != null) {
                this.uniformLocations[uniformName] = location;
            }
        });

        this.ATTRIBUTES.forEach((attr) => {
            const location =
                this.program == null
                    ? null
                    : this.gl?.getAttribLocation(this.program, attr.name);
            if (location === -1)
                throw new Error(
                    `Program: error while getting location for attribute "${attr.name}".`
                );

            if (this.attributeLocations != null && location != null) {
                this.attributeLocations[attr.name] = location;
            }
        });
    }

    private bind(): void {
        const gl = this.gl;

        gl?.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        if (this.indicesArray) {
            gl?.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
        }

        for (const attributeName in this.attributeLocations) {
            gl?.enableVertexAttribArray(this.attributeLocations[attributeName]);
        }

        let offset = 0;

        this.ATTRIBUTES.forEach((attr) => {
            const location = this.attributeLocations[attr.name];

            gl?.vertexAttribPointer(
                location,
                attr.size,
                attr.type,
                attr.normalized || false,
                this.ARRAY_ITEMS_PER_VERTEX * Float32Array.BYTES_PER_ELEMENT,
                offset
            );

            if (!(attr.type in SIZE_FACTOR_PER_ATTRIBUTE_TYPE)) {
                throw new Error(
                    `Program.bind: yet unsupported attribute type "${attr.type}"!`
                );
            }

            const sizeFactor = SIZE_FACTOR_PER_ATTRIBUTE_TYPE[attr.type];

            offset += attr.size * sizeFactor;
        });
    }

    private bufferData(): void {

        this.gl?.bufferData(this.gl.ARRAY_BUFFER, this.array, this.gl.DYNAMIC_DRAW);

        if (this.indicesArray) {
            this.gl?.bufferData(
                this.gl.ELEMENT_ARRAY_BUFFER,
                this.indicesArray,
                this.gl.STATIC_DRAW
            );
        }
    }

    // NOTE: implementing `reallocateIndices` is optional
    reallocateIndices(): void {
        return;
    }

    reallocate(capacity: number): void {
        // If desired capacity has not changed we do nothing
        // NOTE: it's possible here to implement more subtle reallocation schemes
        // when the number of rendered items increase or decrease
        if (capacity === this.capacity) return;

        this.capacity = capacity;
        this.verticesCount = this.VERTICES * capacity;
        this.array = new Float32Array(
            this.verticesCount * this.ARRAY_ITEMS_PER_VERTEX
        );

        if (typeof this.reallocateIndices === "function")
            this.reallocateIndices();
    }

    hasNothingToRender(): boolean {
        return this.verticesCount === 0;
    }

    abstract draw(params: RenderParams): void;

    render(params: RenderParams): void {
        if (this.hasNothingToRender()) return;

        this.bind();
        this.bufferData();
        this.gl?.useProgram(this.program);
        this.draw(params);
    }
}
