export const sendMail = ({ serverUrl = 'https://www.64blit.com/app/mpl/email/', email = "", subject = "", message = "", responseDomElement = null }) =>
{
    const sendMailPromise = new Promise((resolve, reject) =>
    {
        fetch(serverUrl, {
            method: 'POST',
            body: JSON.stringify({ email, subject, message }),
            headers: {
                "Content-Type": "text/plain",
            },
        })
            .then((response) =>
            {
                console.log("response", response.status, response);
                if (response.status === 200)
                {
                    if (responseDomElement)
                    {
                        responseDomElement.innerHTML = 'Thank you for your interest. We will reach out to you shortly.';
                        responseDomElement.classList.remove('hidden');
                    }
                    resolve(response);
                } else
                {
                    if (responseDomElement)
                    {
                        responseDomElement.innerHTML = 'There was an error. Please try again. 3';
                        responseDomElement.classList.remove('hidden');
                    }
                    reject(response);
                }
            }).catch((error) =>
            {
                if (responseDomElement)
                {
                    console.log("error", error)
                    responseDomElement.innerHTML = 'There was an error. Please try again. 4';
                    responseDomElement.classList.remove('hidden');
                }
                reject(error);
            });
    });

    return {
        finally: (cleanupFunction) =>
        {
            sendMailPromise.finally(cleanupFunction);
        }
    };
};
