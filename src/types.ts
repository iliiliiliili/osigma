/**
 * osigma.js Types
 * ===============
 *
 * Various type declarations used throughout the library.
 * @module
 */
import { EventEmitter } from "events";
import { TypedArray } from "./core/ograph";

/**
 * Util type to represent maps of typed elements, but implemented with
 * JavaScript objects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PlainObject<T = any> = { [k: string]: T };

/**
 * Returns a type similar to T, but with the the K set of properties of the type
 * T *required*, and the rest optional.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PartialButFor<T, K extends keyof T> = Pick<T, K> &
    Partial<Omit<T, K>> & { [others: string]: any };

export interface Coordinates {
    x: number;
    y: number;
}

export interface CameraState extends Coordinates {
    angle: number;
    ratio: number;
}

export type MouseInteraction =
    | "click"
    | "doubleClick"
    | "rightClick"
    | "wheel"
    | "down";

export interface MouseCoords extends Coordinates {
    OSigmaDefaultPrevented: boolean;
    preventOSigmaDefault(): void;
    original: MouseEvent;
}

export interface WheelCoords extends MouseCoords {
    delta: number; // This will store the delta actually used by osigma
}

export interface TouchCoords {
    touches: Coordinates[];
    original: TouchEvent;
}

export interface Dimensions {
    width: number;
    height: number;
}

export type Extent = [number, number];

export interface DisplayData {
    label: string | null;
    size: number;
    color: string;
    hidden: boolean;
    forceLabel: boolean;
    zIndex: number;
    type: string;
}

export interface NodeDisplayData extends Coordinates, DisplayData {
    highlighted: boolean;
}

export interface EdgeDisplayData extends DisplayData {}

export type CoordinateConversionOverride = {
    cameraState?: CameraState;
    matrix?: Float32Array;
    viewportDimensions?: Dimensions;
    graphDimensions?: Dimensions;
    padding?: number;
};

export interface RenderParams {
    width: number;
    height: number;
    sizeRatio: number;
    zoomRatio: number;
    pixelRatio: number;
    correctionRatio: number;
    matrix: Float32Array;
}

/**
 * Custom event emitter types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Listener = (...args: any[]) => void;
export type EventsMapping = Record<string, Listener>;

interface ITypedEventEmitter<Events extends EventsMapping> {
    rawEmitter: EventEmitter;

    eventNames<Event extends keyof Events>(): Array<Event>;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    emit<Event extends keyof Events>(
        type: Event,
        ...args: Parameters<Events[Event]>
    ): boolean;
    addListener<Event extends keyof Events>(
        type: Event,
        listener: Events[Event]
    ): this;
    on<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
    once<Event extends keyof Events>(
        type: Event,
        listener: Events[Event]
    ): this;
    prependListener<Event extends keyof Events>(
        type: Event,
        listener: Events[Event]
    ): this;
    prependOnceListener<Event extends keyof Events>(
        type: Event,
        listener: Events[Event]
    ): this;
    removeListener<Event extends keyof Events>(
        type: Event,
        listener: Events[Event]
    ): this;
    off<Event extends keyof Events>(type: Event, listener: Events[Event]): this;
    removeAllListeners<Event extends keyof Events>(type?: Event): this;
    listeners<Event extends keyof Events>(type: Event): Events[Event][];
    listenerCount<Event extends keyof Events>(type: Event): number;
    rawListeners<Event extends keyof Events>(type: Event): Events[Event][];
}

export class TypedEventEmitter<
    Events extends EventsMapping
> extends (EventEmitter as unknown as {
    new <T extends EventsMapping>(): ITypedEventEmitter<T>;
})<Events> {
    constructor() {
        super();
        this.rawEmitter = this as EventEmitter;
    }
}

export type TColor = Uint8Array;
export type TLabel = Uint32Array;
export type TSize = Uint8Array;
export type TNodeFlags = Uint8Array;
export type TEdgeFlags = Uint8Array;
export type TNodeVisual = [TColor, TLabel, TSize, TNodeFlags];
export type TConnectionVisual = [TColor, TLabel, TSize, TEdgeFlags];

export const nodeVisualConstructor = (
    count: number,
    defaultColor?: number,
    defaultLabel?: number,
    defaultSize?: number,
    defaultFlags?: number
): TNodeVisual => {
    let color = new Uint8Array(count);
    let label = new Uint32Array(count);
    let size = new Uint8Array(count);
    let flags = new Uint8Array(count);

    if (defaultColor != undefined) {
        color = color.fill(defaultColor);
    }

    if (defaultLabel != undefined) {
        label = label.fill(defaultLabel);
    }

    if (defaultSize != undefined) {
        size = size.fill(defaultSize);
    }
    if (defaultFlags != undefined) {
        flags = flags.fill(defaultFlags);
    }

    return [color, label, size, flags];
};

export const connectionVisualConstructor = (
    count: number,
    defaultColor?: number,
    defaultLabel?: number,
    defaultSize?: number,
    defaultFlags?: number
): TConnectionVisual => {
    let color = new Uint8Array(count);
    let label = new Uint32Array(count);
    let size = new Uint8Array(count);
    let flags = new Uint8Array(count);

    if (defaultColor != undefined) {
        color = color.fill(defaultColor);
    }

    if (defaultLabel != undefined) {
        label = label.fill(defaultLabel);
    }

    if (defaultSize != undefined) {
        size = size.fill(defaultSize);
    }
    if (defaultFlags != undefined) {
        flags = flags.fill(defaultFlags);
    }

    return [color, label, size, flags];
};

export const nodeVisualConstructorFromData = (
    color: number[],
    label: number[],
    size: number[],
    flags: number[],
): TNodeVisual => {
    const colorArray = new Uint8Array(color);
    const labelArray = new Uint32Array(label);
    const sizeArray = new Uint8Array(size);
    const flagsArray = new Uint8Array(flags);
    return [
        colorArray,
        labelArray,
        sizeArray,
        flagsArray,
    ];
};

export const connectionVisualConstructorFromData = (
    color: number[],
    label: number[],
    size: number[],
    flags: number[],
): TConnectionVisual => {
    const colorArray = new Uint8Array(color);
    const labelArray = new Uint32Array(label);
    const sizeArray = new Uint8Array(size);
    const flagsArray = new Uint8Array(flags);
    return [
        colorArray,
        labelArray,
        sizeArray,
        flagsArray,
    ];
};