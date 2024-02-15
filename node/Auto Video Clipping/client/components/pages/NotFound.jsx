import React from 'react';

const NotFound = () =>
{
    return (
        <div className="min-h-screen flex flex-grow items-center justify-center bg-gray-50">
            <div className="rounded-lg bg-white p-8 text-center shadow-xl">
                <h1 className="mb-4 text-4xl font-bold">404</h1>
                <p className="text-gray-600 bg-slate-100 rounded p-1">Oops! The page you are looking for could not be found.</p>
                <br />
            </div>
        </div>
    );
};

export default NotFound;
