import React from "react";
import { Index } from "./components/Index.jsx";
import "./styles.css";
import { EyePopProvider } from "./hook/EyePopContext.jsx";

export function createApp()
{
    return (
        <EyePopProvider>
            <Index />
        </EyePopProvider>
    )
}
