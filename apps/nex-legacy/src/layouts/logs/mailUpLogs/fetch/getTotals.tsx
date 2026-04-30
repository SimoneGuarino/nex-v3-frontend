import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { isKeyInObject } from "vdck";

import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

import { filtersInterface } from "../index";

// Types and interfaces
interface userContextInterface {
  details?: {
    username: string;
  };
  token: string;
}

/** Api to fetch logs data
 * 
 * @param {userContextInterface} userContext User context
 * @param {any} abortController Abort controller
 * @param {Dispatch<SetStateAction<any[]>>} setTotal State hook to switch data
 * @param {filtersInterface} params Request's params
 * @returns {void}
 */
export default function getTotals(
  userContext: userContextInterface,
  abortController: any,
  setTotal: Dispatch<SetStateAction<number>>,
  params: filtersInterface
): void {
  if (userContext.details === undefined) {
    enqueueSnackbar("I dettagli dell'utente corrente sono cambiati, non è stato possibile inviare la richiesta", {
      title: "Ops..",
      type: "error",
    });

    return;
  }

  // Fetch
  FetchData(`${import.meta.env.VITE_API_MARKETING}lgs/gt-nws-lgs-tt`, "POST", {
    tk: userContext.token,
    of: 0,
    ...params
  }, abortController
  ).then(async (res: any) => {
    if (isKeyInObject(res, "total", "n")) setTotal(res.total);
  }).catch((error: any) => {
    let errorMessage: string = "Si è verificato un problema generale durante l'invio della richiesta per i totali, riprova o contatta l'assistenza tecnica";
    if (isKeyInObject(error, "message", "o") && isKeyInObject(error.message, "msg", "s", { minLength: 1 })) {
      errorMessage = error.message.msg;
    }

    enqueueSnackbar(errorMessage, {
      title: "Ops..",
      type: "error",
    });
  });
}