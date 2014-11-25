(function() {
        try {
            function hasScriptTagForCordova() {
                return $("html,body").find("script[src='cordova.js']").length > 0;
            }
            function addCordovaJs() {
                var scriptTag = $("<scri" + "pt type='text/javascript' src='cordova.js'></scr" + "ipt>");
                scriptTag.appendTo($("body"));
            }
            function doMagick() {
                if (window.$ === undefined) {
                    return false;
                }
                if (!hasScriptTagForCordova() && (window.jasmine === undefined)) {
                    addCordovaJs();
                } else {
                    if (window.cordova === undefined) {
                        window.cordova = {
                        };
                        window.device = {
                            cordova: "Emulated",
                            platform: "Emulated",
                            uuid: "emulated",
                            version: "1.0"
                        };
                        window.setTimeout(function checkDocumentReady() {
                            if (document.readyState === "complete") {
                                document.dispatchEvent(new CustomEvent("deviceready", {
                                            detail: {
                                            },
                                            bubbles: true,
                                            cancelable: true
                                }));
                            } else {
                                window.setTimeout(checkDocumentReady, 50);
                            }
                        }, 50);
                    }
                }
                return true;
            }
            var tryDoMagick = function tryDoMagick () {
                if (!doMagick()) {
                    window.setTimeout(tryDoMagick, 50);
                }
            }
            tryDoMagick();
    } catch (e) { 
    }
})();
