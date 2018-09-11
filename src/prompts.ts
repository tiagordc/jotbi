import { Utils } from './utils'
import { Dashboard, IDashboard } from './dashboard'
import Cookies from 'js-cookie'

import 'core-js/fn/promise'

export class Prompts {
  //https://www.justanalytics.com/blog/geospatial-5
  //https://community.oracle.com/thread/3730170
  //http://obi2ru.blogspot.com/2013/02/biee11g-set-presentation-variable-by-javascript.html

  private static GetPromptManager(): Promise<any> {
    return new Promise((resolve, reject) => {
      const pm = (<any>window).PromptManager
      if (typeof pm === 'object') {
        resolve(pm.getPromptManager())
      } else {
        console.error('Not running under OTBI')
        reject()
      }
    })
  }

  public static GetByCaption(caption: string): Promise<any> {
    return this.GetPromptManager().then(pm => {
      const collections = pm.getAllPromptCollectionJSON()

      for (let i = 0; i < collections.length; i++) {
        const c = collections[i]
        for (let j = 0; j < c.promptSteps.length; j++) {
          const pstep = c.promptSteps[j]
          for (let k = 0; k < pstep.prompts.length; k++) {
            const p = pstep.prompts[k]
            if (p.caption === caption) {
              return p
            }
          }
        }
      }
    })
  }

  public static GetByType(promptType: string, controlType: string): Promise<any[]> {
    return this.GetPromptManager().then(pm => {
      const collections = pm.getAllPromptCollectionJSON()
      let result: any[] = []

      for (let i = 0; i < collections.length; i++) {
        const c = collections[i]
        for (let j = 0; j < c.promptSteps.length; j++) {
          const pstep = c.promptSteps[j]
          for (let k = 0; k < pstep.prompts.length; k++) {
            const p = pstep.prompts[k]
            if (p.promptType === promptType && p.uiControlType === controlType) {
              result.push(p)
            }
          }
        }
      }

      return result
    })
  }

  public static SetPrompt(caption: string, value: any, update: boolean): void {
    let promises = []
    promises.push(this.GetPromptManager())
    promises.push(this.GetByCaption(caption))

    Promise.all(promises).then(result => {
      let pm = result[0]
      let pInfo = result[1]

      let expression =
        "<sawx:expr xmlns:sawx='com.siebel.analytics.web/expression/v1.1' xsi:type='sawx:list' op='_OP_' emptyAsAllChoices='true' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'><sawx:expr xsi:type='sawx:sqlExpression'>_COLFORMULA_</sawx:expr><sawx:expr xsi:type='xsd:string'>_VAL_</sawx:expr></sawx:expr>"
      expression = expression
        .replace('_COLFORMULA_', pInfo.dataType.displayColumnFormula)
        .replace('_VAL_', value)
        .replace('_OP_', pInfo.operator)
      let xml = Utils.GetXML(expression)

      var action = update ? pm.FINISH_ACTION : pm.NEXT_ACTION
      pm.submitPrompt(pInfo.viewStatePath, update, action, xml)
    })
  }

  public static SaveAll(): void {
    let promises: Promise<any>[] = []
    promises.push(Dashboard.GetCurrent())
    promises.push(this.GetByType('columnFilterPrompt', 'dropDown'))

    Promise.all(promises).then(result => {
      let dashboard = <IDashboard>result[0]
      let dropdowns = result[1]
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
              currentFilter.push({ caption: value.caption, code: value.codeValue })
            }
          }
          if (currentFilter.length > 0) {
            saveFilters[current.caption] = currentFilter
          }
        }
      }

      Cookies.set(dashboard.Name, saveFilters, { expires: 365 })
    })
  }

  public static LoadAll(): void {
    Dashboard.GetCurrent().then(dashboard => {
      let savedFilters = Cookies.get(dashboard.Name)

      //Handle dropdowns
    })
  }
}
