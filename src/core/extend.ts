
export default function extend<T>(array: Array<T>, values: Array<T>): void {
    const l2 = values.length;

    if (l2 === 0)
        return;

    const l1 = array.length;

    array.length += l2;

    for (let i = 0; i < l2; i++)
        array[l1 + i] = values[i];
}