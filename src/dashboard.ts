import 'core-js/fn/promise'

export class Dashboard {
  public static GetCurrent(): Promise<IDashboard> {
    return new Promise((resolve, reject) => {
      try {
        const viewState = <any>document.getElementById('idViewStateDiv')
        const path: string = viewState.getAttribute('statepath')
        const args = (<any>window).obips.views.ViewController.getController(path).viewEnv.argMap
        resolve({ Name: args.DashboardCaption, Path: args.PortalPath, Controller: path })
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
}
