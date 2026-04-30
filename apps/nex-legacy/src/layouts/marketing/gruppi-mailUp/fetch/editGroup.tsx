import React from "react";
import { isKeyInObject, isString } from "vdck";

// Components
import { FetchData } from "examples/Fetch";
import { UserState } from "types/UserContext";

// Types & interface
interface groupTableInterface {
  id?: number,
  nome?: string,
  bloccato?: boolean
};

interface newGroupStatusInterface {
  ok: boolean,
  msg: string
};

export default function editGroup(
  userContext: UserState | null,
  abortController: any,
  type: number,
  bodyData: any,
  loading: React.MutableRefObject<boolean>,
  setGroupsTable: React.Dispatch<React.SetStateAction<groupTableInterface[]>> | null,
  addToTable: boolean | null,
  setNewGroupStatus?: React.Dispatch<React.SetStateAction<newGroupStatusInterface>>
): void {
    if (!userContext) return;
  // Check userContext
  if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

  FetchData(`${import.meta.env.VITE_API_MARKETING}mup/edt-grp`, 
    "POST", 
    { tk: userContext.token, 
      ...bodyData, 
      tp: type },
    abortController
  )
  .then((res: any) => {
    if (type == 1 && setNewGroupStatus) {
      setNewGroupStatus({ ok: true, msg: "Gruppo inserito con successo" });
      if (addToTable && setGroupsTable) {
        setGroupsTable((prev: groupTableInterface[]) => {
          return [...prev, { ...bodyData, idGruppo: res.id }];
        });
      }
    }
  })
  .catch((error: any) => {
    if (error.name !== "AbortError") {
      let errorMessage: string = "Si è verificato un problema generale, riprova fra poco o contatta il servizio tecnico";
      if (error?.message?.msg && isString(error.message.msg, true, 1)) errorMessage = error.message.msg;

      if (type == 1 && setNewGroupStatus) setNewGroupStatus({ ok: false, msg: errorMessage });
    } else {
      if (type == 1 && setNewGroupStatus) setNewGroupStatus({ ok: false, msg: "Si è verificato un problema durante il salvataggio, riprova o contatta l'assistenza tecnica" });
    }
  })
  .finally(() => loading.current = false);
}