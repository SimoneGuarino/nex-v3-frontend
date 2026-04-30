import React from "react";
import { isKeyInObject, isString } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function getData({ userContext, abortController, setTableData, params, offset, setLoadStatus, dataEnd, resetOffset }: {
    userContext: { [key: string]: any },
    abortController: any,
    params: any,
    offset: React.MutableRefObject<number>,
    setTableData: React.Dispatch<React.SetStateAction<{ [key: string]: any; }[]>>,
    setLoadStatus: React.Dispatch<React.SetStateAction<boolean>>,
    dataEnd: React.MutableRefObject<boolean>,
    resetOffset: boolean
}): void {
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    // Initialize body
    let body: any = {
        tk: userContext.token,
        sk: offset.current
    };

    FetchData(`${import.meta.env.VITE_API_MARKETING}nws/gt-ctm`,
        "POST",
        { ...body, ...params },
        abortController
    )
        .then((res: any) => {
            if (res.length < 50) dataEnd.current = true;
            if (resetOffset) {
                setTableData(res);
            } else {
                setTableData((prevData) => [...prevData, ...res]);
            }
            setLoadStatus(false);
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
            setLoadStatus(false);
        });
}