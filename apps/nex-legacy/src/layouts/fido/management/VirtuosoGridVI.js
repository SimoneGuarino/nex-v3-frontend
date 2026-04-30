import React, { useContext } from 'react';
//@Internal Packages
import './style.css';
import { Overview } from 'layouts/fido/management/overview';
import { UserContext } from "context/UserContext";
//@External Packages
import { GroupedVirtuoso } from 'react-virtuoso';
import styled from '@emotion/styled';
import { Stack } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { GenStatusColor } from '../status';
import { ItemBoxStyled } from './itemBoxStyled';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';



const ItemContainer = styled.div`
  padding: 0.5rem;
  width: 100%;
  height: max(calc(3vw + 3vh), 130px);
  
  display: flex;
  flex: none;
  align-content: stretch;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    height: 200px;
  }
`

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`



/**
 * Check Login User Got The Selected Task
 */
function CheckLUGotTheST(dataElement, user) {
    const userID = user.details._id;
    return dataElement.DettagliUtenteTaskInCarico.ID === userID && dataElement.Stato === 1;
}


const RenderRow = ({ index, elm, setRowSelected, rowSelected, setStatusBox, listOfRequestStatus, ChangeItemChrono, CreateChat, openOverview, lockCrono, lockChatCard, lockOverviewOpen }) => {
    return <ItemBoxStyled index={index} elmDetails={elm.Dettagli} elm={elm} rowSelected={rowSelected}
        setStatusBox={setStatusBox}
        genColorForRequestStatus={GenStatusColor} listOfRequestStatus={listOfRequestStatus}
        ChangeItemChrono={ChangeItemChrono} CreateChat={CreateChat} openOverview={openOverview} lockCrono={lockCrono} lockChatCard={lockChatCard} lockOverviewOpen={lockOverviewOpen} />
};


function VirtuosoGridVI({ setData, abortController, openErrorSB, CreateChat, chronoPanelStatus,
    data, listOfRequestStatus, TakeRequest, ChangeStatusDB, ChangeItemChrono, rowSelected, setRowSelected, statusBox, setStatusBox, openOverview, closeOverview, lockCrono, lockChatCard, lockOverviewOpen, isActive, }) {
    const palette = MainTheme().palette;

    const [userContext] = useContext(UserContext);
    //Stato delle animazioni di scroll nel pannello laterale di Overview (Dettagli della richiesta)

    //const [statusBox, setStatusBox] = React.useState(false); //stato che indica se è aperto o meno il box Overview.


    //i nomi dei gruppi
    const CalculateGroups = React.useCallback(() => {
        const stack = {};
        //i nomi dei gruppi
        const groups = []; // exmp: const groups = ['Ieri', 'Oggi'];
        //deve contenere la lunghezza degli array per definire quanti oggetti deve separare un gruppo dal'altro
        const groupCounts = []; // exmp: const groupCounts = [3, 3];

        //splitta e sistema i dati creando una proprietà con il numero effettivo di quanti
        //elementi ci sono all'interno dei dati con la stessa data, creando un oggetto composto:
        //{ "23/11/2023": 1, "27/11/2023": 3 }
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            const dateTime = e.Dettagli.DataRichiesta; //format(parseISO(e.Dettagli.DataRichiesta), 'dd/MM/yyyy', { locale: it })
            if (stack[dateTime]) {
                stack[dateTime]++;
            } else {
                stack[dateTime] = 1;
            }
        };

        //Separa effettivamente il count degli elementi con il nome delle date in due array
        //differenti in base alla necessità richiesta da @GroupedVirtuoso.
        for (const key in stack) {
            const e = stack[key];

            // Elabora la data facendo la differenza tra la data di attuale e la data inserita in key.
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0);  // Azzerare le ore, i minuti, i secondi e i millisecondi per confrontare solo le date.
            const dateToValutate = new Date(key).setHours(0, 0, 0, 0);
            const differenzaGiorni = Math.floor((oggi - dateToValutate) / (24 * 60 * 60 * 1000));

            let dataNameToInsert;

            //gestisci il caso e associalo alla variabile let dataNameToInsert.
            switch (differenzaGiorni) {
                case -1:
                case 0:
                    dataNameToInsert = "Oggi";
                    break;
                case 1:
                    dataNameToInsert = "Ieri";
                    break;
                case 2:
                    dataNameToInsert = "L'altro ieri";
                    break;
                default:
                    dataNameToInsert = format(parseISO(key), 'dd/MM/yyyy', { locale: it });
                    break;
            };
            const checkIfDateAlreadyExist = groups.findIndex(e => e === dataNameToInsert);
            if (checkIfDateAlreadyExist === -1) {
                //inserisci i risultati nei due array.
                groups.push(dataNameToInsert);
                groupCounts.push(e);
            } else {
                groupCounts[checkIfDateAlreadyExist]++;
            }

        }

        return { groups: groups, groupCounts: groupCounts }
    }, [data]);

    /**
     * function focused on task assignment
     */
    function TaskAssignment() {
        setData(prev => {
            const copyOfPrev = [...prev];
            const newObject = {
                ID: userContext.details._id,
                NomeCompleto: userContext.details.nome + " " + userContext.details.cognome,
            };
            copyOfPrev[rowSelected].DettagliUtenteTaskInCarico = newObject;
            copyOfPrev[rowSelected].Stato++;
            return copyOfPrev;
        })
        TakeRequest(data[rowSelected]);
    };

    function ChangeStatus(statusID) {
        ChangeStatusDB(data[rowSelected], statusID);
    };




    return (<React.Fragment>
        <Stack direction='row' height="calc(100vh - 150px)" width='100%' translate="no">
            <GroupedVirtuoso
                style={{ width: 'inherit', }}
                totalCount={data.length}
                components={{
                    Item: ItemContainer,
                    List: ListContainer,
                }}
                itemContent={index => <RenderRow index={index} elm={data[index]}
                    setRowSelected={setRowSelected} rowSelected={rowSelected}
                    setStatusBox={setStatusBox} listOfRequestStatus={listOfRequestStatus}
                    ChangeItemChrono={ChangeItemChrono} CreateChat={CreateChat} openOverview={openOverview} lockCrono={lockCrono}
                    lockChatCard={lockChatCard}
                    lockOverviewOpen={lockOverviewOpen} />}

                groupCounts={CalculateGroups().groupCounts}
                groupContent={index => (<MDTypography
                    style={{
                        fontSize: '1.5em',
                        fontWeight: 600,
                        padding: '0.5rem 0.5rem 0',
                        width: '100%',
                        background: palette.background.default,
                        borderBottomRightRadius: 20,
                        backdropFilter: 'blur(10px)',
                    }}>{CalculateGroups().groups[index]}</MDTypography>
                )}
            />

        </Stack>
        <Overview data={data} setData={setData} abortController={abortController} openErrorSB={openErrorSB}
            rowSelected={rowSelected} setRowSelected={setRowSelected}
            statusBox={statusBox} setStatusBox={setStatusBox} genColorForRequestStatus={GenStatusColor}
            listOfRequestStatus={listOfRequestStatus} userContext={userContext} CheckLUGotTheST={CheckLUGotTheST}
            TaskAssignment={TaskAssignment} ChangeStatus={ChangeStatus} chronoPanelStatus={chronoPanelStatus} onClose={closeOverview} lockChat={lockChatCard} isActive={isActive}
        />
    </React.Fragment>
    )
}

export { VirtuosoGridVI };