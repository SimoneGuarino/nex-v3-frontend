/** SANITIZE CLASS
 * 
 * Use this class to sanitize and validate inputted data
 * 
 * @return {Object} Success: true/false | Message: error message | Data: empty if failed, validated and sanitized output string if passed
**/
class Sanitize {

    /** EMAIL | Email sanitization and validation
     * 
     * @param str Inputted email as a string
     * @note Email addresses should respect RFC5322 protocol
     */
    email(str) {
        let res = {Success: false, Message: "", Data: {}};
        let emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

        if (str && typeof str == "string" && str != "") {
            if (str.toLowerCase().match(emailRegex) != null) {
                res.Success = true;
                res.Data = str.toLowerCase().match(emailRegex)[0];
            } else {
                res.Message = "La mail non è valida";
            }
        } else {
            res.Message = "La mail è vuota o non valida";
        }

        return res;
    }

    /** NUMBER | Number sanitization and validation
     * 
     * @param num Inputted number as string or number
     */
    number(num) {
        let res = {Success: false, Message: "", Data: {}};

        try {
            let parsedNumber = Number(num);

            if (Number.isNaN(parsedNumber)) {
                res.Message = "Il numero non è valido";
            }
            
            res.Success = true;
            res.Data = parsedNumber;
        } catch(e) {
            res.Message = e;
        }

        return res;
    }

    /** PASSWORD | Password sanitization and validation
     * 
     * @param str Inputted password
     */
    password(str) {
        let res = {Success: false, Message: "", Data: {}};
        const regex = /\s/g;

        if (str && typeof str == "string" && str != "") {
            if (str.match(regex) != null) {
                res.Message = "Il campo password non può contenere spazi";
            } else {
                res.Success = true;
                res.Data = str;
            }
        } else {
            res.Message = "Il campo password è vuoto o non valido";
        }

        return res;
    }

    /** POSITIVE NUMBER | Only positive numbers
     * 
     * @param num Inputted number as a string or a number
     */
    positiveNumber(num) {
        let res = {Success: false, Message: "", Data: {}};
        const regex = /^[0-9]+$/;

        if (typeof num == "number") {
            if (num > 0) {
                res.Success = true;
                res.Data = num;
            } else {
                res.Message = "Il numero non è valido";
            }
        } else if (typeof num == "string") {
            if (num.match(regex) != null) {
                if (Number(num) && Number(num) > 0) {
                    res.Data = Number(num);
                    res.Success = true;
                } else {
                    res.Message = "Il numero non è valido";
                }
            }
        } else {
            res.Message = "Il numero inserito è vuoto o non valido";
        }

        return res;
    }

    /** RESTRICT TEXT | Text with spaces sanitization and validation
     * 
     * @param str Inputted text
     * @param ref Field name
     */
    restrictText(str, ref) {
        let res = {Success: false, Data: {}};
        const regex = /^[a-zA-Z0-9]+(?: [a-zA-Z0-9]+)*$/;

        if (str && typeof str == "string" && str != "") {
            if (str.match(regex) != null) {
                res.Success = true;
                res.Data = str.match(regex)[0];
            } else {
                res.Message = "Il campo " + ref + " non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z) e spazi ( )";
            }
        } else {
            res.Message = "Il campo " + ref + " è vuoto o non valido";
        }

        return res;
    }

    restrictTextNTIF(str){
        let res = {Success: false,  Data: {}};
        const regex = /^[A-Za-z0-9<>/\s'àè',.]+$/;

        if (str && typeof str == "string" && str != "") {
            if (str.match(regex) != null) {
                res.Success = true;
                res.Data = str.match(regex)[0];
            } else {
                res.Message = "Il campo non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z) e spazi ( )";
            }
        } else {
            res.Message = "Il campo è vuoto o non valido";
        }

        return res;
    }

    /** STRING | String sanitization and validation
     * 
     * @param str Inputted string
     * @param ref Field name
     */
    string(str, ref) {
        let res = {Success: false, Message: "", Data: {}};
        const regex = /^[a-zA-Z0-9]+$/;

        if (str && typeof str == "string" && str != "") {
            if (str.match(regex) != null) {
                res.Success = true;
                res.Data = str.match(regex)[0];
            } else {
                res.Message = "Il campo " + ref + " non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z) e numeri (0-9)";
            }
        } else {
            res.Message = "Il campo " + ref + " è vuoto o non valido";
        }

        return res;
    }

    /** STRING | String sanitization and validation
     * 
     * @param str Inputted string
     * @param ref Field name
     */
    dashString(str, ref) {
        let res = {Success: false, Message: "", Data: {}};
        const regex = /^[a-zA-Z0-9 _-]+$/;

        if (str && typeof str == "string" && str != "") {
            if (str.match(regex) != null) {
                res.Success = true;
                res.Data = str.match(regex)[0];
            } else {
                res.Message = "Il campo " + str + " non è valido, sono accettate solo lettere maiuscole (A-Z), minuscole (a-z), trattino (- _) e numeri (0-9)";
            }
        } else {
            res.Message = "Il campo " + str + " è vuoto o non valido";
        }

        return res;
    }
    
    /** TEXT | Text sanitization and validation
     * 
     * @param str Inputted text
     * @param ref Field name
     */
    text(str, ref) {
        let res = {Success: false, Message: "", Data: {}};
        const regex = /^[^'"\s][^'"\n]*[^'"\s]$/;

        if (str && typeof str == "string" && str != "") {
            if (str.match(regex) != null) {
                res.Success = true;
                res.Data = str.match(regex)[0];
            } else {
                res.Message = "Il campo " + ref + " non è valido, sono accettate solo lettere maiuscole (A-Z) e minuscole (a-z)";
            }
        } else {
            res.Message = "Il campo " + ref + " è vuoto o non valido";
        }

        return res;
    }

    /** TOKEN | Token sanitization and validation
     * 
     * @param str Inputted token
     */
    token(str) {
        let res = {Success: false, Message: "", Data: {}};
        const regex = /^(?!.*[\.\_\-]{2})[a-zA-Z0-9]+([\.\_\-][a-zA-Z0-9]+)*$/;

        if (str && typeof str == "string" && str != "") {
            if (str.match(regex) != null) {
                res.Success = true;
                res.Data = str.match(regex)[0];
            } else {
                res.Message = "Il token non è valido";
            }
        } else {
            res.Message = "Il token è vuoto o non valido";
        }

        return res;
    }
}

export default Sanitize;