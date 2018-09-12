import { Dashboard, IDashboard } from './dashboard';
import Cookies from 'js-cookie';
import 'core-js/fn/promise';

export class Prompts {

    //https://www.justanalytics.com/blog/geospatial-5
    //https://community.oracle.com/thread/3730170
    //http://obi2ru.blogspot.com/2013/02/biee11g-set-presentation-variable-by-javascript.html

    /**
     * Get prompt by display caption
     * @param caption prompt caption
     */
    public static GetByCaption(caption: string): Promise<IPrompt> {
        return new Promise((resolve, reject) => {
            try {

                const collections = window.PromptManager.getPromptManager().getAllPromptCollectionJSON();

                for (let i = 0; i < collections.length; i++) {
                    const c = collections[i];
                    for (let j = 0; j < c.promptSteps.length; j++) {
                        const pstep = c.promptSteps[j];
                        for (let k = 0; k < pstep.prompts.length; k++) {
                            const p = pstep.prompts[k];
                            if (p.caption === caption) {
                                p.viewStatePath = c.viewStatePath;
                                resolve(p);
                                return;
                            }
                        }
                    }
                }
    
                reject();

            }
            catch (e) {
                reject(e);
            }
        });
    }

    /** 
     * Get all prompts of a given typen
     * @param promptType type of filter, example: columnFilterPrompt
     * @param controlType ui control, example: dropDown
     */
    public static GetByType(promptType: string, controlType: string): Promise<IPrompt[]> {
        return new Promise((resolve, reject) => {
            try {

                const collections = window.PromptManager.getPromptManager().getAllPromptCollectionJSON();
                let result: IPrompt[] = [];

                for (let i = 0; i < collections.length; i++) {
                    const c = collections[i];
                    for (let j = 0; j < c.promptSteps.length; j++) {
                        const pstep = c.promptSteps[j];
                        for (let k = 0; k < pstep.prompts.length; k++) {
                            const p = pstep.prompts[k];
                            if (p.promptType === promptType && p.uiControlType === controlType) {
                                p.viewStatePath = c.viewStatePath;
                                result.push(p);
                            }
                        }
                    }
                }
    
                return resolve(result);

            }
            catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Get all page prompts
     */
    public static GetAll(): Promise<IPrompt[]> {
        return new Promise((resolve, reject) => {
            try {

                const collections = window.PromptManager.getPromptManager().getAllPromptCollectionJSON();
                let result: IPrompt[] = [];

                for (let i = 0; i < collections.length; i++) {
                    const c = collections[i];
                    for (let j = 0; j < c.promptSteps.length; j++) {
                        const pstep = c.promptSteps[j];
                        for (let k = 0; k < pstep.prompts.length; k++) {
                            const p = pstep.prompts[k];
                            p.viewStatePath = c.viewStatePath;
                            result.push(p);
                        }
                    }
                }
    
                return resolve(result);

            }
            catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Set prompt value
     * @param caption prompt display caption
     * @param values list of values
     * @param update true if refresh the page after setting the prompt value
     */
    public static SetPrompt(caption: string, values: IPromptValue[], update: boolean): void {

        this.GetByCaption(caption)
            .then(prompt => {

                let promptValues = [];

                //get array of obiprp.PromptComponents.PromptValue objects
                for (let i = 0; i < values.length; i++) {
                    let val = values[i];
                    var current = new window.obiprp.PromptComponents.PromptValue(val.caption, val.codeValue, val.eType);
                    //let current = eval(`new obiprp.PromptComponents.PromptValue("${val.caption}", "${val.codeValue}", ${val.eType})`);
                    promptValues.push(current);
                }

                const action = update ? window.PromptManager.FINISH_ACTION : window.PromptManager.NEXT_ACTION;
                const pm = window.PromptManager.getPromptManager();
                const h = pm.getPromptCollectionInfoWithViewID(prompt.viewStatePath);
                const d = pm.getIndividualPrompt(h.sPromptCollectionID, prompt.promptStreamID);

                let a = {
                    oLayoutItemJSON: pm.getIndividualPromptJSON(h.sPromptCollectionID, prompt.promptStreamID),
                    promptValues: promptValues, //d.getValues(),
                    promptOp: d.getOperator(),
                    bEnterByCodeValue: d.isEnterByCodeValue(),
                    bFilterByCodeValue: false
                };

                if (a.oLayoutItemJSON && a.oLayoutItemJSON.dataType) {
                    a.bFilterByCodeValue = a.oLayoutItemJSON.dataType.isDoubleColumnInput
                }

                let xml = window.buildPromptCollectionFilterGivenPromptValues(h.sPromptCollectionID, prompt.promptStreamID, a);

                //code from h.getAllPromptExprsArray()
                let array: any = {};
                array[prompt.promptStreamID] = xml;
                window.PromptManager.buildPromptExprGivenExpr(" ", array); //will change xml namespaces
                window.PromptManager.submitPrompt(prompt.viewStatePath, update, action, xml);                

            });

    }

    /**
     * Save all prompts to cookie
     */
    public static SaveAll(): void {

        let promises: Promise<any>[] = [];
        promises.push(Dashboard.GetCurrent());
        promises.push(this.GetAll());

        Promise.all(promises).then(result => {

            let dashboard = <IDashboard> result[0];
            let prompts = <IPrompt[]> result[1];
            let saveFilters: any = {};

            for (let i = 0; i < prompts.length; i++) {
                let current = prompts[i];
                if (current.uiControlType === 'calendar') continue;
                if (current.currentValues && current.currentValues.values && current.currentValues.values.length > 0) {
                    let currentFilter = [];
                    for (let j = 0; j < current.currentValues.values.length; j++) {
                        let value = current.currentValues.values[j];
                        if (value.caption && value.codeValue && value.codeValue !== '*)nqgtac(*') {
                            currentFilter.push(value);
                        }
                    }
                    if (currentFilter.length > 0) {
                        saveFilters[current.caption] = currentFilter
                    }
                }
            }

            Cookies.set(dashboard.FriendlyName, saveFilters, { expires: 365 });

        })
    }

    /**
     * Load all prompts from cookie
     */
    public static LoadAll(): void {
        Dashboard.GetCurrent().then(dashboard => {

            let savedFilters = Cookies.getJSON(dashboard.FriendlyName);
            let keys = Object.keys(savedFilters);

            for (let i = 0; i < keys.length; i++) {
                const refresh = i === keys.length - 1;
                const key = keys[i];
                this.SetPrompt(key, savedFilters[key], refresh);
            }

        });
    }

}

export interface IPrompt {
    caption: string;
    promptType: string;
    uiControlType: string;
    operator: string;
    dataType: IPromptDataType;
    currentValues: IPromptCurrentValue;
    promptStreamID: string;
    viewStatePath: string; //doesn't acttually exist
}

export interface IPromptDataType {
    displayColumnFormula: string;
    codeColumnFormula: string;
    codeColumnPrimaryType: string;
    isDoubleColumnInput: boolean;
}

export interface IPromptCurrentValue {
    values: IPromptValue[];
}

export interface IPromptValue {
    caption: string;
    codeValue: any;
    eType: number;
}