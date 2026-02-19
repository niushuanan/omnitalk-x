/**
 * 统一 API 配置 - OpenRouter
 */

const API_PREFIX = '/api';

const defaultConfig = {
    prompt: '',
    messages: [],
    role_meta: {
        user_name: 'user',
        bot_name: 'assistant'
    },
    stream: true,
    type: 'json',
    temperature: 0.7,
    max_tokens: 4096,
};

const API = new Map();

API.set('openai', {
    url: `${API_PREFIX}/v1/openai/chat/completions`,
    model: 'openai/gpt-oss-120b',
    ...defaultConfig,
});

API.set('anthropic', {
    url: `${API_PREFIX}/v1/anthropic/chat/completions`,
    model: 'anthropic/claude-3-haiku',
    ...defaultConfig,
});

API.set('xai', {
    url: `${API_PREFIX}/v1/xai/chat/completions`,
    model: 'x-ai/grok-4.1-fast',
    ...defaultConfig,
});

API.set('google', {
    url: `${API_PREFIX}/v1/google/chat/completions`,
    model: 'google/gemini-2.5-flash-lite',
    ...defaultConfig,
});

API.set('zhipu', {
    url: `${API_PREFIX}/v1/zhipu/chat/completions`,
    model: 'z-ai/glm-4.7-flash',
    ...defaultConfig,
});

API.set('moonshot', {
    url: `${API_PREFIX}/v1/moonshot/chat/completions`,
    model: 'moonshotai/kimi-k2.5',
    ...defaultConfig,
});

API.set('minimax', {
    url: `${API_PREFIX}/v1/minimax/chat/completions`,
    model: 'minimax/minimax-m2.5',
    ...defaultConfig,
});

API.set('qwen', {
    url: `${API_PREFIX}/v1/qwen/chat/completions`,
    model: 'qwen/qwen3-235b-a22b-2507',
    ...defaultConfig,
});

API.set('deepseek', {
    url: `${API_PREFIX}/v1/deepseek/chat/completions`,
    model: 'deepseek/deepseek-chat-v3.1',
    ...defaultConfig,
});

API.set('bytedance', {
    url: `${API_PREFIX}/v1/bytedance/chat/completions`,
    model: 'bytedance-seed/seed-1.6-flash',
    ...defaultConfig,
});

export default API;
