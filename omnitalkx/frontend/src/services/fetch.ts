import API from '@config/api-config';
import { DEFAULT_PROVIDER } from '@constants/models';

// 全局默认 prompts
let defaultPromptsCache: Record<string, string> = {};

// 加载默认 prompts
export const loadDefaultPrompts = async () => {
    try {
        const res = await fetch('/api/default-prompts');
        const data = await res.json();
        if (data.prompts) {
            defaultPromptsCache = data.prompts;
        }
    } catch (e) {
        console.error('加载默认 prompt 失败:', e);
    }
};

// 立即加载
loadDefaultPrompts();

export const getHeaders = (apiKey?: string) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (apiKey) {
        headers['X-Api-Key'] = apiKey;
    }
    return headers;
};

export const getUrl = (provider: string) => {
    return API.get(provider)?.url || API.get(DEFAULT_PROVIDER).url;
};

const getSystemPromptByModel = (model: string): string => {
    const customPrompt = localStorage.getItem('system_prompt_' + model);
    if (customPrompt && customPrompt.trim()) {
        return customPrompt;
    }
    
    // 使用后端默认 prompt
    if (defaultPromptsCache[model]) {
        return defaultPromptsCache[model];
    }
    
    return '';
};

export const getPayload = (provider: string, model: string, prompt: string, messages: { text: string; sender_type: string; }[]) => {
    const apiConfig = API.get(provider) || API.get(DEFAULT_PROVIDER);
    const systemPrompt = getSystemPromptByModel(model);
    const messagesWithSystem = systemPrompt 
        ? [{ role: 'system', content: systemPrompt }] 
        : [];
    
    const payload = {
        model: model || apiConfig.model,
        messages: [
            ...messagesWithSystem,
            ...messages.map((item) => ({
                role: item.sender_type === 'user' ? 'user' : 'assistant',
                content: item.text,
            })),
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: apiConfig.temperature || 0.7,
        max_tokens: apiConfig.max_tokens || 4096,
        stream: true,
    };
    return payload;
};
