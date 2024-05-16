import React, { useState, useEffect, useRef } from "react";


export const ResultsOverlay = ({ title, labelsList }) =>
{
    return (
        <>
            {labelsList.length > 0 &&

                <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-around pointer-events-none overflow-hidden p-[5rem] ">


                    <div className="z-20 text-6xl w-[80%] m-[10%] p-5 rounded-xl  bg-gray-800">
                        <div className="text-white">
                            {title && "Closest Match:"}
                        </div>
                        <div className="text-green-500">
                            {title}
                        </div>
                    </div>

                    <div className="z-20 flex flex-row gap-2 w-[80%] m-[10%]  flex-wrap   p-5 rounded-xl bg-gray-800">
                        <div className="text-4xl text-white"> Text found: </div>
                        <a
                            href={`https://www.google.com/search?q=${labelsList.join(", ") + " cocktail recipe"}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-4xl text-blue-300 underline pointer-events-auto"
                            style={{ overflowWrap: "break-word" }}
                        >
                            {labelsList.join(", ")}
                        </a>
                    </div>
                </div>}
        </>
    );

}
