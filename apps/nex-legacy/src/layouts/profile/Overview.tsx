import Grid from "@mui/material/Grid";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MDBox from "components/MDBox";
import { useUserContext } from "context/UserContext";
import ProfileHeader from "./components/ProfileHeader";
import ProfileDetailsCard from "./components/ProfileDetailsCard";
import { Tooltip } from "react-tooltip";

export default function Overview() {
    const [user] = useUserContext();
    if (!user?.details) return null;

    return (
        <DashboardLayout>
            <ProfileHeader />
            <Grid container spacing={2}>
                <Grid item xs={12} md={7} xl={8}>
                    <ProfileDetailsCard />
                </Grid>
            </Grid>
            <Tooltip id="general-profile-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
        </DashboardLayout>
    );
}