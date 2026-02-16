import React, {
    useContext, useEffect, useRef, useState
} from 'react';
import classNames from 'classnames';
import ReactMarkdown from 'react-markdown';
import 'katex/dist/katex.min.css';
import RemarkMath from 'remark-math';
import RemarkBreaks from 'remark-breaks';
import RehypeKatex from 'rehype-katex';
import RemarkGfm from 'remark-gfm';
import {
    isMobile, message as messageApi
} from 'sea-lion-ui';
import CodeBlock from '@components/code-block/code-block.tsx';
import { autoScroll, getNeedEventCallback } from '@utils/utils.ts';
import {
    CLEAR_CONTEXT, SERIAL_SESSION
} from '@constants/models.ts';
import { ADMIN_INFO, USER_INFO } from '@config/model-config.ts';
import { GlobalConfigContext } from '@components/global-config/global-config-context.tsx';
import { useChatStore, ChatMessage as ChatMessageProps, ChatSession as ChatSessionProps } from '@/store/chat.ts';
import { useBotStore } from '@/store/bot.ts';
import styles from './chat.module.less';
import { useConfigStore } from '@/store/config.ts';

export async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        messageApi.success('copied!');
    } catch (error) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            messageApi.success('copied!');
        } catch (error) {
            messageApi.error('copy failed');
        }
        document.body.removeChild(textArea);
    }
}
export function CopyCode(props: { children: any }) {
    const ref = useRef<HTMLPreElement>(null);
    const [showCopy, setShowCopy] = React.useState(false);

    const handleClickCopy = () => {
        if (ref.current) {
            const code = ref.current.innerText;
            copyToClipboard(code);
        }
    };

    return (
        <pre ref={ref}>
            <div
                onMouseOver={() => setShowCopy(true)}
                onFocus={() => setShowCopy(true)}
                onMouseLeave={() => setShowCopy(false)}
            >
                {/* show copy btn when hover code block */}
                {showCopy && (
                    <span
                        className={styles.copyCodeBtn}
                        {...getNeedEventCallback(handleClickCopy)}
                    />
                )}
                {props.children}
            </div>
        </pre>
    );
}

function ChatMessage(props: { message: ChatMessageProps, sessionInfo: {id: number, name: string, bot: string} }) {
    const { models } = useContext(GlobalConfigContext);
    const [customAvatar, setCustomAvatar] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { message } = props;
    const isUser = message.sender_type === 'user' || message.provider === 'user';
    const isAdmin = message.sender_type === 'admin' || message.provider === 'admin';
    const isClear = message.sender_type === CLEAR_CONTEXT;
    const className = classNames(
        styles.messageWrapper,
        isUser ? styles.chatUser : styles.chatBot,
    );
    const configStore = useConfigStore();

    useEffect(() => {
        const saved = localStorage.getItem('user_avatar');
        if (saved) {
            setCustomAvatar(saved);
        }
    }, []);

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            messageApi.warning('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            localStorage.setItem('user_avatar', base64);
            setCustomAvatar(base64);
            messageApi.success('头像已更新');
        };
        reader.onerror = () => {
            messageApi.error('读取文件失败');
        };
        reader.readAsDataURL(file);
    };

    const getModel = (): any => {
        if (isUser) {
            return USER_INFO;
        }
        if (isAdmin) {
            return ADMIN_INFO;
        }
        return models[message.model];
    };

    const model = getModel();

    // 用户消息不需要 model，AI 消息如果没有 model 则不显示
    if (!isUser && !isClear && !model) {
        return null;
    }

    const isPrivateChat = configStore.mode === 'serial';
    // AI 头像使用模型配置，用户头像使用自定义头像
    const aiAvatarSrc = model?.webui?.avatar;
    const userAvatarSrc = customAvatar || 'ME';
    
    return (
        <div
            className={styles.message}
            style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            {(isClear) ? (
                <div className={styles.clearLine}>
                    Context cleared
                </div>
            ) : (
                <>
                    {/* AI 头像 */}
                    {!isMobile && !isUser && (
                        <div 
                            className={styles.modelAvatar}
                            title={model?.provider || message.provider}
                        >
                            <img
                                src={aiAvatarSrc || ''}
                                className={styles.modelAvatarImg}
                                alt={model?.model || message.provider}
                            />
                        </div>
                    )}
                    <div
                        className={className}
                        style={{ borderRadius: !isUser ? '1px 10px 10px 10px' : '10px 1px 10px 10px' }}
                    >
                        <ReactMarkdown
                            className={styles.markdownBlock}
                            remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
                            rehypePlugins={[RehypeKatex]}
                            components={{
                                code: CodeBlock,
                                pre: CopyCode,
                            }}
                        >
                            {message.text}
                        </ReactMarkdown>
                    </div>
                    {/* 用户头像 */}
                    {!isMobile && isUser && (
                        <div 
                            className={styles.modelAvatar}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            title="右键上传头像"
                        >
                            {userAvatarSrc !== 'ME' ? (
                                <img src={userAvatarSrc} className={styles.modelAvatarImg} alt="user" />
                            ) : (
                                'ME'
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ChatSession(props: { session: ChatSessionProps }) {
    const { session } = props;

    useEffect(() => {
        autoScroll(`chat-wrapper-${session.id}`);
    }, [session.messages.length]);

    return (
        <div className={styles.sessionWrapper}>
            <div className={styles.chat} id={`chat-wrapper-${session.id}`}>
                {Array.isArray(session.messages) && session.messages.map((message, index) => {
                    return (
                        <div key={message.id} className={styles.messageItem}>
                            <ChatMessage
                                key={message.id}
                                message={message}
                                sessionInfo={{
                                    id: session.id,
                                    name: session.name,
                                    bot: session.bot,
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const ChatPage: React.FC = () => {
    const chatStore = useChatStore();
    const botStore = useBotStore();
    const { sessions } = chatStore;
    const privateChat = botStore.privateChat;

    return (
        <div className={styles.sessions}>
            {Array.isArray(sessions) && sessions.map((session) => {
                // 私聊模式：只显示选中的AI对话
                if (privateChat) {
                    if (session.name !== privateChat) {
                        return null;
                    }
                    return (
                        <ChatSession
                            key={session.id}
                            session={session}
                        />
                    );
                }
                // 群聊模式：只显示group session
                if (session.name === 'group') {
                    return (
                        <ChatSession
                            key={session.id}
                            session={session}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
};

export default ChatPage;
