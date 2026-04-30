import React, { SetStateAction } from "react";
import { isKeyInObject, isString } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export async function getFilters(userContext: { [key: string]: any }, 
  abortController: any, 
  setGeneralFilters: React.Dispatch<React.SetStateAction<{ [key: string]: any; }>>,
): Promise<void> {
  // Check userContext
  if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

  // Fetch groups filter
  FetchData(`${import.meta.env.VITE_API_MARKETING}nws/gt-ctm-flt`, 
    "POST",
    { tk: userContext.token },
    abortController
  ).then((res: any) => {
    // Assign filters
    if (isKeyInObject(res, "groups", "a", { minLength: 1 })) {
      setGeneralFilters((prev: { [key: string]: any }) => {
        return { ...prev, groups: res.groups }
      });
    }
  }).catch((error: any) => {
    // Check errors
    if (error.name !== "AbortError") {
      let errorMessage: string = "";
      if (error?.message?.msg && isString(error.message.msg, true, 1)) errorMessage = error.message.msg;

      enqueueSnackbar(errorMessage, {
        title: "Ops..",
        type: "error",
      });
    };
  });
}