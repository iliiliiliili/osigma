import { TConnectionVisual, TNodeVisual } from "../types";
import {
    OGraph,
    TypedArray,
    OSpatialNodes,
    OSpatialConnections,
} from "./ograph";

import OSigma from "../osigma";
import { ValueChoices } from "../value-choices";

export type JsonVerboseGraph = {
    nodes: {
        key: string;
        attributes: {
            label: string;
            x: number;
            y: number;
            z: number;
            [key: string]: string | number | boolean;
        };
    }[];
    edges: {
        [key: string]: string | number | boolean;
    }[];
};

export function jsonVerboseToVisualOGraph<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends [...TypedArray[], ...TNodeVisual],
    TConnectionFeatures extends [...TypedArray[], ...TConnectionVisual]
>({
    json,
    nodeFeatureFields,
    connectionFeatureFields,
    nodeColorField = null,
    nodeSizeField = null,
    connectionFromField,
    connectionToField,
    connectionColorField = null,
    connectionSizeField = null,
    connectionWeightField = null,
    connectionZIndexField = null,
    nodeFeaturesConstructor,
    connectionFeaturesConstructor,
    coordinatesConstructor,
    zIndexConstructor,
    idConstructor,
    connectionWeightConstructor,
    parseConnectionWeight = null,
    parseLabel = null,
    parseColor = null,
    parseSize = null,
    parseX = null,
    parseY = null,
    parseZ = null,
    parseNodeFeatureField = null,
    parseConnectionFeatureField = null,
}: {
    json: JsonVerboseGraph;
    nodeFeatureFields: string[];
    connectionFeatureFields: string[];
    nodeColorField?: string | null;
    nodeSizeField?: string | null;
    connectionFromField: string;
    connectionToField: string;
    connectionColorField?: string | null;
    connectionSizeField?: string | null;
    connectionWeightField?: string | null;
    connectionZIndexField?: string | null;
    nodeFeaturesConstructor: (count: number) => TNodeFeatures;
    connectionFeaturesConstructor: (count: number) => TConnectionFeatures;
    coordinatesConstructor: (count: number) => TCoordinates;
    zIndexConstructor: (count: number) => TZIndex;
    idConstructor: (count: number) => TId;
    connectionWeightConstructor: (count: number) => TConnectionWeight;
    parseConnectionWeight?: ((a: string | number) => number) | null;
    parseLabel?: ((a: string) => string) | null;
    parseColor?: ((a: string) => number) | null;
    parseSize?: ((a: number) => number) | null;
    parseX?: ((a: number) => number) | null;
    parseY?: ((a: number) => number) | null;
    parseZ?: ((a: number) => number) | null;
    parseNodeFeatureField?:
        | ((nodeFeatureId: number, value: string | number | boolean) => number)
        | null;
    parseConnectionFeatureField?:
        | ((
              connectionFeatureId: number,
              value: string | number | boolean
          ) => number)
        | null;
}): [
    OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >,
    ValueChoices
] {
    const keyDictionary: Record<string, number> = {};
    const labelDictionary: Record<string, number> = {};

    const keys: string[] = [];
    const labels: string[] = [];

    const nodesCount = json.nodes.length;
    const connectionsCount = json.edges.length;

    const nodes: OSpatialNodes<TCoordinates, TZIndex, TNodeFeatures> = {
        xCoordinates: coordinatesConstructor(nodesCount),
        yCoordinates: coordinatesConstructor(nodesCount),
        zIndex: zIndexConstructor(nodesCount),
        features: nodeFeaturesConstructor(nodesCount),
    };

    const connections: OSpatialConnections<
        TId,
        TConnectionWeight,
        TZIndex,
        TConnectionFeatures
    > = {
        from: idConstructor(connectionsCount),
        to: idConstructor(connectionsCount),
        value: connectionWeightConstructor(connectionsCount),
        zIndex: zIndexConstructor(connectionsCount),
        features: connectionFeaturesConstructor(connectionsCount),
    };

    let nodeId = 0;

    for (const node of json.nodes) {
        if (!(node.key in keyDictionary)) {
            keyDictionary[node.key] = keys.length;
            keys.push(node.key);
        }

        const label = parseLabel
            ? parseLabel(node.attributes.label)
            : node.attributes.label;

        if (!(label in labelDictionary)) {
            labelDictionary[label] = labels.length;
            labels.push(label);
        }

        nodes.features[OSigma.getNodeLabelFeatureId(nodes.features.length)][
            nodeId
        ] = labelDictionary[label];

        if (nodeColorField != null) {
            const color = parseColor
                ? parseColor(node.attributes[nodeColorField] as string)
                : parseInt(node.attributes[nodeColorField] as string);
            nodes.features[OSigma.getNodeColorFeatureId(nodes.features.length)][
                nodeId
            ] = color;
        }

        let size = 10;

        if (nodeSizeField != null) {
            size = parseSize
                ? parseSize(node.attributes[nodeSizeField] as number)
                : (node.attributes[nodeSizeField] as number);
        }

        nodes.features[OSigma.getNodeSizeFeatureId(nodes.features.length)][
            nodeId
        ] = size;

        const x = parseX ? parseX(node.attributes.x) : node.attributes.x;
        const y = parseY ? parseY(node.attributes.y) : node.attributes.y;
        const z = parseZ ? parseZ(node.attributes.z) : node.attributes.z;

        nodes.xCoordinates[nodeId] = x;
        nodes.yCoordinates[nodeId] = y;
        nodes.zIndex[nodeId] = z;

        for (
            let nodeFeatureId = 0;
            nodeFeatureId < nodeFeatureFields.length;
            nodeFeatureId++
        ) {
            const value = parseNodeFeatureField
                ? parseNodeFeatureField(
                      nodeFeatureId,
                      node.attributes[nodeFeatureFields[nodeFeatureId]]
                  )
                : (node.attributes[nodeFeatureFields[nodeFeatureId]] as number);

            nodes.features[nodeFeatureId][nodeId] = value;
        }

        nodeId++;
    }

    let connectionId = 0;

    for (const connection of json.edges) {
        // TODO: Implement connection labels

        if (connectionColorField != null) {
            const color = parseColor
                ? parseColor(connection[connectionColorField] as string)
                : parseInt(connection[connectionColorField] as string);
            connections.features[
                OSigma.getConnectionColorFeatureId(connections.features.length)
            ][connectionId] = color;
        }

        let size = 10;

        if (connectionSizeField != null) {
            size = parseSize
                ? parseSize(connection[connectionSizeField] as number)
                : (connection[connectionSizeField] as number);
        }

        connections.features[
            OSigma.getConnectionSizeFeatureId(connections.features.length)
        ][connectionId] = size;

        const fromKey = connection[connectionFromField] as string;
        const toKey = connection[connectionToField] as string;

        connections.from[connectionId] = keyDictionary[fromKey];
        connections.to[connectionId] = keyDictionary[toKey];

        if (connectionWeightField != null) {
            const weight = parseConnectionWeight
                ? parseConnectionWeight(
                      connection[connectionWeightField] as string | number
                  )
                : (connection[connectionWeightField] as number);
            connections.value[connectionId] = weight;
        }

        if (connectionZIndexField != null) {
            const zIndex = parseZ
                ? parseZ(connection[connectionZIndexField] as number)
                : (connection[connectionZIndexField] as number);
            connections.zIndex[connectionId] = zIndex;
        }

        for (
            let connectionFeatureId = 0;
            connectionFeatureId < connectionFeatureFields.length;
            connectionFeatureId++
        ) {
            const value = parseConnectionFeatureField
                ? parseConnectionFeatureField(
                      connectionFeatureId,
                      connection[connectionFeatureFields[connectionFeatureId]]
                  )
                : (connection[
                      connectionFeatureFields[connectionFeatureId]
                  ] as number);

            connections.features[connectionFeatureId][connectionId] = value;
        }

        connectionId++;
    }

    console.log(`Loaded nodes:${nodes.xCoordinates.length}, connections: ${connections.from.length}`);

    const graph = new OGraph(nodes, connections);
    const valueChoices = new ValueChoices(labels);

    return [graph, valueChoices];
}
