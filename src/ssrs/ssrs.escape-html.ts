const REPLACEMENTS: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
};

export function escapeHtml(input: string): string {
    return input.replace(/[&<>"']/g, char => REPLACEMENTS[char]);
}
