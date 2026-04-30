export type SortType = 'String' | 'Number' | 'Multiplay';
type SetDataFn = (updater: (prev: any) => any) => void;

/**
 * Funzione dedicata al sort dei dati attraverso l'utilizzo di diversi parametri di distinzione.
 */
export const Filters = (
  type: SortType,
  field: string,
  status: 0 | 1 | 2,
  multiplay: string[] | undefined,
  setData: SetDataFn,
  copyData: any,
  whereToFindData?: string
): void => {
  switch (type) {
    case 'String':
      status === 0
        ? setData((prev) => {
          if (whereToFindData) {
            const copy = [...prev[whereToFindData]];
            const sorted = copy.sort((a, b) => {
              const aValue = a[field] != null ? a[field] : '';
              const bValue = b[field] != null ? b[field] : '';
              return String(aValue).localeCompare(String(bValue));
            });
            return { ...prev, [whereToFindData]: sorted };
          } else {
            const copy = [...prev];
            const sorted = copy.sort((a, b) => {
              const aValue = a[field] != null ? a[field] : '';
              const bValue = b[field] != null ? b[field] : '';
              return String(aValue).localeCompare(String(bValue));
            });
            return sorted;
          }
        })
        : status === 1
          ? setData((prev) => {
            if (whereToFindData) {
              const copy = [...prev[whereToFindData]];
              const sorted = copy.sort((a, b) => {
                const aValue = b[field] != null ? b[field] : '';
                const bValue = a[field] != null ? a[field] : '';
                return String(aValue).localeCompare(String(bValue));
              });
              return { ...prev, [whereToFindData]: sorted };
            } else {
              const copy = [...prev];
              const sorted = copy.sort((a, b) => {
                const aValue = b[field] != null ? b[field] : '';
                const bValue = a[field] != null ? a[field] : '';
                return String(aValue).localeCompare(String(bValue));
              });
              return sorted;
            }
          })
          : setData((prev) => {
            if (whereToFindData) {
              return { ...prev, [whereToFindData]: copyData };
            } else {
              return copyData;
            }
          });
      break;

    case 'Number':
      status === 0
        ? setData((prev) => {
          if (whereToFindData) {
            const copy = [...prev[whereToFindData]];
            const sorted = copy.sort((a, b) =>
              parseFloat(String(a[field])) > parseFloat(String(b[field])) ? 1 : -1
            );
            return { ...prev, [whereToFindData]: sorted };
          } else {
            const copy = [...prev];
            const sorted = copy.sort((a, b) =>
              parseFloat(String(a[field])) > parseFloat(String(b[field])) ? 1 : -1
            );
            return sorted;
          }
        })
        : status === 1
          ? setData((prev) => {
            if (whereToFindData) {
              const copy = [...prev[whereToFindData]];
              const sorted = copy.sort((a, b) =>
                parseFloat(String(a[field])) > parseFloat(String(b[field])) ? -1 : 1
              );
              return { ...prev, [whereToFindData]: sorted };
            } else {
              const copy = [...prev];
              const sorted = copy.sort((a, b) =>
                parseFloat(String(a[field])) > parseFloat(String(b[field])) ? -1 : 1
              );
              return sorted;
            }
          })
          : setData((prev) => {
            if (whereToFindData) {
              return { ...prev, [whereToFindData]: copyData };
            } else {
              return copyData;
            }
          });
      break;

    case 'Multiplay':
      status === 0
        ? setData((prev) => {
          if (whereToFindData) {
            const copy = [...prev[whereToFindData]];
            const sorted = copy.sort((a, b) => {
              const productA = parseFloat(String(a[multiplay![0]])) * parseFloat(String(a[multiplay![1]]));
              const productB = parseFloat(String(b[multiplay![0]])) * parseFloat(String(b[multiplay![1]]));
              if (productA < productB) return -1;
              if (productA > productB) return 1;
              return 0;
            });
            return { ...prev, [whereToFindData]: sorted };
          } else {
            const copy = [...prev];
            const sorted = copy.sort((a, b) => {
              const productA = parseFloat(String(a[multiplay![0]])) * parseFloat(String(a[multiplay![1]]));
              const productB = parseFloat(String(b[multiplay![0]])) * parseFloat(String(b[multiplay![1]]));
              if (productA < productB) return -1;
              if (productA > productB) return 1;
              return 0;
            });
            return sorted;
          }
        })
        : status === 1
          ? setData((prev) => {
            if (whereToFindData) {
              const copy = [...prev[whereToFindData]];
              const sorted = copy.sort((a, b) => {
                const productA = parseFloat(String(a[multiplay![0]])) * parseFloat(String(a[multiplay![1]]));
                const productB = parseFloat(String(b[multiplay![0]])) * parseFloat(String(b[multiplay![1]]));
                if (productA < productB) return 1;
                if (productA > productB) return -1;
                return 0;
              });
              return { ...prev, [whereToFindData]: sorted };
            } else {
              const copy = [...prev];
              const sorted = copy.sort((a, b) => {
                const productA = parseFloat(String(a[multiplay![0]])) * parseFloat(String(a[multiplay![1]]));
                const productB = parseFloat(String(b[multiplay![0]])) * parseFloat(String(b[multiplay![1]]));
                if (productA < productB) return 1;
                if (productA > productB) return -1;
                return 0;
              });
              return sorted;
            }
          })
          : setData((prev) => {
            if (whereToFindData) {
              return { ...prev, [whereToFindData]: copyData };
            } else {
              return copyData;
            }
          });
      break;
  }
};

export default Filters;
