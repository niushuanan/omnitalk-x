const CURRENT_KEY = 'omnitalkx_api_key';
const LEGACY_KEY = 'omnitalk9_api_key';

export const getApiKey = (): string => {
    return localStorage.getItem(CURRENT_KEY) || localStorage.getItem(LEGACY_KEY) || '';
};

export const setApiKey = (key: string) => {
    localStorage.setItem(CURRENT_KEY, key);
    // keep legacy key for backward compatibility
    localStorage.setItem(LEGACY_KEY, key);
};

export const removeApiKey = () => {
    localStorage.removeItem(CURRENT_KEY);
    localStorage.removeItem(LEGACY_KEY);
};
