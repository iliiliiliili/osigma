import { Listener } from "../types";

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


export type OGraphEvent = "nodeAdded" |
    "nodeDropped" |
    "nodeAttributesUpdated" |
    "eachNodeAttributesUpdated" |
    "edgeAdded" |
    "edgeDropped" |
    "edgeAttributesUpdated" |
    "eachEdgeAttributesUpdated" |
    "edgesCleared" |
    "cleared";


export class OGraphEventEmitter {

    protected listeners: Record<string, Listener[]> = { "a": [] };

    public on(event: OGraphEvent, listener: Listener) {

        if (!(event in this.listeners)) {

            this.listeners[event] = [];
        }

        this.listeners[event].push(listener);
    }

    public removeListener(event: OGraphEvent, listener: Listener) {

        if (event in this.listeners) {

            const index = this.listeners[event].indexOf(listener);

            if (index !== -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    protected call(event: OGraphEvent) {

        if (event in this.listeners) {

            this.listeners[event].forEach(element => {
                element();
            });
        }
    }
}


export class OGraph<TId extends TypedArray, TConnectionWeight extends TypedArray, TFeatures extends TypedArray | TypedArray[]> extends OGraphEventEmitter {

    public nodes: ONodes<TId, TFeatures>;
    public connections: OConnections<TId, TConnectionWeight>;

    constructor(nodes: ONodes<TId, TFeatures>, connections: OConnections<TId, TConnectionWeight>) {

        super();

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