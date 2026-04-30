import { Fade, Skeleton, Stack } from "@mui/material";
import { MainTheme } from "assets/settingsTheme";
import MinLoader from "../../minLoader";


export const LoadScreen: React.FC<{}> = () => {
    const palette = MainTheme().palette;

    return <Fade in={true}><Stack className="h-full w-full flex items-center justify-center" alignItems='center' justifyContent='center'>
        <Skeleton height={'100%'} sx={{
            borderRadius: 0, width: '100%',
            backgroundColor: palette.coloredSkeleton.background
        }} variant="rounded" />
        <MinLoader sx={{ width: 25, height: 25, position: 'absolute' }} />
    </Stack></Fade>
};