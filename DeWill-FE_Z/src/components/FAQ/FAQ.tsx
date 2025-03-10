


import _React from "react";
import ResponsiveAppBar from "../AppBar/ResponsiveAppBar";
import { CssBaseline } from "@mui/material";
import FAQBody from "./FAQBody";

function Home() {
    return (
        <div>
            <CssBaseline />
            <ResponsiveAppBar />
            <FAQBody />
        </div>
    );
}

export default Home;
