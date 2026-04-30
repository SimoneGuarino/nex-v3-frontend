import { FetchData } from '../../../../../examples/Fetch';

export function RemoveNote(comment, row, itemId, userContext, abortController) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_SEARCH_ENDPOINT + 'notes/delete/note', 'POST', {
        tk: userContext.token,
        _idProduct: row._id,
        _idTemp: comment[itemId].tempId,
        username: userContext.details?.username,
    }, abortController).then(_ => {
    }).catch(error => console.error(error))
}