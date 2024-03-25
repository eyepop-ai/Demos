import { Html } from '@react-three/drei';
import React from 'react';
import Dialog from './Dialog';
import { useSceneStore } from '../../store/SceneStore';


const UI: React.FC = () =>
{
    const [ open, setOpen ] = React.useState(false);

    return (
        <>
            <Html fullscreen>
                <div className='flex flex-row w-100 h-100 min-h-100 justify-end p-5' style={{ height: '100%' }}>
                    <div className="btn w-14 bg-gray-600 text-white m-4 " onClick={() =>
                    {
                        setOpen(!open)
                    }}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </div>

                    {open && <Dialog onClose={() => { setOpen(!open) }} />}

                </div>


            </Html>
        </>
    );
};

export default UI;
