import Settings from "../Settings";
import SadnessChan from "../SadnessChan";
import Utils from "../Utils";
import settingsDefaults from "../lists/settingsDefaults";

class PreCreateChatMessage {
    private static _instance: PreCreateChatMessage;
    private readonly _errorMessages = settingsDefaults.ERROR_MESSAGES;

    private constructor() {
    }

    public static getInstance(): PreCreateChatMessage {
        if (!PreCreateChatMessage._instance) PreCreateChatMessage._instance = new PreCreateChatMessage();
        return PreCreateChatMessage._instance;
    }

    private _executeResetCmd(args: string, message: any, options: any, user: any) {
        let content = this._errorMessages.NOT_ENOUGH_PERMISSIONS;

        if (game.user.hasRole(4)) {
            switch (args) {
                case "settings":
                    Settings.resetAllSettings();
                    content = this._errorMessages.SETTINGS_RESET;
                    break;
                case "counter":
                    Settings.resetCounter();
                    content = this._errorMessages.COUNTER_RESET;
                    break;
                case "lists":
                    Settings.resetLists();
                    content = this._errorMessages.LISTS_RESET;
                    break;
                default:
                    content = this._errorMessages.INVALID_ARGUMENTS;
                    break;
            }
        }

        message.content = SadnessChan.generateMessageStructure(content);
        this._prepareMessage(message, options, user, true);
    }

    private _prepareMessage(message: any, options: any, userId: string, sendToAll?: boolean): void {
        const isPublic = Settings.getSetting(settingsDefaults.SETTING_KEYS.STATS_MESSAGE_VISIBILITY);

        message.whisper = isPublic || sendToAll ? [] : [userId];
        message.speaker = {alias: `${Utils.moduleTitle}`};
        options.chatBubble = false;
    }

    private _sendStatsMessage(message: any, options: any, userData: any, userId: string): void {
        message.content = SadnessChan.getStatsMessage(userData);
        this._prepareMessage(message, options, userId);
    }

    private _executeStatsCmd(message: any, options: any, user: any) {
        const counter = Settings.getCounter();

        if (counter && counter[user]) {
            this._sendStatsMessage(message, options, counter[user], user);
            Utils.debug('Sad stats displayed.');
        }
    }

    private _sendAllRollsMessage(message: any, options: any, userId: any) {
        const counter = Settings.getCounter();
        if (!(counter && game.user.hasRole(4))) return;

        message.content = '';
        const activeUsers = game.users.entities.filter((user) => user.active);
        activeUsers.forEach((user) => {
            // @ts-ignore
            const id = user.data._id;
            message.content += SadnessChan.getStatsMessage(counter[id], false);
        })

        this._prepareMessage(message, options, userId);
    }

    public executeCommand(args: string, user: any, message: any, options: any) {
        const resetCommand = 'reset';
        const allCommand = 'all';
        if (args.startsWith(resetCommand)) {
            return this._executeResetCmd(args.replace(resetCommand + ' ', ''), message, options, user);
        }
        if (args.startsWith(allCommand)) {
            return this._sendAllRollsMessage(message, options, user);
        }
    }

    public preCreateChatMessageHook(message: any, options: any): void {
        const content = message?.content;
        const user = message?.user;
        const command = SadnessChan.getCmd();
        if (!(user && content && content.startsWith(command))) return;

        if (content === command) return this._executeStatsCmd(message, options, user);

        return this.executeCommand(content.replace(command + ' ', ''), user, message, options);
    }
}

export default PreCreateChatMessage.getInstance();