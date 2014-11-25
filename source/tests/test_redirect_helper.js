describe("HttpRequest", function() {
  function create() {
    return new HttpRequest();
  }
  it("should be defined in the global scope", function() {
    expect(window.HttpRequest).toBeDefined();
  });
  describe("_createRequestFor", function() {
    it("should be defined", function() {
      expect(create()._createRequestFor).toBeDefined();
    });
    it("should return the expected request headers", function() {
      var userAgent = "fakeUserAgent";
      var sut = new HttpRequest(userAgent);
      var url = "http://somehost.somedomain/some/path.html";
      var expected = [
        "GET /some/path.html HTTP/1.1",
        "Host: somehost.somedomain",
        "User-Agent: " + userAgent,
        "Accept: */*",
        "Cache-Control: no-cache",
        "Pragma: no-cache"
        ].join("\r\n") + "\r\n";
      var result = sut._createRequestFor(sut._grokRequestInfoFrom(url));
      expect(result).toEqual(expected);
    });
  });
  describe("_grokRequestInfoFrom", function() {
    it("should be defined", function() {
      var sut = new HttpRequest();
      expect(sut._grokRequestInfoFrom).toBeDefined();
    });
    it("should parse a simple url to get the parts", function() {
      var url = "http://rss.slashdot.org/~r/Slashdot/slashdot/~3/t0o0K_CeQ6k/story01.htm";
      var sut = new HttpRequest();
      var result = sut._grokRequestInfoFrom(url);
      expect(result).toBeDefined();
      expect(result.host).toEqual("rss.slashdot.org");
      expect(result.port).toEqual(80);
      expect(result.path).toEqual("/~r/Slashdot/slashdot/~3/t0o0K_CeQ6k/story01.htm");
    });
  });
});

describe("RedirectHelper", function() {
  it("should be defined", function() {
    expect(window.RedirectHelper).toBeDefined();
  });
  var headers = [
'HTTP/1.1 301 Moved Permanently',
'Location: http://slashdot.feedsportal.com/c/35028/f/647410/s/3f2842fd/sc/29/l/0Lnews0…=feedburner&utm_medium=feed&utm_campaign=Feed:+Slashdot/slashdot+(Slashdot)',
'Content-Type: text/html; charset=UTF-8',
'Date: Mon, 06 Oct 2014 12:40:35 GMT',
'Expires: Mon, 06 Oct 2014 12:40:35 GMT'
]
  describe("RedirectHelper.grokStatusFrom", function() {
    it("should be defined", function() {
      expect(RedirectHelper.grokStatusFrom).toBeDefined();
    });
    it("should get the http status from a bunch of http header lines", function() {
      var result = RedirectHelper.grokStatusFrom(headers);
      expect(result).toBe(301);
    });
  });
  describe("RedirectHelper.grokLocationFrom", function() {
    it("should be defined", function() {
      expect(RedirectHelper.grokLocationFrom).toBeDefined();
    });
    it("should get the location from a bunch of headers", function() {
      var result = RedirectHelper.grokLocationFrom(headers);
      expect(result).toEqual("http://slashdot.feedsportal.com/c/35028/f/647410/s/3f2842fd/sc/29/l/0Lnews0…=feedburner&utm_medium=feed&utm_campaign=Feed:+Slashdot/slashdot+(Slashdot)");
    });
  });
});
