interface StringAvatarProps{
    firstName?: string;
    lastName?: string;
    fullname?: string;
}
interface StringToColorrProps{
    string: string,
}



function StringToColor({string}: StringToColorrProps) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    const pastel = (hue: any, saturation: any, lightness: any) => {
        return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;
    };

    const hue = hash % 360; // Utilizza l'hash come base per la tonalità
    const saturation = 50; // Saturazione costante per colori pastello
    const lightness = 70; // Luminosità costante per colori pastello

    return pastel(hue, saturation, lightness);
}

// Split del nome applicando la logica per nome completo, nome singolo o assenza di dati
export function StringAvatar({ firstName, lastName, fullname }: StringAvatarProps) {
    if (!fullname || fullname.trim() === "") {
        fullname = `${firstName || "???"} ${lastName || ""}`.trim(); // Fallback su ??? se manca il firstName
    } else {
        // Dividi il fullname in nome e cognome, se necessario
        const parts = fullname.split(" ");
        firstName = parts[0];
        lastName = parts.length > 1 ? parts.slice(1).join(" ") : ""; // Gestisce i casi con più di due parole
    }

    const initials = `${firstName?.[0] || "?"}${lastName?.[0] || firstName?.[1] || "?"}`; // Gestisce iniziali per vari scenari

    return {
        sx: {
            bgcolor: StringToColor({ string: fullname }),
        },
        children: initials.toUpperCase(),
    };
}