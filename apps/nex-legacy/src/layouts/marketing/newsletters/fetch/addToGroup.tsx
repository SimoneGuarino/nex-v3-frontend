import React from "react";
import { isKeyInObject } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function addToGroup({
  userContext, 
  abortController, 
  params,
  groupData,
  setLoadStatus 
}: {
  userContext: { [key: string]: any },
  abortController: any,
  params: { [key: string]: any },
  groupData: { id: number, name: string },
  setLoadStatus: React.Dispatch<React.SetStateAction<boolean>>
}): void {
  // Check userContext
  if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
    enqueueSnackbar("Non è stato possibile completare la richiesta poiché sembra che i tuoi dati siano smarriti", {
      title: "Dettagli dell'utente smarriti",
      type: "error",
    });
    return;
  }

  FetchData(`${import.meta.env.VITE_API_MARKETING}nws/add-ctm-grp`, 
    "POST", 
    { tk: userContext.token, group: groupData, ...params },
    abortController
  )
  .then((res: any) => {
    enqueueSnackbar("", {
      title: "Inseriti con successo",
      type: "success"
    });
  })
  .catch((error: any) => {
    let errorMessage: string = "Si è verificato un problema generale durante l'invio della richiesta, riprova o contatta l'assistenza tecnica";
    if (isKeyInObject(error, "message", "o") && isKeyInObject(error.message, "msg", "s", { minLength: 1 })) {
      errorMessage = error.message.msg;
    }

    enqueueSnackbar(errorMessage, {
      title: "Ops..",
      type: "error",
    });
  }).finally(() => setLoadStatus(false));
}