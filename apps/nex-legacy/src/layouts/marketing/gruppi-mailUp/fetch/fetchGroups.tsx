import React from "react";
import { isArray, isKeyInObject, isNumber, isString } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { UserState } from "types/UserContext";

// Types & interface
interface groupTableInterface {
    id?: number,
    nome?: string,
    bloccato?: boolean
};

export default function fetchGroups({
    userContext,
    abortController,
    searchParam,
    setGroupsTable,
    firstCall,
    groupsTableOffset,
    loading
}: {
    userContext: UserState | null,
    abortController: any,
    searchParam: string,
    setGroupsTable: React.Dispatch<React.SetStateAction<groupTableInterface[] | []>>,
    groupsTableOffset: React.MutableRefObject<number>,
    firstCall: boolean,
    setError: (prev: boolean) => void,
    loading: React.MutableRefObject<boolean>
}): void {
    if (!userContext) return;
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    FetchData(`${import.meta.env.VITE_API_MARKETING}mup/gt-grp`,
        "POST",
        {
            nm: searchParam,
            tk: userContext.token,
            sk: groupsTableOffset.current
        },
        abortController
    )
        .then((res: any) => {
            setGroupsTable((prev: groupTableInterface[]) => {
                if (firstCall) {
                    return res;
                } else {
                    return [...prev, ...res];
                }
            });

            if (res.length == 50) {
                groupsTableOffset.current++;
            }
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
        }).finally(() => loading.current = false);
}