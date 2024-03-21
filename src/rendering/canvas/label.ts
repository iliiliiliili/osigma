/**
 * osigma.js Canvas Renderer Label Component
 * =========================================
 *
 * Function used by the canvas renderer to display a single node's label.
 * @module
 */
import { ValueSettings } from "../../settings";
// import { NodeDisplayData, PartialButFor } from "../../types";

// export default function drawLabel(
//     context: CanvasRenderingContext2D,
//     data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
//     settings: Settings,
// ): void {
//     if (!data.label) return;

//     const size = settings.labelSize,
//         font = settings.labelFont,
//         weight = settings.labelWeight,
//         color = settings.labelColor.attribute
//             ? data[settings.labelColor.attribute] || settings.labelColor.color || "#000"
//             : settings.labelColor.color;

//     context.fillStyle = color;
//     context.font = `${weight} ${size}px ${font}`;

//     context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
// }

export default function drawLabel(
    context: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    nodeSize: number,
    settings: ValueSettings,
): void {

    const labelSize = settings.labelSize,
        font = settings.labelFont,
        weight = settings.labelWeight,
        color = settings.labelColor.color || "#000"

    context.fillStyle = color;
    context.font = `${weight} ${labelSize}px ${font}`;

    context.fillText(label, x + nodeSize + 3, y + labelSize / 3);
}
