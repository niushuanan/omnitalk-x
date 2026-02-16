export const USER_INFO = {
    provider: 'user',
    model: 'user',
    webui: {
        avatar: '/avatars/用户.jpg',
        background: '#71e875',
    }
};

export const ADMIN_INFO = {
    provider: 'admin',
    model: 'admin',
    webui: {
        avatar: 'https://oss.openmmlab.com/frontend/OpenAOE/A.svg',
        background: 'linear-gradient(rgb(255 255 255 / 80%) 0%, rgb(168 245 179) 100%)',
    }
};

export const models = {
    'chatgpt': {
        provider: 'openai',
        webui: {
            avatar: '/avatars/ChatGPT-Logo.png',
            background: 'linear-gradient(180deg, rgba(156, 206, 116, 0.15) 0%, #1a8d15 100%)',
        }
    },
    'claude': {
        provider: 'anthropic',
        webui: {
            avatar: '/avatars/claude_logo.jpeg',
            background: 'linear-gradient(180deg, rgba(141, 90, 181, 0.15) 0%, rgba(106, 39, 123, 0.7) 53.12%, #663E9A 100%)',
        }
    },
    'grok': {
        provider: 'xai',
        webui: {
            avatar: '/avatars/grok-icon.webp',
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)',
        }
    },
    'gemini': {
        provider: 'google',
        webui: {
            avatar: '/avatars/gemini_icon-logo_brandlogos.net_aacx5.png',
            background: 'linear-gradient(180deg, rgba(181, 90, 90, 0.15) 0%, #fa5ab1 100%)',
        }
    },
    'glm': {
        provider: 'zhipu',
        webui: {
            avatar: '/avatars/z.webp',
            background: 'linear-gradient(180deg, rgba(70, 130, 255, 0.15) 0%, rgba(70, 130, 255, 0.8) 100%)',
        }
    },
    'kimi': {
        provider: 'moonshot',
        webui: {
            avatar: '/avatars/kimi.jpeg',
            background: 'linear-gradient(180deg, rgba(66, 133, 244, 0.15) 0%, rgba(66, 133, 244, 0.8) 100%)',
        }
    },
    'minimax': {
        provider: 'minimax',
        webui: {
            avatar: '/avatars/MiniMax.png',
            background: 'linear-gradient(180deg, rgba(207, 72, 72, 0.15) 0%, rgba(151, 43, 43, 0.7) 53.12%, #742828 100%)',
        }
    },
    'qwen': {
        provider: 'qwen',
        webui: {
            avatar: '/avatars/Qwen_logo.svg.png',
            background: 'linear-gradient(180deg, rgba(255, 102, 0, 0.15) 0%, rgba(255, 102, 0, 0.8) 100%)',
        }
    },
    'deepseek': {
        provider: 'deepseek',
        webui: {
            avatar: '/avatars/DeepSeek.png',
            background: 'linear-gradient(180deg, rgba(65, 105, 225, 0.15) 0%, rgba(65, 105, 225, 0.8) 100%)',
        }
    },
    'seed': {
        provider: 'bytedance',
        webui: {
            avatar: '/avatars/seed.png',
            background: 'linear-gradient(180deg, rgba(255, 0, 100, 0.15) 0%, rgba(255, 0, 100, 0.8) 100%)',
        }
    },
};

export const defaultModels = [
    'chatgpt',
    'claude',
    'grok',
    'gemini',
    'glm',
    'kimi',
    'minimax',
    'qwen',
    'deepseek',
    'seed',
];
