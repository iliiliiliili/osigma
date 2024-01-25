/**
 * osigma.js WebGL Renderer Program
 * ================================
 *
 * Class representing a single WebGL program used by osigma's WebGL renderer.
 * @module
 */
import type osigma from "../../../../osigma";
import type { RenderParams } from "../../../../types";
export interface ProgramAttributeSpecification {
    name: string;
    size: number;
    type: number;
    normalized?: boolean;
}
export interface ProgramDefinition<Uniform extends string = string> {
    VERTICES: number;
    ARRAY_ITEMS_PER_VERTEX: number;
    VERTEX_SHADER_SOURCE: string;
    FRAGMENT_SHADER_SOURCE: string;
    UNIFORMS: ReadonlyArray<Uniform>;
    ATTRIBUTES: Array<ProgramAttributeSpecification>;
}
export declare abstract class AbstractProgram {
    constructor(_gl: WebGLRenderingContext, _renderer: osigma);
    abstract reallocate(capacity: number): void;
    abstract render(params: RenderParams): void;
}
export declare abstract class Program<Uniform extends string = string> implements AbstractProgram, ProgramDefinition {
    VERTICES: number;
    ARRAY_ITEMS_PER_VERTEX: number;
    VERTEX_SHADER_SOURCE: string;
    FRAGMENT_SHADER_SOURCE: string;
    UNIFORMS: ReadonlyArray<Uniform>;
    ATTRIBUTES: Array<ProgramAttributeSpecification>;
    STRIDE: number;
    renderer: osigma;
    gl: WebGLRenderingContext;
    buffer: WebGLBuffer;
    array: Float32Array;
    canUse32BitsIndices: boolean;
    indicesType: number;
    indicesBuffer: WebGLBuffer;
    IndicesArray: Uint16ArrayConstructor | Uint32ArrayConstructor;
    indicesArray: Uint16Array | Uint32Array | null;
    vertexShader: WebGLShader;
    fragmentShader: WebGLShader;
    program: WebGLProgram;
    uniformLocations: Record<Uniform, WebGLUniformLocation>;
    attributeLocations: Record<string, GLint>;
    capacity: number;
    verticesCount: number;
    abstract getDefinition(): ProgramDefinition<Uniform>;
    constructor(gl: WebGLRenderingContext, renderer: osigma);
    private bind;
    private bufferData;
    reallocateIndices(): void;
    reallocate(capacity: number): void;
    hasNothingToRender(): boolean;
    abstract draw(params: RenderParams): void;
    render(params: RenderParams): void;
}
