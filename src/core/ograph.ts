export type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

export class OGraph<TId extends TypedArray, TConnectionWeight extends TypedArray, TFeatures extends TypedArray | TypedArray[]> {

    public nodes: ONodes<TId, TFeatures>;
    public connections: OConnections<TId, TConnectionWeight>;

    constructor(nodes: ONodes<TId, TFeatures>, connections: OConnections<TId, TConnectionWeight>) {

        this.nodes = nodes;
        this.connections = connections;
    }

    get nodeCount(): number {

        return this.nodes.ids.length;
    }

    get connectionCount(): number {

        return this.connections.from.length;
    }
}

export interface OConnections<TId extends TypedArray, TValue extends TypedArray> {

    from: TId;
    to: TId;
    value: TValue;
}

export interface ONodes<TId extends TypedArray, TFeatures extends TypedArray | TypedArray[]> {

    ids: TId;
    features: TFeatures;
}