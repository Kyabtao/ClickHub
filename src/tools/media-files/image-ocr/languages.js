// Shared by the OCR tool and scripts/build/copy-ocr-assets.mjs. To add a language, install
// @tesseract.js-data/<code> and add it here; the build copies its 4.0.0_best_int model.
export const OCR_LANGUAGES = [
 { code: 'eng', name: 'English' },
 { code: 'hin', name: 'Hindi (हिन्दी)' },
 { code: 'spa', name: 'Spanish (Español)' },
 { code: 'fra', name: 'French (Français)' },
 { code: 'deu', name: 'German (Deutsch)' },
];
// LSTM-only engine builds; tesseract.js picks relaxed-SIMD, SIMD, or plain based on browser support.
export const OCR_CORE_FILES = ['tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'];
