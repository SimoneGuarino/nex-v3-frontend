export interface PercentProp {
    percent: number;
    number: number;
}

export function CalcPercent({ percent, number }: PercentProp): number | undefined {
    if (percent === null || percent === undefined 
        || number === null || number === undefined) {
        return undefined;
    }
    const math = (number * percent) / 100;
    return math;
};