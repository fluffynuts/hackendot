'use strict';
var Hackendot = Hackendot || {};
(function(ns) {
    var webHelper = window.WebHelper;
    var AtomLoader = function() {
    };
    AtomLoader.prototype = {
        getFullUrlFor: function(category) {
            return ['http://rss.slashdot.org/Slashdot', category].join('/');
        },
        getCssSize: function(el, attrib) {
            var raw = el.css(attrib);
            return parseInt(raw);
        },
        setLoading: function(target, feedUrl) {
            $("body").trigger("loading-started");
            target.children().remove();
            var loading = $("<div></div>");
            loading.css("position", "absolute");
            loading.css("left", $(window).width());
            loading.width(150);
            loading.height(150);
            loading.css("border-left", "8px solid #166c6c");
            loading.css("border-right", "8px solid #166c6c");
            loading.css("border-top", "8px solid transparent");
            loading.css("border-bottom", "8px solid transparent");
            loading.css("border-radius", "50%");
            loading.css("animation", "rotateanim 1.8s linear 0s infinite normal");
            // TODO: figure out how to get actual element width
            var left = ($(window).width() / 2) - 75;
            var top = ($(window).height() / 2) - 75;
            loading.css("left", left + "px");
            loading.css("top", top + "px");
            loading.appendTo(target);
            this.setOperationStatus(target, "busy");
        },
        setLoadingComplete: function(target) {
            $("body").trigger("loading-complete");
            target.children().remove();
            this.setOperationStatus(target, "success");
        },
        setLoadingFailed: function(target, feedUrl) {
            target.children().remove();
            var container = $("<div></div>");
            container.css({marginTop: "150px", textAlign: "center"});
            var button = $("<button></button>");
            button.text("Try again");
            var self = this;
            button.on("click", function() {
                var url = target.attr("data-load-feed-url");
                self.loadXML(url, target);
            });
            var messageContainer = $("<div></div>");
            messageContainer.css({fontSize: "x-large", marginBottom: "15px"});
            messageContainer.text("Unable to load feed :(");
            
            messageContainer.appendTo(container);
            button.appendTo(container);
            container.appendTo(target);

            $("body").trigger("loading-failed");
            this.setOperationStatus(target, "failed");
        },
        setOperationStatus: function(target, s) {
            target.attr("data-operation-status", s);
        },
        loadDocument: function(doc, target) {
        },
        loadXML: function(feedUrl, target) {
            window.closeMenu();
            var self = this;
            target = $(target);
            target.attr("data-load-feed-url", feedUrl);
            this.setLoading(target);
            var deferred = new $.Deferred();
            $.get(feedUrl).then(function(result) {
                var toAppend = [];
                self.clearTrackersFrom(result);
                var doc = $(result);
                if (result.results !== undefined) {
                    doc = $($.parseXML(result.results[0]));
                }
                self.setLoadingComplete(target);
                $(doc).find("item").each(function(idx, rssItem) {
                    rssItem = $(rssItem);
                    var blob = $("<div></div>");
                    blob.addClass("story");
                    
                    var title = $("<h4></h4>");
                    title.addClass("storyTitle");
                    var storyUrl = rssItem.find("link").text();
                    var storyTitle = rssItem.find("title").text();
                    var titleLink = self.createExternalAnchorFor(storyUrl, storyTitle);
                    titleLink.appendTo(title);

                    var body = self.getBodyFrom(rssItem);
                    body.attr("data-story-url", storyUrl);
                    body.attr("data-story-title", storyTitle);

                    title.appendTo(blob);
                    body.appendTo(blob);
                    toAppend.push(blob);
                });
                target.fadeOut(250, function() {
                    toAppend.forEach(function(el) {
                        el.appendTo(target);
                    });
                    target.fadeIn(250, function() {
                      target.trigger("loaded");
                      deferred.resolve();
                    });
                });
            }).fail(function(e) {
                self.setLoadingFailed(target);
                deferred.reject(e);
            });
            return deferred.promise();
        },
        clearTrackersFrom: function(doc) {
            var descriptions = doc.getElementsByTagName("description");
            var toFind = [
                /<img src=\"http:\/\/da.feedsportal.com\/r.*?\/>/,
                /<img src=\"http:\/\/feeds.feedburner.com\/~r.*?\/>/,
                /<img width=\"1\" height=\"1\".*?\/>/,
                /<img width='1' height='1'.*?\/>/,
            ];
            for (var i = 0; i < descriptions.length; i++) {
                var d = descriptions[i].textContent;
                for (var j = 0; j < toFind.length; j++) {
                    var re = toFind[j];
                    while (d.match(re)) {
                        d = d.replace(re, "");
                    }
                }
                descriptions[i].textContent = d;
            }
        },
        fixSocialImages: function(ctx) {
            var self = this;
            ctx.find("img").each(function(idx, item) {
                var src = $(item).attr("src");
                src = self.resolveLocalSocialIconFor(src);
                $(item).attr("src", src);
            });
        },
        getBodyFrom: function(item) {
            var description = item.find("description").text();
            //var descHtml = $($.parseHTML(description));

            var descHtml = window.XmlHelper.parseXml(description);

            this.fixSocialImages(descHtml);
            var result = $("<div></div>");
            result.addClass("storyBody");
            var stop = false;
            for (var i = 0; i < descHtml.length; i++) {
                if (stop) {
                    break;
                }
                var subItem = descHtml.get(i);
                var tagName = (subItem.tagName === undefined) ? "" : subItem.tagName.toLowerCase();
                var doAppend = false;
                switch (tagName) {
                    case "iframe":
                    case "br":
                        break;
                    case "a":
                        subItem = this.convertToExternalAnchor($(subItem));
                        subItem.appendTo(result);
                        break;
                    case "div":
                        if ($(subItem).hasClass("share_submission")) {
                            stop = true;
                        }
                        doAppend = true;
                        break;
                    case "p":
                        if ($(subItem).text() !== "") {
                            doAppend = true;
                        }
                        break;
                    case "img":
                        var src = $(subItem).attr("src");
                        src = this.resolveLocalSocialIconFor(src);
                        $(subItem).attr("src", src);
                        doAppend = true;
                        break;
                    default:
                        this.fixSocialImages($(subItem));
                        doAppend = true;
                }
                if (doAppend) {
                    var converted = this.convertLinksToExternalOpen(subItem);
                    converted.appendTo(result);
                }
            }
            result.find("br").remove();
            return result;
        },
        resolveLocalSocialIconFor: function(src) {
            var parts = src.split("/");
            var lastPart = parts[parts.length-1];
            switch(lastPart) {
                case "twitter_icon_large.png":
                    return "images/twitter.png";
                case "facebook_icon_large.png":
                    return "images/facebook.png";
                case "gplus-16.png":
                    return "images/googleplus.png";
                default:
                    return src;
            }
        },
        convertToExternalAnchor: function(a) {
            return this.createExternalAnchorFor($(a).attr("href"), $(a).text());
        },
        createExternalAnchorFor: function(url, text) {
            var a = $("<a></a>");
            a.attr("href", "#");
            a.text(text);
            var self = this;
            a.on("click", function(ev) {
                ev.preventDefault();
                self._openExternally(url);
            });
            return a;
        },
        convertLinksToExternalOpen: function(ctx) {
            var self = this;
            $(ctx).find("a").each(function(idx, item) {
                item = $(item);
                var url = item.attr("href");
                item.attr("href", "#");
                item.attr("data-original-url", url);
                item.removeAttr("onclick");
                item.on("click", function(ev) {
                    ev.preventDefault();
                    self._openExternally(url);
                });
            });
            return $(ctx);
        },
        _openExternally: function(url) {
            var scrollTop = $('body').scrollTop();
            webHelper.openUrl(url);
            window.setTimeout(function() {
                $('body').scrollTop(scrollTop);
            }, 10);
        }
    };
    AtomLoader.bindClick = function(navItem, target, onSuccess, onFail) {
        var feedUrl = $(navItem).attr("data-feed-url");
        var noop = function() {};
        $(navItem).on("click", function() {
            var loader = new AtomLoader();
            loader.loadXML(feedUrl, target)
                    .then(onSuccess || noop)
                    .fail(onFail || noop);
        });
    };
    AtomLoader.refresh = function() {
        var loaded = $("[data-load-feed-url]");
        if (loaded.length === 0) {
            var deferred = $.Deferred();
            return deferred.promise();
        }
        var loader = new AtomLoader();
        return loader.loadXML(loaded.attr("data-load-feed-url"), loaded);
    };
    ns.AtomLoader = AtomLoader;
})(Hackendot);

