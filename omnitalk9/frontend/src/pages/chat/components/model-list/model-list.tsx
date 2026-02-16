import {
    PARALLEL_MODE, SERIAL_MODE
} from '@constants/models.ts';
import { useContext, useRef, useState, useEffect } from 'react';
import { getNeedEventCallback } from '@utils/utils.ts';
import { message } from 'sea-lion-ui';
import { GlobalConfigContext } from '@components/global-config/global-config-context.tsx';
import styles from './model-list.module.less';
import { BotState, useBotStore } from '@/store/bot.ts';
import { useChatStore } from '@/store/chat.ts';
import { useConfigStore } from '@/store/config.ts';

const AVATAR_STORAGE_PREFIX = 'model_avatar_';
const API_KEY_STORAGE = 'omnitalk9_api_key';
const SYSTEM_PROMPT_STORAGE_PREFIX = 'system_prompt_';

function ModelAvatar(props: {
    model: BotState
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const configStore = useConfigStore();
    const chatStore = useChatStore();
    const botStore = useBotStore();
    const [customAvatar, setCustomAvatar] = useState<string>('');
    const isPrivateChat = botStore.privateChat === props.model.model;

    useEffect(() => {
        const saved = localStorage.getItem(AVATAR_STORAGE_PREFIX + props.model.model);
        if (saved) {
            setCustomAvatar(saved);
        }
    }, [props.model.model]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isPrivateChat) {
            botStore.setPrivateChat(null);
        } else {
            botStore.setPrivateChat(props.model.model);
        }
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            message.warning('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            localStorage.setItem(AVATAR_STORAGE_PREFIX + props.model.model, base64);
            setCustomAvatar(base64);
            message.success('头像已更新');
        };
        reader.onerror = () => {
            message.error('读取文件失败');
        };
        reader.readAsDataURL(file);
    };

    const avatarSrc = customAvatar || props.model.webui?.avatar || '';

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <div
                className={`${styles.modelAvatar} ${isPrivateChat ? styles.modelAvatarChosen : ''}`}
                onClick={handleClick}
                onContextMenu={handleRightClick}
                title="左键: 进入/退出私聊 | 右键: 上传头像"
            >
                <img
                    src={avatarSrc}
                    className={styles.modelAvatarImg}
                    alt={props.model.provider}
                />
                <div className={styles.modelName}>
                    @{props.model.model || props.model.provider}
                </div>
            </div>
        </>
    );
}

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const ModelList = () => {
    const { models } = useContext(GlobalConfigContext);
    const [showSettings, setShowSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<'api' | 'prompts'>('api');
    const [apiKey, setApiKey] = useState('');
    const [inputKey, setInputKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [customLogo, setCustomLogo] = useState<string>('');
    const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>({});
    const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
    const [promptText, setPromptText] = useState('');
    const logoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedKey = localStorage.getItem(API_KEY_STORAGE);
        if (savedKey) {
            setApiKey(savedKey);
            setInputKey(savedKey);
        }
        const savedLogo = localStorage.getItem('app_custom_logo');
        if (savedLogo) {
            setCustomLogo(savedLogo);
        }
        loadSystemPrompts();
    }, []);

    const loadSystemPrompts = () => {
        const prompts: Record<string, string> = {};
        if (models) {
            Object.keys(models).forEach((modelName) => {
                const saved = localStorage.getItem(SYSTEM_PROMPT_STORAGE_PREFIX + modelName);
                if (saved) {
                    prompts[modelName] = saved;
                }
            });
        }
        setSystemPrompts(prompts);
    };

    const handleLogoRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        logoInputRef.current?.click();
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            message.warning('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            localStorage.setItem('app_custom_logo', base64);
            setCustomLogo(base64);
            message.success('图标已更新');
        };
        reader.onerror = () => {
            message.error('读取文件失败');
        };
        reader.readAsDataURL(file);
    };

    const logoSrc = customLogo;

    const handleSaveApiKey = async () => {
        const key = inputKey.trim();
        if (!key) {
            message.warning('请输入 API Key');
            return;
        }
        if (!key.startsWith('sk-or-v1-') && !key.startsWith('sk-')) {
            message.warning('无效的 OpenRouter API Key 格式');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });
            const data = await res.json();
            if (data.status === 'ok') {
                localStorage.setItem(API_KEY_STORAGE, key);
                setApiKey(key);
                message.success('API Key 保存成功');
            } else {
                message.error(data.message || '保存失败');
            }
        } catch (e) {
            message.error('保存失败');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteApiKey = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/key', { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'ok') {
                localStorage.removeItem(API_KEY_STORAGE);
                setApiKey('');
                setInputKey('');
                message.success('API Key 已删除');
            }
        } catch (e) {
            message.error('删除失败');
        } finally {
            setLoading(false);
        }
    };

    const handleEditPrompt = (modelName: string) => {
        setEditingPrompt(modelName);
        setPromptText(systemPrompts[modelName] || '');
    };

    const handleSavePrompt = (modelName: string) => {
        localStorage.setItem(SYSTEM_PROMPT_STORAGE_PREFIX + modelName, promptText);
        setSystemPrompts(prev => ({ ...prev, [modelName]: promptText }));
        setEditingPrompt(null);
        message.success(`${modelName} 的 System Prompt 已保存`);
    };

    const handleDeletePrompt = (modelName: string) => {
        localStorage.removeItem(SYSTEM_PROMPT_STORAGE_PREFIX + modelName);
        setSystemPrompts(prev => {
            const newPrompts = { ...prev };
            delete newPrompts[modelName];
            return newPrompts;
        });
        message.success(`${modelName} 的 System Prompt 已删除`);
    };

    const getModelDisplayName = (modelName: string): string => {
        const names: Record<string, string> = {
            'chatgpt': 'ChatGPT',
            'claude': 'Claude',
            'grok': 'Grok',
            'gemini': 'Gemini',
            'glm': 'GLM',
            'kimi': 'Kimi',
            'minimax': 'MiniMax',
            'qwen': 'Qwen',
            'deepseek': 'DeepSeek',
            'seed': 'Seed',
        };
        return names[modelName] || modelName;
    };

    return (
        <>
            <div className={styles.modelListContainer}>
                <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoFileChange}
                />
                <div 
                    className={styles.settingsIcon} 
                    onClick={() => { setInputKey(apiKey); loadSystemPrompts(); setShowSettings(true); }} 
                    onContextMenu={handleLogoRightClick}
                    title="左键: 设置 | 右键: 上传图标"
                >
                    {customLogo ? (
                        <img src={logoSrc} alt="settings" />
                    ) : (
                        <SettingsIcon />
                    )}
                </div>
                <div className={styles.modelsList}>
                    {models && Object.keys(models).map((modelName) => {
                        return (
                            <ModelAvatar
                                key={modelName}
                                model={{ model: modelName, ...models[modelName] }}
                            />
                        );
                    })}
                </div>
            </div>

            {showSettings && (
                <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
                    <div className={styles.settingsModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <span className={styles.modalTitle}>设置</span>
                            <span className={styles.modalClose} onClick={() => setShowSettings(false)}>×</span>
                        </div>
                        
                        <div className={styles.tabs}>
                            <div 
                                className={`${styles.tab} ${activeTab === 'api' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('api')}
                            >
                                API 配置
                            </div>
                            <div 
                                className={`${styles.tab} ${activeTab === 'prompts' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('prompts')}
                            >
                                System Prompt
                            </div>
                        </div>

                        <div className={styles.modalBody}>
                            {activeTab === 'api' && (
                                <div className={styles.tabContent}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>OpenRouter API Key</label>
                                        <input 
                                            className={styles.formInput}
                                            value={inputKey}
                                            onChange={(e) => setInputKey(e.target.value)}
                                            placeholder="sk-or-v1-xxxxxx"
                                        />
                                        <div className={styles.formHint}>
                                            请输入 OpenRouter API Key，格式：sk-or-v1-xxxxxx
                                        </div>
                                    </div>
                                    <div className={styles.modalFooter}>
                                        <button 
                                            className={styles.btnCancel}
                                            onClick={() => setShowSettings(false)}
                                        >
                                            取消
                                        </button>
                                        <button 
                                            className={styles.btnPrimary}
                                            onClick={handleSaveApiKey}
                                            disabled={loading}
                                        >
                                            {loading ? '保存中...' : '保存'}
                                        </button>
                                    </div>
                                    {apiKey && (
                                        <div className={styles.deleteLink}>
                                            <span onClick={handleDeleteApiKey}>删除 API Key</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'prompts' && (
                                <div className={styles.tabContent}>
                                    <div className={styles.promptsIntro}>
                                        为每个 AI 模型设置自定义的 System Prompt
                                    </div>
                                    <div className={styles.promptsList}>
                                        {models && Object.keys(models).map((modelName) => (
                                            <div key={modelName} className={styles.promptItem}>
                                                <div className={styles.promptItemHeader}>
                                                    <span className={styles.promptItemName}>
                                                        {getModelDisplayName(modelName)}
                                                    </span>
                                                    <div className={styles.promptItemActions}>
                                                        {editingPrompt === modelName ? (
                                                            <>
                                                                <button 
                                                                    className={styles.btnSmall}
                                                                    onClick={() => handleSavePrompt(modelName)}
                                                                >
                                                                    保存
                                                                </button>
                                                                <button 
                                                                    className={styles.btnSmallCancel}
                                                                    onClick={() => setEditingPrompt(null)}
                                                                >
                                                                    取消
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    className={styles.btnSmall}
                                                                    onClick={() => handleEditPrompt(modelName)}
                                                                >
                                                                    {systemPrompts[modelName] ? '编辑' : '添加'}
                                                                </button>
                                                                {systemPrompts[modelName] && (
                                                                    <button 
                                                                        className={styles.btnSmallDelete}
                                                                        onClick={() => handleDeletePrompt(modelName)}
                                                                    >
                                                                        删除
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {editingPrompt === modelName ? (
                                                    <textarea
                                                        className={styles.promptTextarea}
                                                        value={promptText}
                                                        onChange={(e) => setPromptText(e.target.value)}
                                                        placeholder="在这里输入 System Prompt..."
                                                    />
                                                ) : systemPrompts[modelName] ? (
                                                    <div className={styles.promptPreview}>
                                                        {systemPrompts[modelName]}
                                                    </div>
                                                ) : (
                                                    <div className={styles.promptEmpty}>
                                                        未设置 System Prompt
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ModelList;
