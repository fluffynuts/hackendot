'use strict';
window.Hackendot = window.Hackendot || {};
(function() {
    $.support.cors = true;
    var webHelper = window.WebHelper;
    var prefs = window.PrefsHelper;
    var noop = function() {};
    var app = {
        init: function() {
            this._target = $("main");
            this._loadDepth = 0;
            this.setupFeedsConfig();
            this.restorePreferences();
            this.addNavigationLinks();
            this.bindMenuButton();
            this.bindNavigation();
            this.loadStartPage();
            this.bindOptions();
            this.bindThemeSwitcher();
            this.bindFontSwitcher();
            this.bindLoadMethodOptions();
            this.fixBottomMenuItemsForSmallerScreens();
            this.show();
            this.bindPullToRefresh();
        },
        showLoadingFeedback: function() {
            this._loadingFeedbackElement = this._loadingFeedbackElement || this.createLoadingFeedbackElement();
            this._loadDepth++;
            this._loadingFeedbackElement.show();
        },
        hideLoadingFeedback: function() {
          if (--this._loadDepth <= 0) {
            var el = this._loadingFeedbackElement;
            if (el) {
              el.hide();
            }
          }
        },
        createLoadingFeedbackElement: function() {
          var el = $("<div></div>");
          el.attr("id", "loading-feedback");
          el.css({
            position: "fixed",
            top: "60px",
            backgroundColor: "rgb(55, 158, 158)",
            height: "2px",
            width: "100%",
          });
          el.hide();
          el.appendTo($("body"));
          var r = 25;
          var g = 108;
          var b = 108;
          var lighten = function() {
            var color = "rgb(" + (r++) + "," + (g++) + "," + (b++) + ")";
            el.css({backgroundColor: color}, 1000);
          };
          var darken = function() {
            var color = "rgb(" + (r--) + "," + (g--) + "," + (b--) + ")";
            el.css({backgroundColor: color}, 1000);
          };
          var shouldLighten = true;
          window.setInterval(function() {
            if (!el.is(":visible")) {
              return;
            }
            if (r > 140 || r < 20) {
              shouldLighten = !shouldLighten;
            }
            if (shouldLighten) {
              lighten();
            } else {
              darken();
            }
          }, 20);
          return el;
        },
        getKey: function() {
            var d = $.Deferred();
            $.get("http://m.slashdot.org", function(data) {
                var lines = data.split("\n");
                var apiKey = null;
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();
                    var parts = line.split(":");
                    if (parts.length !== 2) {
                        continue;
                    }
                    var k = parts[0].trim();
                    if (k === "apiKey") {
                        apiKey = parts[1].replace(/'|,/g, "");
                        break;
                    }
                }
                d.resolve(apiKey.trim());
            });
            return d.promise();
        },
        bindPullToRefresh: function() {
            this._target.pullToRefresh({ color: "#999" });
            var self = this;
            this._target.on("pulled", function() {
                self.onPulled();
            });
        },
        onPulled: function() {
            var self = this;
            self._abortBackgroundWork();
            window.Hackendot.AtomLoader.refresh().then(function() {
              self.applyCurrentThemeLinkColorOn($("main"));
              self.loadRicherContent();
            });
        },
        show: function() {
            $("#splash").hide();
            $("#content").show();
        },
        fixBottomMenuItemsForSmallerScreens: function() {
            var bottomList = $("ul.bottom");
            if (bottomList.length === 0) {
                return;
            }
            var bottomListTop = bottomList.position().top;
            var lastItem = $("ul.top li:last-child()");
            var lastItemBottom = lastItem.position().top + lastItem.height();
            if (bottomListTop <= lastItemBottom) {
                bottomList.css("position", "relative");
            }
        },
        restoreFontSize: function() {
            prefs.fetch(function(value) {
                app.setFontSize(value);
            }, function(e) {
                app.setFontSize("small");
            }, "fontSize");
        },
        restoreTheme: function() {
            prefs.fetch(function(value) {
                app.setTheme(value);
            }, function(e) {
                app.setTheme("light");
            }, "theme");
        },
        restoreFeedLoadType: function() {
            prefs.fetch(function(value) {
                app._loadMethod = value;
                app.setChecked("data-load-method", app._loadMethod);
            }, function(e) {
                app._loadMethod = "lighter";   
                app.setChecked("data-load-method", app._loadMethod);
            }, "load-method");
        },
        restorePreferences: function() {
            app.restoreFontSize();
            app.restoreTheme();
            app.restoreFeedLoadType();
        },
        setupFeedsConfig: function() {
            this.feeds = [["Main", "slashdot"],
                            ["Books", "slashdotBookReviews"],
                            ["Developers", "slashdotDevelopers"],
                            ["Apple", "slashdotApple"],
                            ["Gaming", "slashdotGames"],
                            ["Hardware", "slashdotHardware"],
                            ["Interviews", "slashdotInterviews"],
                            ["IT News", "slashdotit"],
                            ["Linux", "slashdotlinux"],
                            ["Politics", "slashdotpolitics"],
                            ["Science", "slashdotscience"]];
        },
        addNavigationLinkFor: function(ul, name, url) {
            var item = $("<span></span>");
            item.text(name);
            item.attr("data-feed-url", url);
            var li = $("<li></li>");
            item.appendTo(li);
            li.appendTo(ul);
        },
        addDefaultFeedOptionFor: function(title, category) {
            var container = $("div#options div#defaultFeedOptions");
            var item = $("<div></div>");
            item.attr("data-category", category);
            item.addClass("unchecked");
            item.text(title);
            item.appendTo(container);
            item.on("click", function() {
                app.setDefaultCategory(category);
            });
        },
        setDefaultCategory: function(category) {
            prefs.store(noop, noop, "defaultCategory", category);
            app.setChecked("data-category", category);
        },
        addNavigationLinks: function() {
            var ul = $(".navdrawer-container ul:first()");
            ul.children().remove();
            [["Main", "slashdot"],
                ["Books", "slashdotBookReviews"],
                ["Developers", "slashdotDevelopers"],
                ["Apple", "slashdotApple"],
                ["Gaming", "slashdotGames"],
                ["Hardware", "slashdotHardware"],
                ["Interviews", "slashdotInterviews"],
                ["IT News", "slashdotit"],
                ["Linux", "slashdotlinux"],
                ["Politics", "slashdotpolitics"],
                ["Science", "slashdotscience"]].forEach(function(cfg) {
                    var title = cfg[0],
                        category = cfg[1],
                        url = app.urlForCategory(category);
                    app.addNavigationLinkFor(ul, title, url);
                    app.addDefaultFeedOptionFor(title, category);
                });

                $(".navdrawer-container ul li:last-child()").css({borderRight: "none"});

                app.setChecked("data-category", app.getDefaultCategory());
                var donateImg = $("img#donatePaypal");
                if (window.PaymentOptions && window.PaymentOptions.donationEnabled) {
                    donateImg.on("click", function() {
                            webHelper.openUrl("https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=ALERZYKJV3N2N&lc=ZA&item_name=Davyd%20McColl&item_number=hackendot&amount=1%2e00&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted");
                    });
                } else {
                    donateImg.hide();
                }
        },
        urlForCategory: function(category) {
            return ['http://rss.slashdot.org/Slashdot', category].join('/');
        },
        bindMenuButton: function() {
            document.addEventListener("menubutton", function() {
                window.console.log("menubutton pressed");
                window.toggleMenu();
            }, false);
        },
        bindNavigation: function() {
            var target = $("body main");
            var self = this;
            $(".navdrawer-container [data-feed-url]").each(function(idx, item) {
                self._abortBackgroundWork();
                window.Hackendot.AtomLoader.bindClick($(item), target, 
                                                                app.onFeedLoadSuccess, 
                                                                app.onFeedLoadFail);
            });
        },
        _abortBackgroundWork: function() {
          this._deferredLoad = [];
        },
        onFeedLoadFail: function(e) {
            var button = $("main button");
            app.themeButton(button);
        },
        getDefaultCategory: function() {
            prefs.fetch(function(value) {
                if (!value) {
                    value = "slashdot";
                    app.setDefaultCategory(value);
                }
                app._defaultCategory = value;
            }, function(e) {
                app.setDefaultCategory("slashdot");
                app._defaultCategory = "slashdot";
            }, "defaultCategory");
            return app._defaultCategory;
        },
        onFeedLoadSuccess: function(e) {
            app.restoreFontSize();
            app.restoreTheme();
            app.highlightCurrentFeedInMenu();
            app.loadRicherContent();
        },
        loadRicherContent: function() {
          if (this._loadMethod !== "richer") {
              console.log("User prefers lighter content...");
              return;
          }
          if (!window.RedirectHelper.canFollowRedirects()) {
              console.log("richer content only available on supported platforms");
              return;
          }
          var self = this;
          this.showLoadingFeedback();
          this.getKey().then(function(key) {
              $("main div.storyBody").each(function() {
                  self._deferredLoad = self._deferredLoad || [];
                  self._deferredLoad.push({element: $(this), attempts: 0, key: key, url: $(this).attr("data-story-url")});
              });
              self._loadNext();
              window.setTimeout(function() {
                self._loadNext();
              }, 500);
              self.hideLoadingFeedback();
          });
        },
        _loadNext: function() {
          if (this._deferredLoad === undefined || this._deferredLoad.length === 0) {
            return;
          }
          this.showLoadingFeedback();
          var current = this._deferredLoad.shift();
          var el = current.element;
          var key = current.key;
          var url = current.url;
          var self = this;
          window.RedirectHelper.traverse(url).then(function(steps) {
              if (steps.length === 0) {
                  self.hideLoadingFeedback();
                  return;
              }
              var mobileUrl = steps[steps.length-1];
              var parts = mobileUrl.split("/");
              try {
                  var storyId = parseInt(parts[parts.length-1]);
                  self.loadAlternativeContent(storyId, el, key).then(function() {
                    self.hideLoadingFeedback();
                  }).fail(function(err) {
                    if (current.attempts++ < 3) {
                      window.console.log(current.url + " :: load alt. content fails (" + err + "); will try again");
                      self._deferredLoad.unshift(current);
                      self.hideLoadingFeedback();
                    }
                  });
              } catch (e) {
                  if (current.attempts++ < 3) {
                    window.console.log(current.url + " :: load alt. content fails badly (" + e + "); will try again");
                    self._deferredLoad.unshift(current);
                  } else {
                    console.log("Couldn't load alternative content (last traversed url: " + mobileUrl + "); " + e);
                  }
                  self.hideLoadingFeedback();
              }
              self._loadNext();
          }).fail(function() {
            if (current.attempts++ < 3) {
              console.log("redirection traversal fails for " + current.url + "; will try again");
              self.hideLoadingFeedback();
              self._deferredLoad.unshift(current);
            }
            self._loadNext();
          });
        },
        loadAlternativeContent: function(storyId, onElement, apiKey) {
            var d = $.Deferred();
            var jsonUrl = "http://m.slashdot.org/api/v1/story/" + storyId + ".json?api_key=" + apiKey;
            var self = this;
            $.get(jsonUrl).then(function(data) {
              self.replaceContent(data, onElement);
              self.applyCurrentThemeLinkColorOn(onElement);
              d.resolve();
            }).fail(function(err) {
              console.log(err);
              d.reject(err);
            });
            return d.promise();
        },
        replaceContent: function(data, el) {
          var newContent = window.XmlHelper.parseXml(data.introtext);
          for (var i = 0;i < newContent.length; i++) {
            var current = newContent[i];
            if (current.nodeName !== "A" || current.href === undefined) {
              continue;
            }
            current.href = current.href.replace(/file:\/\//, "http://m.slashdot.org");
          }
          //Hackendot.AtomLoader.prototype.convertLinksToExternalOpen(newContent);
          el.children().remove();
          el.text("");
          newContent.appendTo(el);
          window.Hackendot.AtomLoader.prototype.convertLinksToExternalOpen(el);
        },
        highlightCurrentFeedInMenu: function() {
            $("main div.storyBody").css({marginTop: "10px", marginBottom: "10px"});
            var loadedUrl = $("main").attr("data-load-feed-url");
            var matchingNavItem = $("[data-feed-url='" + loadedUrl + "']");
            $("[data-feed-url]").css({fontStyle:"normal", paddingLeft: "0px"});
            matchingNavItem.css({fontStyle:"italic", paddingLeft: "10px", paddingRight: "10px"});
        },
        bindOptions: function() {
            var self = this;
            $("img#preferences").on("click", function() {
                self.showOptions();
            });
            $("#done").on("click", function() {
                self.hideOptions();
            });
            $("body").on("loading-started", function() {
                self.hideOptions();
            });
        },
        showOptions: function() {
            window.closeMenu();
            $("body").scrollTop(0);
            this._target.hide();
            $("div#options").show();
        },
        hideOptions: function() {
            window.closeMenu();
            $("div#options").hide();
            this._target.show();
        },
        bindThemeSwitcher: function() {
            var self = this;
            $("[data-theme]").on("click", function() {
                var setTo = $(this).attr("data-theme");
                self.setTheme(setTo);
            });
        },
        bindLoadMethodOptions: function() {
          var self = this;
          $("[data-load-method]").on("click", function() {
            var setTo = $(this).attr("data-load-method");
            self._loadMethod = setTo;
            self.setChecked("data-load-method", setTo);
            prefs.store(noop, noop, "load-method", setTo);
          });
        },
        setTheme: function(themeName) {
            var setDark = themeName === "dark";
            app.currentTheme = setDark ? "dark" : "light";
            if (setDark) {
                this.applyDarkTheme();
            } else {
                this.applyLightTheme();
            }
            this.setChecked("data-theme", themeName);
            prefs.store(noop, noop, "theme", themeName);
        },
        applyCurrentThemeLinkColorOn: function(el) {
            if (app.currentTheme === "dark") {
              this.applyDarkThemeLinkColor(el.find("a"));
            } else {
              this.applyLightThemeLinkColor(el.find("a"));
            }
        },
        themeButton: function(button, theme) {
            theme = theme || app.currentTheme;
            if (theme === "dark") {
                button.css("color", "#eee")
                            .css("background-color", "#444")
                            .css("border-color", "#222");
            } else {
                button.css("color", "#000")
                            .css("background-color", "#a0a0a0")
                            .css("border-color", "#444");
            }
        },
        applyDarkTheme: function() {
            $("body div#options, body div#options div").css("background-color", "#aaa");
            app.themeButton($("body div#options button, main button"), "dark");
            $("body .navdrawer-container, body .app-bar, body .navdrawer-container, body .navdrawer-container h4").css("color", "#efe").css("background-color", "#044");
            $("body, body main").css("color", "#efe").css("background-color", "#111");
            app.applyDarkThemeLinkColor($("a"));
        },
        applyDarkThemeLinkColor: function(onEl) {
            onEl.css({color: "rgb(55, 158, 158)"});
        },
        applyLightTheme: function() {
            $("body div#options, body div#options div").css("background-color", "#f0f0f0");
            app.themeButton($("body div#options button, main button"));
            $("body .navdrawer-container, body .app-bar, body .navdrawer-container, body .navdrawer-container h4").css("color", "#fefefe").css("background-color", "#166c6c");
            $("body, body main").css("color", "#000").css("background-color", "#fcfcfc");
            app.applyLightThemeLinkColor($("a"));
        },
        applyLightThemeLinkColor: function(onEl) {
          onEl.css({color: "rgb(15,88,88)"});
        },
        setChecked: function(attr, selectedValue) {
            $("[" + attr + "]").each(function(idx, item) {
                var selected = $(item).attr(attr) === selectedValue;
                var bgurl = (selected) ? "images/checked.png" : "images/unchecked.png";
                $(item).css("background-image", "url(" + bgurl + ")");
            });
        },
        bindFontSwitcher: function() {
            $("[data-font-size]").on("click", function() {
                var newSize = $(this).attr("data-font-size");
                app.setFontSize(newSize);
            });
        },
        setFontSize: function(size) {
            var setLarge = size === "large";
            if (setLarge) {
                this.applyLargerFonts();
            } else {
                this.applyRegularFonts();
            }
            this.setChecked("data-font-size", size);
            prefs.store(noop, noop, "fontSize", size);
        },
        applyLargerFonts: function() {
            $("body main h4").css("font-size", "36px");
            $("main").css("zoom", "1.1");
            $("body").css("font-size", "24px").css("line-height", "36px");
        },
        applyRegularFonts: function() {
            $("body main h4").css("font-size", "28px");
            $("main").css("zoom", "1");
            $("body").css("font-size", "16px").css("line-height", "1.625em");
        },
        loadFeed: function(url) {
            var loader = new window.Hackendot.AtomLoader();
            loader.loadXML(url, $("main"))
                    .then(app.onFeedLoadSuccess)
                    .fail(app.onFeedLoadFail);
        },
        loadStartPage: function() {
            app.loadFeed(app.urlForCategory(app.getDefaultCategory()));
        }
    };

    document.addEventListener('deviceready', function() {
        app.init();
    }, false);
    window.Hackendot.App = app;
})();
