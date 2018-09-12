import { Utils } from './utils'
import 'core-js/fn/promise'

export class Dashboard {
  public static GetCurrent(): Promise<IDashboard> {
    return new Promise((resolve, reject) => {
      try {
        const viewState = window.document.getElementById('idViewStateDiv')
        if (viewState == null) {
          reject()
          return
        }

        const path = viewState.getAttribute('statepath')
        if (path == null) {
          reject()
          return
        }

        const controller = window.obips.views.ViewController.getController(path)

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

  public static FitToWindow(report: any): void {
    for (let i = 0; i < report.childViewIDList.length; i++) {
      const childViewId = report.childViewIDList[i]
      const scrollingTable = report._childScrollInfo[childViewId].container
      const scrollingHeader: any = document.getElementById('DashboardPageContentDiv')
      const fitContent: any = document.querySelectorAll('div.FitContent')[0]

      //find first parent with class p_AFMedium
      let elem: any = window.frameElement
      while (elem != null) {
        if (elem.tagName === 'DIV' && elem.className && elem.className.indexOf('p_AFMedium') !== -1)
          break
        elem = elem.parentElement
      }

      report.pivotContainer.firstElementChild.style.width = '100%'
      fitContent.style.width = '100%'
      elem.style.width = ''

      const contentWidth = report.pivotContainer.getBoundingClientRect().width
      const oldWidth = parseInt(scrollingTable.attributes['_width'].value)
      const change = scrollingTable.querySelectorAll('div[style]')

      //change divs with hardcoded width or left
      for (let j = 0; j < change.length; j++) {
        const current = change[j]
        if (/^[\d]+px$/.test(current.style.width)) {
          const currentWidth = parseInt(current.style.width.replace('px', ''))
          const diffWidth = oldWidth - currentWidth
          if (diffWidth >= 0 && diffWidth < 25) {
            current.style.width = contentWidth - diffWidth - 10 + 'px'
          }
        }
        if (/^[\d]+px$/.test(current.style.left)) {
          const currentLeft = parseInt(current.style.left.replace('px', ''))
          const diffLeft = oldWidth - currentLeft
          if (diffLeft >= 0 && diffLeft < 25) {
            current.style.left = contentWidth - diffLeft - 10 + 'px'
          }
        }
      }

      window.setTimeout(function() {
        elem.style.height = scrollingHeader.scrollHeight + 100 + 'px'
      }, 50)
    }
  }
}

export interface IDashboard {
  Name: string
  Path: string
  Controller: string
  Page: string
  FriendlyName: string
}
