

export const labelChoices = (() => {

    const result: string[] = [""];

    for (let i = 1; i < 256; i++) {

        result.push(`l${i}`);
    }

    return result;
})();


export const colorChoices = (() => {

    const result: string[] = [];

    const maxChoicesPerColor = 6;
    const encodeColor = "0123456789ABCDEF";

    for (let ri = 0; ri < maxChoicesPerColor; ri++) {

        for (let gi = 0; gi < maxChoicesPerColor; gi++) {

            for (let bi = 0; bi < maxChoicesPerColor; bi++) {

                const r = encodeColor[Math.floor(16 * ri / maxChoicesPerColor)];
                const g = encodeColor[Math.floor(16 * gi / maxChoicesPerColor)];
                const b = encodeColor[Math.floor(16 * bi / maxChoicesPerColor)];

                result.push(`#${r}${g}${b}`);
            }
        }
    }

    return result;
})();

export const decodeLabel = (encoded: number): string => labelChoices[encoded];

export const decodeColor = (encoded: number): string => colorChoices[encoded];
