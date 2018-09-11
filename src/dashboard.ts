import { Utils } from './utils'
import 'core-js/fn/promise'

export class Dashboard {
  public static GetCurrent(): Promise<IDashboard> {
    return new Promise((resolve, reject) => {
      try {
        const win = <any>window
        const viewState = <any>document.getElementById('idViewStateDiv')
        const path: string = viewState.getAttribute('statepath')
        const controller = <IController>win.obips.views.ViewController.getController(path)

        let result: IDashboard = {
          Name: controller.getViewEnvParam('DashboardCaption'),
          Path: controller.getViewEnvParam('PortalPath'),
          Page: controller.getViewEnvParam('Page'),
          Controller: path,
          FriendlyName: ''
        }

        result.FriendlyName = Utils.NormalizeString(`${result.Name} ${result.Page}`)
          .toLowerCase()
          .replace(/[^\w]/g, '_')
        resolve(result)
      } catch (e) {
        reject(e)
      }
    })
  }
}

export interface IDashboard {
  Name: string
  Path: string
  Controller: string
  Page: string
  FriendlyName: string
}

export interface IController {
  getViewEnvParam(name: string): string
  viewEnv: any
}
