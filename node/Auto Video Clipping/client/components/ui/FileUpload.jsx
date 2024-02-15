import React, { useState } from 'react';

const FileUpload = ({ className, onFileChange }) =>
{
    const [ selectedFile, setSelectedFile ] = useState(null);

    const handleFileChange = (event) =>
    {
        setSelectedFile(event.target.files[ 0 ]);
        onFileChange(event);
    };

    const handleUpload = () =>
    {
        // Perform file upload logic here
        if (selectedFile)
        {
            // Example: Upload file using fetch API
            const formData = new FormData();
            formData.append('file', selectedFile);

            fetch('/upload', {
                method: 'POST',
                body: formData,
            })
                .then((response) => response.json())
                .then((data) =>
                {
                    // Handle response from server
                    console.log(data);
                })
                .catch((error) =>
                {
                    // Handle error
                    console.error(error);
                });
        }
    };

    return (
        <div className={` ${className}  h-40 text-center flex flex-col justify-center min-w-0`} >
            <input className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded hover:outline-2 outline-slate-100" type="file" onChange={handleFileChange} />
        </div>
    );
};

export default FileUpload;
