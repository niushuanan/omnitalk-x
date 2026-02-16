/**
 * 统一 API 配置 - OpenRouter
 */

const API_PREFIX = '';

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
    model: 'openai/gpt-5.2',
    ...defaultConfig,
});

API.set('anthropic', {
    url: `${API_PREFIX}/v1/anthropic/chat/completions`,
    model: 'anthropic/claude-opus-4.5',
    ...defaultConfig,
});

API.set('xai', {
    url: `${API_PREFIX}/v1/xai/chat/completions`,
    model: 'x-ai/grok-4',
    ...defaultConfig,
});

API.set('google', {
    url: `${API_PREFIX}/v1/google/chat/completions`,
    model: 'google/gemini-3-pro-preview',
    ...defaultConfig,
});

API.set('zhipu', {
    url: `${API_PREFIX}/v1/zhipu/chat/completions`,
    model: 'z-ai/glm-5',
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
    model: 'qwen/qwen3-max-thinking',
    ...defaultConfig,
});

API.set('deepseek', {
    url: `${API_PREFIX}/v1/deepseek/chat/completions`,
    model: 'deepseek/deepseek-v3.2',
    ...defaultConfig,
});

export default API;
