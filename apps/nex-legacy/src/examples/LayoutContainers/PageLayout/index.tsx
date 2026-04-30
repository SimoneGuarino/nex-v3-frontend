// PageLayout/index.tsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

import MDBox from "components/MDBox";
import { useMaterialUIController, setLayout } from "context/index";

type Background = "white" | "light" | "default";

export interface PageLayoutProps {
  background?: Background;
  children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ background = "default", children }) => {
  // se il context non è tipizzato nel progetto, lo tratto come any
  const [, dispatch] = useMaterialUIController() as any;
  const { pathname } = useLocation();

  useEffect(() => {
    setLayout(dispatch, "page");
  }, [pathname, dispatch]);

  return (
    <MDBox
      width="100vw"
      height="100%"
      minHeight="100vh"
      bgColor={background}
      sx={{ overflowX: "hidden", backgroundColor: "#f0f2f5", position: "relative" }}
    >
      {children}
    </MDBox>
  );
};

export default PageLayout;
