import React from "react";
import { isKeyInObject, isString } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { UserState } from "types/UserContext";

export default function fetchTotalsGroups({
    userContext,
    abortController,
    searchParam,
    setTotalGroupsTable,
    setError
}: {
    userContext: UserState | null,
    abortController: any,
    searchParam: string,
    setTotalGroupsTable: React.Dispatch<React.SetStateAction<number>>,
    setError: (prev: boolean) => void
}): void {
    if (!userContext) return;

    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    // Get total groups docs
    FetchData(`${import.meta.env.VITE_API_MARKETING}mup/gt-grp-tot`,
        "POST",
        {
            nm: searchParam,
            tk: userContext.token
        },
        abortController
    )
        .then((res: any) => {
            setTotalGroupsTable(res);
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