// Dependencies
import OSigma from "../../../src";
import { OGraph } from "../../../src/core/ograph";

// Programs to test
import NodeCircleProgram from "../../../src/rendering/webgl/programs/node.circle";
import NodePointProgram from "../../../src/rendering/webgl/programs/node.point";
import getNodeImageProgram from "../../../src/rendering/webgl/programs/node.image";
import EdgeRectangleProgram from "../../../src/rendering/webgl/programs/edge.rectangle";
import EdgeLineProgram from "../../../src/rendering/webgl/programs/edge.line";
import EdgeArrowProgram from "../../../src/rendering/webgl/programs/edge.arrow";
import EdgeTriangleProgram from "../../../src/rendering/webgl/programs/edge.triangle";

// Useful data
// import ARCTIC from "./resources/arctic.json";
// import LES_MISERABLES from "./resources/les-miserables.json";

// const arctic = Graph.from(ARCTIC as SerializedGraph);
// const lesMiserables = Graph.from(LES_MISERABLES as SerializedGraph);

const container = document.getElementById("container") as HTMLElement;

function globalize(variables: Record<string, unknown>): void {
  for (const key in variables) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window[key] = variables[key];
  }
}

globalize({
  dependencies: {
    OGraph,
    OSigma,
    // data: { arctic, lesMiserables },
    programs: {
      NodeCircleProgram,
      NodePointProgram,
      getNodeImageProgram,
      EdgeLineProgram,
      EdgeRectangleProgram,
      EdgeArrowProgram,
      EdgeTriangleProgram,
    },
    container,
  },
});
