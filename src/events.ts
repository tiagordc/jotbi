import 'core-js/fn/promise';

export class Events {

    public static OnHttp(callback: ((b: any, d: any) => void)): void {

        const win = <any>window;

        if (typeof win.__HttpCallbacks === 'undefined') {

            win.__HttpCallbacks = [];
            win.__HttpCallbacks.push(callback);
            win.__HttpNotification = win.saw.ajax.Connection._handleNotification;

            win.saw.ajax.Connection._handleNotification = function (b: any, d: any) {
                win.__HttpNotification(b, d);
                for (let i = 0; i < win.__HttpCallbacks.length; i++) {
                    let cb = win.__HttpCallbacks[i];
                    cb(b, d);
                }
            };

        }
        else if (win.__HttpCallbacks.indexOf(callback) === -1) {
            win.__HttpCallbacks.push(callback);
        }

    }

    public static OnButtonClick(callback: ((button: string, a: MouseEvent) => boolean)): void {

        const win = <any>window;

        if (typeof win.__ButtonCallbacks === 'undefined') {

            win.__ButtonCallbacks = [];
            win.__ButtonCallbacks.push(callback);
            win.__ButtonHandler = win.obips.FormFields.Button.clickHandler;

            win.obips.FormFields.Button.clickHandler = function (a: any) {

                let text = null;
                try { text = a.currentTarget.value; }
                catch (e) {}

                for (let i = 0; i < win.__ButtonCallbacks.length; i++) {
                    let cb = win.__ButtonCallbacks[i];
                    let cbResult = cb(text, a);
                    if (cbResult === false) return;
                }

                win.__ButtonHandler(a);

            };

        }
        else if (win.__ButtonCallbacks.indexOf(callback) === -1) {
            win.__ButtonCallbacks.push(callback);
        }

    }

    public static OnViewModel(callback: ((id: string, report: any, reload: boolean) => void)): void {

        const win = <any>window;

        for (var key in win.document.body) {
            if (win.document.body.hasOwnProperty(key) && /^saw_[\w_]+$/i.test(key) && key.indexOf('Cache') === -1) {
                const report = win.document.body[key];
                callback(key, report, false);
            }
        }

        if (typeof win.__ViewModelCallbacks === 'undefined') {

            win.__ViewModelCallbacks = [];
            win.__ViewModelCallbacks.push(callback);
            win.__ViewModelConstructor = window.obips.ViewModel.baseConstructor;
            
            win.obips.ViewModel.baseConstructor = function (j: string, k: any, l: any, c: any, b: any, f: any, g: any, a: any, e: any, h: any) {
                
                win.__ViewModelConstructor.call(this, j, k, l, c, b, f, g, a, e, h);

                let checkViewModel = setInterval(function () {
                    if (typeof win.document.body[j] === 'object') {
                        clearInterval(checkViewModel);
                        const report = win.document.body[j];
                        for (let i = 0; i < win.__ViewModelCallbacks.length; i++) {
                            let cb = win.__ViewModelCallbacks[i];
                            cb(j, report, true);
                        }
                    }
                }, 50);

            };

        }
        else if (win.__ViewModelCallbacks.indexOf(callback) === -1) {
            win.__ViewModelCallbacks.push(callback);
        }

    }

}