import React from "react";

/**
 * 
 * @param reactChild
 * @param {string} reactChild.idName Input id
 * @param {string} reactChild.title Input title
 * @param {string} reactChild.type Input type
 * @param {?string} reactChild.mandatory Mandatory?
 * @param {?string} reactChild.area
 * @param {?string} reactChild.clsName
 * @param {?number} reactChild.charWidth
 * 
 * @returns 
 */
export function InputText({
  inputs,
  setInputs,
  idName,
  title,
  type,
  getValue = null,
  mandatory = false,
  area = false,
  clsName = 'input',
  charWidth = 10
}: {
  inputs: any,
  setInputs: (prev: any) => void,
  idName: string,
  title: string;
  type: string;
  getValue?: Function | null,
  mandatory?: boolean;
  area?: boolean;
  clsName?: string;
  charWidth?: number;
}) {

  // States
  const [errorMessage, setErrorMessage] = React.useState('');

  // On user's input
  function changeValue(event: any): void {
    let inputValue: any;
    if (type === 'checkbox') {
      inputValue = event.target.checked;
    } else {
      inputValue = event.target.value;
    }

    switch (type) {
      case 'text':
        if (typeof inputValue != 'string') {
          setErrorMessage(`Questo campo non è di tipo testo`);
          setInputs((prev: any) => {
            return { ...prev, [idName]: { value: inputValue, error: true } }
          });
          return;
        }

        if (inputValue.length == 0) {
          if (mandatory) {
            setInputs((prev: any) => {
              return { ...prev, [idName]: { value: inputValue, error: true } }
            });
          } else {
            setInputs((prev: any) => {
              return { ...prev, [idName]: { value: inputValue, error: false } }
            });
          }
          return;
        } else if (inputValue.length >= Number.MAX_SAFE_INTEGER) {
          setErrorMessage(`Questo campo contiene troppi caratteri`);
          setInputs((prev: any) => {
            return { ...prev, [idName]: { value: inputValue, error: true } }
          });
          return;
        }

        break;
      case 'number':
        if (typeof inputValue != 'number') {
          setErrorMessage(`Questo campo non contiene un numero`);
          setInputs((prev: any) => {
            return { ...prev, [idName]: { value: inputValue, error: true } }
          });
          return;
        }

        setInputs((prev: any) => {
          return { ...prev, [idName]: { value: inputValue, error: false } }
        });
        break;
      case 'checkbox': 
        setInputs((prev: any) => {
          return { ...prev, [idName]: { value: inputValue, error: false } }
        });
      return;
      // Da aggiungere altre
      default:
        break;
    }

    setInputs((prev: any) => {
      return { ...prev, [idName]: { value: inputValue, error: false } }
    });
  }

  // Check mandatory text input
  let mandatoryText = mandatory ? <span className={`${clsName}-mandatory`}>* </span> : null;

  // To first letter up
  let fieldName = title;
  title = title.charAt(0).toLowerCase() + title.slice(1);

  return (
    <div className={type === 'checkbox' ? `${clsName}-check-container` : `${clsName}-container`} style={{ width: `calc(${charWidth} * 1rem)` }}>
      {!area ?(
        type === 'checkbox' ? (
          <>
            <input
              aria-label={`Input campo ${title}`}
              className={inputs[idName].error && mandatory ? `${clsName}-check-field-error` : `${clsName}-check-field`}
              id={`in-${idName}`}
              onChange={(e) => changeValue(e)}
              type={type}
              checked={inputs[idName].value}
            />
            <span className={`${clsName}-check-title`}>{fieldName} {mandatoryText}</span>
          </>
        ) : (
          <>
            <span className={`${clsName}-title`}>{fieldName} {mandatoryText}</span>
            <input
              aria-label={`Input campo ${title}`}
              className={inputs[idName].error && mandatory ? `${clsName}-field-error` : `${clsName}-field`}
              id={`in-${idName}`}
              onChange={(e) => changeValue(e)}
              onBlur={(e) => {if (typeof getValue == 'function') getValue(e);}}
              placeholder={`Inserisci ${title}`}
              type={type}
              value={inputs[idName].value}
            />
          </>
        )) : (
          <>
            <span className={`${clsName}-title`}>{fieldName} {mandatoryText}</span>
            <textarea
              aria-label={`Input campo ${title}`}
              className={inputs[idName].error && mandatory ? `${clsName}-field-error` : `${clsName}-field`}
              cols={30}
              id={`in-${idName}`}
              name={fieldName}
              onChange={(e) => changeValue(e)}
              placeholder={`Inserisci ${title}`}
              rows={8}
              value={inputs[idName].value}
            />
          </>
        )
      }
      {inputs[idName].error && mandatory ?
        <p className={`${clsName}-error-text`}>{errorMessage}</p> :
        null
      }
    </div>
  )
}