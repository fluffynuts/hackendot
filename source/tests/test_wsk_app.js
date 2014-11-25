describe("WSK app", function() {
    function ensureSomeMenuExists() {
        var navdrawerContainer = $(".navdrawer-container");
        var ul = navdrawerContainer.find("ul");
        if (ul.length === 0) {
            ul = $("<ul><ul>");
            ul.appendTo(navdrawerContainer);
        }
        var li = ul.find("li");
        if (li.length === 0) {
            li = $("<li></li>");
            li.appendTo(ul);
        }
        var a = li.find("a");
        if (a.length === 0) {
            a = $("<a></a>");
            a.text("link");
            a.attr("href", "#");
            a.appendTo(li);
        }
    }
    beforeEach(function() {
        spyOn(window, "toggleMenu");
        spyOn(window, "closeMenu");
        ensureSomeMenuExists();
        $.fx.off = true;
    });
    afterEach(function() {
        $.fx.off = false;
    });
    it("should export toggleMenu into the global namespace", function() {
        expect(typeof window.toggleMenu).toBe('function');
    });
    it("should bind the menu button click event to toggleMenu", function() {
        $(".menu").trigger("click");
        expect(window.toggleMenu).toHaveBeenCalled();
    });
    it("should bind a click on the main area to closeMenu", function() {
        $("main").trigger("click");
        expect(window.closeMenu).toHaveBeenCalled();
    });
    it("should not bind clicks on the navdrawer container to closeMenu", function() {
        $(".navdrawer-container").trigger("click");
        expect(window.closeMenu).not.toHaveBeenCalled();
    });
    it("should bind clicks on list items in the navdrawer container to closeMenu", function() {
        $(".navdrawer-container li").trigger("click");
        expect(window.closeMenu).toHaveBeenCalled();
    });
    
});
