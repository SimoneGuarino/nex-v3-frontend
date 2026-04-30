import React from "react";
import { isKeyInObject, isString } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function getTotals({ userContext, abortController, params, setTotalData }: {
  userContext: { [key: string]: any },
  abortController: any,
  params: any,
  setTotalData: React.Dispatch<React.SetStateAction<number>>,
}): void {
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

  let bodyToSend: any = {
    tk: userContext.token,
  };
  FetchData(`${import.meta.env.VITE_API_MARKETING}nws/gt-ctm-tot`, "POST", { ...bodyToSend, ...params }, abortController)
  .then((res: any) => {
    setTotalData(res.total);
  })
  .catch((error: any) => {
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