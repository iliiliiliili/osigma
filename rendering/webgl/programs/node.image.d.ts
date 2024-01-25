import { NodeProgramConstructor } from "./common/node";
/**
 * To share the texture between the program instances of the graph and the
 * hovered nodes (to prevent some flickering, mostly), this program must be
 * "built" for each osigma instance:
 */
export default function getNodeImageProgram(): NodeProgramConstructor;
