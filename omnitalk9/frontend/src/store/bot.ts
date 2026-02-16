import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_BOT, ALL_BOTS } from '@constants/models.ts';

export interface BotState {
    provider: string;
    model: string;
    webui: {
        avatar: string;
        background: string;
        border?: string;
    },
    description?: string;
    url?: string;
}

interface BotStore {
    chosenBotNames: string[];
    currentBot: string;
    privateChat: string | null;
    updateCurrentBot: (botName: string) => void;
    setPrivateChat: (botName: string | null) => void;
    addBot: (botId: string) => void;
    removeBot: (botId: string) => void;
    getCurrentBot: () => string;
    clearBots: () => void;
}
export const useBotStore = create<BotStore>()(
    persist(
        (set, get) => ({
            chosenBotNames: ALL_BOTS,
            currentBot: DEFAULT_BOT,
            privateChat: null,
            updateCurrentBot: (botName: string) => {
                set({ currentBot: botName });
            },
            setPrivateChat: (botName: string | null) => {
                set({ privateChat: botName });
            },
            addBot: (botName: string) => {
                const { chosenBotNames } = get();
                if (chosenBotNames.includes(botName)) {
                    return;
                }
                set({ chosenBotNames: [...chosenBotNames, botName] });
            },
            removeBot: (botName: string) => {
                const { chosenBotNames } = get();
                set({ chosenBotNames: chosenBotNames.filter((name) => name !== botName) });
            },
            getCurrentBot: () => {
                return get().currentBot || DEFAULT_BOT;
            },
            clearBots: () => {
                localStorage.removeItem('bot');
                set({ chosenBotNames: ALL_BOTS });
            }
        }),
        {
            name: 'bot',
        }
    )
);
