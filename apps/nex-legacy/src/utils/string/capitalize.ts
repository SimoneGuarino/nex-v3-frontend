export function CapitalizeFirstLetter(word: string): string {
    if (!word) return '';
    return word[0] + word.slice(1).toLowerCase();
}