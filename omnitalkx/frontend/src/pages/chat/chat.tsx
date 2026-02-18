import React, { useState, useEffect } from 'react';
import Chat from '@pages/chat/components/chat/chat.tsx';
import GroupList, { SettingsModal } from '@pages/chat/components/group-list/group-list.tsx';
import PromptInput from '@pages/chat/components/prompt-input/prompt-input.tsx';
import { useBotStore } from '@/store/bot.ts';
import { useChatStore } from '@/store/chat.ts';
import { useGroupStore } from '@/store/group.ts';
import { message } from 'sea-lion-ui';
import styles from './chat.module.less';

const ClearIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const ChatPage: React.FC = () => {
    const botStore = useBotStore();
    const chatStore = useChatStore();
    const groupStore = useGroupStore();
    const privateChat = botStore.privateChat;
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const currentGroup = groupStore.getCurrentGroup();

    // 获取群公告
    const announcement = currentGroup?.announcement || '';
    
    // 生成默认公告
    const getDefaultAnnouncement = () => {
        if (!currentGroup) return '';
        const botNames = currentGroup.bot_names || [];
        if (botNames.length === 0) return '';
        const namesStr = botNames.length === 1 
            ? botNames[0] 
            : botNames.length === 2 
                ? `${botNames[0]}、${botNames[1]}`
                : `${botNames.slice(0, -1).join('、')}、${botNames[botNames.length - 1]}`;
        return `这是一个名为「${currentGroup.name}」的群聊，群成员有${namesStr}等等（包含小庄）。`;
    };
    
    const displayAnnouncement = announcement || getDefaultAnnouncement();

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

    const handleClearChat = () => {
        setShowConfirm(true);
    };

    const confirmClear = async () => {
        const targetSession = privateChat 
            ? privateChat.toLowerCase() 
            : (currentGroup ? `group_${currentGroup.id}` : 'group');
        
        if (groupStore.currentGroupId !== 'grp_all') {
            try {
                await fetch(`/api/groups/${groupStore.currentGroupId}/context`, { method: 'DELETE' });
            } catch (e) {
                console.error('清除上下文失败:', e);
            }
        }
        
        chatStore.clearCurrentSession(targetSession);
        message.success('当前聊天记录已清除');
        setShowConfirm(false);
    };

    return (
        <div className={styles.home}>
            <div className={styles.toolbar}>
                <div className={styles.inputWrapper}>
                    <PromptInput />
                </div>
                <button className={styles.clearBtn} onClick={handleClearChat} title="清除聊天记录">
                    <ClearIcon />
                </button>
                <button className={styles.clearBtn} onClick={() => setShowSettings(true)} title="设置">
                    <SettingsIcon />
                </button>
            </div>
            
            <div className={styles.mainContent}>
                <div className={styles.chatArea}>
                    <Chat />
                </div>
                
                <div className={styles.groupListWrapper}>
                    <GroupList />
                </div>
            </div>

            {showConfirm && (
                <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
                    <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <div className={styles.confirmTitle}>确认清除</div>
                        <div className={styles.confirmContent}>
                            确定要清除当前聊天记录和上下文吗？
                        </div>
                        <div className={styles.confirmActions}>
                            <button className={styles.confirmCancel} onClick={() => setShowConfirm(false)}>
                                取消
                            </button>
                            <button className={styles.confirmOk} onClick={confirmClear}>
                                确认清除
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSettings && (
                <SettingsModal onClose={() => setShowSettings(false)} />
            )}
        </div>
    );
};

export default ChatPage;
