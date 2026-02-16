import { message } from 'sea-lion-ui';
import React, {
    useEffect, useState, useRef
} from 'react';
import classNames from 'classnames';
import send from '@assets/imgs/send.png';
import { useChatStore } from '@/store/chat.ts';
import { useBotStore } from '@/store/bot.ts';
import { defaultModels } from '@config/model-config.ts';
import styles from './prompt-input.module.less';

const AI_LIST = defaultModels;

// 后端 provider 到前端 model key 的映射
const PROVIDER_TO_MODEL: Record<string, string> = {
    'openai': 'chatgpt',
    'anthropic': 'claude',
    'xai': 'grok',
    'google': 'gemini',
    'zhipu': 'glm',
    'moonshot': 'kimi',
    'minimax': 'minimax',
    'qwen': 'qwen',
    'deepseek': 'deepseek',
    'bytedance': 'seed',
};

const PromptInput = () => {
    const chatStore = useChatStore();
    const botStore = useBotStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);

    const privateChat = botStore.privateChat;

    const [inputValue, setInputValue] = useState('');
    const [showMention, setShowMention] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [chosenMention, setChosenMention] = useState(0);
    const [mentionList, setMentionList] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const allItems = ['@所有人', ...AI_LIST];
        if (mentionFilter === '') {
            setMentionList(allItems);
        } else {
            const filtered = allItems.filter(item =>
                item.toLowerCase().includes(mentionFilter.toLowerCase())
            );
            setMentionList(filtered);
        }
        setChosenMention(0);
    }, [mentionFilter]);

    // 滚动选中项到可视区域
    useEffect(() => {
        if (showMention && mentionRef.current) {
            const selectedElement = mentionRef.current.children[chosenMention] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [chosenMention, showMention]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        
        const lastAtIndex = value.lastIndexOf('@');
        if (lastAtIndex !== -1) {
            const textAfterAt = value.slice(lastAtIndex + 1);
            if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                setMentionFilter(textAfterAt);
                setShowMention(true);
                return;
            }
        }
        setShowMention(false);
        setMentionFilter('');
    };

    const insertMention = (mention: string) => {
        const lastAtIndex = inputValue.lastIndexOf('@');
        let newValue: string;
        
        if (mention === '@所有人') {
            newValue = inputValue.slice(0, lastAtIndex) + '@所有人 ';
        } else {
            newValue = inputValue.slice(0, lastAtIndex) + '@' + mention + ' ';
        }
        
        setInputValue(newValue);
        setShowMention(false);
        inputRef.current?.focus();
    };

    // 上下文存储 key
    const CONTEXT_STORAGE_KEY = 'ai_context_history';

    // 保存上下文到 localStorage
    const saveContextToStorage = (provider: string, messages: {role: string, content: string}[]) => {
        const storage = localStorage.getItem(CONTEXT_STORAGE_KEY);
        const allContexts: Record<string, {role: string, content: string}[]> = storage ? JSON.parse(storage) : {};
        allContexts[provider] = messages;
        localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(allContexts));
    };

    // 从 localStorage 读取上下文
    const loadContextFromStorage = (provider: string): {role: string, content: string}[] => {
        const storage = localStorage.getItem(CONTEXT_STORAGE_KEY);
        if (!storage) return [];
        const allContexts: Record<string, {role: string, content: string}[]> = JSON.parse(storage);
        return allContexts[provider] || [];
    };

    // 清除指定 AI 的上下文
    const clearContextFromStorage = (provider: string) => {
        const storage = localStorage.getItem(CONTEXT_STORAGE_KEY);
        if (!storage) return;
        const allContexts: Record<string, {role: string, content: string}[]> = JSON.parse(storage);
        delete allContexts[provider];
        localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(allContexts));
    };

    // 获取指定AI的完整上下文（群聊+私聊+本地存储）
    const getAIContext = (provider: string): {role: string, content: string}[] => {
        const context: {role: string, content: string}[] = [];
        const modelKey = PROVIDER_TO_MODEL[provider] || provider;
        
        // 1. 获取本地存储的历史上下文
        const storedContext = loadContextFromStorage(provider);
        context.push(...storedContext);
        
        // 2. 获取群聊消息
        const groupSession = chatStore.sessions.find(s => s.name === 'group');
        if (groupSession && groupSession.messages) {
            for (const msg of groupSession.messages) {
                if (msg.sender_type === 'user') {
                    context.push({ role: 'user', content: msg.text });
                } else if (msg.sender_type === 'assistant') {
                    // 群聊中其他AI的回复也要包含
                    const speaker = msg.provider === provider ? 'assistant' : 'user';
                    context.push({ role: speaker, content: msg.text });
                }
            }
        }
        
        // 3. 获取私聊消息（如果有）
        if (privateChat) {
            const privateSession = chatStore.sessions.find(s => s.name === privateChat.toLowerCase());
            if (privateSession && privateSession.messages) {
                for (const msg of privateSession.messages) {
                    if (msg.sender_type === 'user') {
                        context.push({ role: 'user', content: msg.text });
                    } else if (msg.sender_type === 'assistant') {
                        context.push({ role: 'assistant', content: msg.text });
                    }
                }
            }
        }
        
        return context;
    };

    // 非流式调用单个AI，带上下文记忆
    const fetchAI = async (provider: string, userText: string, apiKey: string) => {
        const modelKey = PROVIDER_TO_MODEL[provider] || provider;
        const sessionName = privateChat ? modelKey : 'group';

        // 获取完整上下文（群聊+私聊）
        const context = getAIContext(provider);

        try {
            const res = await fetch(`/api/v1/${provider}/chat/completions/non-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey
                },
                body: JSON.stringify({
                    model: provider,
                    messages: [
                        { role: 'system', content: getSystemPrompt(provider) },
                        ...context
                    ],
                    max_tokens: 3000
                })
            });

            let replyText = '';

            if (!res.ok) {
                replyText = `[错误: HTTP ${res.status}]`;
            } else {
                const data = await res.json();
                
                if (data.success && data.msg) {
                    replyText = data.msg;
                } else if (data.choices && data.choices[0] && data.choices[0].message) {
                    replyText = data.choices[0].message.content || '无回复';
                } else if (data.msg) {
                    replyText = data.msg;
                } else {
                    replyText = '[无回复]';
                }
            }

            // 保存上下文到本地存储
            const updatedContext = [
                ...context,
                { role: 'user', content: userText },
                { role: 'assistant', content: replyText }
            ];
            saveContextToStorage(provider, updatedContext);

            // 完整回复生成后再添加到界面
            chatStore.addMessage(sessionName, {
                id: Date.now() + Math.random(),
                text: replyText,
                sender_type: 'assistant',
                model: modelKey,
                provider: provider,
                date: new Date().toLocaleString(),
                stream: false
            });
        } catch (e: any) {
            chatStore.addMessage(sessionName, {
                id: Date.now() + Math.random(),
                text: `[错误: ${e.message}]`,
                sender_type: 'assistant',
                model: modelKey,
                provider: provider,
                date: new Date().toLocaleString(),
                stream: false
            });
        }
    };

    // 获取系统提示词
    const getSystemPrompt = (provider: string): string => {
        const modelKey = PROVIDER_TO_MODEL[provider];
        const customPrompt = modelKey ? localStorage.getItem('system_prompt_' + modelKey) : null;
        if (customPrompt && customPrompt.trim()) {
            return customPrompt;
        }
        
        const prompts: Record<string, string> = {
            'openai': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=ChatGPT，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'anthropic': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Claude，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'xai': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Grok，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'google': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Gemini，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'zhipu': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=GLM，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'moonshot': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Kimi，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'minimax': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=MiniMax，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'qwen': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Qwen，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'deepseek': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=DeepSeek，小庄微信群里的朋友。简洁回复，像微信聊天。',
            'bytedance': '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！你=Seed，小庄微信群里的朋友。简洁回复，像微信聊天。',
        };
        return prompts[provider] || '【强制规则】你只能回复一句话，不超过35字！不要重复用户的话！不要替其他AI说话！';
    };

    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text || isLoading) return;

        setIsLoading(true);
        
        // 确定要调用的AI列表
        let targetProviders: string[] = [];
        
        // 私聊模式：只调用对应的AI
        if (privateChat) {
            const providerMap: Record<string, string> = {
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
            const provider = providerMap[privateChat.toLowerCase()];
            if (provider) {
                targetProviders = [provider];
            }
        } else if (text.includes('@所有人')) {
            // @所有人，调用全部10个AI
            targetProviders = ['openai', 'anthropic', 'xai', 'google', 'zhipu', 'moonshot', 'minimax', 'qwen', 'deepseek', 'bytedance'];
        } else {
            // 检查@了哪些AI
            const providerMap: Record<string, string> = {
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
            
            for (const ai of AI_LIST) {
                if (text.includes('@' + ai)) {
                    const provider = providerMap[ai];
                    if (provider && !targetProviders.includes(provider)) {
                        targetProviders.push(provider);
                    }
                }
            }
            
            // 如果没有@任何AI，随机3个
            if (targetProviders.length === 0) {
                const allProviders = ['openai', 'anthropic', 'xai', 'google', 'zhipu', 'moonshot', 'minimax', 'qwen', 'deepseek', 'bytedance'];
                // Fisher-Yates 洗牌算法
                const shuffled = [...allProviders];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                targetProviders = shuffled.slice(0, 3);
            }
        }

        const apiKey = localStorage.getItem('omnitalk9_api_key');

        if (!apiKey) {
            message.error('请先设置 API Key');
            setIsLoading(false);
            return;
        }

        // 添加用户消息
        const userMessage = {
            id: Date.now(),
            text: text,
            sender_type: 'user',
            provider: 'user',
            date: new Date().toLocaleString(),
            stream: false
        };
        const targetSession = privateChat || 'group';
        chatStore.addMessage(targetSession, userMessage);

        // 清空输入框
        setInputValue('');

        // 同时发起所有AI的请求，谁先回复谁先显示
        const promises = targetProviders.map(provider => 
            fetchAI(provider, text, apiKey)
        );

        try {
            await Promise.all(promises);
        } catch (e: any) {
            message.error('发送失败: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (showMention && mentionList.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setChosenMention(prev => (prev + 1) % mentionList.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setChosenMention(prev => (prev - 1 + mentionList.length) % mentionList.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (mentionList[chosenMention]) {
                    insertMention(mentionList[chosenMention]);
                }
                return;
            }
            if (e.key === 'Escape') {
                setShowMention(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            if (e.metaKey || e.ctrlKey) {
                return;
            }
            e.preventDefault();
            if (inputValue.trim()) {
                handleSendMessage();
            }
        }
    };

    return (
        <div className={styles.inputContainer}>
            <div className={styles.homeInputWrapper}>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.promptInput}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    placeholder="输入消息，@可提及AI，回车发送，Cmd+回车换行"
                    disabled={isLoading}
                />
                <img
                    className={classNames(styles.promptClip, { [styles.sending]: isLoading })}
                    src={send}
                    alt="send-message"
                    onClick={handleSendMessage}
                />
            </div>
            
            {showMention && mentionList.length > 0 && (
                <div ref={mentionRef} className={styles.mentionPopup}>
                    {mentionList.map((item, index) => (
                        <div
                            key={item}
                            className={classNames(styles.mentionItem, { [styles.chosenMention]: index === chosenMention })}
                            onClick={() => insertMention(item)}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromptInput;
