export const defaultLabelChoices = (() => {
    const result: string[] = [""];

    for (let i = 1; i < 256; i++) {
        result.push(`l${i}`);
    }

    return result;
})();

export const maxChoicesPerColor = 6;
export const defaultColorChoices = (() => {
    const result: string[] = [];

    const encodeColor = "0123456789ABCDEF";

    for (let ri = 0; ri < maxChoicesPerColor; ri++) {
        for (let gi = 0; gi < maxChoicesPerColor; gi++) {
            for (let bi = 0; bi < maxChoicesPerColor; bi++) {
                const r =
                    encodeColor[Math.floor((16 * ri) / maxChoicesPerColor)];
                const g =
                    encodeColor[Math.floor((16 * gi) / maxChoicesPerColor)];
                const b =
                    encodeColor[Math.floor((16 * bi) / maxChoicesPerColor)];

                result.push(`#${r}${g}${b}`);
            }
        }
    }

    return result;
})();

export class ValueChoices {
    public labelChoices: string[];
    public colorChoices: string[];

    constructor(
        labelChoices: string[] | null = null,
        colorChoices: string[] | null = null
    ) {
        this.labelChoices = labelChoices ?? defaultLabelChoices;
        this.colorChoices = colorChoices ?? defaultColorChoices;
    }

    public decodeLabel(encoded: number): string {
        return this.labelChoices[encoded];
    }
    public decodeColor(encoded: number): string {
        return this.colorChoices[encoded];
    }
}
