/**
 * This is a minimal example of osigma. You can use it as a base to write new
 * examples, or reproducible test cases for new issues, for instance.
 */

import Graph from "graphology";
import osigma from "osigma";
import NodeCircleProgram from "../../src/rendering/webgl/programs/node.circle";

const container = document.getElementById("osigma-container") as HTMLElement;

const graph = new Graph();

graph.addNode("Andrea", { x: 0, y: 0, size: 6, label: "Andrea", color: "blue" });
graph.addNode("Bill", { x: 10, y: 0, size: 4, label: "Bill", color: "red" });
graph.addNode("Carole", { x: 10, y: 10, size: 6, label: "Carole", color: "green" });
graph.addNode("Daniel", { x: 0, y: 10, size: 4, label: "Daniel", color: "purple" });

graph.addEdge("Andrea", "Bill", { size: 12 });
graph.addEdge("Bill", "Carole", { size: 12 });
graph.addEdge("Carole", "Daniel", { size: 8 });
graph.addEdge("Daniel", "Andrea", { size: 8 });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const renderer = new osigma(graph, container, {
  itemSizesReference: "positions",
  zoomToSizeRatioFunction: (x) => x,
  nodeProgramClasses: {
    circle: NodeCircleProgram,
  },
});
