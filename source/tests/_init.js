(function() {
    // add the elements that WSK will expect to be in the DOM
    var querySelector = document.querySelector.bind(document);
    var body = document.body;
    function createIfMissing(withClass) {
        var existing = querySelector('.' + withClass);
        if (existing) {
            return;
        }
        var el = document.createElement('div');
        el.classList.add(withClass);
        body.appendChild(el);
    }
    ['navdrawer-container', 'app-bar', 'menu'].forEach(function(item) {
        createIfMissing(item);
    });
    if (!querySelector('main')) {
        body.appendChild(document.createElement('main'));
    }
})();
