import React, { forwardRef, createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import MDBox from "components/MDBox";
import MDPaginationItemRoot from "./MDPaginationItemRoot"; // <-- assicurati del path/nome
import type { MDColor, MDSize } from "components/MDButton"; // riusa i tipi del tuo MDButton (o ridichiara le union)

type MDPaginationVariant = "gradient" | "contained";

type CtxValue = {
  variant: MDPaginationVariant;
  color: MDColor;
  size: MDSize;
};

// Il contesto è usato per leggere i valori dal "contenitore" nei singoli item
const Context = createContext<CtxValue | null>(null);

export interface MDPaginationProps {
  item?: boolean;
  variant?: MDPaginationVariant;
  color?: MDColor;
  size?: MDSize;
  active?: boolean;
  children: ReactNode;
  // tutto il resto (onClick, className, ecc.) lo inoltriamo solo quando item === true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const MDPagination = forwardRef<HTMLButtonElement, MDPaginationProps>(
  ({ item = false, variant = "gradient", color = "info", size = "medium", active = false, children, ...rest }, ref) => {
    // Se questo componente è usato come "item", qui leggerà il contesto del genitore MDPagination (contenitore)
    const context = useContext(Context);
    const paginationSize = context ? context.size : null;

    // Se questo componente è usato come "contenitore", forniamo il contesto ai figli
    const value = useMemo<CtxValue>(() => ({ variant, color, size }), [variant, color, size]);

    return (
      <Context.Provider value={value}>
        {item ? (
          <MDPaginationItemRoot
            {...rest}
            ref={ref}
            // Se l'item è "active", usiamo variant/color dal contesto del contenitore; altrimenti "outlined"/"secondary"
            variant={active ? context?.variant ?? "contained" : "outlined"}
            color={active ? context?.color ?? "secondary" : "secondary"}
            iconOnly
            circular
            ownerState={{ variant, active, paginationSize }}
          >
            {children}
          </MDPaginationItemRoot>
        ) : (
          <MDBox display="flex" justifyContent="flex-end" alignItems="center" sx={{ listStyle: "none" }}>
            {children}
          </MDBox>
        )}
      </Context.Provider>
    );
  }
);

MDPagination.displayName = "MDPagination";

export default MDPagination;
