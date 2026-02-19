export type ChatStyleConfig = {
    temperature: number;
    max_tokens: number;
    top_p: number;
};

const STORAGE_KEY = 'chat_style_config';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const getChatStyleConfig = (): ChatStyleConfig => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return {
                    temperature: clamp(Number(parsed.temperature ?? 0.7), 0, 2),
                    max_tokens: clamp(Number(parsed.max_tokens ?? 1000), 64, 4096),
                    top_p: clamp(Number(parsed.top_p ?? 0.9), 0, 1),
                };
            }
        } catch {
            // ignore
        }
    }
    return { temperature: 0.7, max_tokens: 1000, top_p: 0.9 };
};

export const setChatStyleConfig = (cfg: Partial<ChatStyleConfig>) => {
    const current = getChatStyleConfig();
    const next = {
        temperature: cfg.temperature ?? current.temperature,
        max_tokens: cfg.max_tokens ?? current.max_tokens,
        top_p: cfg.top_p ?? current.top_p,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};
