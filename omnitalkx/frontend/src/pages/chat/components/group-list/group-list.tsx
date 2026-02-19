import { useContext, useState, useEffect } from 'react';
import { getNeedEventCallback } from '@utils/utils.ts';
import { message } from 'sea-lion-ui';
import { GlobalConfigContext } from '@components/global-config/global-config-context.tsx';
import styles from './group-list.module.less';
import { BotState, useBotStore } from '@/store/bot.ts';
import { useGroupStore, GroupInfo } from '@/store/group.ts';
import { getApiKey, removeApiKey, setApiKey as storeApiKey } from '@/utils/api-key.ts';
import { getChatStyleConfig, setChatStyleConfig } from '@/utils/chat-style.ts';

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const GroupList = () => {
    const { models } = useContext(GlobalConfigContext);
    const groupStore = useGroupStore();
    const botStore = useBotStore();
    const [showSettings, setShowSettings] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupInfo | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const res = await fetch('/api/groups');
            const data = await res.json();
            if (data.success) {
                groupStore.setGroups(data.groups);
            }
        } catch (e) {
            console.error('加载群组失败:', e);
        }
    };

    const handleSelectGroup = (groupId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        
        // 如果当前是私聊模式，点击群组应该退出私聊，返回群聊
        if (botStore.privateChat) {
            groupStore.setCurrentGroupId(groupId);
            botStore.setPrivateChat(null);
        } else if (groupStore.currentGroupId === groupId) {
            // 群聊模式下，点击当前群组才展开/收起AI列表
            setExpandedGroup(expandedGroup === groupId ? null : groupId);
        } else {
            // 切换到其他群组
            groupStore.setCurrentGroupId(groupId);
            botStore.setPrivateChat(null);
        }
    };

    const handleSelectBot = (bot: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (botStore.privateChat === bot) {
            botStore.setPrivateChat(null);
        } else {
            botStore.setPrivateChat(bot);
        }
    };

    const handleRightClick = (e: React.MouseEvent, group: GroupInfo) => {
        e.preventDefault();
        if (!group.is_default) {
            setEditingGroup(group);
            setShowEditor(true);
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        try {
            const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                message.success('群组已删除');
                loadGroups();
                if (groupStore.currentGroupId === groupId) {
                    groupStore.setCurrentGroupId('grp_all');
                }
            } else {
                message.error(data.message);
            }
        } catch (e) {
            message.error('删除失败');
        }
        setShowEditor(false);
        setEditingGroup(null);
    };

    const getBotAvatar = (bot: string): string => {
        return models?.[bot]?.webui?.avatar || '';
    };

    const getBotDisplayName = (bot: string): string => {
        const names: Record<string, string> = {
            'chatgpt': 'ChatGPT', 'claude': 'Claude', 'grok': 'Grok',
            'gemini': 'Gemini', 'glm': 'GLM', 'kimi': 'Kimi',
            'minimax': 'MiniMax', 'qwen': 'Qwen', 'deepseek': 'DeepSeek', 'seed': 'Seed',
        };
        return names[bot] || bot;
    };

    const toggleExpand = (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedGroup(expandedGroup === groupId ? null : groupId);
    };

    return (
        <div className={styles.container}>
            <div 
                className={styles.addGroupBtn} 
                onClick={() => { setEditingGroup(null); setShowEditor(true); }}
                title="新建群组"
            >
                + 新建群组
            </div>

            <div className={styles.groupList}>
                {[...groupStore.groups].sort((a, b) => {
                    if (a.is_default) return -1;
                    if (b.is_default) return 1;
                    return 0;
                }).map((group) => (
                    <div key={group.id}>
                        <div
                            className={`${styles.groupItem} ${groupStore.currentGroupId === group.id && !botStore.privateChat ? styles.groupItemActive : ''}`}
                            onClick={() => handleSelectGroup(group.id)}
                            onContextMenu={(e) => handleRightClick(e, group)}
                        >
                            <div 
                                className={styles.groupAvatars}
                            >
                                {group.bots.slice(0, 5).map((bot, index) => {
                                    const count = Math.min(group.bots.length, 5);
                                    const spacing = 14;
                                    const marginLeft = (index - (count - 1) / 2) * spacing;
                                    return (
                                        <img
                                            key={bot}
                                            src={getBotAvatar(bot)}
                                            alt={bot}
                                            className={styles.groupAvatar}
                                            style={{ zIndex: count - index, marginLeft: `${marginLeft}px` }}
                                        />
                                    );
                                })}
                                {group.bots.length > 5 && (
                                    <div className={styles.moreAvatars}>+{group.bots.length - 5}</div>
                                )}
                            </div>
                            <div className={styles.groupInfo}>
                                <div className={styles.groupName}>{group.name}</div>
                            </div>
                        </div>

                        {expandedGroup === group.id && (
                            <div className={styles.memberList}>
                                {group.bots.map((bot) => (
                                    <div
                                        key={bot}
                                        className={`${styles.memberItem} ${botStore.privateChat === bot ? styles.memberItemActive : ''}`}
                                        onClick={(e) => handleSelectBot(bot, e)}
                                    >
                                        <img
                                            src={getBotAvatar(bot)}
                                            alt={bot}
                                            className={styles.memberAvatar}
                                        />
                                        <span className={styles.memberName}>{getBotDisplayName(bot)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showEditor && (
                <GroupEditor 
                    group={editingGroup}
                    onClose={() => { setShowEditor(false); setEditingGroup(null); }}
                    onSave={() => { setShowEditor(false); setEditingGroup(null); loadGroups(); }}
                    onDelete={handleDeleteGroup}
                />
            )}

            {showSettings && (
                <SettingsModal onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
};

const GroupEditor = ({ group, onClose, onSave, onDelete }: { group: GroupInfo | null; onClose: () => void; onSave: () => void; onDelete?: (id: string) => void }) => {
    const { models } = useContext(GlobalConfigContext);
    const [name, setName] = useState(group?.name || '');
    const [selectedBots, setSelectedBots] = useState<string[]>(group?.bots || []);
    const [announcement, setAnnouncement] = useState(group?.announcement || '');
    const [loading, setLoading] = useState(false);
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1000);
    const [topP, setTopP] = useState(0.9);

    const allBots = models ? Object.keys(models) : [];

    useEffect(() => {
        if (group) {
            loadAnnouncement();
        }
        const cfg = getChatStyleConfig(group?.id);
        setTemperature(cfg.temperature);
        setMaxTokens(cfg.max_tokens);
        setTopP(cfg.top_p);
    }, [group]);

    const loadAnnouncement = async () => {
        if (!group) return;
        try {
            const res = await fetch(`/api/groups/${group.id}/announcement`);
            const data = await res.json();
            if (data.success) {
                setAnnouncement(data.announcement || '');
            }
        } catch (e) {
            console.error('加载公告失败:', e);
        }
    };

    const generateDefaultAnnouncement = (): string => {
        if (!group) return '';
        const botNames = group.bot_names || [];
        if (botNames.length === 0) {
            return `这是一个名为「${group.name}」的群聊，群成员有小庄。`;
        }
        const namesStr = botNames.length === 1 
            ? botNames[0] 
            : botNames.length === 2 
                ? `${botNames[0]}、${botNames[1]}`
                : `${botNames.slice(0, -1).join('、')}、${botNames[botNames.length - 1]}`;
        return `这是一个名为「${group.name}」的群聊，群成员有${namesStr}等等（包含小庄）。`;
    };

    const toggleBot = (bot: string) => {
        setSelectedBots(prev => 
            prev.includes(bot) ? prev.filter(b => b !== bot) : [...prev, bot]
        );
    };

    const getBotDisplayName = (bot: string): string => {
        const names: Record<string, string> = {
            'chatgpt': 'ChatGPT', 'claude': 'Claude', 'grok': 'Grok',
            'gemini': 'Gemini', 'glm': 'GLM', 'kimi': 'Kimi',
            'minimax': 'MiniMax', 'qwen': 'Qwen', 'deepseek': 'DeepSeek', 'seed': 'Seed',
        };
        return names[bot] || bot;
    };

    const getBotAvatar = (bot: string): string => {
        return models?.[bot]?.webui?.avatar || '';
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            message.warning('请输入群组名称');
            return;
        }
        if (selectedBots.length < 2) {
            message.warning('请至少选择 2 个 AI');
            return;
        }

        setLoading(true);
        try {
            const url = group ? `/api/groups/${group.id}` : '/api/groups';
            const method = group ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), bots: selectedBots })
            });
            
            const data = await res.json();
            if (data.success) {
                if (group && !group.is_default) {
                    await updateAnnouncement();
                }
                message.success(group ? '群组已更新' : '群组已创建');
                onSave();
            } else {
                message.error(data.message);
            }
        } catch (e) {
            message.error('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const updateAnnouncement = async () => {
        if (!group) return;
        try {
            await fetch(`/api/groups/${group.id}/announcement`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ announcement: announcement })
            });
        } catch (e) {
            console.error('更新公告失败:', e);
        }
    };

    const isDefaultGroup = group?.is_default && group?.name === '全员群';

    const handleStyleChange = (next: { temperature?: number; max_tokens?: number; top_p?: number }) => {
        setChatStyleConfig(next, group?.id);
        if (typeof next.temperature === 'number') setTemperature(next.temperature);
        if (typeof next.max_tokens === 'number') setMaxTokens(next.max_tokens);
        if (typeof next.top_p === 'number') setTopP(next.top_p);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.editorModal} onClick={e => e.stopPropagation()}>
                <div className={styles.editorHeader}>
                    <span>{group ? '编辑群组' : '新建群组'}</span>
                    <span className={styles.closeBtn} onClick={onClose}>×</span>
                </div>
                
                <div className={styles.editorBody}>
                    <div className={styles.formGroup}>
                        <label>群组名称</label>
                        <input
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="输入群组名称"
                            maxLength={20}
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label>选择 AI 成员 ({selectedBots.length})</label>
                        <div className={styles.botGrid}>
                            {allBots.map((bot) => (
                                <div
                                    key={bot}
                                    className={`${styles.botOption} ${selectedBots.includes(bot) ? styles.botOptionSelected : ''}`}
                                    onClick={() => toggleBot(bot)}
                                >
                                    <img src={getBotAvatar(bot)} alt={bot} className={styles.botAvatar} />
                                    <span className={styles.botName}>{getBotDisplayName(bot)}</span>
                                    {selectedBots.includes(bot) && <span className={styles.checkMark}>✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {!isDefaultGroup && (
                        <div className={styles.formGroup}>
                            <label>群公告</label>
                            <textarea
                                className={styles.textarea}
                                value={announcement}
                                onChange={(e) => setAnnouncement(e.target.value)}
                                placeholder={generateDefaultAnnouncement()}
                                maxLength={2000}
                                rows={4}
                            />
                            <div className={styles.hint}>* 不填则使用默认公告</div>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>话痨程度</label>
                        <div className={styles.chatStyleBox}>
                            <div className={styles.chatStyleHeader}>
                                <span className={styles.chatStyleTitle}>参数控制</span>
                                <span className={styles.chatStyleBadge}>仅当前群生效</span>
                            </div>
                            <div className={styles.chatStyleDesc}>
                                影响回复的长度与发散程度
                            </div>
                            <div className={styles.sliderRow}>
                                <div className={styles.sliderMeta}>
                                    <span className={styles.sliderLabel}>随机性</span>
                                    <span className={styles.sliderHint}>更高更发散</span>
                                </div>
                                <div className={styles.sliderControl}>
                                    <input
                                        type="range"
                                        min={0}
                                        max={2}
                                        step={0.1}
                                        value={temperature}
                                        onChange={(e) => handleStyleChange({ temperature: Number(e.target.value) })}
                                    />
                                    <span className={styles.sliderValue}>{temperature.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className={styles.sliderRow}>
                                <div className={styles.sliderMeta}>
                                    <span className={styles.sliderLabel}>长度上限</span>
                                    <span className={styles.sliderHint}>更大更话痨</span>
                                </div>
                                <div className={styles.sliderControl}>
                                    <input
                                        type="range"
                                        min={128}
                                        max={2048}
                                        step={64}
                                        value={maxTokens}
                                        onChange={(e) => handleStyleChange({ max_tokens: Number(e.target.value) })}
                                    />
                                    <span className={styles.sliderValue}>{maxTokens}</span>
                                </div>
                            </div>
                            <div className={styles.sliderRow}>
                                <div className={styles.sliderMeta}>
                                    <span className={styles.sliderLabel}>集中度</span>
                                    <span className={styles.sliderHint}>更低更有惊喜</span>
                                </div>
                                <div className={styles.sliderControl}>
                                    <input
                                        type="range"
                                        min={0.1}
                                        max={1}
                                        step={0.05}
                                        value={topP}
                                        onChange={(e) => handleStyleChange({ top_p: Number(e.target.value) })}
                                    />
                                    <span className={styles.sliderValue}>{topP.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className={styles.editorFooter}>
                    <div className={styles.footerLeft}>
                        {group && !group.is_default && onDelete && (
                            <button 
                                className={styles.deleteBtn}
                                onClick={() => onDelete(group.id)}
                            >
                                删除群组
                            </button>
                        )}
                    </div>
                    <div className={styles.footerRight}>
                        <button className={styles.cancelBtn} onClick={onClose}>取消</button>
                        <button className={styles.saveBtn} onClick={handleSubmit} disabled={loading}>
                            {loading ? '保存中...' : '保存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
    const { models } = useContext(GlobalConfigContext);
    const [activeTab, setActiveTab] = useState<'api' | 'prompts'>('api');
    const [apiKey, setApiKey] = useState('');
    const [inputKey, setInputKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>({});
    const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
    const [promptText, setPromptText] = useState('');

    useEffect(() => {
        loadApiKey();
        loadSystemPrompts();
    }, []);

    const loadApiKey = async () => {
        try {
            const res = await fetch('/api/key');
            const data = await res.json();
            if (data.has_key) {
                setApiKey(data.masked_key);
                setInputKey(getApiKey());
            }
        } catch (e) {
            console.error('加载 API Key 失败:', e);
        }
    };

    const loadSystemPrompts = async () => {
        const prompts: Record<string, string> = {};
        
        try {
            const res = await fetch('/api/default-prompts');
            const data = await res.json();
            if (data.prompts) {
                Object.assign(prompts, data.prompts);
            }
        } catch (e) {
            console.error('加载默认 prompt 失败:', e);
        }
        
        if (models) {
            Object.keys(models).forEach((modelName) => {
                const saved = localStorage.getItem('system_prompt_' + modelName);
                if (saved) {
                    prompts[modelName] = saved;
                }
            });
        }
        setSystemPrompts(prompts);
    };

    const handleSaveApiKey = async () => {
        const key = inputKey.trim();
        if (!key) {
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
                storeApiKey(key);
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
                removeApiKey();
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
        localStorage.setItem('system_prompt_' + modelName, promptText);
        setSystemPrompts(prev => ({ ...prev, [modelName]: promptText }));
        setEditingPrompt(null);
        message.success(`${modelName} 的 System Prompt 已保存`);
    };

    const handleDeletePrompt = (modelName: string) => {
        localStorage.removeItem('system_prompt_' + modelName);
        setSystemPrompts(prev => {
            const newPrompts = { ...prev };
            delete newPrompts[modelName];
            return newPrompts;
        });
        message.success(`${modelName} 的 System Prompt 已删除`);
    };

    const getModelDisplayName = (modelName: string): string => {
        const names: Record<string, string> = {
            'chatgpt': 'ChatGPT', 'claude': 'Claude', 'grok': 'Grok',
            'gemini': 'Gemini', 'glm': 'GLM', 'kimi': 'Kimi',
            'minimax': 'MiniMax', 'qwen': 'Qwen', 'deepseek': 'DeepSeek', 'seed': 'Seed',
        };
        return names[modelName] || modelName;
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.settingsModal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <span>设置</span>
                    <span className={styles.closeBtn} onClick={onClose}>×</span>
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
                                <label>OpenRouter API Key</label>
                                <input 
                                    className={styles.input}
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    onBlur={handleSaveApiKey}
                                    placeholder="sk-or-v1-xxxxxx"
                                />
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
    );
};

export { SettingsModal };
export default GroupList;
