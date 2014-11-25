module.exports = function(config) {
    config.set({
            autoWatch: false,
            frameworks: ['jasmine'],
            reporters: [ 'progress', 'junit' ],
            browsers: ['Chrome'], //, 'Firefox', 'PhantomJS']
    });
};
