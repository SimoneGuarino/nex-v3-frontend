// Footer.tsx
import * as React from "react";

// @mui
import Link from "@mui/material/Link";
import type { Theme } from "@mui/material/styles";

// components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// base styles
import typography from "assets/theme/base/typography";

type Company = {
    href: string;
    name: string;
};

type FooterLink = {
    href: string;
    name: string;
};

export interface FooterProps {
    company?: Company;
    links?: FooterLink[];
}

export default function Footer({
    company = { href: "https://www.focelda.com/", name: "Focelda" },
    links = [
        { href: "", name: "Focelda Dev" },
        { href: "https://www.focelda.com/chi_siamo.aspx", name: "About Us" },
        { href: "https://www.focelda.com/rete_distributiva.aspx", name: "Rete Distributiva" },
        { href: "https://www.focelda.com/landingpage.aspx?id=45", name: "License" },
    ],
}: FooterProps) {
    const { href, name } = company;
    const { size } = (typography as any) || {};

    const renderLinks = () =>
        links.map((link) => (
            <MDBox key={`${link.name}-${link.href}`} component="li" px={2} lineHeight={1}>
                <Link href={link.href} target="_blank" rel="noreferrer">
                    <MDTypography variant="button" fontWeight="regular" color="text" fontSize="0.8rem">
                        {link.name}
                    </MDTypography>
                </Link>
            </MDBox>
        ));

    return (
        <MDBox
            width="100%"
            display="flex"
            flexDirection={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            alignItems="center"
            px={1.5}
            zIndex={1}
            color="#ccc"
        >
            <MDBox
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexWrap="wrap"
                color="text"
                fontSize={size?.sm}
                px={1.5}
            >
                <MDTypography variant="body2" sx={{ mr: 2 }} fontWeight="regular" fontSize="0.8rem">
                    {new Date().getFullYear()} &copy;
                </MDTypography>

                <MDTypography variant="body2" fontWeight="regular" fontSize="0.8rem">
                    by Nex
                </MDTypography>

                <Link href={href} target="_blank" rel="noreferrer">
                    <MDTypography variant="button" fontWeight="medium" fontSize="0.8rem">
                        &nbsp;{name}&nbsp;
                    </MDTypography>
                </Link>

                <MDTypography variant="body2" fontWeight="regular" fontSize="0.8rem">
                    for a better web.
                </MDTypography>
            </MDBox>

            <MDBox
                component="ul"
                sx={(theme: Theme) => ({
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "center",
                    listStyle: "none",
                    mt: 3,
                    mb: 0,
                    p: 0,
                    [theme.breakpoints.up("lg")]: {
                        mt: 0,
                    },
                })}
            >
                {renderLinks()}
            </MDBox>
        </MDBox>
    );
}
