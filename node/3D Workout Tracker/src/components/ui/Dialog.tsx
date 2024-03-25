import React, { useState } from 'react';
import { useSceneStore } from '../../store/SceneStore';

interface DialogProps
{
    onClose: () => void;
}



const Dialog: React.FC<DialogProps> = ({ onClose }) =>
{
    const { incrementRep, setRepsPerSet, setTotalSets, setWorkoutRoutine, workoutRules, repsPerSet, totalSets, reset } = useSceneStore();

    return (
        <div className="bg-white rounded p-4 flex flex-col gap-3 justify-center text-black">
            <h2 className="text-center">Workout Settings</h2>
            <label className='flex flex-row justify-evenly items-center gap-3'>
                <div className='w-24'>
                    Workout Routine:
                </div>
                <textarea
                    value={workoutRules}
                    onChange={(e) =>
                    {
                        // add a \r\n to the end of each line if it doesn't already exist
                        const value = e.target.value.split('\n').map((line) => line.trim()).join('\r\n');

                        setWorkoutRoutine(value)
                    }}
                    className="border border-gray-100 rounded p-2 text-white"
                    rows={8}
                    cols={80}
                />
            </label>

            <br />
            <br />

            <div className="btn w-24 self-center text-blue-500 " onClick={() =>
            {
                incrementRep()
            }}>+1 Rep</div>

            <label className='flex flex-row justify-evenly items-center gap-3  '>

                <div className='w-40'>
                    Reps per Set:
                </div>

                <input
                    type="number"
                    value={repsPerSet}
                    onChange={(e) => setRepsPerSet(Number(e.target.value))}
                    className="border border-gray-300 rounded p-2 text-white"
                />

            </label>

            <br />

            <label className='flex flex-row justify-evenly items-center gap-3  '>
                <div className='w-40'>
                    Total Set Count:
                </div>
                <input
                    type="number"
                    value={totalSets}
                    onChange={(e) => setTotalSets(Number(e.target.value))}
                    className="border border-gray-300 rounded p-2 text-white"
                />
            </label>

            <br />

            <div className="flex justify-center">
                <button
                    onClick={reset}
                    className=" btn  text-white rounded p-2 mr-2"
                >
                    Reset
                </button>
                <button
                    onClick={onClose}
                    className=" btn  text-white rounded p-2"
                >
                    Close
                </button>
            </div>

        </div>
    );
};

export default Dialog;
