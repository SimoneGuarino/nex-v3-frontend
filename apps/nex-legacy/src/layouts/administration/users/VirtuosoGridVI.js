import React, { Fragment, useMemo } from 'react';
import { UserContext } from 'context/UserContext';

//@Internal Packages
import styled from '@emotion/styled'

//@External Packages
import { VirtuosoGrid } from 'react-virtuoso';
//import styled from '@emotion/styled';
import { Fade, Stack, Menu, MenuItem } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import ItemBoxStyled from './itemBoxStyled';

import CheckOperator from "layouts/administration/users/checkOperator";
import ChangeRole from "./changeRole/index.js";

import { Success } from 'components/Success';
import { BanAPI } from './fetch/actions/banAPI';
import { CreateAccount } from './createAccount';
import { PermissionsPanel } from './extraPanel/permissions';
import { SaveRoutePermissionsAPI } from './fetch/actions/permissions';
import { enqueueSnackbar } from 'components/MessageBox';

const ItemContainer = styled.div`
  padding: 0.5rem;
  min-width: 420px;
  max-width: 420px;
  flex: 33%;
  height: 190px;
  display: flex;
  flex: none;
  align-content: stretch;
  box-sizing: border-box;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important;

  @media (max-width: 1524px) {
    width: 500px;
  }

  @media (max-width: 850px) {
    width: 100%;
  }
`

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`


const VirtuosoGridVI = React.memo(({ setData, data, roles, openErrorSB }) => {
    const [userContext, setUserContext] = React.useContext(UserContext);

    const [checkOperatorMenu, setCheckOperatorMenu] = React.useState(false);
    const [changeRoleMenu, setChangeRoleMenu] = React.useState(false);
    const [permissionsPanelStatus, setPermissionsPanelStatus] = React.useState(false);
    const ChangePermissionsPanelStatus = () => {
        //condizioni per evitare l'accesso al pannello se l'utente non ha un ruolo assegnato
        if(Boolean(
            (data[indexUserSelected] && 
            !data[indexUserSelected].ruolo) || 
            (data[indexUserSelected] &&
            Array.isArray(data[indexUserSelected].ruolo) && 
            data[indexUserSelected].ruolo.length == 0)
        )){
            return enqueueSnackbar("Prima di continuare e assegnare permessi per i pannelli, inserisci un ruolo all'utente in question.", {
                title: 'Ruolo non definito',
                type: 'warning',
            });
        };
        return setPermissionsPanelStatus(!permissionsPanelStatus);
    };

    const [success, setSuccess] = React.useState(false); //Success Opereation
    const [caStatus, setCAStatus] = React.useState(false); //Create Account Panel Status

    const [anchorEl, setAnchorEl] = React.useState(false);
    const [indexUserSelected, setIndexUserSelected] = React.useState(null);

    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(false);
    // Abort il panding del fetch all server
    const abortController = React.useRef(null);


    const stringToColor = React.useCallback((string) => {
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }

        const pastel = (hue, saturation, lightness) => {
            return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;
        };

        const hue = hash % 360; // Utilizza l'hash come base per la tonalità
        const saturation = 50; // Saturazione costante per colori pastello
        const lightness = 70; // Luminosità costante per colori pastello

        return pastel(hue, saturation, lightness);
    });

    //Split del nome, applicando la logica se è presente solo nome o nome e congome.
    const stringAvatar = React.useCallback((firstName, lastName, checkStatus) => {
        //const fullname = firstName + ' ' + (lastName || ''); // Utilizza una stringa vuota come fallback per lastName
        const splitName = firstName[0] + (lastName ? lastName[0] : firstName[2]); // Usa lastName solo se è definito

        return {
            sx: {
                bgcolor: stringToColor(splitName),
                filter: checkStatus ? "grayscale(1) !important" : "grayscale(0)",
                opacity: checkStatus ? 0.2 : 1,
            },
            children: splitName.toUpperCase(),
        };
    });

    const [visibleRange, setVisibleRange] = React.useState({
        startIndex: 0,
        endIndex: 0,
    })



    const Ban_Callback = React.useCallback((index, banStatus, setBanStatus) => {
        BanAPI(data[index].username, userContext,
            banStatus, setBanStatus, abortController, openErrorSB);
    }, [data, userContext]);

    const ChangeRole_Callback = React.useCallback(() => (
        <ChangeRole
            setChangeRoleMenu={setChangeRoleMenu}
            target_username={data[indexUserSelected].username}
            target_role_data={{ ruolo: data[indexUserSelected].ruolo[0], descrizione: data[indexUserSelected].desc_role[0] }}
            openErrorSB={openErrorSB} roles={roles} setData={setData} setSuccess={setSuccess}
        />
    ), [indexUserSelected, data]);

    const CheckOperator_Callback = React.useCallback(() => (
        <CheckOperator
            tk={userContext.token}
            setStatus={setCheckOperatorMenu}
            target_username={data[indexUserSelected].username}
        />
    ), [indexUserSelected, data]);

    const CreateAccount_Callback = React.useCallback(() => (
        <CreateAccount abortController={abortController} setCAStatus={setCAStatus}
            setSuccess={setSuccess} openErrorSB={openErrorSB} userContext={userContext} />
    ), [indexUserSelected, data]);

    /**
     * Funzione di Salvataggio API dedicata ai permessi.
     * @param {*} userTargetData Object | Proprietà del target utente.
     * @param {*} userChanges Object | Permessi Generati da sostituire.
     */
    const SaveData = (userTargetData, userChanges) => {
        setData(prev => {
            const copy = [...prev];
            const findUserIndex = copy.findIndex(e => e.username === userTargetData.username);
            if(findUserIndex !== -1){
                if(copy[findUserIndex].permissions.length > 0){
                    copy[findUserIndex].permissions.splice(0, 1, userChanges);
                }else{
                    copy[findUserIndex].permissions.push(userChanges);
                }
            }
            return copy;
        });
        SaveRoutePermissionsAPI({
            userContext: userContext, abortController: abortController,
            userTarget: userTargetData._id, prmw: userChanges, setSuccess: setSuccess
        });
    };

    const PermissionsPanel_Callback = React.useCallback(() => (
        <PermissionsPanel userTargetData={data[indexUserSelected]}
            ChangePermissionsPanelStatus={ChangePermissionsPanelStatus} SaveData={SaveData}/>
    ), [indexUserSelected, data, permissionsPanelStatus]);




    const InnerItem = React.memo(({ index, elm }) => {
        return (
            <ItemBoxStyled
                key={index}
                index={index}
                elm={elm}
                Ban_Callback={Ban_Callback}
                stringAvatar={stringAvatar}
                handleOpenMenu={handleOpenMenu}
                setIndexUserSelected={setIndexUserSelected}
                setCAStatus={setCAStatus}
            />
        );
    }, (prevProps, nextProps) => {
        // Controlla le proprietà specifiche di elm per determinare l'uguaglianza
        return (
            prevProps.index === nextProps.index &&
            prevProps.elm.id === nextProps.elm.id // Ad esempio, controlla l'ID dell'elemento
        );
    });

    const renderRow = React.useCallback((index, elm) => {
        return <InnerItem key={elm._id} index={index} elm={elm} />;
    }, [visibleRange, data])

    const menuMore = () => (
        <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            onClick={handleCloseMenu}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                    },
                    '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                    },
                },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            <MenuItem translate="no" onClick={() => setChangeRoleMenu(true)}>
                Cambia Ruolo
            </MenuItem>
            <MenuItem translate="no" onClick={() => setCheckOperatorMenu(true)}>
                Controlla Utente
            </MenuItem>
            <MenuItem translate="no" onClick={ChangePermissionsPanelStatus}>
                Cambia Permessi
            </MenuItem>
        </Menu>
    );


    const memoRender = useMemo(() => (
        <Stack direction='row' height="calc(100vh - 269px)" translate="no">
            <VirtuosoGrid
                style={{ height: '100%', width: '100%' }}
                overscan={10}
                totalCount={data.length}
                components={{
                    Item: ItemContainer,
                    List: ListContainer,
                    ScrollSeekPlaceholder: ({ height, width, index }) => (
                        <Fade in={true}>
                            <ItemContainer>
                                <Skeleton sx={{ width: '100%', height: 290 }} />
                            </ItemContainer>
                        </Fade>
                    ),
                }}
                rangeChanged={setVisibleRange}
                itemContent={index => renderRow(index, data[index])}
                scrollSeekConfiguration={{
                    enter: velocity => Math.abs(velocity) > 325,
                    exit: velocity => Math.abs(velocity) < 30,
                    //change: (_, range) => console.log({ range }),
                }}
            />
        </Stack>
    ), [data])

    return (
        <Fragment>
            {caStatus && CreateAccount_Callback()}
            <Success success={success} setSuccess={setSuccess} />
            {changeRoleMenu && ChangeRole_Callback()}
            {checkOperatorMenu && CheckOperator_Callback()}
            {permissionsPanelStatus && PermissionsPanel_Callback()}
            {memoRender}
            {menuMore()}
        </Fragment>
    );
});

export { VirtuosoGridVI };