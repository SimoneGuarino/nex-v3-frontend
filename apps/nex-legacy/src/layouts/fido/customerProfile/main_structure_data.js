export function general_structure_box(FidoActived) {
    return [
        {
            from: 'Anagrafica', var: FidoActived, autoAdd: true, key: 'profile', title: 'Profile', directionPart: 'row', divider: true, sx: { height: '100%' }, dataTour: "fido-panel-anagrafica", part: [
                { key: 0, sx: { padding: 1.5, alignItems: 'center', height: '100%' } },
            ], xs: 12, md: 12, lg: 6
        },

        {
            from: 'Generale', key: 'rating', title: 'Rating cliente', icon: 'F', sx: { height: '100%' }, dataTour: "fido-gauge", gap: 0.3, part: [
                { key: 0, sx: { alignItems: 'center', width: '100%', height: '100%', padding: 1.5, borderRadius: 4 } },
                { key: 1, sx: { alignItems: 'center', width: '100%', height: '100%', padding: 3, borderRadius: 4, gap: 1 } }
            ], xs: 12, md: 12, lg: 6
        },

        {
            from: 'Fidi', switch: true, var: FidoActived, type: 'half_dynamic', ignore: ['Esiti', 'Tipi', 'FidoResiduo', 'FidoTotale'], key: 'fido', title: 'Credito cliente', icon: 'F', sx: { height: '100%' }, dataTour: "fido-residuo", gap: 0.3, part: [
                { key: 0, sx: { alignItems: 'center', width: '100%', maxWidth: '100%', height: '100%', maxHeight: '100%' } },
            ], xs: 12, md: 12, lg: 8
        },

        //Genera i blocchi fido in maniera dinamica in base alla variabile selezionata (switch)
        {
            from: 'Fidi', to: 'Tipi', var: FidoActived, key: 'assicurazione', title: 'Assicurazione', icon: 'F', sx: { height: '100%' }, gap: 0.3, type: 'dynamic_part', dataTour: 'altri-fido',
            xs: 12, md: 12, lg: 4
        },

        {
            from: 'Generale', key: 'credito', title: 'Credito cliente', icon: 'F', sx: { height: '100%' }, gap: 0.3, dataTour: 'fido-fatturato', part: [
                { key: 0, sx: { alignItems: 'center', width: '100%', maxWidth: '100%' } },
                { key: 1, sx: { alignItems: 'center', width: '100%', maxWidth: '100%', borderRadius: 4, padding: 3 } },
            ], xs: 12, md: 12, lg: 4
        },

        {
            from: 'Fatturato', key: 'fatturato', title: 'Ultimi Fatturati', icon: 'F', sx: { height: '100%' }, gap: 0.3, dataTour: 'fido-fatturato-2', part: [
                { key: 0, sx: { alignItems: 'center', width: '100%', maxWidth: '100%', borderRadius: 4 } },
            ], xs: 12, md: 12, lg: 8
        },
    ];
}

export function elements_structure_data(data, FidoActived) {
    return [
        // Profile Block
        /* Blocco 0 */
        {
            key: 'RagioneSociale', type: 'Avatar', block: 'profile', part: 0,
            sx: { borderRadius: '15%', width: "3em", height: "3em", fontSize: "2em", marginBottom: 25 }
        },
        { key: 'RagioneSociale', block: 'profile', part: 0, sx: { textAlign: 'center' } },
        { key: 'Email', block: 'profile', part: 0, sx: { color: '#ccc', fontSize: '0.75em' } },
        { key: 'PecEmail', block: 'profile', part: 0, sx: { color: '#ccc', fontSize: '0.75em' } },


        //Rating Block
        {
            from: "Anagrafica", key: 'Stato', type: 'ChangeStatus', condition: ['Attiva', 'ATTIVA', 'attiva'], label: 'rating', block: 'rating', part: 0,
            sx: { position: 'absolute', right: 35, fontSize: '0.75em', fontWeight: 600, padding: "0 15px 0 15px", borderRadius: "12px", fontSize: "0.85rem" }
        },
        {
            key: 'Rating', label: 'Valutazione Generale', desc: 'Valutazione Cliente', type: 'GraphRating', block: 'rating', part: 0,
            sx: { width: '100%', height: '100%' },
            labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
        },
        { key: 'DescRating', label: data?.Generale?.DescrizioneRating, direction: 'row', gap: 1, type: 'label-key', block: 'rating', part: 0, keysx: { mt: 2, fontSize: '0.75em' } },

        {
            from: "Anagrafica", key: 'Costituzione', direction: 'row', type: 'label-key', block: 'rating', part: 1,
            sx: { width: '100%' },
            keysx: { fontWeight: 600, backgroundColor: '#f2f2f2', padding: '0 15px 0 15px', borderRadius: 3, fontSize: '0.85rem', color: '#7f7f7f' },
            labelsx: { fontWeight: 400, marginRight: 'auto', fontSize: '0.67em', alignSelf: 'center' },
        },
        {
            from: "Anagrafica", key: 'Dipendenti', direction: 'row', type: 'label-key', block: 'rating', part: 1,
            sx: { width: '100%' },
            keysx: { fontSize: '0.75em', marginRight: 2 },
            labelsx: { fontWeight: 400, marginRight: 'auto', fontSize: '0.67em', alignSelf: 'center' }
        },
        /*{ key: 'DataReport', direction:'row', type: 'label-key', block: 'rating', part: 1, 
            sx:{width: '100%'},
            keysx:{fontWeight: 600, backgroundColor: '#f2f2f2', padding: '0 15px 0 15px', borderRadius: 3, fontSize: '0.85rem', color: '#7f7f7f'},
            labelsx: {fontWeight: 400, marginRight: 'auto', fontSize: '0.67em', alignSelf: 'center'},
        },*/


        //Fido Block
        /* Blocco 0 */
        {
            values: ['FidoResiduo', 'FidoTotale'], varSwitch: FidoActived, type: 'ProgressCharts', block: 'fido', part: 0, gap: 2,
            onHover__ToT: ['Fido'],
            desc: 'Il valore presente specifica il fido residuo, valore messo a paragone con il fido totale in modo tale da avere chiarezza generale della situazione del cliente',
            sx: { height: '100%', padding: '5px 15px 0px 15px', width: '100%', alignItems: 'flex-start', padding: 3, borderRadius: '0 10px 10px' },
            labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
            keysx: { fontSize: '3.5rem', fontWeight: '600', alignSelf: 'center' },
            descsx: { fontSize: '0.74rem', mt: 'auto' }
        },

        //Credito Generale
        {
            key: 'LimiteCredito', label: 'Limite Credito Generale', type: 'label-key', desc: 'Valore valutando e assegnato internamento che indica il limite Credito consentio al cliente', typeof: 'euro', block: 'credito', part: 0,
            sx: { padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', height: '100%', alignItems: 'flex-start', padding: 2 },
            labelsx: { alignSelf: 'flex-end', fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
            keysx: { fontSize: '2rem', fontWeight: '600' },
            descsx: { fontSize: '0.74rem' }
        },
        {
            key: 'UltimoBilancio', keyDiff: new Date().getFullYear(), type: 'label-key', direction: 'row', gap: 1, label: 'Ultimo Bilancio', block: 'credito', part: 1,
            sx: { width: '100%' },
            keysx: { fontWeight: 600, padding: '0 15px 0 15px', borderRadius: 3, fontSize: '0.85rem' },
            labelsx: { fontWeight: 400, marginRight: 'auto', fontSize: '0.67em', alignSelf: 'center' },
        },
        {
            key: 'CapitaleSociale', type: 'label-key', typeof: 'euro', direction: 'row', gap: 1, label: 'Capitale Sociale', block: 'credito', part: 1,
            sx: { width: '100%' },
            keysx: { fontWeight: 400, fontSize: '1.15rem' },
            labelsx: { fontWeight: 400, marginRight: 'auto', fontSize: '0.67em', alignSelf: 'center' },
        },
        {
            key: 'FatturatoUltimoAnno', type: 'label-key', typeof: 'euro', direction: 'row', gap: 1, block: 'credito', part: 1,
            sx: { width: '100%' },
            keysx: { fontWeight: 400, fontSize: '1.15rem' },
            labelsx: { fontWeight: 400, marginRight: 'auto', fontSize: '0.67em', alignSelf: 'center' },
        },
        {
            key: 'UtilePerditaUltimoAnno', type: 'label-key', typeof: 'euro', direction: 'row', gap: 1, block: 'credito', part: 1,
            sx: { width: '100%' },
            keysx: { fontWeight: 400, fontSize: '1.15rem' },
            labelsx: { fontWeight: 400, marginRight: 'auto', fontSize: '0.67em', alignSelf: 'center' },
        },


        //Ultimi Fatturati
        {
            type: 'GraphFatturato', block: 'fatturato', part: 0,
            /*values: [
                {
                    key: '2021', label: 'Fatturato 2021', desc: `Fatturato del 2021 del cliente ${FidoActived != 0 ? 'Focelda' : 'IOT'}.`,
                    sx: { gap: 1, padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', alignItems: 'flex-start', padding: 2 },
                    labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
                    keysx: { fontSize: '2rem', fontWeight: '600', padding: '0 15px' },
                    descsx: { fontSize: '0.74rem', color: '#9e9e9e' }
                },
                {
                    key: '2022', label: 'Fatturato 2022', desc: `Fatturato del 2022 del cliente ${FidoActived != 0 ? 'Focelda' : 'IOT'}.`,
                    sx: { gap: 1, padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', alignItems: 'flex-start', padding: 2 },
                    labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
                    keysx: { fontSize: '2rem', fontWeight: '600', padding: '0 15px' },
                    descsx: { fontSize: '0.74rem', color: '#9e9e9e' }
                },
                {
                    key: '2023', label: 'Fatturato 2023', desc: `Fatturato del 2023 del cliente ${FidoActived != 0 ? 'Focelda' : 'IOT'}.`,
                    sx: { gap: 1, padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', alignItems: 'flex-start', padding: 2 },
                    labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
                    keysx: { fontSize: '2rem', fontWeight: '600', padding: '0 15px' },
                    descsx: { fontSize: '0.74rem', color: '#9e9e9e' }
                }, {
                    key: '2024', label: 'Fatturato 2024', desc: `Fatturato del 2024 del cliente ${FidoActived != 0 ? 'Focelda' : 'IOT'}, in rapporto con il fatturato del periodo precedente al ${(new Date).toLocaleDateString('it-IT')}.`,
                    sx: { gap: 1, padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', alignItems: 'flex-start', padding: 2 },
                    labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
                    keysx: { fontSize: '2rem', fontWeight: '600', padding: '0 15px' },
                    descsx: { fontSize: '0.74rem', color: '#9e9e9e' }
                },
                {
                    key: '2025', label: 'Fatturato 2025', desc: `Fatturato del 2025 del cliente ${FidoActived != 0 ? 'Focelda' : 'IOT'}, in rapporto con il fatturato del periodo precedente al ${(new Date).toLocaleDateString('it-IT')}.`,
                    sx: { gap: 1, padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', alignItems: 'flex-start', padding: 2 },
                    labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
                    keysx: { fontSize: '2rem', fontWeight: '600', padding: '0 15px' },
                    descsx: { fontSize: '0.74rem', color: '#9e9e9e' }
                },
                {
                    key: '2026', label: 'Fatturato 2026', desc: `Fatturato del 2026 del cliente ${FidoActived != 0 ? 'Focelda' : 'IOT'}, in rapporto con il fatturato del periodo precedente al ${(new Date).toLocaleDateString('it-IT')}.`,
                    sx: { gap: 1, padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', alignItems: 'flex-start', padding: 2 },
                    labelsx: { alignSelf: 'flex-end', color: '#aeaeae', fontWeight: 300, fontSize: '0.76em', marginRight: 'auto', backgroundColor: '#cccccc3b', padding: 0.7, borderRadius: 2 },
                    keysx: { fontSize: '2rem', fontWeight: '600', padding: '0 15px' },
                    descsx: { fontSize: '0.74rem', color: '#9e9e9e' }
                },
            ],*/
        },
    ];
}