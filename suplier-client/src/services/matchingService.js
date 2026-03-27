// src/services/matchingService.js

export const calculateScore = (name1, name2) => {
  const prepare = (s) => (s || "").toLowerCase().replace(/[^a-z0-9а-яіїє]/g, ' ').split(/\s+/).filter(Boolean);
  const t1 = prepare(name1);
  const t2 = prepare(name2);
  if (!t1.length || !t2.length) return 0;
  const common = t1.filter(t => t2.includes(t));
  return Math.round((common.length / Math.max(t1.length, t2.length)) * 100);
};

export const getSupplierSuggestions = (selectedProduct, allSuppliers) => {
  if (!selectedProduct) return [];
  return allSuppliers
    .map(sp => ({
      ...sp,
      confidence: calculateScore(selectedProduct.name, sp.originalName)
    }))
    .filter(item => item.confidence > 5) // мінімальний поріг
    .sort((a, b) => b.confidence - a.confidence);
};