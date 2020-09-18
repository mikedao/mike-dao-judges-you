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
        } else {
            message.content = SadnessChan.generateMessageStructure(this._errorMessages.NO_DATA);
            this._prepareMessage(message, options, user, true);
        }
    }

    private _sendAllRollsMessage(message: any, options: any, userId: any) {
        const counter = Settings.getCounter();
        let sendToAll = false;
        if (!(counter && game.user.hasRole(4))) return;

        if (Object.keys(counter).length === 0) {
            message.content = SadnessChan.generateMessageStructure(this._errorMessages.NO_DATA);
            sendToAll = true;
        }
        else {
            message.content = '';
            const activeUsers = game.users.entities.filter((user) => user.active);
            activeUsers.forEach((user, index) => {
                // @ts-ignore
                const userData = counter[user?.data?._id];
                if (!userData) return;

                message.content += SadnessChan.getStatsMessage(userData, index === 0);
            })
        }
        this._prepareMessage(message, options, userId, sendToAll);
    }

    private _sendHelpMessage (message: any, options: any, userId: any) {
        const command = SadnessChan.getCmd()
        message.content = `<p>Are you that useless that you need help? Fine, I'll help you:</p>`;
        message.content += `<p><b>${command}</b> - "happiness".</p>`
        message.content += `<p><b>${command} all</b> - AOE "happiness".</p>`
        message.content += `<p><b>${command} reset settings</b> - you want to make me a normie, sure I guess...</p>`
        message.content += `<p><b>${command} reset lists</b> -  back to square one, like the retards who made me intended.</p>`
        message.content += `<p><b>${command} reset counter</b> - makes me forget how much of a disappointment you are. Oh. Wait. I still have your browser history to remind me.</p>`
        this._prepareMessage(message, options, userId);
    }


    public executeCommand(args: string, user: any, message: any, options: any) {
        const resetCommand = 'reset';
        const allCommand = 'all';
        const helpCommand = 'help';
        if (args.startsWith(resetCommand)) {
            return this._executeResetCmd(args.replace(resetCommand + ' ', ''), message, options, user);
        }
        if (args.startsWith(allCommand)) {
            return this._sendAllRollsMessage(message, options, user);
        }
        if (args.startsWith(helpCommand)) {
            return this._sendHelpMessage(message, options, user);
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