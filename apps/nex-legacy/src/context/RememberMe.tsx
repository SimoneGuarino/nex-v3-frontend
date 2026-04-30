import React, { useState, createContext, Dispatch, SetStateAction } from "react";

type RememberMeContextType = [boolean, Dispatch<SetStateAction<boolean>>];

export const RememberMeContext = createContext<RememberMeContextType>([false, () => {}]);

const RememberMeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<boolean>(false);

  return (
    <RememberMeContext.Provider value={[state, setState]}>
      {children}
    </RememberMeContext.Provider>
  );
};

export { RememberMeProvider };
