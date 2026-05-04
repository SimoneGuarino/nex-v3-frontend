export interface SplitCammelCaseProp {
    string: string; // o un tipo più specifico al posto di 'any' se possibile
  }

export function SplitCammelCase({ string }: SplitCammelCaseProp){
    if(string == undefined){return;}
    const new_string = string.replace(/([a-z])([A-Z])/g, '$1 $2');
    return new_string;
}