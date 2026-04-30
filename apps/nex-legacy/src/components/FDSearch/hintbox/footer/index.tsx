import React from "react";
import { Stack } from "@mui/material";
import MDTypography from "components/MDTypography";

import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import CloseIcon from "@mui/icons-material/Close";

export function Footer(): JSX.Element {
  const iconsColor = "#ebebeb";

  return (
    <Stack
      direction="row"
      gap={2}
      alignItems="center"
      justifyContent="center"
      sx={{ width: "100%", height: 50, borderRadius: "0 0 15px 15px" }}
    >
      <Stack direction="row" gap={0.5}>
        <KeyboardArrowUpIcon sx={{ backgroundColor: iconsColor, borderRadius: 1 }} />
        <KeyboardArrowDownIcon sx={{ backgroundColor: iconsColor, borderRadius: 1 }} />
        <MDTypography component="p" style={{ fontWeight: 300, fontSize: "0.7rem" }}>
          Per Navigare
        </MDTypography>
      </Stack>

      <Stack direction="row" gap={0.5}>
        <KeyboardReturnIcon sx={{ backgroundColor: iconsColor, borderRadius: 1, padding: 0.2 }} />
        <MDTypography component="p" style={{ fontWeight: 300, fontSize: "0.7rem" }}>
          Per Selezionare
        </MDTypography>
      </Stack>

      <Stack direction="row" gap={0.5}>
        <CloseIcon sx={{ backgroundColor: iconsColor, borderRadius: 1, padding: 0.2 }} />
        <MDTypography component="p" style={{ fontWeight: 300, fontSize: "0.7rem" }}>
          Per Chiudere
        </MDTypography>
      </Stack>
    </Stack>
  );
}
