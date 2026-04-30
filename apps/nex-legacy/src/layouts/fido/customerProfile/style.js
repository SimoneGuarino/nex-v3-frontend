function style_main(value, data){
    //Style dedicato al comporre il Colore e il BG del cerchio caricamento.           
    /// E => ROSSO            D => ARANCIONE            C => GIALLO            B => VERDE CHIARO            A => VERDE SCURO 
    const rating = data?.Generale?.RatingInternazionale || "E";
    let ColorCG = rating == 'E' ?
        '#c85b5b'
    : rating == 'D' ?
        '#d9863e'
    : rating == 'C' ?
        '#f1d033'
    : rating == 'B' ?
        '#b2df97'
    : rating == 'A' ?
        '#6bc732'
    : '#ccc'

    let BgCG = rating == 'E' ?
            '#ffbbbb'
        :rating == 'D' ?
            '#ffdfc4'
        : rating == 'C' ?
            '#fff3bb'
        : rating == 'B' ?
            '#e3ffd2'
        : rating == 'A' ?
            '#cdffae'
        : '#ccc'

    //Style dedicato al comporre il cerchio con il caricamento.
    return {
        //animation: "progress 2s 0.5s forwards",
        width: 400,
        height: 200,
        aspectRatio: 2 / 1,
        borderRadius: "50% / 100% 100% 0 0",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: 'center',
        alignSelf: 'center',
        "&::before": {
            content: `""`,
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `conic-gradient(from 0.75turn at 50% 100%, ${ColorCG} calc(${(value || 0)} * 1% / 2), ${BgCG} 0)`,
            WebkitMask: "radial-gradient(at 50% 100%, #0000 65%, #000 65.4%)",
            zIndex: 1,
            transition: `background 1s ease-in`,
        },
    };
};

function style_rounded(value, data){
    //Style dedicato al comporre il Colore e il BG del cerchio caricamento.
    const rating = data?.Generale?.RatingInternazionale || "E";
    let ColorCG = rating == 'E' ?
        '#c85b5b'
    : rating == 'D' ?
        '#d9863e'
    : rating == 'C' ?
        '#f1d033'
    : rating == 'B' ?
        '#b2df97'
    : rating == 'A' ?
        '#6bc732'
    : '#ccc'

    let BgCG = rating == 'E' ?
            '#ffbbbb'
        :rating == 'D' ?
            '#ffdfc4'
        : rating == 'C' ?
            '#fff3bb'
        : rating == 'B' ?
            '#e3ffd2'
        : rating == 'A' ?
            '#cdffae'
        : '#ccc'

    //Style dedicato al comporre il cerchio con il caricamento.
    return {
        //animation: "progress 2s 0.5s forwards",
        width: 400,
        height: 205,
        position: 'absolute',
        aspectRatio: 2 / 1,
        borderRadius: "50% / 100% 100% 0 0",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: 'center',
        alignSelf: 'center',
        "&::after" : {
            content: `""`,
            position: "absolute",
            bottom: 0,
            left: 0,
            background: ColorCG,
            borderRadius: "50%",
            width: 15.4,
            height: 15.4,
        },
        "&::before": {
            content: `""`,
            position: "absolute",
            bottom: 0,
            right: 0,
            background: "#aaddff",
            borderRadius: "50%",
            width: 15.4,
            height: 15.4,
            background: `conic-gradient(from ${value < 100 ? 0.65 : 0.82}turn at -50% 60%, ${ColorCG} calc(100 * 1% / 2), ${BgCG} 0)` // from 0.82turn is fulled
        },
    };
};

export { style_main, style_rounded};