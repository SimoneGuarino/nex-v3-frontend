/**
 * Render dei dati delle chat presenti nella tab privata
 */
import { Fade, Stack } from "@mui/material";
import NoProductFound from "assets/images/noData/no_conversation_avaible.webp";
import MDTypography from "components/MDTypography";
import { LoadScreen } from "components/Load";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { enqueueSnackbar } from "components/MessageBox";
import { FDBox } from "@nex/fd-ui";
import { UserAvatar } from "../../userInfo";

interface User {
    _id: string;
    idBlock?: null | string;
    username: string;
    nome: string;
    cognome: string;
    stato: {
        codice: "Online" | "Offline" | "Assente"
    },
    bio?: string;
    immagini?: {
        avatar?: string;
        cover?: string;
    };
};


interface ItemProps {
    i: number;
    user: User;
    CreateChat: ({ item }: { item: User }) => void;
};
const Item: React.FC<ItemProps> = ({ user, i, CreateChat }) => {
    return <FDBox key={i} onClick={() => CreateChat({ item: user })} asMotion={true} className="flex space-x-2 items-center px-3 py-2 
    hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
        <UserAvatar key={i} src={user.immagini?.avatar} name={user.nome}
            cognome={user.cognome} size={12} cover={{ src: user.immagini?.cover, active: true }} bio={user.bio} />
        <p className="text-sm">
            {user.nome} {user.cognome}
        </p>
    </FDBox>
};



interface UsersBlocksProps {
    data: Array<User>;
    loadBool: boolean;
};
export const UsersBlocks: React.FC<UsersBlocksProps> = ({ data, loadBool }) => {
    const { createPrivateChat } = useGeneralDataContext();

    // Assicurati che la funzione chiamante sia async
    const CreateChat = async ({ item }: { item: User }) => {
        if (!item) {
            enqueueSnackbar("Sembra che ci sia stato un problema...", { title: "Ops..", type: "error" });
            return;
        }
        await createPrivateChat({
            data: {
                idBlock: item.idBlock,
                userID: item._id,
                nome: item.nome,
                cognome: item.cognome,
                disabilitato: false,
                path: "privata",
            },
            settings: { loadFromRemote: true, createRemoteBlock: true },
            openAfter: true,
        });
    };


    return (
        <div className="w-full h-full flex flex-col min-h-[300px] overflow-auto">
            {loadBool ? <LoadScreen /> 
            : (data && Array.isArray(data) && data.length > 0) ?
                    data.map((data: User, i: number) => (
                        <Item key={i} user={data} i={i} CreateChat={CreateChat} />
                    )) 
                : <Stack justifyContent='center'
                        sx={{ padding: "0 0 40px", alignItems: "center", filter: 'grayscale(1)', opacity: 0.65, height: '100%' }}>
                        <img src={NoProductFound} className="avoid-drag" loading="lazy" style={{
                            opacity: 0.8,
                            minHeight: 250,
                            maxHeight: 300,
                            maxWidth: 300
                        }} alt="No Conversations Found" />
                        <MDTypography component="h3" sx={{
                            fontWeight: "normal", textAlign: "center",
                            fontSize: "1em", maxWidth: "50%"
                        }}>
                            La tua ricerca non ha prodotto risultati, non sono stati trovati utenti, prova a modificare il testo.</MDTypography>
                    </Stack>}
        </div>
    );            
};