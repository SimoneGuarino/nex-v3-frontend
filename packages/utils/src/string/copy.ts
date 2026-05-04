// utils/copyToClipboard.ts
export type CopyOptions = {
    /** Se true, seleziona e ripristina la selezione utente nel fallback */
    preserveSelection?: boolean;
};

export async function CopyToClipboard(
    text: string,
    options: CopyOptions = {}
): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Passa al fallback sotto
    }

    // --- Fallback: textarea nascosta + execCommand('copy') ---
    try {
        const active = document.activeElement as HTMLElement | null;

        const ta = document.createElement('textarea');
        ta.value = text;

        // stile per non “saltare” layout e non scrollare
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';

        document.body.appendChild(ta);

        const selection = document.getSelection();
        const rangeBefore =
            options.preserveSelection && selection && selection.rangeCount > 0
                ? selection.getRangeAt(0).cloneRange()
                : null;

        ta.focus();
        ta.select();

        const ok = document.execCommand('copy');

        // pulizia + ripristino selezione/focus se richiesto
        document.body.removeChild(ta);

        if (options.preserveSelection && rangeBefore && selection) {
            selection.removeAllRanges();
            selection.addRange(rangeBefore);
        }
        if (options.preserveSelection && active) {
            active.focus();
        }

        return ok;
    } catch {
        return false;
    }
}
