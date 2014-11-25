"use strict";
window.RedirectHelper = window.RedirectHelper || {};
(function(ns) {
  function getSocket() {
      return window.tlantic.plugins.socket || {};
  }
  function TcpSocket() {
  }
  TcpSocket.prototype = {
    connect: function(host, port) {
      var d = $.Deferred();
      var self = this;
      getSocket().connect(function(connectionId) {
          self._connectionId = connectionId;
          self.gather = function(ev) {
              if (ev.metadata.connection.id === self._connectionId) {
                if (self._currentReceiver) {
                  self._currentReceiver(ev.metadata.data);
                }
              }
          };
          document.addEventListener(window.tlantic.plugins.socket.receiveHookName, self.gather);
          self._waitForConnection(d);
      }, function() {
          d.reject("Connect to " + host + ":" + port + " fails");
      },host, port);
      return d.promise();
    },
    write: function(data, lineReceiverFunction, attempts) {
      var d = $.Deferred();
      attempts = attempts || 0;
      var self = this;
      this._currentReceiver = function(data) {
        if (lineReceiverFunction) {
          lineReceiverFunction(data);
        } else {
          console.log(self._connectionId + " :: no lineReceiverFunction defined; data -> /dev/null");
        }
      };
      getSocket().send(function() {
        d.resolve();
      }, function(e) {
        if (attempts++ < 10) {
          window.setTimeout(function() {
            self.write(data, lineReceiverFunction, attempts);
          }, attempts * 50);
        } else {
          d.reject("Fuxed: " + e);
        }
      }, this._connectionId, data);
      return d.promise();
    },
    disconnect: function() {
      document.removeEventListener(window.tlantic.plugins.socket.receiveHookName, this.gather);
      var d = $.Deferred();
      try {
        getSocket().disconnect(function() {
          d.resolve();
        }, function() {
          d.reject();
        }, this._socketId);
      } catch (e) {
        d.reject(e);
      }
      return d.promise();
    },
    _waitForConnection: function(deferred, waited) {
      var self = this;
      window.setTimeout(function() {
        waited = waited || 0;
        var interval = 50;
        getSocket().isConnected(self._connectionId, function() {
          deferred.resolve(self._connectionId);
        }, function() {
          if (waited > 10000) {
            deferred.reject("Connection timeout");
          } else {
            window.setTimeout(function() {
              self._waitForConnection(deferred, waited + interval);
            }, interval);
          }
        });
      }, 50);
    },
  };

  function HttpRequest(userAgent) {
      this._userAgent = userAgent || "Mozilla/5.0 (Linux; Android 4.3; Nexus 7 Build/JSS15Q) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.72 Safari/537.36";
  }
  HttpRequest.prototype = {
    _grokRequestInfoFrom: function(url) {
      var parts = url.split("://");
      var host, port, path;
      if (parts.length === 1) {
        path = parts[0];
        port = 80;
      } else {
        path = parts[1];
        port = 80;    // TODO: handle other automatic port?
      }
      parts = path.split("/");
      host = parts[0];
      path = parts.slice(1, parts.length).join("/");
      parts = host.split(":");
      if (parts.length > 1) {
        port = parseInt(parts[1]);
        host = parts[0];
      }
      return {
        host: host,
        port: port,
        path: "/" + path
      };
    },
    head: function(url, attempts, deferred) {
      var self = this;
      attempts = attempts || 0;
      var requestInfo = this._grokRequestInfoFrom(url);
      var d = deferred || $.Deferred();
      var sock = new TcpSocket();
      var request = this._createRequestFor(requestInfo, "HEAD");
      sock.connect(requestInfo.host, requestInfo.port).then(function() {
        var buffer = [];
        sock.write(request, function(line) {
          if (line && line.trim() !== "") {
            buffer.push(line);
          } else {
            d.resolve(buffer);
            sock.disconnect();
          }
        }).fail(function() {
          if (attempts++ > 10) {
            d.reject("Unable to complete HEAD call");
          } else {
            self.head(url, attempts, d);
          }
        });
      });
      return d.promise();
    },
    _createRequestFor: function(requestInfo, method) {
      method = method || "GET";
      var request = [
                      method + " " + requestInfo.path + " HTTP/1.1",
                      "Host: " + requestInfo.host,
                      "User-Agent: " + this._userAgent,
                      "Accept: */*",
                      "Cache-Control: no-cache",
                      "Pragma: no-cache"
                    ].join("\r\n") + "\r\n";
      //console.log(request);
      return request;
    }
  };

  window.TcpSocket = TcpSocket;
  window.HttpRequest = HttpRequest;

  ns.traverse = function(url, d, list) {
    var setupTimeoutHandler = false;
    if (d === undefined) {
      setupTimeoutHandler = true;
    }
    d = d || $.Deferred();
    if (setupTimeoutHandler) {
      window.setTimeout(function() {
        if (d.state() !== "resolved") {
          d.reject("timed out");
        }
      }, 10000);
    }
    list = list || [];
    var h = new HttpRequest();
    h.head(url).then(function(lines) {
      var httpStatus = ns.grokStatusFrom(lines);
      var loc;
      switch (httpStatus) {
        case 301:
          loc = ns.grokLocationFrom(lines);
          console.log("301: " + loc);
          list.push(loc);
          ns.traverse(loc, d, list);
          break;
        case 302:
          loc = ns.grokLocationFrom(lines);
          console.log("302: " + loc);
          list.push(loc);
          d.resolve(list);
          break;
        default:
          d.resolve(url);
      }
    });
    return d.promise();
  };

  ns.grokStatusFrom = function(lines) {
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.match(/^HTTP\/1/)) {
        var parts = line.split(' ');
        return parseInt(parts[1]);
      }
    }
  };

  ns.grokLocationFrom = function(lines) {
    for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].split(':');
      if (parts.length > 1 && parts[0] === 'Location') {
        return parts.slice(1, parts.length).join(':').trim();
      }
    }
  };
  ns.canFollowRedirects = function() {
     return window.tlantic && window.tlantic.plugins && window.tlantic.plugins.socket;
  };
})(window.RedirectHelper);
