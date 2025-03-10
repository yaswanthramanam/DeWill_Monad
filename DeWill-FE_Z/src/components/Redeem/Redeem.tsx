import _React, { ReactNode } from "react";
import ResponsiveAppBar from "../AppBar/ResponsiveAppBar";
import RedeemBody from './RedeemBody';
import CssBaseline from "@mui/material/CssBaseline/CssBaseline";

const Redeem= ():ReactNode | Promise<ReactNode> => {
    return (
        <div>
            <CssBaseline />
            <ResponsiveAppBar />
            <RedeemBody />
        </div>
    );
}

export default Redeem;