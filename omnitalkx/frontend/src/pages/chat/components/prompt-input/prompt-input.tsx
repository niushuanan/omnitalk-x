import { message } from 'sea-lion-ui';
import React, {
    useEffect, useState, useRef
} from 'react';
import classNames from 'classnames';
import send from '@assets/imgs/send.png';
import { useChatStore } from '@/store/chat.ts';
import { useBotStore } from '@/store/bot.ts';
import { useGroupStore } from '@/store/group.ts';
import { defaultModels } from '@config/model-config.ts';
import styles from './prompt-input.module.less';
import { getApiKey } from '@/utils/api-key.ts';
import {
    loadGroupContext,
    loadPrivateContext,
    saveGroupContext,
    savePrivateContext,
    ensureGroupAnnouncement,
    ContextMessage,
} from '@/utils/context-storage.ts';
import { getChatStyleConfig } from '@/utils/chat-style.ts';

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

// 全局默认 prompts
let defaultPromptsCache: Record<string, string> = {};

// 加载默认 prompts
const loadDefaultPrompts = async () => {
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

const PromptInput = () => {
    const chatStore = useChatStore();
    const botStore = useBotStore();
    const groupStore = useGroupStore();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const mentionRef = useRef<HTMLDivElement>(null);

    const privateChat = botStore.privateChat;
    const currentGroup = groupStore.getCurrentGroup();

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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    const getAIContext = (provider: string, groupId?: string, isPrivate?: boolean): ContextMessage[] => {
        if (isPrivate) {
            return loadPrivateContext(provider);
        }
        return loadGroupContext(groupId || 'grp_all', provider);
    };

    // 非流式调用单个AI，带上下文记忆
    const fetchAI = async (
        provider: string,
        userText: string,
        apiKey: string,
        mentionNote?: string,
        announcementNote?: string,
        currentGroupId?: string,
        isPrivate?: boolean,
    ) => {
        const modelKey = PROVIDER_TO_MODEL[provider] || provider;
        // 私聊用AI名称，群聊用群组ID
        const sessionName = privateChat 
            ? modelKey 
            : (currentGroup ? `group_${currentGroup.id}` : 'group');

        // 获取完整上下文（群聊+私聊）
        const context = getAIContext(provider, currentGroupId, isPrivate);

        const styleCfg = getChatStyleConfig(currentGroupId);
        const payload = {
            model: provider,
            temperature: styleCfg.temperature,
            max_tokens: styleCfg.max_tokens,
            top_p: styleCfg.top_p,
            messages: [
                { role: 'system', content: getSystemPrompt(provider) },
                ...(mentionNote ? [{ role: 'system', content: mentionNote }] : []),
                ...(announcementNote ? [{ role: 'system', content: announcementNote }] : []),
                ...context,
                { role: 'user', content: userText }
            ]
        };

        const headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': apiKey
        };

        const tryFetch = async (url: string) => {
            return await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
        };

        try {
            let res: Response;
            try {
                res = await tryFetch(`/api/v1/${provider}/chat/completions/non-stream`);
            } catch (e: any) {
                // fallback to backend direct in dev if proxy fails
                const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
                if (isLocal) {
                    const fallbackUrl = `http://localhost:8000/api/v1/${provider}/chat/completions/non-stream`;
                    res = await tryFetch(fallbackUrl);
                } else {
                    throw e;
                }
            }

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
            const now = Date.now();
            const updatedContext: ContextMessage[] = [
                ...context,
                { role: 'user', content: userText, ts: now },
                { role: 'assistant', content: replyText, ts: now + 1 }
            ];
            if (isPrivate) {
                savePrivateContext(provider, updatedContext);
            } else if (currentGroupId) {
                saveGroupContext(currentGroupId, provider, updatedContext);
            }

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
        
        // 使用后端默认 prompt
        if (modelKey && defaultPromptsCache[modelKey]) {
            return defaultPromptsCache[modelKey];
        }
        
        return '你是一个专业的AI助手。';
    };

    const handleSendMessage = async () => {
        const text = inputValue.trim();
        if (!text || isLoading) return;

        setIsLoading(true);
        
        // 确定要调用的AI列表
        let targetProviders: string[] = [];
        let mentionAll = false;
        let mentionedModels: string[] = [];
        
        // model key 到 provider 的映射
        const modelToProvider: Record<string, string> = {
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
        
        // 私聊模式：只调用对应的AI
        if (privateChat) {
            const provider = modelToProvider[privateChat.toLowerCase()];
            if (provider) {
                targetProviders = [provider];
            }
        } else if (text.includes('@所有人')) {
            // @所有人：全员群 -> 全部AI；小群 -> 仅该群成员
            mentionAll = true;
            if (currentGroup && currentGroup.id !== 'grp_all') {
                targetProviders = currentGroup.bots.map(bot => modelToProvider[bot]).filter(Boolean);
            } else {
                targetProviders = ['openai', 'anthropic', 'xai', 'google', 'zhipu', 'moonshot', 'minimax', 'qwen', 'deepseek', 'bytedance'];
            }
        } else {
            // 检查@了哪些AI
            const mentionedProviders: string[] = [];
            for (const ai of AI_LIST) {
                if (text.toLowerCase().includes('@' + ai.toLowerCase())) {
                    const provider = modelToProvider[ai];
                    if (provider && !mentionedProviders.includes(provider)) {
                        mentionedProviders.push(provider);
                        mentionedModels.push(ai);
                    }
                }
            }
            
            if (mentionedProviders.length > 0) {
                // @了具体AI，调用被@的AI
                targetProviders = mentionedProviders;
            } else if (!currentGroup || currentGroup.id === 'grp_all') {
                // 全员群且没有@，随机5个AI
                const allProviders = ['openai', 'anthropic', 'xai', 'google', 'zhipu', 'moonshot', 'minimax', 'qwen', 'deepseek', 'bytedance'];
                const shuffled = [...allProviders];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                targetProviders = shuffled.slice(0, 5);
            } else {
                // 自定义群组，调用群组成员
                targetProviders = currentGroup.bots.map(bot => modelToProvider[bot]).filter(Boolean);
            }
        }

        const apiKey = getApiKey();

        if (!apiKey) {
            message.error('请先设置 API Key');
            setIsLoading(false);
            return;
        }

        // 添加用户消息（展示原始文本）
        const userMessage = {
            id: Date.now(),
            text: text,
            sender_type: 'user',
            provider: 'user',
            date: new Date().toLocaleString(),
            stream: false
        };
        // 私聊用AI名称，群聊用群组ID
        const targetSession = privateChat 
            ? privateChat.toLowerCase() 
            : (currentGroup ? `group_${currentGroup.id}` : 'group');
        chatStore.addMessage(targetSession, userMessage);

        // 清空输入框
        setInputValue('');

        // 清理 @ 提及（只用于发送给模型）
        const stripMentions = (input: string) => {
            let cleaned = input.replace(/@所有人/g, ' ');
            for (const ai of AI_LIST) {
                const re = new RegExp(`@${ai}`, 'gi');
                cleaned = cleaned.replace(re, ' ');
            }
            return cleaned.replace(/\s+/g, ' ').trim();
        };
        const userTextForAI = stripMentions(text) || text;

        const announcementNote = '';

        const mentionNotesByProvider: Record<string, string> = {};
        if (mentionAll) {
            targetProviders.forEach((provider) => {
                mentionNotesByProvider[provider] = '注意：用户在群聊中@了你，请优先回应。';
            });
        } else if (mentionedModels.length > 0) {
            mentionedModels.forEach((model) => {
                const provider = modelToProvider[model];
                if (provider) {
                    mentionNotesByProvider[provider] = '注意：用户在群聊中@了你，请优先回应。';
                }
            });
        }

        // 同时发起所有AI的请求，谁先回复谁先显示
        const currentGroupId = currentGroup ? currentGroup.id : 'grp_all';
        if (!privateChat && currentGroup) {
            targetProviders.forEach((provider) => {
                ensureGroupAnnouncement(currentGroupId, provider, currentGroup.announcement || '');
            });
        }
        const promises = targetProviders.map(provider => 
            fetchAI(
                provider,
                userTextForAI,
                apiKey,
                mentionNotesByProvider[provider],
                announcementNote,
                currentGroupId,
                !!privateChat
            )
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

        if (e.key === 'Enter') {
            // Cmd/Ctrl + Enter: send
            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                if (inputValue.trim()) {
                    handleSendMessage();
                }
                return;
            }
            // Enter: allow default newline in textarea
            return;
        }
    };

    return (
        <div className={styles.inputContainer}>
            <div className={styles.homeInputWrapper}>
                <textarea
                    ref={inputRef}
                    className={styles.promptInput}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={onKeyDown}
                    placeholder="输入消息，@可提及AI，回车换行，Cmd+回车发送"
                    disabled={isLoading}
                    rows={1}
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
