import React, { useState } from 'react';
import Chat from '@pages/chat/components/chat/chat.tsx';
import ModelList from '@pages/chat/components/model-list/model-list.tsx';
import PromptInput from '@pages/chat/components/prompt-input/prompt-input.tsx';
import { useBotStore } from '@/store/bot.ts';
import { useChatStore } from '@/store/chat.ts';
import { message } from 'sea-lion-ui';
import styles from './chat.module.less';

const ChatPage: React.FC = () => {
    const botStore = useBotStore();
    const chatStore = useChatStore();
    const privateChat = botStore.privateChat;
    const [showConfirm, setShowConfirm] = useState(false);

    const handleClearChat = () => {
        setShowConfirm(true);
    };

    const confirmClear = () => {
        const targetSession = privateChat || 'group';
        chatStore.clearCurrentSession(targetSession);
        message.success('当前聊天记录已清除');
        setShowConfirm(false);
    };

    return (
        <div className={styles.home}>
            <div className={styles.leftColumn}>
                <div className={styles.headerRow}>
                    <PromptInput />
                    <button className={styles.clearBtn} onClick={handleClearChat} title="清除聊天记录">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
                
                <div className={styles.homeChats}>
                    <Chat />
                </div>
            </div>
            
            <div className={styles.modelListWrapper}>
                <ModelList />
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
                            确定要清除当前聊天记录吗？此操作无法撤销。
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
        </div>
    );
};

export default ChatPage;
