import utils from "../Utils"
import settings from "../Settings"
import meanComments from "../meanComments"
import reallyMeanComments from "../reallyMeanComments"

class RenderChatMessage {
    private static _instance: RenderChatMessage;
    private readonly _counterKey: string = 'counter';
    private static playerWhisperChance = 1000000; // out of 100

    private constructor() {
    }

    public static getInstance(): RenderChatMessage {
        if (!RenderChatMessage._instance) RenderChatMessage._instance = new RenderChatMessage();
        return RenderChatMessage._instance;
    }

    public checkIfBetter5eRollsIsInstalled(): boolean {
        return !!game.modules.get('betterrolls5e');
    }

    private _extractUserData(user: any): any {
        const id = user?._id;
        const name = user?.name;
        return id && name ? {id: id, name: name} : null;
    }

    private async _updateDiceRolls(recentRolls: number[], userData: any): Promise<void> {
        if (!userData) return;
        const counter = settings.getSetting(this._counterKey);
        const user = counter[userData.id];

        if (user) {
            for (let i = 1; i <= 20; i++) {
                if (recentRolls[i]) {
                    if (user.rolls[i]) {
                        user.rolls[i] += recentRolls[i];
                    }
                    else {
                        user.rolls[i] = recentRolls[i];
                    }
                }
            }
            user.name = userData.name;
        } else {
            const rolls:number[] = recentRolls; //rolls is initialized with recentRolls to account for a new player's first roll
            // counter data structure holds an array where on position x it is stored the number of times x has been rolled
            counter[userData.id] = {
                rolls,
                ...userData,
            }
        }
        utils.debug(counter);
        return settings.setSetting(this._counterKey, counter);return settings.setSetting(this._counterKey, counter);
    }

    // recentRolls holds on position x the number of times x has been rolled 
    public async extractSimpleAnalytics(roll: any, user: any): Promise<void> {
        const dice = roll._dice;
        if (!dice) return;
        
        const recentRolls = new Array(21).fill(0);
        if (dice[0].faces === 20) {
            const rolls = dice[0]?.rolls;
            for (let key in rolls) {
                const rollValue = rolls[key].roll;
                recentRolls[rollValue] += 1;              
            }
        }
        return this._updateDiceRolls(recentRolls, this._extractUserData(user));
    }

    public async extractBetter5eRollsAnalytics(chatMessage: any, user: string): Promise<void> {
        const dieRegex = /<li.*roll die d20.*>([0-9]+)<\/li>/g;
        const valueRegex = /(\d+)(?!.*\d)/g;
        const matches = chatMessage.match(dieRegex);
        if (!matches) return;
        
        const recentRolls = [];

        for (let i = 0; i < matches.length; i++) {
            const valueMatch = matches[i].match(valueRegex);
            const rollValue = recentRolls[valueMatch[0]];
            recentRolls[valueMatch[0]] = rollValue ? rollValue + 1 : 1;
        }
        return this._updateDiceRolls(recentRolls, this._extractUserData(user));
    }

    public calculateNumberOfRolls (rolls: any) { 
        return rolls.reduce((total: number, roll: number): number => {
            return total + roll;
        }, 0);
    }

    private selectRandomFromList(list: any){
        const listIndex = Math.floor(Math.random() * list.length);
        return list[listIndex];
    }

    public selectMeanComment(){
        return this.selectRandomFromList(meanComments);
    }

    public selectReallyMeanComment(){
        return this.selectRandomFromList(reallyMeanComments);
    }

    // takes all active players ids
    // generates random index
    // generates random value 0 -> 100
    public shouldIWhisper(roll: number){
        const players = game.users.filter(u => u.active).map(u => u.id);
        const randomPlayerIndex = Math.floor(Math.random() * players.length);
        const random = Math.floor(Math.random() * 100);
        if (random < RenderChatMessage.playerWhisperChance){
            if (roll === 20){
                this.createWhisperMessage(players[randomPlayerIndex], "mesaj sarcastic");
            }
            else if(roll === 1){
                this.createWhisperMessage(players[randomPlayerIndex], "alt mesaj sarcastic");                
            }
        }
    }

    public async createWhisperMessage(target: any, content: any){
        const message = {
            author: "Sadness-chan",
            alias: "Sadness-chan",
            name: "Sneak pick",
            content: content,
            whisper: [target]
        }
        let a = await ChatMessage.create(message);

    }

}

export default RenderChatMessage.getInstance();