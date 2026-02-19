export type ChatStyleConfig = {
    temperature: number;
    max_tokens: number;
    top_p: number;
};

type ChatStyleStore = {
    global: ChatStyleConfig;
    groups: Record<string, ChatStyleConfig>;
};

const STORAGE_KEY_V2 = 'chat_style_config_v2';
const LEGACY_KEY = 'chat_style_config';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const normalizeConfig = (raw: any): ChatStyleConfig => ({
    temperature: clamp(Number(raw?.temperature ?? 0.7), 0, 2),
    max_tokens: clamp(Number(raw?.max_tokens ?? 1000), 64, 4096),
    top_p: clamp(Number(raw?.top_p ?? 0.9), 0, 1),
});

const readStore = (): ChatStyleStore => {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return {
                    global: normalizeConfig(parsed.global),
                    groups: parsed.groups || {},
                };
            }
        } catch {
            // ignore
        }
    }

    // legacy migration (single global)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
        try {
            const parsed = JSON.parse(legacy);
            const store: ChatStyleStore = {
                global: normalizeConfig(parsed),
                groups: {},
            };
            localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(store));
            return store;
        } catch {
            // ignore
        }
    }

    return {
        global: { temperature: 0.7, max_tokens: 1000, top_p: 0.9 },
        groups: {},
    };
};

const writeStore = (store: ChatStyleStore) => {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(store));
};

export const getChatStyleConfig = (groupId?: string): ChatStyleConfig => {
    const store = readStore();
    if (groupId && store.groups[groupId]) {
        return normalizeConfig(store.groups[groupId]);
    }
    return normalizeConfig(store.global);
};

export const setChatStyleConfig = (cfg: Partial<ChatStyleConfig>, groupId?: string) => {
    const store = readStore();
    if (groupId) {
        const current = normalizeConfig(store.groups[groupId] || store.global);
        store.groups[groupId] = {
            temperature: cfg.temperature ?? current.temperature,
            max_tokens: cfg.max_tokens ?? current.max_tokens,
            top_p: cfg.top_p ?? current.top_p,
        };
    } else {
        const current = normalizeConfig(store.global);
        store.global = {
            temperature: cfg.temperature ?? current.temperature,
            max_tokens: cfg.max_tokens ?? current.max_tokens,
            top_p: cfg.top_p ?? current.top_p,
        };
    }
    writeStore(store);
};
