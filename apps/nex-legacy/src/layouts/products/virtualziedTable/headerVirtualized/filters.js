// src/layouts/products/virtualziedTable/headerVirtualized/filters.js
const collator = new Intl.Collator('it', { sensitivity: 'base', numeric: true });

const readField = (row, field) => {
  // field può essere 'CodiciGTIN' o ['Descrizione','Corta']
  if (Array.isArray(field)) {
    const [k, sk] = field;
    const base = row?.[k];
    return sk != null ? base?.[sk] : base;
  }
  return row?.[field];
};

const toText = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) {
    // 1) usa solo il primo GTIN
    return v.length ? String(v[0]) : '';
    // 2) in alternativa, concatena tutti:
    // return v.map(x => (x == null ? '' : String(x))).join(' | ');
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return String(v?.toString?.() ?? JSON.stringify(v));
  return String(v);
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const pickArrayFromPrev = (prev, where) => {
  if (where) return [...(prev?.[where] ?? [])];
  return Array.isArray(prev) ? [...prev] : [...(prev?.dati ?? [])];
};

const putArrayBack = (prev, where, arr) => {
  if (where) return { ...prev, [where]: arr };
  return Array.isArray(prev) ? arr : { ...prev, dati: arr };
};

export const Filters = (type, field, status, multiplay, setData, copyData, whereToFindData) => {
  // tua semantica: 0 = asc, 1 = desc, altri = reset
  const dir = status === 1 ? 'desc' : 'asc';

  // reset allo stato base
  if (status !== 0 && status !== 1) {
    setData(prev => {
      if (whereToFindData) {
        const base = Array.isArray(copyData) ? copyData : (copyData?.[whereToFindData] ?? []);
        return { ...prev, [whereToFindData]: [...base] };
      }
      if (Array.isArray(prev)) {
        const base = Array.isArray(copyData) ? copyData : (copyData?.dati ?? []);
        return [...base];
      }
      const base = Array.isArray(copyData) ? copyData : (copyData?.dati ?? []);
      return { ...prev, dati: [...base] };
    });
    return;
  }

  if (type === 'String') {
    setData(prev => {
      const copy = pickArrayFromPrev(prev, whereToFindData);
      const sorted = copy.sort((a, b) => {
        const va = toText(readField(a, field));
        const vb = toText(readField(b, field));
        const aEmpty = va === '';
        const bEmpty = vb === '';
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return dir === 'desc' ? -1 : 1;
        if (bEmpty) return dir === 'desc' ? 1 : -1;
        return dir === 'desc' ? collator.compare(vb, va) : collator.compare(va, vb);
      });
      return putArrayBack(prev, whereToFindData, sorted);
    });
    return;
  }

  if (type === 'Number') {
    setData(prev => {
      const copy = pickArrayFromPrev(prev, whereToFindData);
      const sorted = copy.sort((a, b) => {
        const av = toNum(readField(a, field));
        const bv = toNum(readField(b, field));
        if (av == null && bv == null) return 0;
        if (av == null) return dir === 'desc' ? -1 : 1;
        if (bv == null) return dir === 'desc' ? 1 : -1;
        return dir === 'desc' ? (bv - av) : (av - bv);
      });
      return putArrayBack(prev, whereToFindData, sorted);
    });
    return;
  }

  if (type === 'Multiplay') {
    setData(prev => {
      const copy = pickArrayFromPrev(prev, whereToFindData);
      const sorted = copy.sort((a, b) => {
        const a0 = toNum(readField(a, multiplay?.[0]));
        const a1 = toNum(readField(a, multiplay?.[1]));
        const b0 = toNum(readField(b, multiplay?.[0]));
        const b1 = toNum(readField(b, multiplay?.[1]));
        const prodA = (a0 ?? 0) * (a1 ?? 0);
        const prodB = (b0 ?? 0) * (b1 ?? 0);
        return dir === 'desc' ? (prodB - prodA) : (prodA - prodB);
      });
      return putArrayBack(prev, whereToFindData, sorted);
    });
  }
};

export default Filters;
