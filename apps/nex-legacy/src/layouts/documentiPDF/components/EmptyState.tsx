import React from 'react';
import noDataWEBP from 'assets/images/9170826-no-data-pdf-documenti.webp'

const EmptyState: React.FC<{ text?: string }> = ({ text = "Nessun documento trovato. Prova a cambiare i filtri." }) => (
  <div className="h-[60vh] w-full grid place-items-center">
    <div className="max-w-md text-center opacity-80">
      <img src={noDataWEBP} className="avoid-drag mx-auto mb-6 w-52 opacity-80 grayscale" alt="" />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{text}</p>
    </div>
  </div>
);
export default EmptyState;