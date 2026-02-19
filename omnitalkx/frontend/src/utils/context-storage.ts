const STORAGE_KEY = 'ai_context_history_v2';
const LEGACY_KEY = 'ai_context_history';

export type ContextMessage = { role: string; content: string; ts?: number };

type ContextStore = {
    groups: Record<string, Record<string, ContextMessage[]>>;
    private: Record<string, ContextMessage[]>;
};

const emptyStore = (): ContextStore => ({ groups: {}, private: {} });

const readStore = (): ContextStore => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return {
                    groups: parsed.groups || {},
                    private: parsed.private || {},
                };
            }
        } catch {
            // fall through to legacy
        }
    }

    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
        try {
            const legacy = JSON.parse(legacyRaw);
            if (legacy && typeof legacy === 'object') {
                const migrated: ContextStore = emptyStore();
                migrated.groups['grp_all'] = legacy;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
                return migrated;
            }
        } catch {
            // ignore
        }
    }

    return emptyStore();
};

const writeStore = (store: ContextStore) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const loadAllContext = (provider: string): ContextMessage[] => {
    const store = readStore();
    const messages: ContextMessage[] = [];
    Object.values(store.groups).forEach((groupMap) => {
        const groupMsgs = groupMap?.[provider];
        if (Array.isArray(groupMsgs)) {
            messages.push(...groupMsgs);
        }
    });
    const privateMsgs = store.private?.[provider];
    if (Array.isArray(privateMsgs)) {
        messages.push(...privateMsgs);
    }
    // sort by timestamp if present
    return messages.sort((a, b) => (a.ts || 0) - (b.ts || 0));
};

export const saveGroupContext = (groupId: string, provider: string, messages: ContextMessage[]) => {
    const store = readStore();
    if (!store.groups[groupId]) {
        store.groups[groupId] = {};
    }
    store.groups[groupId][provider] = messages;
    writeStore(store);
};

export const ensureGroupAnnouncement = (groupId: string, provider: string, announcement: string) => {
    if (!announcement) return;
    const store = readStore();
    if (!store.groups[groupId]) {
        store.groups[groupId] = {};
    }
    const existing = store.groups[groupId][provider] || [];
    const tag = `【群公告】${announcement}`;
    if (!existing.some(m => m.role === 'system' && m.content === tag)) {
        store.groups[groupId][provider] = [{ role: 'system', content: tag, ts: Date.now() }, ...existing];
        writeStore(store);
    }
};

export const savePrivateContext = (provider: string, messages: ContextMessage[]) => {
    const store = readStore();
    store.private[provider] = messages;
    writeStore(store);
};

export const clearGroupContext = (groupId: string) => {
    const store = readStore();
    delete store.groups[groupId];
    writeStore(store);
};

export const clearPrivateContext = (provider: string) => {
    const store = readStore();
    delete store.private[provider];
    writeStore(store);
};

export const clearAllContext = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
};

export const modelKeyToProvider = (modelKey: string): string | null => {
    const map: Record<string, string> = {
        'chatgpt': 'openai',
        'claude': 'anthropic',
        'grok': 'xai',
        'gemini': 'google',
        'glm': 'zhipu',
        'kimi': 'moonshot',
        'minimax': 'minimax',
        'qwen': 'qwen',
        'deepseek': 'deepseek',
        'seed': 'bytedance',
    };
    return map[modelKey] || null;
};
