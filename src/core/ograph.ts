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
    | Float64Array;

export type OGraphEvent =
    | "nodeAdded"
    | "nodeDropped"
    | "nodeAttributesUpdated"
    | "eachNodeAttributesUpdated"
    | "edgeAdded"
    | "edgeDropped"
    | "edgeAttributesUpdated"
    | "eachEdgeAttributesUpdated"
    | "edgesCleared"
    | "cleared";


export class OGraphEventEmitter {
    protected listeners: Record<string, Listener[]> = { a: [] };

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
            this.listeners[event].forEach((element) => {
                element();
            });
        }
    }
}

export interface OGraphologyInterface<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TFeatures extends TypedArray[]
> {
    someEdge(
        predicate: (
            connectionId: number,
            connectionWeight: number,
            sourceId: number,
            targetId: number,
            sourceCoordinates: [number, number],
            targetCoordinates: [number, number]
        ) => boolean
    ): boolean;

    // Instead of graphology edges, it returns ids of connections
    // that can be accessed later without creating new objects
    filterEdges(
        predicate: (
            connectionId: number,
            connectionWeight: number,
            sourceId: number,
            targetId: number,
            sourceCoordinates: [number, number],
            targetCoordinates: [number, number]
        ) => boolean
    ): number[];

    get order() : number;
    
}

export class OGraph<
        TId extends TypedArray,
        TConnectionWeight extends TypedArray,
        TCoordinates extends TypedArray,
        TFeatures extends TypedArray[]
    >
    extends OGraphEventEmitter
    implements OGraphologyInterface<TId, TConnectionWeight, TFeatures>
{
    public nodes: OSpatialNodes<TCoordinates, TFeatures>;
    public connections: OSpatialConnections<TId, TCoordinates, TConnectionWeight>;

    public constructor(
        nodes: OSpatialNodes<TCoordinates, TFeatures>,
        connections: OSpatialConnections<TId, TCoordinates, TConnectionWeight>
    ) {
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

    // OGraphologyInterface implementation start

    get order(): number {
        return this.nodeCount;
    }

    public someEdge(
        predicate: (
            connectionId: number,
            connectionWeight: number,
            sourceId: number,
            targetId: number,
            sourceCoordinates: [number, number],
            targetCoordinates: [number, number]
        ) => boolean
    ): boolean {
        for (let i = 0; i < this.connectionCount; i++) {
            if (
                predicate(
                    i,
                    this.connections.value[i],
                    this.connections.from[i],
                    this.connections.to[i],
                    [
                        this.nodes.xCoordinates[this.connections.from[i]],
                        this.nodes.yCoordinates[this.connections.from[i]],
                    ],
                    [
                        this.nodes.xCoordinates[this.connections.to[i]],
                        this.nodes.yCoordinates[this.connections.to[i]],
                    ]
                )
            ) {
                return true;
            }
        }

        return false;
    }

    public filterEdges(
        predicate: (
            connectionId: number,
            connectionWeight: number,
            sourceId: number,
            targetId: number,
            sourceCoordinates: [number, number],
            targetCoordinates: [number, number]
        ) => boolean
    ): number[] {
    
        const result = [];

        for (let i = 0; i < this.connectionCount; i++) {
            if (
                predicate(
                    i,
                    this.connections.value[i],
                    this.connections.from[i],
                    this.connections.to[i],
                    [
                        this.nodes.xCoordinates[this.connections.from[i]],
                        this.nodes.yCoordinates[this.connections.from[i]],
                    ],
                    [
                        this.nodes.xCoordinates[this.connections.to[i]],
                        this.nodes.yCoordinates[this.connections.to[i]],
                    ]
                )
            ) {
                result.push(i);
            }
        }

        return result;
    }
    
    // OGraphologyInterface implementation end
}

export interface OConnections<
    TId extends TypedArray,
    TValue extends TypedArray
> {
    from: TId;
    to: TId;
    value: TValue;
}

export interface ONodes<
    TFeatures extends TypedArray[]
> {
    features: TFeatures;
}

export interface OSpatialConnections<
    TId extends TypedArray,
    TValue extends TypedArray,
    TCoordinates extends TypedArray,
> {
    from: TId;
    to: TId;
    value: TValue;
    zIndex: TCoordinates,
}

export interface OSpatialNodes<
    TCoordinates extends TypedArray,
    TFeatures extends TypedArray[]
> extends ONodes<TFeatures> {
    xCoordinates: TCoordinates;
    yCoordinates: TCoordinates;
    features: TFeatures;
}
