"use strict";
window.XmlHelper = window.XmlHelper || {};
(function(ns) {
        ns.parseXml = function(text) {
            if (window.toStaticHTML === undefined) {
                return $($.parseHTML(text));
            }
            var el = document.createElement("div");
            el.innerHTML = window.toStaticHTML(text);
            return $(el);
        };
})(window.XmlHelper);
