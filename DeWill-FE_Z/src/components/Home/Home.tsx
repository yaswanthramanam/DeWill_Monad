import _React from "react";
import ResponsiveAppBar from "../AppBar/ResponsiveAppBar";
import Body from "../Body/Body";
import { CssBaseline } from "@mui/material";

function Home() {
    return (
        <div>
            <CssBaseline />
            <ResponsiveAppBar />
            <Body />
        </div>
    );
}

export default Home;
