import React from "react";
import { isKeyInObject } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function getData({ userContext, abortController, setData, params, setErr }: {
  userContext: { [key: string]: any },
  abortController: any,
  params: any,
  setData: React.Dispatch<React.SetStateAction<{ [key: string]: any; }[]>>,
  setErr: (prev: boolean) => void
}): void {
  // Check userContext
  if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

  let bodyToSend: any = { tk: userContext.token };
  FetchData(`${import.meta.env.VITE_API_REGISTRY}ctm/gt-dt`, "POST", { ...bodyToSend, ...params }, abortController)
  .then((res: any) => {
    setData(res);
    setErr(false);
  })
  .catch((error: any) => {
    if (error.name !== "AbortError") {
      enqueueSnackbar(error, {
        title: "Ops..",
        type: "error",
      });
      setErr(true);
    };
  });
}