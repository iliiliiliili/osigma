type TypedArray =
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
    public globalParams: { nodes: number, links: number } | null = null;
    public connections: OConnections<TId, TConnectionWeight>;
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