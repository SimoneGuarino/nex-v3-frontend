export function exportToCsv(
    filename: string,
    columns: string[],
    rows: (string | number | null)[][]
): void {
    const csvLines: string[] = [];

    // 1) header
    csvLines.push(
        columns
            .map(col => `"${col.replace(/"/g, '""')}"`)
            .join(';')
    );

    // 2) righe
    for (const row of rows) {
        const line = row
            .map(cell => {
                const v = cell == null ? '' : String(cell);
                return `"${v.replace(/"/g, '""')}"`;
            })
            .join(';');
        csvLines.push(line);
    }

    // BOM per Excel e join
    const csvContent = '\uFEFF' + csvLines.join('\n');

    // crea Blob e fornisci download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
