export interface SplitCammelCaseProp {
    string: string; // o un tipo più specifico al posto di 'any' se possibile
  }

export function StringToHTML({ string }: SplitCammelCaseProp){
    // Cast to string
    if (typeof string != 'string') {
        string = String(string);
    }

    // Replace HTML entities back to original characters
    string = string.replace(/&lt;/gmi, '<')
        .replace(/&gt;/gmi, '>')
        .replace(/&#36;/gmi, '$')
        .replace(/&amp;/gmi, '&')
        .replace(/&quot;/gmi, '"')
        .replace(/&#039;/gmi, "'");

    return string;
}
