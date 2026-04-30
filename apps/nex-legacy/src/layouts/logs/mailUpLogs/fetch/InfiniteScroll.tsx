import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { isKeyInObject } from "vdck";

import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from "components/MessageBox";

import { filtersInterface } from "../index";

// Types and interfaces
interface userContextInterface {
  details?: {
    username: string;
  };
  token: string;
}

export default function InfiniteScrollAPI(
  userContext: userContextInterface,
  abortController: any,
  setData: Dispatch<SetStateAction<any[]>>,
  params: filtersInterface,
  offset: MutableRefObject<number>,
  loading: MutableRefObject<boolean>
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (userContext.details === undefined) {
      enqueueSnackbar("I dettagli dell'utente corrente sono cambiati, non è stato possibile inviare la richiesta", {
        title: "Ops..",
        type: "error",
      });
  
      reject(true);
    }

    FetchData(`${import.meta.env.VITE_API_MARKETING}lgs/gt-nws-lgs`, "POST", {
      tk: userContext.token,
      of: offset.current,
      ...params
    }, abortController
    ).then(async (res) => {
      setData((prev: any) => {
        return [...prev, ...res]
      });
      resolve(true);
    }).catch((error: any) => {
      let errorMessage: string = "Si è verificato un problema generale durante l'invio della richiesta per il recupero dei dati, riprova o contatta l'assistenza tecnica";
      if (isKeyInObject(error, "message", "o") && isKeyInObject(error.message, "msg", "s", { minLength: 1 })) {
        errorMessage = error.message.msg;
      }

      enqueueSnackbar(errorMessage, {
        title: "Ops..",
        type: "error",
      });
      reject(true);
    }).finally(() => {
      loading.current = false
    });
  });
}