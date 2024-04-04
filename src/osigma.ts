/**
 * osigma.js
 * ========
 * @module
 */
import extend from "./core/extend";

import {
    OGraph,
    TypedArray,
    OSpatialNodes,
    OSpatialConnections,
} from "./core/ograph";
import Camera from "./core/camera";
import MouseCaptor from "./core/captors/mouse";
import QuadTree from "./core/quadtree";
import {
    CameraState,
    Coordinates,
    Dimensions,
    EdgeDisplayData,
    Extent,
    Listener,
    MouseCoords,
    NodeDisplayData,
    PlainObject,
    CoordinateConversionOverride,
    TypedEventEmitter,
    MouseInteraction,
    TNodeVisual,
    TConnectionVisual,
    nodeVisualConstructor,
    connectionVisualConstructor,
} from "./types";
import {
    createElement,
    getPixelRatio,
    createNormalizationFunction,
    NormalizationFunction,
    cancelFrame,
    matrixFromCamera,
    requestFrame,
    zIndexOrdering,
    getMatrixImpact,
    graphExtent,
} from "./utils";
import { LabelGrid } from "./core/labels";
import { Settings, validateSettings, resolveSettings } from "./settings";
import { AbstractNodeProgram } from "./rendering/webgl/programs/common/node";
import { AbstractEdgeProgram } from "./rendering/webgl/programs/common/edge";
import TouchCaptor, { FakeOSigmaMouseEvent } from "./core/captors/touch";
import { identity, multiplyVec2 } from "./utils/matrices";
import {
    doEdgeCollideWithPoint,
    isPixelColored,
} from "./utils/edge-collisions";
import { ValueChoices } from "./value-choices";

/**
 * Constants.
 */
const X_LABEL_MARGIN = 150;
const Y_LABEL_MARGIN = 50;

/**
 * Event types.
 */
export interface OSigmaEventPayload {
    event: MouseCoords;
    preventOSigmaDefault(): void;
}

export interface OSigmaStageEventPayload extends OSigmaEventPayload {}
export interface OSigmaNodeEventPayload extends OSigmaEventPayload {
    node: number;
}
export interface OSigmaEdgeEventPayload extends OSigmaEventPayload {
    edge: number;
}

export type OSigmaStageEvents = {
    [E in MouseInteraction as `${E}Stage`]: (
        payload: OSigmaStageEventPayload
    ) => void;
};

export type OSigmaNodeEvents = {
    [E in MouseInteraction as `${E}Node`]: (
        payload: OSigmaNodeEventPayload
    ) => void;
};

export type OSigmaEdgeEvents = {
    [E in MouseInteraction as `${E}Edge`]: (
        payload: OSigmaEdgeEventPayload
    ) => void;
};

export type OSigmaAdditionalEvents = {
    // Lifecycle events
    beforeRender(): void;
    afterRender(): void;
    resize(): void;
    kill(): void;

    // Additional node events
    enterNode(payload: OSigmaNodeEventPayload): void;
    leaveNode(payload: OSigmaNodeEventPayload): void;

    // Additional edge events
    enterEdge(payload: OSigmaEdgeEventPayload): void;
    leaveEdge(payload: OSigmaEdgeEventPayload): void;
};

export type OSigmaEvents = OSigmaStageEvents &
    OSigmaNodeEvents &
    OSigmaEdgeEvents &
    OSigmaAdditionalEvents;

/**
 * Main class.
 *
 * @constructor
 * @param {Graph}       graph     - Graph to render.
 * @param {HTMLElement} container - DOM container in which to render.
 * @param {object}      settings  - Optional settings.
 */
export default class OSigma<
    TId extends TypedArray,
    TConnectionWeight extends TypedArray,
    TCoordinates extends TypedArray,
    TZIndex extends TypedArray,
    TNodeFeatures extends TypedArray[],
    TConnectionFeatures extends TypedArray[]
> extends TypedEventEmitter<OSigmaEvents> {
    private settings: Settings<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >;
    private graph: OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    >;
    private mouseCaptor: MouseCaptor<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >;
    private touchCaptor: TouchCaptor<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    >;
    private container: HTMLElement | null;
    private elements: PlainObject<HTMLCanvasElement> = {};
    private canvasContexts: PlainObject<CanvasRenderingContext2D> = {};
    private webGLContexts: PlainObject<WebGLRenderingContext> = {};
    private activeListeners: PlainObject<Listener> = {};
    private quadtree: QuadTree = new QuadTree();
    private labelGrid: LabelGrid = new LabelGrid();
    // private nodeDataCache: Record<string, NodeDisplayData> = {};
    // private edgeDataCache: Record<string, EdgeDisplayData> = {};
    private nodesWithForcedLabels: number[] = [];
    private edgesWithForcedLabels: number[] = [];
    private nodeExtent: { x: Extent; y: Extent } = { x: [0, 1], y: [0, 1] };

    private matrix: Float32Array = identity();
    private invMatrix: Float32Array = identity();
    private correctionRatio = 1;
    private customBBox: { x: Extent; y: Extent } | null = null;
    private normalizationFunction: NormalizationFunction =
        createNormalizationFunction({
            x: [0, 1],
            y: [0, 1],
        });

    // Cache:
    private graphToViewportRatio = 1;

    // Starting dimensions and pixel ratio
    private width = 0;
    private height = 0;
    private pixelRatio = getPixelRatio();

    // State
    private displayedNodeLabels: Set<number> = new Set();
    private displayedEdgeLabels: Set<number> = new Set();
    private highlightedNodes: Set<number> = new Set();
    private hoveredNode: number | null = null;
    private hoveredEdge: number | null = null;
    private renderFrame: number | null = null;
    private renderHighlightedNodesFrame: number | null = null;
    private needToProcess = false;
    private checkEdgesEventsFrame: number | null = null;

    // Programs
    private nodePrograms: {
        [key: number]: AbstractNodeProgram<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >;
    } = {};
    private nodeHoverPrograms: {
        [key: number]: AbstractNodeProgram<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >;
    } = {};
    private edgePrograms: {
        [key: number]: AbstractEdgeProgram<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >;
    } = {};

    private camera: Camera;

    public valueChoices: ValueChoices;
    private shouldDefaultGraphVisuals: boolean;

    public nodeColorFeatureId: number;
    public nodeLabelFeatureId: number;
    public nodeSizeFeatureId: number;
    public nodeFlagsFeatureId: number;

    public connectionColorFeatureId: number;
    public connectionLabelFeatureId: number;
    public connectionSizeFeatureId: number;
    public connectionFlagsFeatureId: number;

    constructor(
        graph: OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            [...TNodeFeatures, ...TNodeVisual],
            [...TConnectionFeatures, ...TConnectionVisual]
        >,
        container: HTMLElement | null,
        settings: Partial<
            Settings<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                TNodeFeatures,
                TConnectionFeatures
            >
        > = {},
        shouldDefaultGraphVisuals = true,
        valueChoices: ValueChoices | null = null
    ) {
        super();

        this.shouldDefaultGraphVisuals = shouldDefaultGraphVisuals;

        this.nodeColorFeatureId = OSigma.getNodeColorFeatureId(
            graph.nodes.features.length
        );
        this.nodeLabelFeatureId = OSigma.getNodeLabelFeatureId(
            graph.nodes.features.length
        );
        this.nodeSizeFeatureId = OSigma.getNodeSizeFeatureId(
            graph.nodes.features.length
        );
        this.nodeFlagsFeatureId = OSigma.getNodeFlagsFeatureId(
            graph.nodes.features.length
        );

        this.connectionColorFeatureId = OSigma.getConnectionColorFeatureId(
            graph.connections.features.length
        );
        this.connectionLabelFeatureId = OSigma.getConnectionLabelFeatureId(
            graph.connections.features.length
        );
        this.connectionSizeFeatureId = OSigma.getConnectionSizeFeatureId(
            graph.connections.features.length
        );
        this.connectionFlagsFeatureId = OSigma.getConnectionFlagsFeatureId(
            graph.connections.features.length
        );

        this.valueChoices = valueChoices ?? new ValueChoices();

        // Resolving settings
        this.settings = resolveSettings(settings);

        // Validating
        validateSettings(this.settings);
        if (!(container == null || container instanceof HTMLElement))
            throw new Error(
                "osigma: container should be an html element or null for headless tests."
            );

        // Properties
        this.graph = graph;
        this.container = container;

        if (container != null) {
            // Initializing contexts
            this.createWebGLContext("edges", { preserveDrawingBuffer: true });
            this.createCanvasContext("edgeLabels");
            this.createWebGLContext("nodes");
            this.createCanvasContext("labels");
            this.createCanvasContext("hovers");
            this.createWebGLContext("hoverNodes");
            this.createCanvasContext("mouse");

            // Blending
            for (const key in this.webGLContexts) {
                const gl = this.webGLContexts[key];

                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                gl.enable(gl.BLEND);
            }
        }

        // Loading programs
        for (const type in this.settings.nodeProgramClasses) {
            const NodeProgramClass = this.settings.nodeProgramClasses[type];
            this.nodePrograms[type] = new NodeProgramClass(
                this.webGLContexts.nodes,
                this
            );

            let NodeHoverProgram = NodeProgramClass;
            if (type in this.settings.nodeHoverProgramClasses) {
                NodeHoverProgram = this.settings.nodeHoverProgramClasses[type];
            }

            this.nodeHoverPrograms[type] = new NodeHoverProgram(
                this.webGLContexts.hoverNodes,
                this
            );
        }
        for (const type in this.settings.edgeProgramClasses) {
            const EdgeProgramClass = this.settings.edgeProgramClasses[type];
            this.edgePrograms[type] = new EdgeProgramClass(
                this.webGLContexts.edges,
                this
            );
        }

        if (container != null) {
            // Initial resize
            this.resize();
        }

        // Initializing the camera
        this.camera = new Camera();

        // Binding camera events
        this.bindCameraHandlers();

        // Initializing captors
        this.mouseCaptor = new MouseCaptor(this.elements.mouse, this);
        this.touchCaptor = new TouchCaptor(this.elements.mouse, this);

        if (container != null) {
            // Binding event handlers
            this.bindEventHandlers();
        }

        // Binding graph handlers
        this.bindGraphHandlers();

        // Trigger eventual settings-related things
        this.handleSettingsUpdate();

        // Processing data for the first time & render
        this.refresh();
    }

    /**---------------------------------------------------------------------------
     * Internal methods.
     **---------------------------------------------------------------------------
     */

    /**
     * Internal function used to create a canvas element.
     * @param  {string} id - Context's id.
     * @return {OSigma}
     */
    private createCanvas(id: string): HTMLCanvasElement {
        const canvas: HTMLCanvasElement = createElement<HTMLCanvasElement>(
            "canvas",
            {
                position: "absolute",
            },
            {
                class: `osigma-${id}`,
            }
        );

        this.elements[id] = canvas;

        if (this.container == null) {
            throw Error("Container is null");
        }

        this.container.appendChild(canvas);

        return canvas;
    }

    /**
     * Internal function used to create a canvas context and add the relevant
     * DOM elements.
     *
     * @param  {string} id - Context's id.
     * @return {OSigma}
     */
    private createCanvasContext(id: string): this {
        const canvas = this.createCanvas(id);

        const contextOptions = {
            preserveDrawingBuffer: false,
            antialias: false,
        };

        this.canvasContexts[id] = canvas.getContext(
            "2d",
            contextOptions
        ) as CanvasRenderingContext2D;

        return this;
    }

    /**
     * Internal function used to create a canvas context and add the relevant
     * DOM elements.
     *
     * @param  {string}  id      - Context's id.
     * @param  {object?} options - #getContext params to override (optional)
     * @return {OSigma}
     */
    private createWebGLContext(
        id: string,
        options?: { preserveDrawingBuffer?: boolean; antialias?: boolean }
    ): this {
        const canvas = this.createCanvas(id);

        const contextOptions = {
            preserveDrawingBuffer: false,
            antialias: false,
            ...(options || {}),
        };

        let context;

        // First we try webgl2 for an easy performance boost
        context = canvas.getContext("webgl2", contextOptions);

        // Else we fall back to webgl
        if (!context) context = canvas.getContext("webgl", contextOptions);

        // Edge, I am looking right at you...
        if (!context)
            context = canvas.getContext("experimental-webgl", contextOptions);

        this.webGLContexts[id] = context as WebGLRenderingContext;

        return this;
    }

    /**
     * Method binding camera handlers.
     *
     * @return {OSigma}
     */
    private bindCameraHandlers(): this {
        this.activeListeners.camera = () => {
            this.scheduleRender();
        };

        this.camera.on("updated", this.activeListeners.camera);

        return this;
    }

    /**
     * Method unbinding camera handlers.
     *
     * @return {OSigma}
     */
    private unbindCameraHandlers(): this {
        this.camera.removeListener("updated", this.activeListeners.camera);
        return this;
    }

    /**
     * Method that checks whether or not a node collides with a given position.
     */
    private mouseIsOnNode(
        { x, y }: Coordinates,
        { x: nodeX, y: nodeY }: Coordinates,
        size: number
    ): boolean {
        return (
            x > nodeX - size &&
            x < nodeX + size &&
            y > nodeY - size &&
            y < nodeY + size &&
            Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2)) < size
        );
    }

    /**
     * Method that returns all nodes in quad at a given position.
     */
    private getQuadNodes(position: Coordinates): number[] {
        const mouseGraphPosition = this.viewportToFramedGraph(position);

        return this.quadtree.point(
            mouseGraphPosition.x,
            1 - mouseGraphPosition.y
        );
    }

    /**
     * Method that returns the closest node to a given position.
     */
    private getNodeAtPosition(position: Coordinates): number | null {
        const { x, y } = position;
        const quadNodes = this.getQuadNodes(position);

        // We will hover the node whose center is closest to mouse
        let minDistance = Infinity,
            nodeAtPosition = null;

        for (let i = 0, l = quadNodes.length; i < l; i++) {
            const nodeId = quadNodes[i];

            // const data = this.nodeDataCache[node];

            const nodePosition = this.framedGraphToViewport({
                x: this.graph.nodes.xCoordinates[nodeId],
                y: this.graph.nodes.yCoordinates[nodeId],
            });

            const size = this.scaleSize(
                this.graph.nodes.features[this.nodeSizeFeatureId][nodeId]
            );

            if (
                !this.isNodeHidden(nodeId) &&
                this.mouseIsOnNode(position, nodePosition, size)
            ) {
                const distance = Math.sqrt(
                    Math.pow(x - nodePosition.x, 2) +
                        Math.pow(y - nodePosition.y, 2)
                );

                // TODO: sort by min size also for cases where center is the same
                if (distance < minDistance) {
                    minDistance = distance;
                    nodeAtPosition = nodeId;
                }
            }
        }

        return nodeAtPosition;
    }

    /**
     * Method binding event handlers.
     *
     * @return {OSigma}
     */
    private bindEventHandlers(): this {
        // Handling window resize
        this.activeListeners.handleResize = () => {
            this.scheduleRender();
        };

        window.addEventListener("resize", this.activeListeners.handleResize);

        // Handling mouse move
        this.activeListeners.handleMove = (e: MouseCoords): void => {
            const baseEvent = {
                event: e,
                preventOSigmaDefault(): void {
                    e.preventOSigmaDefault();
                },
            };

            const nodeToHover = this.getNodeAtPosition(e);

            if (
                nodeToHover &&
                this.hoveredNode !== nodeToHover &&
                !this.isNodeHidden(nodeToHover)
            ) {
                // Handling passing from one node to the other directly
                if (this.hoveredNode)
                    this.emit("leaveNode", {
                        ...baseEvent,
                        node: this.hoveredNode,
                    });

                this.hoveredNode = nodeToHover;
                this.emit("enterNode", { ...baseEvent, node: nodeToHover });
                this.scheduleHighlightedNodesRender();
                return;
            }

            // Checking if the hovered node is still hovered
            if (this.hoveredNode) {
                // const data = this.nodeDataCache[this.hoveredNode];

                const pos = this.framedGraphToViewport({
                    x: this.graph.nodes.xCoordinates[this.hoveredNode],
                    y: this.graph.nodes.yCoordinates[this.hoveredNode],
                });

                const size = this.scaleSize(
                    this.graph.nodes.features[this.nodeSizeFeatureId][
                        this.hoveredNode
                    ]
                );

                if (!this.mouseIsOnNode(e, pos, size)) {
                    const node = this.hoveredNode;
                    this.hoveredNode = null;

                    this.emit("leaveNode", { ...baseEvent, node });
                    this.scheduleHighlightedNodesRender();
                    return;
                }
            }

            if (this.settings.enableEdgeHoverEvents === true) {
                this.checkEdgeHoverEvents(baseEvent);
            } else if (this.settings.enableEdgeHoverEvents === "debounce") {
                if (!this.checkEdgesEventsFrame)
                    this.checkEdgesEventsFrame = requestFrame(() => {
                        this.checkEdgeHoverEvents(baseEvent);
                        this.checkEdgesEventsFrame = null;
                    });
            }
        };

        // Handling click
        const createMouseListener = (
            eventType: MouseInteraction
        ): ((e: MouseCoords) => void) => {
            return (e) => {
                const baseEvent = {
                    event: e,
                    preventOSigmaDefault(): void {
                        e.preventOSigmaDefault();
                    },
                };

                const isFakeOSigmaMouseEvent = (
                    e.original as FakeOSigmaMouseEvent
                ).isFakeOSigmaMouseEvent;
                const nodeAtPosition = isFakeOSigmaMouseEvent
                    ? this.getNodeAtPosition(e)
                    : this.hoveredNode;

                if (nodeAtPosition)
                    return this.emit(`${eventType}Node`, {
                        ...baseEvent,
                        node: nodeAtPosition,
                    });

                if (
                    eventType === "wheel"
                        ? this.settings.enableEdgeWheelEvents
                        : this.settings.enableEdgeClickEvents
                ) {
                    const edge = this.getEdgeAtPoint(e.x, e.y);
                    if (edge)
                        return this.emit(`${eventType}Edge`, {
                            ...baseEvent,
                            edge,
                        });
                }

                return this.emit(`${eventType}Stage`, baseEvent);
            };
        };

        this.activeListeners.handleClick = createMouseListener("click");
        this.activeListeners.handleRightClick =
            createMouseListener("rightClick");
        this.activeListeners.handleDoubleClick =
            createMouseListener("doubleClick");
        this.activeListeners.handleWheel = createMouseListener("wheel");
        this.activeListeners.handleDown = createMouseListener("down");

        this.mouseCaptor.on("mousemove", this.activeListeners.handleMove);
        this.mouseCaptor.on("click", this.activeListeners.handleClick);
        this.mouseCaptor.on(
            "rightClick",
            this.activeListeners.handleRightClick
        );
        this.mouseCaptor.on(
            "doubleClick",
            this.activeListeners.handleDoubleClick
        );
        this.mouseCaptor.on("wheel", this.activeListeners.handleWheel);
        this.mouseCaptor.on("mousedown", this.activeListeners.handleDown);

        // TODO
        // Deal with Touch captor events

        return this;
    }

    /**
     * Method binding graph handlers
     *
     * @return {OSigma}
     */
    private bindGraphHandlers(): this {
        const graph = this.graph;

        this.activeListeners.graphUpdate = () => {
            this.scheduleRefresh();
        };

        this.activeListeners.dropNodeGraphUpdate = (e: {
            key: number;
        }): void => {
            // delete this.nodeDataCache[e.key];

            if (this.hoveredNode === e.key) this.hoveredNode = null;

            this.activeListeners.graphUpdate();
        };

        this.activeListeners.dropEdgeGraphUpdate = (e: {
            key: number;
        }): void => {
            // delete this.edgeDataCache[e.key];

            if (this.hoveredEdge === e.key) this.hoveredEdge = null;

            this.activeListeners.graphUpdate();
        };

        this.activeListeners.clearEdgesGraphUpdate = (): void => {
            // this.edgeDataCache = {};
            this.hoveredEdge = null;

            this.activeListeners.graphUpdate();
        };

        this.activeListeners.clearGraphUpdate = (): void => {
            // this.nodeDataCache = {};
            this.hoveredNode = null;

            this.activeListeners.clearEdgesGraphUpdate();
        };

        graph.on("nodeAdded", this.activeListeners.graphUpdate);
        graph.on("nodeDropped", this.activeListeners.dropNodeGraphUpdate);
        graph.on("nodeAttributesUpdated", this.activeListeners.graphUpdate);
        graph.on("eachNodeAttributesUpdated", this.activeListeners.graphUpdate);
        graph.on("edgeAdded", this.activeListeners.graphUpdate);
        graph.on("edgeDropped", this.activeListeners.dropEdgeGraphUpdate);
        graph.on("edgeAttributesUpdated", this.activeListeners.graphUpdate);
        graph.on("eachEdgeAttributesUpdated", this.activeListeners.graphUpdate);
        graph.on("edgesCleared", this.activeListeners.clearEdgesGraphUpdate);
        graph.on("cleared", this.activeListeners.clearGraphUpdate);

        return this;
    }

    /**
     * Method used to unbind handlers from the graph.
     *
     * @return {undefined}
     */
    private unbindGraphHandlers() {
        const graph = this.graph;

        graph.removeListener("nodeAdded", this.activeListeners.graphUpdate);
        graph.removeListener(
            "nodeDropped",
            this.activeListeners.dropNodeGraphUpdate
        );
        graph.removeListener(
            "nodeAttributesUpdated",
            this.activeListeners.graphUpdate
        );
        graph.removeListener(
            "eachNodeAttributesUpdated",
            this.activeListeners.graphUpdate
        );
        graph.removeListener("edgeAdded", this.activeListeners.graphUpdate);
        graph.removeListener(
            "edgeDropped",
            this.activeListeners.dropEdgeGraphUpdate
        );
        graph.removeListener(
            "edgeAttributesUpdated",
            this.activeListeners.graphUpdate
        );
        graph.removeListener(
            "eachEdgeAttributesUpdated",
            this.activeListeners.graphUpdate
        );
        graph.removeListener(
            "edgesCleared",
            this.activeListeners.clearEdgesGraphUpdate
        );
        graph.removeListener("cleared", this.activeListeners.clearGraphUpdate);
    }

    /**
     * Method dealing with "leaveEdge" and "enterEdge" events.
     *
     * @return {OSigma}
     */
    private checkEdgeHoverEvents(payload: OSigmaEventPayload): this {
        const edgeToHover = this.hoveredNode
            ? null
            : this.getEdgeAtPoint(payload.event.x, payload.event.y);

        if (edgeToHover !== this.hoveredEdge) {
            if (this.hoveredEdge)
                this.emit("leaveEdge", { ...payload, edge: this.hoveredEdge });
            if (edgeToHover)
                this.emit("enterEdge", { ...payload, edge: edgeToHover });
            this.hoveredEdge = edgeToHover;
        }

        return this;
    }

    /**
     * Method looking for an edge colliding with a given point at (x, y). Returns
     * the key of the edge if any, or null else.
     */
    private getEdgeAtPoint(x: number, y: number): number | null {
        // const { edgeDataCache, nodeDataCache } = this;

        // Check first that pixel is colored:
        // Note that mouse positions must be corrected by pixel ratio to correctly
        // index the drawing buffer.
        if (
            !isPixelColored(
                this.webGLContexts.edges,
                x * this.pixelRatio,
                y * this.pixelRatio
            )
        )
            return null;

        // Check for each edge if it collides with the point:
        const { x: graphX, y: graphY } = this.viewportToGraph({ x, y });

        // To translate edge thicknesses to the graph system, we observe by how much
        // the length of a non-null edge is transformed to between the graph system
        // and the viewport system:
        let transformationRatio = 0;
        this.graph.someEdge(
            (key, _, sourceId, targetId, [xs, ys], [xt, yt]) => {
                if (
                    this.isEdgeHidden(key) ||
                    this.isNodeHidden(sourceId) ||
                    this.isNodeHidden(targetId)
                )
                    return false;

                if (xs !== xt || ys !== yt) {
                    const graphLength = Math.sqrt(
                        Math.pow(xt - xs, 2) + Math.pow(yt - ys, 2)
                    );

                    const { x: vp_xs, y: vp_ys } = this.graphToViewport({
                        x: xs,
                        y: ys,
                    });
                    const { x: vp_xt, y: vp_yt } = this.graphToViewport({
                        x: xt,
                        y: yt,
                    });
                    const viewportLength = Math.sqrt(
                        Math.pow(vp_xt - vp_xs, 2) + Math.pow(vp_yt - vp_ys, 2)
                    );

                    transformationRatio = graphLength / viewportLength;
                    return true;
                }

                return false;
            }
        );
        // If no non-null edge has been found, return null:
        if (!transformationRatio) return null;

        // Now we can look for matching edges:
        const edges = this.graph.filterEdges(
            (key, _, sourceId, targetId, sourcePosition, targetPosition) => {
                if (
                    this.isEdgeHidden(key) ||
                    this.isNodeHidden(sourceId) ||
                    this.isNodeHidden(targetId)
                )
                    return false;
                if (
                    doEdgeCollideWithPoint(
                        graphX,
                        graphY,
                        sourcePosition[0],
                        sourcePosition[1],
                        targetPosition[0],
                        targetPosition[1],
                        // Adapt the edge size to the zoom ratio:
                        this.scaleSize(
                            this.graph.connections.features[
                                this.connectionSizeFeatureId
                            ][key] * transformationRatio
                        )
                    )
                ) {
                    return true;
                }

                return false;
            }
        );

        if (edges.length === 0) return null; // no edges found

        // if none of the edges have a zIndex, selected the most recently created one to match the rendering order
        let selectedEdge = edges[edges.length - 1];

        // otherwise select edge with highest zIndex
        let highestZIndex = -Infinity;
        for (const edge of edges) {
            const zIndex = this.graph.connections.zIndex[edge];
            if (zIndex >= highestZIndex) {
                selectedEdge = edge;
                highestZIndex = zIndex;
            }
        }

        return selectedEdge;
    }

    /**
     * Method used to process the whole graph's data.
     *
     * @return {OSigma}
     */
    private process(): this {
        const graph = this.graph;
        const settings = this.settings;
        const dimensions = this.getDimensions();

        const nodeZExtent: [number, number] = [Infinity, -Infinity];
        const edgeZExtent: [number, number] = [Infinity, -Infinity];

        // Clearing the quad
        this.quadtree.clear();

        // Resetting the label grid
        // TODO: it's probably better to do this explicitly or on resizes for layout and anims
        this.labelGrid.resizeAndClear(dimensions, settings.labelGridCellSize);

        // Clear the highlightedNodes
        this.highlightedNodes = new Set();

        // Computing extents
        this.nodeExtent = graphExtent(graph);

        // Resetting `forceLabel` indices
        this.nodesWithForcedLabels = [];
        this.edgesWithForcedLabels = [];

        // NOTE: it is important to compute this matrix after computing the node's extent
        // because #.getGraphDimensions relies on it
        const nullCamera = new Camera();
        const nullCameraMatrix = matrixFromCamera(
            nullCamera.getState(),
            this.getDimensions(),
            this.getGraphDimensions(),
            this.getSetting("stagePadding") || 0
        );

        // Rescaling function
        this.normalizationFunction = createNormalizationFunction(
            this.customBBox || this.nodeExtent
        );

        const nodesPerPrograms: Record<string, number> = {};

        if (this.shouldDefaultGraphVisuals) {
            this.applyNodeDefaults(this.settings, this.graph);
        }

        this.normalizationFunction.applyToAll(
            graph.nodes.xCoordinates,
            graph.nodes.yCoordinates
        );

        for (let i = 0, l = this.graph.nodeCount; i < l; i++) {
            const [, , forceLabel, nodeType] = OSigma.decodeNodeFlags(
                this.graph.nodes.features[this.nodeFlagsFeatureId][i]
            );

            nodesPerPrograms[nodeType] = (nodesPerPrograms[nodeType] || 0) + 1;
            // this.nodeDataCache[node] = data;

            if (forceLabel) this.nodesWithForcedLabels.push(i);

            if (this.settings.zIndex) {
                if (this.graph.nodes.zIndex[i] < nodeZExtent[0])
                    nodeZExtent[0] = this.graph.nodes.zIndex[i];
                if (this.graph.nodes.zIndex[i] > nodeZExtent[1])
                    nodeZExtent[1] = this.graph.nodes.zIndex[i];
            }
        }

        for (const type in this.nodePrograms) {
            if (!this.nodePrograms.hasOwnProperty(type)) {
                throw new Error(
                    `osigma: could not find a suitable program for node type "${type}"!`
                );
            }

            this.nodePrograms[type].reallocate(nodesPerPrograms[type] || 0);
            // We reset that count here, so that we can reuse it while calling the Program#process methods:
            nodesPerPrograms[type] = 0;
        }

        // // Handling node z-index
        // // TODO: z-index needs us to compute display data before hand
        // if (this.settings.zIndex && nodeZExtent[0] !== nodeZExtent[1])
        //     nodes = zIndexOrdering<string>(
        //         nodeZExtent,
        //         (node: string): number => this.nodeDataCache[node].zIndex,
        //         nodes
        //     );

        const normalizationRatio = this.normalizationFunction.ratio;
        for (let i = 0, l = graph.nodeCount; i < l; i++) {
            // const node = nodes[i];
            // const data = this.nodeDataCache[node];

            this.quadtree.add(
                i,
                graph.nodes.xCoordinates[i],
                1 - graph.nodes.yCoordinates[i],
                this.scaleSize(
                    graph.nodes.features[this.nodeSizeFeatureId][i],
                    1
                ) / normalizationRatio
            );

            const [hidden, highlighted, , nodeType] = OSigma.decodeNodeFlags(
                this.graph.nodes.features[this.nodeFlagsFeatureId][i]
            );

            if (!hidden)
                this.labelGrid.add(
                    i,
                    graph.nodes.features[this.nodeSizeFeatureId][i],
                    this.framedGraphToViewport(
                        {
                            x: graph.nodes.xCoordinates[i],
                            y: graph.nodes.yCoordinates[i],
                        },
                        {
                            matrix: nullCameraMatrix,
                        }
                    )
                );

            const nodeProgram = this.nodePrograms[nodeType];
            if (!nodeProgram)
                throw new Error(
                    `osigma: could not find a suitable program for node type "${nodeType}"!`
                );
            nodeProgram.process(nodesPerPrograms[nodeType]++, i);

            // Save the node in the highlighted set if needed
            if (highlighted && !hidden) this.highlightedNodes.add(i);
        }

        this.labelGrid.organize();

        const edgesPerPrograms: Record<number, number> = {};

        if (this.shouldDefaultGraphVisuals) {
            this.applyEdgeDefaults(this.settings, this.graph);
        }

        for (let i = 0, l = graph.connectionCount; i < l; i++) {
            // Edge display data resolution:
            //   1. First we get the edge's attributes
            //   2. We optionally reduce them using the function provided by the user
            //      Note that this function must return a total object and won't be merged
            //   3. We apply our defaults, while running some vital checks

            // We shallow copy edge data to avoid dangerous behaviors from reducers
            // let attr = Object.assign({}, graph.getEdgeAttributes(edge));

            // if (settings.edgeReducer) attr = settings.edgeReducer(edge, attr);

            const [hidden, forceLabel, edgeType] = OSigma.decodeEdgeFlags(
                this.graph.connections.features[this.connectionFlagsFeatureId][
                    i
                ]
            );

            edgesPerPrograms[edgeType] = (edgesPerPrograms[edgeType] || 0) + 1;
            // this.edgeDataCache[edge] = data;

            if (forceLabel && !hidden) this.edgesWithForcedLabels.push(i);

            if (this.settings.zIndex) {
                if (graph.connections.zIndex[i] < edgeZExtent[0])
                    edgeZExtent[0] = graph.connections.zIndex[i];
                if (graph.connections.zIndex[i] > edgeZExtent[1])
                    edgeZExtent[1] = graph.connections.zIndex[i];
            }
        }

        for (const type in this.edgePrograms) {
            if (!this.edgePrograms.hasOwnProperty(type)) {
                throw new Error(
                    `osigma: could not find a suitable program for edge type "${type}"!`
                );
            }

            this.edgePrograms[type].reallocate(edgesPerPrograms[type] || 0);
            // We reset that count here, so that we can reuse it while calling the Program#process methods:
            edgesPerPrograms[type] = 0;
        }

        // // Handling edge z-index
        // if (this.settings.zIndex && edgeZExtent[0] !== edgeZExtent[1])
        //     edges = zIndexOrdering(
        //         edgeZExtent,
        //         (edge: string): number => this.edgeDataCache[edge].zIndex,
        //         edges
        //     );

        for (let i = 0, l = graph.connectionCount; i < l; i++) {
            const edgeType = this.getEdgeType(i);
            this.edgePrograms[edgeType].process(
                edgesPerPrograms[edgeType]++,
                i
            );
        }

        this.shouldDefaultGraphVisuals = false;
        return this;
    }

    /**
     * Method that backports potential settings updates where it's needed.
     * @private
     */
    private handleSettingsUpdate(): this {
        this.camera.minRatio = this.settings.minCameraRatio;
        this.camera.maxRatio = this.settings.maxCameraRatio;
        this.camera.setState(this.camera.validateState(this.camera.getState()));

        return this;
    }

    /**
     * Method used to render labels.
     *
     * @return {OSigma}
     */
    private renderLabels(): this {
        if (!this.settings.renderLabels) return this;

        const cameraState = this.camera.getState();

        // Selecting labels to draw
        const nodesWhichLabelsToDisplay =
            this.labelGrid.getNodesWhichLabelsToDisplay(
                cameraState.ratio,
                this.settings.labelDensity
            );
        extend(nodesWhichLabelsToDisplay, this.nodesWithForcedLabels);

        this.displayedNodeLabels = new Set();

        // Drawing labels
        const context = this.canvasContexts.labels;

        for (let q = 0, l = nodesWhichLabelsToDisplay.length; q < l; q++) {
            const nodeId = nodesWhichLabelsToDisplay[q];

            // If the node was already drawn (like if it is eligible AND has
            // `forceLabel`), we don't want to draw it again
            // NOTE: we can do better probably
            if (this.displayedNodeLabels.has(nodeId)) continue;

            const [hidden, , forceLabel, nodeType] = OSigma.decodeNodeFlags(
                this.graph.nodes.features[this.nodeFlagsFeatureId][nodeId]
            );

            // If the node is hidden, we don't need to display its label obviously
            if (hidden) continue;

            const { x, y } = this.framedGraphToViewport({
                x: this.graph.nodes.xCoordinates[nodeId],
                y: this.graph.nodes.yCoordinates[nodeId],
            });

            // NOTE: we can cache the labels we need to render until the camera's ratio changes
            const size = this.scaleSize(
                this.graph.nodes.features[this.nodeSizeFeatureId][nodeId]
            );

            // Is node big enough?
            if (!forceLabel && size < this.settings.labelRenderedSizeThreshold)
                continue;

            // Is node actually on screen (with some margin)
            // NOTE: we used to rely on the quadtree for this, but the coordinates
            // conversion make it unreliable and at that point we already converted
            // to viewport coordinates and since the label grid already culls the
            // number of potential labels to display this looks like a good
            // performance compromise.
            // NOTE: labelGrid.getLabelsToDisplay could probably optimize by not
            // considering cells obviously outside of the range of the current
            // view rectangle.
            if (
                x < -X_LABEL_MARGIN ||
                x > this.width + X_LABEL_MARGIN ||
                y < -Y_LABEL_MARGIN ||
                y > this.height + Y_LABEL_MARGIN
            )
                continue;

            // Because displayed edge labels depend directly on actually rendered node
            // labels, we need to only add to this.displayedNodeLabels nodes whose label
            // is rendered.
            // This makes this.displayedNodeLabels depend on viewport, which might become
            // an issue once we start memoizing getLabelsToDisplay.
            this.displayedNodeLabels.add(nodeId);

            this.settings.labelRenderer(
                context,
                this.valueChoices.decodeLabel(
                    this.graph.nodes.features[this.nodeLabelFeatureId][nodeId]
                ),
                x,
                y,
                size,
                this.settings
            );
        }

        return this;
    }

    /**
     * Method used to render edge labels, based on which node labels were
     * rendered.
     *
     * @return {OSigma}
     */
    private renderEdgeLabels(): this {
        return this;
        // if (!this.settings.renderEdgeLabels) return this;

        // const context = this.canvasContexts.edgeLabels;

        // // Clearing
        // context.clearRect(0, 0, this.width, this.height);

        // const edgeLabelsToDisplay = edgeLabelsToDisplayFromNodes({
        //     graph: this.graph,
        //     hoveredNode: this.hoveredNode,
        //     displayedNodeLabels: this.displayedNodeLabels,
        //     highlightedNodes: this.highlightedNodes,
        // }).concat(this.edgesWithForcedLabels);
        // const displayedLabels = new Set<string>();

        // for (let i = 0, l = edgeLabelsToDisplay.length; i < l; i++) {
        //     const edge = edgeLabelsToDisplay[i],
        //         extremities = this.graph.extremities(edge),
        //         sourceData = this.nodeDataCache[extremities[0]],
        //         targetData = this.nodeDataCache[extremities[1]],
        //         edgeData = this.edgeDataCache[edge];

        //     // If the edge was already drawn (like if it is eligible AND has
        //     // `forceLabel`), we don't want to draw it again
        //     if (displayedLabels.has(edge)) continue;

        //     // If the edge is hidden we don't need to display its label
        //     // NOTE: the test on sourceData & targetData is probably paranoid at this point?
        //     if (edgeData.hidden || sourceData.hidden || targetData.hidden) {
        //         continue;
        //     }

        //     this.settings.edgeLabelRenderer(
        //         context,
        //         {
        //             key: edge,
        //             ...edgeData,
        //             size: this.scaleSize(edgeData.size),
        //         },
        //         {
        //             key: extremities[0],
        //             ...sourceData,
        //             ...this.framedGraphToViewport(sourceData),
        //             size: this.scaleSize(sourceData.size),
        //         },
        //         {
        //             key: extremities[1],
        //             ...targetData,
        //             ...this.framedGraphToViewport(targetData),
        //             size: this.scaleSize(targetData.size),
        //         },
        //         this.settings
        //     );
        //     displayedLabels.add(edge);
        // }

        // this.displayedEdgeLabels = displayedLabels;

        // return this;
    }

    /**
     * Method used to render the highlighted nodes.
     *
     * @return {OSigma}
     */
    private renderHighlightedNodes(): void {
        const context = this.canvasContexts.hovers;

        // Clearing
        context.clearRect(0, 0, this.width, this.height);

        // Rendering
        const render = (nodeId: number): void => {
            // const data = this.nodeDataCache[node];

            const { x, y } = this.framedGraphToViewport({
                x: this.graph.nodes.xCoordinates[nodeId],
                y: this.graph.nodes.yCoordinates[nodeId],
            });

            const size = this.scaleSize(
                this.graph.nodes.features[this.nodeSizeFeatureId][nodeId]
            );

            this.settings.hoverRenderer(
                context,
                this.valueChoices.decodeLabel(
                    this.graph.nodes.features[this.nodeLabelFeatureId][nodeId]
                ),
                x,
                y,
                size,
                this.settings
            );
        };

        const nodesToRender: number[] = [];

        if (this.hoveredNode) {
            const [hidden, , ,] = OSigma.decodeNodeFlags(
                this.graph.nodes.features[this.nodeFlagsFeatureId][
                    this.hoveredNode
                ]
            );

            if (!hidden) {
                nodesToRender.push(this.hoveredNode);
            }
        }

        this.highlightedNodes.forEach((node) => {
            // The hovered node has already been highlighted
            if (node !== this.hoveredNode) nodesToRender.push(node);
        });

        // Draw labels:
        nodesToRender.forEach((node) => render(node));

        // Draw WebGL nodes on top of the labels:
        const nodesPerPrograms: Record<string, number> = {};

        // 1. Count nodes per type:
        nodesToRender.forEach((node) => {
            // const type = this.nodeDataCache[node].type;
            const type = this.getNodeType(node);
            nodesPerPrograms[type] = (nodesPerPrograms[type] || 0) + 1;
        });
        // 2. Allocate for each type for the proper number of nodes
        for (const type in this.nodeHoverPrograms) {
            this.nodeHoverPrograms[type].reallocate(
                nodesPerPrograms[type] || 0
            );
            // Also reset count, to use when rendering:
            nodesPerPrograms[type] = 0;
        }
        // 3. Process all nodes to render:
        nodesToRender.forEach((node) => {
            const type = this.getNodeType(node);
            this.nodeHoverPrograms[type].process(
                nodesPerPrograms[type]++,
                node
            );
        });
        // 4. Clear hovered nodes layer:
        this.webGLContexts.hoverNodes.clear(
            this.webGLContexts.hoverNodes.COLOR_BUFFER_BIT
        );
        // 5. Render:
        for (const type in this.nodeHoverPrograms) {
            const program = this.nodeHoverPrograms[type];

            program.render({
                matrix: this.matrix,
                width: this.width,
                height: this.height,
                pixelRatio: this.pixelRatio,
                zoomRatio: this.camera.ratio,
                sizeRatio: 1 / this.scaleSize(),
                correctionRatio: this.correctionRatio,
            });
        }
    }

    /**
     * Method used to schedule a hover render.
     *
     */
    private scheduleHighlightedNodesRender(): void {
        if (this.renderHighlightedNodesFrame || this.renderFrame) return;

        this.renderHighlightedNodesFrame = requestFrame(() => {
            // Resetting state
            this.renderHighlightedNodesFrame = null;

            // Rendering
            this.renderHighlightedNodes();
            this.renderEdgeLabels();
        });
    }

    /**
     * Method used to render.
     *
     * @return {OSigma}
     */
    private render(): this {
        if (this.container === null) {
            return this;
        }

        this.emit("beforeRender");

        const exitRender = () => {
            this.emit("afterRender");
            return this;
        };

        // If a render was scheduled, we cancel it
        if (this.renderFrame) {
            cancelFrame(this.renderFrame);
            this.renderFrame = null;
        }

        // First we need to resize
        this.resize();

        // Do we need to reprocess data?
        if (this.needToProcess) this.process();
        this.needToProcess = false;

        // Clearing the canvases
        this.clear();

        // If we have no nodes we can stop right there
        if (this.graph.nodeCount <= 0) return exitRender();

        // TODO: improve this heuristic or move to the captor itself?
        // TODO: deal with the touch captor here as well
        const mouseCaptor = this.mouseCaptor;
        const moving =
            this.camera.isAnimated() ||
            mouseCaptor.isMoving ||
            mouseCaptor.draggedEvents ||
            mouseCaptor.currentWheelDirection;

        // Then we need to extract a matrix from the camera
        const cameraState = this.camera.getState();
        const viewportDimensions = this.getDimensions();
        const graphDimensions = this.getGraphDimensions();
        const padding = this.getSetting("stagePadding") || 0;
        this.matrix = matrixFromCamera(
            cameraState,
            viewportDimensions,
            graphDimensions,
            padding
        );
        this.invMatrix = matrixFromCamera(
            cameraState,
            viewportDimensions,
            graphDimensions,
            padding,
            true
        );
        this.correctionRatio = getMatrixImpact(
            this.matrix,
            cameraState,
            viewportDimensions
        );
        this.graphToViewportRatio = this.getGraphToViewportRatio();

        // [jacomyal]
        // This comment is related to the one above the `getMatrixImpact` definition:
        // - `this.correctionRatio` is somehow not completely explained
        // - `this.graphToViewportRatio` is the ratio of a distance in the viewport divided by the same distance in the
        //   graph
        // - `this.normalizationFunction.ratio` is basically `Math.max(graphDX, graphDY)`
        // And now, I observe that if I multiply these three ratios, I have something constant, which value remains 2, even
        // when I change the graph, the viewport or the camera. It might be useful later so I prefer to let this comment:
        // console.log(this.graphToViewportRatio * this.correctionRatio * this.normalizationFunction.ratio * 2);

        const params = {
            matrix: this.matrix,
            width: this.width,
            height: this.height,
            pixelRatio: this.pixelRatio,
            zoomRatio: this.camera.ratio,
            sizeRatio: 1 / this.scaleSize(),
            correctionRatio: this.correctionRatio,
        };

        // Drawing nodes
        for (const type in this.nodePrograms) {
            const program = this.nodePrograms[type];

            program.render(params);
        }

        // Drawing edges
        if (!this.settings.hideEdgesOnMove || !moving) {
            for (const type in this.edgePrograms) {
                const program = this.edgePrograms[type];

                program.render(params);
            }
        }

        // Do not display labels on move per setting
        if (this.settings.hideLabelsOnMove && moving) return exitRender();

        this.renderLabels();
        this.renderEdgeLabels();
        this.renderHighlightedNodes();

        return exitRender();
    }

    /**---------------------------------------------------------------------------
     * Public API.
     **---------------------------------------------------------------------------
     */

    /**
     * Method returning the renderer's camera.
     *
     * @return {Camera}
     */
    getCamera(): Camera {
        return this.camera;
    }

    /**
     * Method setting the renderer's camera.
     *
     * @param  {Camera} camera - New camera.
     * @return {OSigma}
     */
    setCamera(camera: Camera): void {
        this.unbindCameraHandlers();
        this.camera = camera;
        this.bindCameraHandlers();
    }

    /**
     * Method returning the container DOM element.
     *
     * @return {HTMLElement}
     */
    getContainer(): HTMLElement {
        if (this.container == null) {
            throw Error("Container is null");
        }

        return this.container;
    }

    getGraph(): OGraph<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        [...TNodeFeatures, ...TNodeVisual],
        [...TConnectionFeatures, ...TConnectionVisual]
    > {
        return this.graph;
    }

    /**
     * Method used to set the renderer's graph.
     *
     * @return {OGraph}
     */
    setGraph(
        graph: OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            [...TNodeFeatures, ...TNodeVisual],
            [...TConnectionFeatures, ...TConnectionVisual]
        >
    ): void {
        if (graph === this.graph) return;

        // Unbinding handlers on the current graph
        this.unbindGraphHandlers();

        // Clearing the graph data caches
        // this.nodeDataCache = {};
        // this.edgeDataCache = {};

        // Cleaning renderer state tied to the current graph
        this.displayedNodeLabels.clear();
        this.displayedEdgeLabels.clear();
        this.highlightedNodes.clear();
        this.hoveredNode = null;
        this.hoveredEdge = null;
        this.nodesWithForcedLabels.length = 0;
        this.edgesWithForcedLabels.length = 0;

        if (this.checkEdgesEventsFrame !== null) {
            cancelFrame(this.checkEdgesEventsFrame);
            this.checkEdgesEventsFrame = null;
        }

        // Installing new graph
        this.graph = graph;

        // Binding new handlers
        this.bindGraphHandlers();

        // Re-rendering now to avoid discrepancies from now to next frame
        this.refresh();
    }

    /**
     * Method returning the mouse captor.
     *
     * @return {MouseCaptor}
     */
    getMouseCaptor(): MouseCaptor<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    > {
        return this.mouseCaptor;
    }

    /**
     * Method returning the touch captor.
     *
     * @return {TouchCaptor}
     */
    getTouchCaptor(): TouchCaptor<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    > {
        return this.touchCaptor;
    }

    /**
     * Method returning the current renderer's dimensions.
     *
     * @return {Dimensions}
     */
    getDimensions(): Dimensions {
        return { width: this.width, height: this.height };
    }

    /**
     * Method returning the current graph's dimensions.
     *
     * @return {Dimensions}
     */
    getGraphDimensions(): Dimensions {
        const extent = this.customBBox || this.nodeExtent;

        return {
            width: extent.x[1] - extent.x[0] || 1,
            height: extent.y[1] - extent.y[0] || 1,
        };
    }

    // /**
    //  * Method used to get all the osigma node attributes.
    //  * It's usefull for example to get the position of a node
    //  * and to get values that are set by the nodeReducer
    //  *
    //  * @param  {string} key - The node's key.
    //  * @return {NodeDisplayData | undefined} A copy of the desired node's attribute or undefined if not found
    //  */
    // getNodeDisplayData(key: unknown): NodeDisplayData | undefined {
    //     const node = this.nodeDataCache[key as string];
    //     return node ? Object.assign({}, node) : undefined;
    // }

    // /**
    //  * Method used to get all the osigma edge attributes.
    //  * It's usefull for example to get values that are set by the edgeReducer.
    //  *
    //  * @param  {string} key - The edge's key.
    //  * @return {EdgeDisplayData | undefined} A copy of the desired edge's attribute or undefined if not found
    //  */
    // getEdgeDisplayData(key: unknown): EdgeDisplayData | undefined {
    //     const edge = this.edgeDataCache[key as string];
    //     return edge ? Object.assign({}, edge) : undefined;
    // }

    /**
     * Method used to get the set of currently displayed node labels.
     *
     * @return {Set<number>} A set of node keys whose label is displayed.
     */
    getNodeDisplayedLabels(): Set<number> {
        return new Set(this.displayedNodeLabels);
    }

    /**
     * Method used to get the set of currently displayed edge labels.
     *
     * @return {Set<number>} A set of edge keys whose label is displayed.
     */
    getEdgeDisplayedLabels(): Set<number> {
        return new Set(this.displayedEdgeLabels);
    }

    /**
     * Method returning a copy of the settings collection.
     *
     * @return {Settings} A copy of the settings collection.
     */
    getSettings(): Settings<
        TId,
        TConnectionWeight,
        TCoordinates,
        TZIndex,
        TNodeFeatures,
        TConnectionFeatures
    > {
        return { ...this.settings };
    }

    /**
     * Method returning the current value for a given setting key.
     *
     * @param  {string} key - The setting key to get.
     * @return {any} The value attached to this setting key or undefined if not found
     */
    getSetting<
        K extends keyof Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    >(
        key: K
    ):
        | Settings<
              TId,
              TConnectionWeight,
              TCoordinates,
              TZIndex,
              TNodeFeatures,
              TConnectionFeatures
          >[K]
        | undefined {
        return this.settings[key];
    }

    /**
     * Method setting the value of a given setting key. Note that this will schedule
     * a new render next frame.
     *
     * @param  {string} key - The setting key to set.
     * @param  {any}    value - The value to set.
     * @return {OSigma}
     */
    setSetting<
        K extends keyof Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    >(
        key: K,
        value: Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >[K]
    ): this {
        this.settings[key] = value;
        validateSettings(this.settings);
        this.handleSettingsUpdate();
        this.scheduleRefresh();
        return this;
    }

    /**
     * Method updating the value of a given setting key using the provided function.
     * Note that this will schedule a new render next frame.
     *
     * @param  {string}   key     - The setting key to set.
     * @param  {function} updater - The update function.
     * @return {OSigma}
     */
    updateSetting<
        K extends keyof Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    >(
        key: K,
        updater: (
            value: Settings<
                TId,
                TConnectionWeight,
                TCoordinates,
                TZIndex,
                TNodeFeatures,
                TConnectionFeatures
            >[K]
        ) => Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >[K]
    ): this {
        this.settings[key] = updater(this.settings[key]);
        validateSettings(this.settings);
        this.handleSettingsUpdate();
        this.scheduleRefresh();
        return this;
    }

    /**
     * Method used to resize the renderer.
     *
     * @return {OSigma}
     */
    resize(): this {
        const previousWidth = this.width,
            previousHeight = this.height;

        if (this.container == null) {
            throw Error("Container is null");
        }

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.pixelRatio = getPixelRatio();

        if (this.width === 0) {
            if (this.settings.allowInvalidContainer) this.width = 1;
            else
                throw new Error(
                    "osigma: Container has no width. You can set the allowInvalidContainer setting to true to stop seeing this error."
                );
        }

        if (this.height === 0) {
            if (this.settings.allowInvalidContainer) this.height = 1;
            else
                throw new Error(
                    "osigma: Container has no height. You can set the allowInvalidContainer setting to true to stop seeing this error."
                );
        }

        // If nothing has changed, we can stop right here
        if (previousWidth === this.width && previousHeight === this.height)
            return this;

        this.emit("resize");

        // Sizing dom elements
        for (const id in this.elements) {
            const element = this.elements[id];

            element.style.width = this.width + "px";
            element.style.height = this.height + "px";
        }

        // Sizing canvas contexts
        for (const id in this.canvasContexts) {
            this.elements[id].setAttribute(
                "width",
                this.width * this.pixelRatio + "px"
            );
            this.elements[id].setAttribute(
                "height",
                this.height * this.pixelRatio + "px"
            );

            if (this.pixelRatio !== 1)
                this.canvasContexts[id].scale(this.pixelRatio, this.pixelRatio);
        }

        // Sizing WebGL contexts
        for (const id in this.webGLContexts) {
            this.elements[id].setAttribute(
                "width",
                this.width * this.pixelRatio + "px"
            );
            this.elements[id].setAttribute(
                "height",
                this.height * this.pixelRatio + "px"
            );

            this.webGLContexts[id].viewport(
                0,
                0,
                this.width * this.pixelRatio,
                this.height * this.pixelRatio
            );
        }

        return this;
    }

    /**
     * Method used to clear all the canvases.
     *
     * @return {OSigma}
     */
    clear(): this {
        this.webGLContexts.nodes.clear(
            this.webGLContexts.nodes.COLOR_BUFFER_BIT
        );
        this.webGLContexts.edges.clear(
            this.webGLContexts.edges.COLOR_BUFFER_BIT
        );
        this.webGLContexts.hoverNodes.clear(
            this.webGLContexts.hoverNodes.COLOR_BUFFER_BIT
        );
        this.canvasContexts.labels.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.hovers.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.edgeLabels.clearRect(0, 0, this.width, this.height);

        return this;
    }

    /**
     * Method used to refresh, i.e. force the renderer to fully reprocess graph
     * data and render.
     *
     * @return {OSigma}
     */
    refresh(): this {
        this.needToProcess = true;
        this.render();

        return this;
    }

    /**
     * Method used to schedule a render at the next available frame.
     * This method can be safely called on a same frame because it basically
     * debounce refresh to the next frame.
     *
     * @return {OSigma}
     */
    scheduleRender(): this {
        if (!this.renderFrame) {
            this.renderFrame = requestFrame(() => {
                this.render();
            });
        }

        return this;
    }

    /**
     * Method used to schedule a refresh (i.e. fully reprocess graph data and render)
     * at the next available frame.
     * This method can be safely called on a same frame because it basically
     * debounce refresh to the next frame.
     *
     * @return {OSigma}
     */
    scheduleRefresh(): this {
        this.needToProcess = true;
        this.scheduleRender();
        return this;
    }

    /**
     * Method used to (un)zoom, while preserving the position of a viewport point.
     * Used for instance to zoom "on the mouse cursor".
     *
     * @param viewportTarget
     * @param newRatio
     * @return {CameraState}
     */
    getViewportZoomedState(
        viewportTarget: Coordinates,
        newRatio: number
    ): CameraState {
        const { ratio, angle, x, y } = this.camera.getState();

        // TODO: handle max zoom
        const ratioDiff = newRatio / ratio;

        const center = {
            x: this.width / 2,
            y: this.height / 2,
        };

        const graphMousePosition = this.viewportToFramedGraph(viewportTarget);
        const graphCenterPosition = this.viewportToFramedGraph(center);

        return {
            angle,
            x:
                (graphMousePosition.x - graphCenterPosition.x) *
                    (1 - ratioDiff) +
                x,
            y:
                (graphMousePosition.y - graphCenterPosition.y) *
                    (1 - ratioDiff) +
                y,
            ratio: newRatio,
        };
    }

    /**
     * Method returning the abstract rectangle containing the graph according
     * to the camera's state.
     *
     * @return {object} - The view's rectangle.
     */
    viewRectangle(): {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        height: number;
    } {
        // TODO: reduce relative margin?
        const marginX = (0 * this.width) / 8,
            marginY = (0 * this.height) / 8;

        const p1 = this.viewportToFramedGraph({
                x: 0 - marginX,
                y: 0 - marginY,
            }),
            p2 = this.viewportToFramedGraph({
                x: this.width + marginX,
                y: 0 - marginY,
            }),
            h = this.viewportToFramedGraph({ x: 0, y: this.height + marginY });

        return {
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            height: p2.y - h.y,
        };
    }

    /**
     * Method returning the coordinates of a point from the framed graph system to the viewport system. It allows
     * overriding anything that is used to get the translation matrix, or even the matrix itself.
     *
     * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
     * of computations.
     */
    framedGraphToViewport(
        coordinates: Coordinates,
        override: CoordinateConversionOverride = {}
    ): Coordinates {
        const recomputeMatrix =
            !!override.cameraState ||
            !!override.viewportDimensions ||
            !!override.graphDimensions;
        const matrix = override.matrix
            ? override.matrix
            : recomputeMatrix
            ? matrixFromCamera(
                  override.cameraState || this.camera.getState(),
                  override.viewportDimensions || this.getDimensions(),
                  override.graphDimensions || this.getGraphDimensions(),
                  override.padding || this.getSetting("stagePadding") || 0
              )
            : this.matrix;

        const viewportPos = multiplyVec2(matrix, coordinates);

        return {
            x: ((1 + viewportPos.x) * this.width) / 2,
            y: ((1 - viewportPos.y) * this.height) / 2,
        };
    }

    /**
     * Method returning the coordinates of a point from the viewport system to the framed graph system. It allows
     * overriding anything that is used to get the translation matrix, or even the matrix itself.
     *
     * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
     * of computations.
     */
    viewportToFramedGraph(
        coordinates: Coordinates,
        override: CoordinateConversionOverride = {}
    ): Coordinates {
        const recomputeMatrix =
            !!override.cameraState ||
            !!override.viewportDimensions ||
            !override.graphDimensions;
        const invMatrix = override.matrix
            ? override.matrix
            : recomputeMatrix
            ? matrixFromCamera(
                  override.cameraState || this.camera.getState(),
                  override.viewportDimensions || this.getDimensions(),
                  override.graphDimensions || this.getGraphDimensions(),
                  override.padding || this.getSetting("stagePadding") || 0,
                  true
              )
            : this.invMatrix;

        const res = multiplyVec2(invMatrix, {
            x: (coordinates.x / this.width) * 2 - 1,
            y: 1 - (coordinates.y / this.height) * 2,
        });

        if (isNaN(res.x)) res.x = 0;
        if (isNaN(res.y)) res.y = 0;

        return res;
    }

    /**
     * Method used to translate a point's coordinates from the viewport system (pixel distance from the top-left of the
     * stage) to the graph system (the reference system of data as they are in the given graph instance).
     *
     * This method accepts an optional camera which can be useful if you need to translate coordinates
     * based on a different view than the one being currently being displayed on screen.
     *
     * @param {Coordinates}                  viewportPoint
     * @param {CoordinateConversionOverride} override
     */
    viewportToGraph(
        viewportPoint: Coordinates,
        override: CoordinateConversionOverride = {}
    ): Coordinates {
        return this.normalizationFunction.inverse(
            this.viewportToFramedGraph(viewportPoint, override)
        );
    }

    /**
     * Method used to translate a point's coordinates from the graph system (the reference system of data as they are in
     * the given graph instance) to the viewport system (pixel distance from the top-left of the stage).
     *
     * This method accepts an optional camera which can be useful if you need to translate coordinates
     * based on a different view than the one being currently being displayed on screen.
     *
     * @param {Coordinates}                  graphPoint
     * @param {CoordinateConversionOverride} override
     */
    graphToViewport(
        graphPoint: Coordinates,
        override: CoordinateConversionOverride = {}
    ): Coordinates {
        return this.framedGraphToViewport(
            this.normalizationFunction(graphPoint),
            override
        );
    }

    /**
     * Method returning the distance multiplier between the graph system and the
     * viewport system.
     */
    getGraphToViewportRatio(): number {
        const graphP1 = { x: 0, y: 0 };
        const graphP2 = { x: 1, y: 1 };
        const graphD = Math.sqrt(
            Math.pow(graphP1.x - graphP2.x, 2) +
                Math.pow(graphP1.y - graphP2.y, 2)
        );

        const viewportP1 = this.graphToViewport(graphP1);
        const viewportP2 = this.graphToViewport(graphP2);
        const viewportD = Math.sqrt(
            Math.pow(viewportP1.x - viewportP2.x, 2) +
                Math.pow(viewportP1.y - viewportP2.y, 2)
        );

        return viewportD / graphD;
    }

    /**
     * Method returning the graph's bounding box.
     *
     * @return {{ x: Extent, y: Extent }}
     */
    getBBox(): { x: Extent; y: Extent } {
        return graphExtent(this.graph);
    }

    /**
     * Method returning the graph's custom bounding box, if any.
     *
     * @return {{ x: Extent, y: Extent } | null}
     */
    getCustomBBox(): { x: Extent; y: Extent } | null {
        return this.customBBox;
    }

    /**
     * Method used to override the graph's bounding box with a custom one. Give `null` as the argument to stop overriding.
     *
     * @return {OSigma}
     */
    setCustomBBox(customBBox: { x: Extent; y: Extent } | null): this {
        this.customBBox = customBBox;
        this.scheduleRender();
        return this;
    }

    /**
     * Method used to shut the container & release event listeners.
     *
     * @return {undefined}
     */
    kill(): void {
        // Emitting "kill" events so that plugins and such can cleanup
        this.emit("kill");

        // Releasing events
        this.removeAllListeners();

        // Releasing camera handlers
        this.unbindCameraHandlers();

        // Releasing DOM events & captors
        window.removeEventListener("resize", this.activeListeners.handleResize);
        this.mouseCaptor.kill();
        this.touchCaptor.kill();

        // Releasing graph handlers
        this.unbindGraphHandlers();

        // Releasing cache & state
        this.quadtree = new QuadTree();
        // this.nodeDataCache = {};
        // this.edgeDataCache = {};
        this.nodesWithForcedLabels = [];
        this.edgesWithForcedLabels = [];

        this.highlightedNodes.clear();

        // Clearing frames
        if (this.renderFrame) {
            cancelFrame(this.renderFrame);
            this.renderFrame = null;
        }

        if (this.renderHighlightedNodesFrame) {
            cancelFrame(this.renderHighlightedNodesFrame);
            this.renderHighlightedNodesFrame = null;
        }

        // Destroying canvases
        const container = this.container;

        if (container != null) {
            while (container.firstChild)
                container.removeChild(container.firstChild);
        }
    }

    /**
     * Method used to scale the given size according to the camera's ratio, i.e.
     * zooming state.
     *
     * @param  {number?} size -        The size to scale (node size, edge thickness etc.).
     * @param  {number?} cameraRatio - A camera ratio (defaults to the actual camera ratio).
     * @return {number}              - The scaled size.
     */
    scaleSize(size = 1, cameraRatio = this.camera.ratio): number {
        return (
            (size / this.settings.zoomToSizeRatioFunction(cameraRatio)) *
            (this.getSetting("itemSizesReference") === "positions"
                ? cameraRatio * this.graphToViewportRatio
                : 1)
        );
    }

    /**
     * Method that returns the collection of all used canvases.
     * At the moment, the instantiated canvases are the following, and in the
     * following order in the DOM:
     * - `edges`
     * - `nodes`
     * - `edgeLabels`
     * - `labels`
     * - `hovers`
     * - `hoverNodes`
     * - `mouse`
     *
     * @return {PlainObject<HTMLCanvasElement>} - The collection of canvases.
     */
    getCanvases(): PlainObject<HTMLCanvasElement> {
        return { ...this.elements };
    }

    public static encodeNodeFlags(
        hidden: boolean,
        highlighted: boolean,
        forceLabel: boolean,
        nodeType: number
    ): number {
        const result =
            (hidden ? 1 : 0) |
            ((highlighted ? 1 : 0) << 1) |
            ((forceLabel ? 1 : 0) << 2) |
            (nodeType << 3);

        return result;
    }

    public static decodeNodeFlags(
        nodeFlags: number
    ): [boolean, boolean, boolean, number] {
        const hidden = (nodeFlags & 0b1) == 1;
        const highlighted = ((nodeFlags >> 1) & 0b1) == 1;
        const forceLabel = ((nodeFlags >> 2) & 0b1) == 1;
        const nodeType = (nodeFlags >> 3) & 0b11;

        return [hidden, highlighted, forceLabel, nodeType];
    }

    public static encodeEdgeFlags(
        hidden: boolean,
        forceLabel: boolean,
        edgeType: number
    ): number {
        const result =
            (hidden ? 1 : 0) | ((forceLabel ? 1 : 0) << 1) | (edgeType << 2);

        return result;
    }

    public static decodeEdgeFlags(
        edgeFlags: number
    ): [boolean, boolean, number] {
        const hidden = (edgeFlags & 0b1) == 1;
        const forceLabel = ((edgeFlags >> 1) & 0b1) == 1;
        const edgeType = (edgeFlags >> 2) & 0b111;

        return [hidden, forceLabel, edgeType];
    }

    protected applyNodeDefaults(
        settings: Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >,
        graph: OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            [...TNodeFeatures, ...TNodeVisual],
            [...TConnectionFeatures, ...TConnectionVisual]
        >
    ): void {
        const defaultNodeFlags = OSigma.encodeNodeFlags(
            false,
            false,
            false,
            settings.defaultNodeType
        );

        for (let i = 0; i < graph.nodeCount; i++) {
            graph.nodes.features[this.nodeColorFeatureId][i] =
                settings.defaultNodeColor;
            // graph.nodes.features[this.nodeLabelFeatureId][i] = 0;
            graph.nodes.features[this.nodeSizeFeatureId][i] =
                settings.defaultNodeSize;
            graph.nodes.features[this.nodeFlagsFeatureId][i] = defaultNodeFlags;
            graph.nodes.zIndex[i] = 0;
        }
    }

    protected applyEdgeDefaults(
        settings: Settings<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >,
        graph: OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            [...TNodeFeatures, ...TNodeVisual],
            [...TConnectionFeatures, ...TConnectionVisual]
        >
    ): void {
        const defaultEdgeFlags = OSigma.encodeEdgeFlags(
            false,
            false,
            settings.defaultEdgeType
        );

        for (let i = 0; i < graph.nodeCount; i++) {
            graph.connections.features[this.connectionColorFeatureId][i] =
                settings.defaultEdgeColor;
            // graph.connections.features[this.connectionLabelFeatureId][i] = 0;
            graph.connections.features[this.connectionSizeFeatureId][i] =
                settings.defaultNodeSize;
            graph.connections.features[this.connectionFlagsFeatureId][i] =
                defaultEdgeFlags;
            // graph.connections.zIndex[i] = 0;
        }
    }

    public isNodeHidden(nodeId: number) {
        return (
            (this.graph.nodes.features[this.nodeFlagsFeatureId][nodeId] &
                0b1) ==
            1
        );
    }

    public isNodeHighlighted(nodeId: number) {
        return (
            ((this.graph.nodes.features[this.nodeFlagsFeatureId][nodeId] >> 1) &
                0b1) ==
            1
        );
    }

    public isNodeForceLabeled(nodeId: number) {
        return (
            ((this.graph.nodes.features[this.nodeFlagsFeatureId][nodeId] >> 2) &
                0b1) ==
            1
        );
    }

    public getNodeType(nodeId: number) {
        return (
            (this.graph.nodes.features[this.nodeFlagsFeatureId][nodeId] >> 3) &
            0b11
        );
    }

    public isEdgeHidden(edgeId: number) {
        return (
            (this.graph.connections.features[this.connectionFlagsFeatureId][
                edgeId
            ] &
                0b1) ==
            1
        );
    }

    public isEdgeForceLabeled(edgeId: number) {
        return (
            ((this.graph.connections.features[this.connectionFlagsFeatureId][
                edgeId
            ] >>
                1) &
                0b1) ==
            1
        );
    }

    public getEdgeType(edgeId: number) {
        return (
            (this.graph.connections.features[this.connectionFlagsFeatureId][
                edgeId
            ] >>
                2) &
            0b111
        );
    }

    public static getNodeColorFeatureId(featuresCount: number) {
        return featuresCount - 4;
    }
    public static getNodeLabelFeatureId(featuresCount: number) {
        return featuresCount - 3;
    }
    public static getNodeSizeFeatureId(featuresCount: number) {
        return featuresCount - 2;
    }
    public static getNodeFlagsFeatureId(featuresCount: number) {
        return featuresCount - 1;
    }

    public static getConnectionColorFeatureId(featuresCount: number) {
        return featuresCount - 4;
    }
    public static getConnectionLabelFeatureId(featuresCount: number) {
        return featuresCount - 3;
    }
    public static getConnectionSizeFeatureId(featuresCount: number) {
        return featuresCount - 2;
    }
    public static getConnectionFlagsFeatureId(featuresCount: number) {
        return featuresCount - 1;
    }

    public static makeVisualGraph<
        TId extends TypedArray,
        TConnectionWeight extends TypedArray,
        TCoordinates extends TypedArray,
        TZIndex extends TypedArray,
        TNodeFeatures extends TypedArray[],
        TConnectionFeatures extends TypedArray[]
    >(
        spatialGraph: OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            TNodeFeatures,
            TConnectionFeatures
        >
    ) {
        const nodes: OSpatialNodes<
            TCoordinates,
            TZIndex,
            [...TNodeFeatures, ...TNodeVisual]
        > = {
            xCoordinates: spatialGraph.nodes.xCoordinates,
            yCoordinates: spatialGraph.nodes.yCoordinates,
            zIndex: spatialGraph.nodes.zIndex,
            features: [
                ...spatialGraph.nodes.features,
                ...nodeVisualConstructor(spatialGraph.nodeCount),
            ],
        };
        const connections: OSpatialConnections<
            TId,
            TConnectionWeight,
            TZIndex,
            [...TConnectionFeatures, ...TConnectionVisual]
        > = {
            from: spatialGraph.connections.from,
            to: spatialGraph.connections.to,
            value: spatialGraph.connections.value,
            zIndex: spatialGraph.connections.zIndex,
            features: [
                ...spatialGraph.connections.features,
                ...connectionVisualConstructor(spatialGraph.connectionCount),
            ]
        };

        const visualGraph = new OGraph<
            TId,
            TConnectionWeight,
            TCoordinates,
            TZIndex,
            [...TNodeFeatures, ...TNodeVisual],
            [...TConnectionFeatures, ...TConnectionVisual]
        >(nodes, connections);

        return visualGraph;
    }
}
