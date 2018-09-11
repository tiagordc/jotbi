import 'core-js/fn/promise'

// https://github.com/Microsoft/TypeScript/blob/master/lib/lib.scripthost.d.ts
interface ActiveXObject {
  new (s: string): any
}
declare var ActiveXObject: ActiveXObject

export class Utils {
  public static GetXML(contents: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let anyWindow: any = <any>window
      let xmlDoc: any

      if (anyWindow.DOMParser) {
        var parser = new DOMParser()
        xmlDoc = parser.parseFromString(contents, 'text/xml')
      } else {
        xmlDoc = new ActiveXObject('Microsoft.XMLDOM')
        xmlDoc.async = false
        xmlDoc.loadXML(contents)
      }

      resolve(xmlDoc)
    })
  }
}
