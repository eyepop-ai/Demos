import React, { useRef } from "react";


const ModelSlector = ({ className, setModel }) =>
{
    const modelSelectionRef = useRef();

    return (

        <div className={`${className} flex w-full justify-center items-center`}>
            <div
                className="flex h-full text-2xl justify-center items-center ml-2 pr-2 rounded-b-xlbg-blue-400">

                <h5 className="text-2xl text-center text-white">Select Model:</h5>

                <select
                    ref={modelSelectionRef}
                    onChange={() => { setModel(modelSelectionRef.current.value); }}
                    className="btn select select-bordered outline border-black max-w-xs w-1/2 m-5 text-2xl text-white rounded-xl transition-all bg-black hover:bg-purple-500 hover:text-white"
                >

                    <option className='text-white bg-black' value="peopleCommon">People + Common Objects</option>

                    <option className='text-white bg-black' value="text">Text</option>

                    <option className='text-white bg-black' value="peopleBody">People + 2D Body Pose</option>

                    <option className='text-white bg-black' value="people3d">People + 3D Pose + Hands + Face</option>

                </select>
            </div>
        </div>

    );
};


export default ModelSlector;
