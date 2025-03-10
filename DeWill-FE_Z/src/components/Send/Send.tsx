import _React, { ReactNode } from "react";
import ResponsiveAppBar from "../AppBar/ResponsiveAppBar";
import RedeemBody from './SendBody';
import CssBaseline from "@mui/material/CssBaseline/CssBaseline";

const Send= ():ReactNode | Promise<ReactNode> => {
    return (
        <div>
            <CssBaseline />
            <ResponsiveAppBar />
            <RedeemBody />
        </div>
    );
}

export default Send;