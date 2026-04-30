/** SANITIZE CLASS
 * 
 * Use this class to sanitize and validate inputted data
 * 
 * @return {Object} Success: true/false | Message: error message | Data: empty if failed, validated and sanitized output string if passed
**/
class Convert {

    /** TOKEN | Token sanitization and validation
     * 
     * @param num Inputted number for convert in to Euro
     */
    euro(num) {
        let res = {Success: false, Data: null};
        const convertNum = parseFloat(num);
        if (convertNum != undefined && convertNum != null && typeof convertNum == "number") {

            res.Success = true;
            res.Data = convertNum.toLocaleString("it-IT", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        } else {
            res.Message = "Il Numero è vuoto o non valido";
        }

        return res;
    }

    date(str) {
        let res = {Success: false};
        if (str != undefined && str != null && typeof str == "string") {
            const formattedString = str.length > 5 ? str : `0${str}`;
            // Dividi la stringa in parti usando il metodo substring
            const day = formattedString.substring(2, 4); // Estrae "05"
            const month = formattedString.substring(0, 2); // Estrae "06"
            const year = formattedString.substring(4);    // Estrae "18"

            res.Success = true;
            res.Data = `${month}/${day}/${year}`;
        } else {
            res.Message = "Il Numero è vuoto o non valido";
        }

        return res;
    }
};

export default Convert;