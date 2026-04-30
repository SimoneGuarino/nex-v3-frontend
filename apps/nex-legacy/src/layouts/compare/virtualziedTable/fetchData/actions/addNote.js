import { FetchData } from '../../../../../examples/Fetch';

export function AddNote(uniqueString, row, postText, userContext, abortController) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_SEARCH_ENDPOINT + 'notes/create/note', 'POST', {
        tk: userContext.token,
        _id: row._id,
        tempId: uniqueString,
        text: postText,
    }, abortController).then(res => {
    }).catch(error => console.error(error))
}