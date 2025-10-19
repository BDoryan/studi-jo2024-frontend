const JSPDF_CDN_URL = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';

type JsPdfGlobal = {
    jsPDF?: JsPdfConstructor;
};

let cachedJsPdfPromise: Promise<JsPdfConstructor> | null = null;

const resolveGlobalCtor = (): JsPdfConstructor | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const globalJsPdf = (window as unknown as JsPdfGlobal)?.jsPDF;
    if (typeof globalJsPdf === 'function') {
        return globalJsPdf;
    }

    const legacyGlobal = (window as Record<string, unknown>).jspdf as JsPdfGlobal | undefined;
    const legacyCtor = legacyGlobal?.jsPDF;

    return typeof legacyCtor === 'function' ? legacyCtor : null;
};

const injectScript = (): Promise<JsPdfConstructor> =>
    new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
            reject(new Error('jsPDF ne peut être chargé côté serveur.'));
            return;
        }

        if (resolveGlobalCtor()) {
            resolve(resolveGlobalCtor() as JsPdfConstructor);
            return;
        }

        const script = document.createElement('script');
        script.src = JSPDF_CDN_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';

        script.onload = () => {
            const ctor = resolveGlobalCtor();

            if (!ctor) {
                reject(new Error('Module jsPDF introuvable via le CDN.'));
                return;
            }

            resolve(ctor);
        };

        script.onerror = () => {
            reject(new Error('Impossible de charger jsPDF depuis le CDN.'));
        };

        document.head.appendChild(script);
    });

export const loadJsPdf = (): Promise<JsPdfConstructor> => {
    if (cachedJsPdfPromise) {
        return cachedJsPdfPromise;
    }

    if (typeof window === 'undefined') {
        return Promise.reject(new Error('jsPDF ne peut être chargé côté serveur.'));
    }

    const ctor = resolveGlobalCtor();

    if (ctor) {
        cachedJsPdfPromise = Promise.resolve(ctor);
        return cachedJsPdfPromise;
    }

    cachedJsPdfPromise = injectScript().catch((error) => {
        cachedJsPdfPromise = null;
        throw error;
    });

    return cachedJsPdfPromise;
};

export type JsPdfConstructor = new (...args: unknown[]) => {
    setFillColor: (...args: number[]) => void;
    roundedRect: (...args: any[]) => void;
    setTextColor: (...args: number[]) => void;
    setFontSize: (size: number) => void;
    setFont: (family: string, style?: string) => void;
    text: (text: string, x: number, y: number, options?: Record<string, unknown>) => void;
    addImage: (...args: any[]) => void;
    setDrawColor: (...args: number[]) => void;
    setLineWidth: (width: number) => void;
    setLineDashPattern: (segments: number[], phase: number) => void;
    line: (x1: number, y1: number, x2: number, y2: number) => void;
    save: (filename: string) => void;
    internal: {
        pageSize: {
            getWidth: () => number;
        };
    };
};
