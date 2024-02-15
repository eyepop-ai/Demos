import React from 'react';
import FileUpload from './FileUpload';

const HeaderPopControls = ({ className, handleFileChange, loading, popNameRef }) =>
{

    const marginsStyle = ' p-4 mr-[5rem] ml-[5rem] mt-[-1rem] ';
    return (
        <div
            className={`${className}  ${loading ? 'h-0' : 'h-14'} transition-all duration-500 `}>


            <div
                className={`${marginsStyle} bg-blue-400 flex h-full justify-center items-center rounded-b-3xl shadow-2xl p-5`}>


                <div
                    className='text-blue-100 font-extrabold text-xl w-32 overflow-hidden'
                    ref={popNameRef}
                >
                </div>

                <FileUpload
                    className={` ${loading ? 'w-0 h-0 mt-[-50rem]' : 'h-24'} transition-all duration-500`} onFileChange={handleFileChange} />
                {/* 

                <button
                    className={`${loading ? 'hidden' : '0'}  bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white border border-blue-500 hover:border-transparent rounded h-10 m-5 w-24 self-center hover:scale-125 transition-all`} >
                    Start Camera
                </button> */}


            </div>
        </div>
    );
};

export default HeaderPopControls;
