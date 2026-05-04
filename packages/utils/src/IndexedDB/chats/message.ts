const limitStoredForBlock = 250;
export const limitLoadedMessage = 25;

const initDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('model-storage', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('messages')) {
                const messageStore = db.createObjectStore('messages', { keyPath: '_id' });
                messageStore.createIndex('idBlock', 'idBlock', { unique: false });
                messageStore.createIndex('idBlock_date', ['idBlock', 'date'], { unique: false });
            };
            if (!db.objectStoreNames.contains('blocks')) {
                const blockStore = db.createObjectStore('blocks', { keyPath: 'idBlock' });
                blockStore.createIndex('date', 'date', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject(`Error opening database: ${(event.target as IDBRequest).error}`);
        };
    });
};


export const saveMessageToIndexedDB = async (message: any) => {
    try {
        if (!message._id) {
            throw new Error('Message is missing the _id property, which is required as the keyPath.');
        }

        const db = await initDB();

        // Gestione del blocco
        const blockTransaction = db.transaction('blocks', 'readwrite');
        const blockStore = blockTransaction.objectStore('blocks');

        const blockExists: any = await new Promise((resolve, reject) => {
            const request = blockStore.get(message.idBlock);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Error checking for existing block');
        });

        if (blockExists) {
            // Aggiorna il blocco
            blockStore.put({
                ...blockExists,
                date: new Date(message.date).getTime(),
                totalMessages: (blockExists.totalMessages || 0) + 1,
            });
        } else {
            // Crea un nuovo blocco
            blockStore.add({
                path: message.path,
                idBlock: message.idBlock,
                titleBlock: message.titleBlock,
                date: new Date(message.date).getTime(),
                user: message.user,
                totalMessages: 1, // Inizia con 1 messaggio
            });
        }

        await new Promise<void>((resolve, reject) => {
            blockTransaction.oncomplete = () => resolve();
            blockTransaction.onerror = () => reject('Transaction failed while managing blocks');
        });

        // Gestione del limite di messaggi
        const numberStored: number = await countMessagesByIdBlock(message.idBlock);

        if (numberStored >= limitStoredForBlock) {
            const messageTransaction = db.transaction('messages', 'readwrite');
            const messageStore = messageTransaction.objectStore('messages');

            const deleteOldMessagesRequest: any = messageStore.index('idBlock').openCursor(null, 'next');
            let deletedCount = 0;

            deleteOldMessagesRequest.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor && cursor.value.idBlock === message.idBlock) {
                    messageStore.delete(cursor.primaryKey);
                    deletedCount++;
                    if (deletedCount >= (numberStored - limitStoredForBlock + 1)) {
                        return;
                    }
                    cursor.continue();
                }
            };

            await new Promise<void>((resolve, reject) => {
                messageTransaction.oncomplete = () => resolve();
                messageTransaction.onerror = () => reject('Transaction failed while deleting old messages');
            });
        }

        // Aggiungi il nuovo messaggio
        const insertTransaction = db.transaction('messages', 'readwrite');
        const insertStore = insertTransaction.objectStore('messages');
        insertStore.put(message);

        return new Promise<void>((resolve, reject) => {
            insertTransaction.oncomplete = () => resolve();
            insertTransaction.onerror = () => reject('Transaction failed while inserting new message');
        });
    } catch (error) {
        console.error('Error saving message to IndexedDB:', error);
    }
};


export const SyncronizeIndexedDB = async (blocks: any) => {
    try {
        const numberStored: number = await countMessagesByIdBlock(blocks.idBlock);
        const db = await initDB();

        // Usa una singola transazione per gestire sia i messaggi che i blocchi
        const transaction = db.transaction(['messages', 'blocks'], 'readwrite');
        const store = transaction.objectStore('messages');
        const blockStore = transaction.objectStore('blocks');

        // Se il numero totale di messaggi supera il limite, rimuovi i più vecchi
        if (numberStored >= limitStoredForBlock) {
            const excessMessagesCount = numberStored - limitStoredForBlock + blocks.length;

            // Rimuovi i messaggi più vecchi per rispettare il limite
            const deleteOldMessagesRequest: any = store.index('idBlock').openCursor(null, 'next'); // Assicurati di avere un indice su `idBlock`
            let deletedCount = 0;

            deleteOldMessagesRequest.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor && deletedCount < excessMessagesCount) {
                    if (cursor.value.idBlock === blocks.idBlock) {
                        store.delete(cursor.primaryKey);
                        deletedCount++;
                    }
                    cursor.continue();
                }
            };

            await new Promise<void>((resolve, reject) => {
                deleteOldMessagesRequest.transaction.oncomplete = () => resolve();
                deleteOldMessagesRequest.onerror = () => reject('Error deleting old messages.');
            });
        }

        // Calcola quanti messaggi possono ancora essere aggiunti
        const remainingLimit = Math.max(0, limitStoredForBlock - numberStored);

        if (remainingLimit > 0) {
            const promises = blocks.map(async (block: any) => {
                // Controlla l'esistenza del blocco
                const blockExists = await new Promise((resolve, reject) => {
                    const request = blockStore.get(block.idBlock);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(`Error checking for existing block: ${request.error}`);
                });

                if (block.messages && Array.isArray(block.messages) && block.messages.length > 0) {
                    // Ordina i messaggi per data in ordine decrescente (dal più recente al più vecchio)
                    block.messages.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    // Trova l'oggetto con la data più recente
                    const mostRecentItem = block.messages[0];

                    // Aggiungi o aggiorna il blocco
                    if (!blockExists) {
                        blockStore.add({ 
                            path: block.path, 
                            idBlock: block.idBlock, 
                            titleBlock: block.titleBlock, 
                            date: new Date(mostRecentItem.date).getTime(), 
                            user: block.user,
                            totalMessages: block.totalMessages
                        });
                    } else {
                        const updatedBlock = { ...blockExists, date: new Date(mostRecentItem.date).getTime(), totalMessages: block.totalMessages };
                        blockStore.put(updatedBlock);
                    }
                }

                // Gestisci i messaggi all'interno del blocco (limita al `remainingLimit`)
                const messagePromises = block.messages.slice(0, remainingLimit).map((message: any) => {
                    const message_ = { ...message, idBlock: block.idBlock, date: new Date(message.date).getTime() };
                    return new Promise<void>((resolve, reject) => {
                        const request = store.get(message._id);
                        request.onsuccess = () => {
                            const existingMessage = request.result;

                            if (existingMessage) {
                                // Aggiorna il messaggio esistente
                                const updatedMessage = { ...existingMessage, ...message_ };
                                store.put(updatedMessage);
                            } else {
                                // Inserisci un nuovo messaggio
                                store.add(message_);
                            }
                            resolve();
                        };
                        request.onerror = () => {
                            reject(`Error checking for existing message: ${request.error}`);
                        };
                    });
                });

                // Attendi il completamento di tutte le operazioni sui messaggi per il blocco corrente
                await Promise.all(messagePromises);
            });

            // Attendi il completamento di tutte le operazioni sui blocchi
            await Promise.all(promises);
        }

        // Ritorna una Promise che si risolve quando la transazione è completata
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject('Transaction failed');
        });
    } catch (error) {
        console.error('Error saving messages to IndexedDB:', error);
    }
};




export const getOldestMessageDateByIdBlock = async (idBlock: string) => {
    try {
        const db = await initDB();
        const transaction = db.transaction('messages', 'readonly');
        const store = transaction.objectStore('messages');

        return new Promise<Date | null>((resolve, reject) => {
            let oldestDate: Date | null = null;

            const request = store.openCursor();
            request.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.idBlock === idBlock) {
                        const messageDate = new Date(cursor.value.date);
                        if (!oldestDate || messageDate < oldestDate) {
                            oldestDate = messageDate;
                        }
                    }
                    cursor.continue(); // Continua a iterare sugli altri elementi
                } else {
                    // Risolvi la Promise con la data più vecchia trovata o null se non ci sono messaggi
                    resolve(oldestDate);
                }
            };

            request.onerror = () => {
                reject(`Error retrieving messages: ${request.error}`);
            };
        });
    } catch (error) {
        console.error('Error retrieving oldest message date by idBlock:', error);
        return null; // Ritorna null in caso di errore
    }
};

export const findBlock = async (idBlock: string) => {
    try {
        const db = await initDB();
        const transaction = db.transaction('blocks', 'readonly');
        const blockStore = transaction.objectStore('blocks');

        return new Promise<boolean>((resolve, reject) => {
            const request = blockStore.get(idBlock);

            request.onsuccess = (event: any) => {
                const result = event.target.result;
                if (result) {
                    resolve(true); // Il blocco esiste
                } else {
                    resolve(false); // Il blocco non esiste
                }
            };

            request.onerror = () => {
                reject(`Error checking for idBlock: ${request.error}`);
            };
        });
    } catch (error) {
        console.error('Error retrieving block by idBlock:', error);
        return false; // Ritorna false in caso di errore
    }
};

export const countMessagesByIdBlock = async (idBlock: string): Promise<number> => {
    try {
        const db = await initDB();
        const transaction = db.transaction('messages', 'readonly');
        const store = transaction.objectStore('messages');

        return new Promise((resolve, reject) => {
            let count = 0;

            const request = store.openCursor();

            request.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.idBlock === idBlock) {
                        count++; // Incrementa il contatore se l'elemento corrisponde all'idBlock
                    }
                    cursor.continue(); // Continua a iterare sugli altri elementi
                } else {
                    // Risolvi la Promise con il conteggio quando il cursore ha finito di iterare
                    resolve(count);
                }
            };

            request.onerror = () => {
                reject(`Error counting messages: ${request.error}`);
            };
        });
    } catch (error) {
        console.error('Error counting messages by idBlock:', error);
        return 0; // Ritorna 0 in caso di errore
    }
};

export const getMessagesByIdBlock = async (
    idBlock: string,
    lastItemDate: Date = new Date(),
): Promise<Array<object>> => {
    try {
        const db = await initDB();
        const transaction = db.transaction('messages', 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('idBlock_date'); // Indice combinato

        // Intervallo di ricerca
        const range = IDBKeyRange.bound(
            [idBlock, 0],
            [idBlock, lastItemDate.getTime()],
            true,
            true
        );

        return new Promise((resolve, reject) => {
            const messages: any[] = [];
            const request = index.openCursor(range, 'prev'); // Ordine decrescente

            request.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (messages.length < limitLoadedMessage) {
                        messages.unshift(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(messages);
                    }
                } else {
                    resolve(messages);
                }
            };

            request.onerror = () => {
                reject(`Error retrieving messages: ${request.error}`);
            };
        });
    } catch (error) {
        console.error('Error retrieving messages by idBlock:', error);
        return [];
    }
};

export const getMessagesByViewed = async (idBlock: string) => {
    try {
        const db = await initDB();
        const transaction = db.transaction('messages', 'readonly');
        const store = transaction.objectStore('messages');
        const messages: any = [];

        return new Promise((resolve, reject) => {
            const request = store.openCursor();

            request.onsuccess = (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    if(idBlock){
                        if (cursor.value.idBlock === idBlock && cursor.value.viewed === false && cursor.value.fromMe === false) {
                            messages.push(cursor.value);
                        }
                    }else{
                        if (cursor.value.viewed === false && cursor.value.fromMe === false) {
                            messages.push(cursor.value);
                        }
                    }

                    cursor.continue(); // Continua a iterare sugli altri elementi
                } else {
                    // Risolvi la Promise quando il cursore ha finito di iterare
                    resolve(messages);
                }
            };

            request.onerror = () => {
                reject(`Error retrieving messages: ${request.error}`);
            };
        });
    } catch (error) {
        console.error('Error retrieving messages by idBlock:', error);
    }
};

/**
 * Funzione che ha lo scopo di trovare tutti i blocchi presenti nel indexedDB
 * @returns 
 */
export const getAllBlocks = async () => {
    try {
        const db = await initDB();
        const transaction = db.transaction('blocks', 'readonly');
        const store = transaction.objectStore('blocks');
        const index = store.index('date'); // Assicurati che esista un indice sulla proprietà `date`

        const results: any[] = [];
        let count = 0;

        // Apri un cursore per iterare sugli elementi in ordine decrescente
        index.openCursor(null, 'prev').onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor && count < 15) {
                results.push(cursor.value);
                count++;
                cursor.continue();
            };
        };

        // Restituisce una Promise che si risolve quando la transazione è completata
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(results);
            transaction.onerror = () => reject('Transaction failed');
        });

    } catch (error) {
        console.error('Error retrieving blocks:', error);
    }
};

/**
 * Aggioprna la proprietà viewed di tutti i messaggi che fanno parte di quel determinato blocco
 * TODO: aggiornare solo i messaggi caricati e visti di quel determinato blocco, per limitare l'update sul'indexedDB.
 * @param idBlock string
 * @returns 
 */
export const updateMessagesViewedByIdBlock = async (idBlock: string) => {
    try {
        const db = await initDB();
        const transaction = db.transaction('messages', 'readwrite');
        const store = transaction.objectStore('messages');

        const index = store.index('idBlock'); // Assicurati che ci sia un indice su `idBlock`
        const request = index.openCursor(IDBKeyRange.only(idBlock));

        request.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
                const updatedMessage = { ...cursor.value, viewed: true };
                store.put(updatedMessage);
                cursor.continue(); // Continua a iterare sui prossimi messaggi
            }
        };

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject('Transaction failed');
        });
    } catch (error) {
        console.error('Error updating messages in IndexedDB:', error);
    }
};