import API from '@config/api-config';
import { DEFAULT_PROVIDER } from '@constants/models';

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
    
    const prompts: Record<string, string> = {
        'chatgpt': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=ChatGPT，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'claude': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Claude，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'grok': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Grok，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'gemini': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Gemini，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'glm': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=GLM，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'kimi': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Kimi，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'minimax': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=MiniMax，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'qwen': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Qwen，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'deepseek': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=DeepSeek，小庄微信群里的朋友。简洁回复，像微信聊天。',
        'seed': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Seed，小庄微信群里的朋友。简洁回复，像微信聊天。',
    };
    return prompts[model] || '';
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
