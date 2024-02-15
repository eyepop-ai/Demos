import React from 'react';
import HeaderPopControls from './HeaderPopControls';

const Header = ({ className, loading, handleFileChange, popNameRef }) =>
{

    return (
        <header
            className={className}>

            <div
                className="bg-blue-200 flex h-20 justify-between items-center m-4 rounded-3xl shadow-2xl">

                <a
                    className="overflow-hidden w-[10rem] p-5 hover:scale-125 transition-all"
                    href='https://eyepop.ai'
                    target='_blank'>

                    <img
                        src="https://raw.githubusercontent.com/64blit/files/main/pose_follow/ep_logo.png"
                        className="object-contain h-full w-48" />
                </a>

                <h4
                    className="font-bold m-5 overflow-hidden self-center text-xl text-center">
                    Node Demo
                </h4>

                <form action="https://docs.eyepop.ai" target="_blank"
                    className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded h-12 w-36 self-center m-5 hover:scale-125 transition-all">

                    <input
                        type="submit"
                        className="bg-transparent cursor-pointer h-full w-full hover:scale-125 transition-all"
                        value="Docs"
                    />

                </form>


            </div>

            <HeaderPopControls
                handleFileChange={handleFileChange}
                popNameRef={popNameRef}
                loading={loading}
            />
        </header>
    );
};

export default Header;
