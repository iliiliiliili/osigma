/**
 * osigma.js Canvas Renderer Hover Component
 * =========================================
 *
 * Function used by the canvas renderer to display a single node's hovered
 * state.
 * @module
 */
import { ValueSettings } from "../../settings";
import { NodeDisplayData, PartialButFor } from "../../types";
import drawLabel from "./label";

/**
 * Draw an hovered node.
 * - if there is no label => display a shadow on the node
 * - if the label box is bigger than node size => display a label box that contains the node with a shadow
 * - else node with shadow and the label box
 */
export default function drawHover(
    context: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    nodeSize: number,
    settings: ValueSettings
): void {
    const labelSize = settings.labelSize,
        font = settings.labelFont,
        weight = settings.labelWeight;

    context.font = `${weight} ${labelSize}px ${font}`;

    // Then we draw the label background
    context.fillStyle = "#FFF";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = "#000";

    const PADDING = 2;

    if (typeof label === "string") {
        const textWidth = context.measureText(label).width,
            boxWidth = Math.round(textWidth + 5),
            boxHeight = Math.round(labelSize + 2 * PADDING),
            radius = Math.max(nodeSize, labelSize / 2) + PADDING;

        const angleRadian = Math.asin(boxHeight / 2 / radius);
        const xDeltaCoord = Math.sqrt(
            Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2))
        );

        context.beginPath();
        context.moveTo(x + xDeltaCoord, y + boxHeight / 2);
        context.lineTo(x + radius + boxWidth, y + boxHeight / 2);
        context.lineTo(x + radius + boxWidth, y - boxHeight / 2);
        context.lineTo(x + xDeltaCoord, y - boxHeight / 2);
        context.arc(x, y, radius, angleRadian, -angleRadian);
        context.closePath();
        context.fill();
    } else {
        context.beginPath();
        context.arc(x, y, nodeSize + PADDING, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    }

    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;

    // And finally we draw the label
    drawLabel(context, label, x, y, nodeSize, settings);
}
