// prop-types is a library for typechecking of props
import PropTypes from "prop-types";
import Fade from "@mui/material/Fade";

// React example components
import PageLayout from "examples/LayoutContainers/PageLayout";
import { Stack } from "@mui/material";

import bg from 'assets/images/login/circle-doodle-bg.png';
import { useNexTheme } from "@nex/theme-system";



function BasicLayout({ image, children }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return (
        <PageLayout>
            <Fade in={true} timeout={1000}>
                <Stack width="100%" height="100vh" mx="auto" alignItems='center' justifyContent='center' sx={{
                        backgroundImage:
                        bg &&
                        `linear-gradient(to left, rgba(${darkMode ? '15, 15, 15' : '245, 245, 245'}, 0.96), 
                        rgba(${darkMode ? '15, 15, 15' : '245, 245, 245'}, 0.96)), url( ${bg} )`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "repeat",
                }}>
                    {children}
                </Stack>
            </Fade>
        </PageLayout>
    );
}

// Typechecking props for the BasicLayout
BasicLayout.propTypes = {
    image: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

export default BasicLayout;
