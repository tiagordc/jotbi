import { Utils } from './utils'
import { Dashboard, IDashboard } from './dashboard'
import Cookies from 'js-cookie'
import 'core-js/fn/promise'

export class Prompts {
  //https://www.justanalytics.com/blog/geospatial-5
  //https://community.oracle.com/thread/3730170
  //http://obi2ru.blogspot.com/2013/02/biee11g-set-presentation-variable-by-javascript.html

  private static GetPromptManager(): Promise<IPromptManager> {
    return new Promise((resolve, reject) => {
      const win = <any>window
      const pm = <IPromptManager>win.PromptManager
      if (typeof pm !== 'undefined') {
        resolve(pm)
      } else {
        console.error('Not running under OTBI')
        reject()
      }
    })
  }

  public static GetByCaption(caption: string): Promise<IPrompt> {
    return this.GetPromptManager().then(pm => {
      const collections = pm.getPromptManager().getAllPromptCollectionJSON()

      for (let i = 0; i < collections.length; i++) {
        const c = collections[i]
        for (let j = 0; j < c.promptSteps.length; j++) {
          const pstep = c.promptSteps[j]
          for (let k = 0; k < pstep.prompts.length; k++) {
            const p = pstep.prompts[k]
            if (p.caption === caption) {
              p.viewStatePath = c.viewStatePath
              return Promise.resolve(p)
            }
          }
        }
      }

      return Promise.reject(null)
    })
  }

  public static GetByType(promptType: string, controlType: string): Promise<IPrompt[]> {
    return this.GetPromptManager().then(pm => {
      const collections = pm.getPromptManager().getAllPromptCollectionJSON()
      let result: IPrompt[] = []

      for (let i = 0; i < collections.length; i++) {
        const c = collections[i]
        for (let j = 0; j < c.promptSteps.length; j++) {
          const pstep = c.promptSteps[j]
          for (let k = 0; k < pstep.prompts.length; k++) {
            const p = pstep.prompts[k]
            if (p.promptType === promptType && p.uiControlType === controlType) {
              p.viewStatePath = c.viewStatePath
              result.push(p)
            }
          }
        }
      }

      return Promise.resolve(result)
    })
  }

  public static SetPrompt(caption: string, value: any, update: boolean): void {
    let promises: Promise<any>[] = []
    promises.push(this.GetPromptManager())
    promises.push(this.GetByCaption(caption))

    let pm: IPromptManager
    let pInfo: IPrompt

    Promise.all(promises)
      .then(result => {
        pm = <IPromptManager>result[0]
        pInfo = <IPrompt>result[1]

        let expression =
          "<sawx:expr xmlns:sawx='com.siebel.analytics.web/expression/v1.1' xsi:type='sawx:list' op='_OP_' emptyAsAllChoices='true' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'><sawx:expr xsi:type='sawx:sqlExpression'>_COLFORMULA_</sawx:expr><sawx:expr xsi:type='xsd:string'>_VAL_</sawx:expr></sawx:expr>"
        expression = expression
          .replace('_COLFORMULA_', pInfo.dataType.displayColumnFormula)
          .replace('_VAL_', value)
          .replace('_OP_', pInfo.operator)

        return Utils.GetXML(expression)
      })
      .then(v => {
        if (pInfo.viewStatePath) {
          const action = update ? pm.FINISH_ACTION : pm.NEXT_ACTION
          pm.submitPrompt(pInfo.viewStatePath, update, action, v)
        }
      })
  }

  public static SaveAll(): void {
    let promises: Promise<any>[] = []
    promises.push(Dashboard.GetCurrent())
    promises.push(this.GetByType('columnFilterPrompt', 'dropDown'))

    Promise.all(promises).then(result => {
      let dashboard = <IDashboard>result[0]
      let dropdowns = <IPrompt[]>result[1]
      let saveFilters: any = {}

      //Handle dropdowns
      for (let i = 0; i < dropdowns.length; i++) {
        let current = dropdowns[i]
        if (
          current.currentValues &&
          current.currentValues.values &&
          current.currentValues.values.length > 0
        ) {
          let currentFilter = []
          for (let j = 0; j < current.currentValues.values.length; j++) {
            let value = current.currentValues.values[j]
            if (value.caption && value.codeValue && value.codeValue !== '*)nqgtac(*') {
              currentFilter.push({
                caption: value.caption,
                code: value.codeValue,
                controlType: 'dropDown'
              })
            }
          }
          if (currentFilter.length > 0) {
            saveFilters[current.caption] = currentFilter
          }
        }
      }

      Cookies.set(dashboard.FriendlyName, saveFilters, { expires: 365 })
    })
  }

  public static LoadAll(): void {
    Dashboard.GetCurrent().then(dashboard => {
      let savedFilters = Cookies.getJSON(dashboard.FriendlyName)
      let keys = Object.keys(savedFilters)

      for (let i = 0; i < keys.length; i++) {
        const refresh = i === keys.length - 1
        const key = keys[i]
        const values = savedFilters[key]
        let value = ''

        for (let j = 0; j < values.length; j++) {
          if (j > 0) value += ';'
          value += values[j].caption
        }

        this.SetPrompt(key, value, refresh)
      }
    })
  }
}

export interface IPromptManager {
  FINISH_ACTION: string
  NEXT_ACTION: string
  submitPrompt(path: string, update: boolean, action: string, xml: any): void
  getPromptManager(): IPromptManagerInstance
}

export interface IPromptManagerInstance {
  getAllPromptCollectionJSON(): IPromptCollection[]
}

export interface IPromptCollection {
  promptSteps: IPromptStep[]
  viewStatePath: string
}

export interface IPromptStep {
  prompts: IPrompt[]
}

export interface IPrompt {
  caption: string
  promptType: string
  uiControlType: string
  operator: string
  dataType: IPromptDataType
  currentValues: IPromptCurrentValue

  viewStatePath?: string
}

export interface IPromptDataType {
  displayColumnFormula: string
}

export interface IPromptCurrentValue {
  values: IPromptValue[]
}

export interface IPromptValue {
  caption: string
  codeValue: any
}
