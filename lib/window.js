var alloy = JSON.parse(
  atob(document.currentScript.getAttribute("data-config"))
);
alloy.url = new URL(alloy.url);

var presetTitle = "PortalByte";
var presetFavicon =
  "https://thumb.ac-illust.com/fa/fa93223f93b035d221622686e2c245e0_t.jpeg";

window.alloyLocation = new Proxy(
  {},
  {
    set(obj, prop, value) {
      if (
        prop == "assign" ||
        prop == "reload" ||
        prop == "replace" ||
        prop == "toString"
      )
        return;

      const newHref = alloy.url.href.replace(alloy.url[prop], value);
      console.log(proxify.url(newHref));
      console.log(newHref);

      return (location[prop] = proxify.url(newHref));
    },
    get(obj, prop) {
      if (
        alloy.url.origin == atob("aHR0cHM6Ly9kaXNjb3JkLmNvbQ==") &&
        alloy.url.pathname == "/app"
      )
        return window.location[prop];

      if (
        prop == "assign" ||
        prop == "reload" ||
        prop == "replace" ||
        prop == "toString"
      )
        return {
          assign: (arg) => window.location.assign(proxify.url(arg)),
          replace: (arg) => window.location.replace(proxify.url(arg)),
          reload: () => window.location.reload(),
          toString: () => {
            return alloy.url.href;
          },
        }[prop];
      else return alloy.url[prop];
    },
  }
);

window.document.alloyLocation = window.alloyLocation;

Object.defineProperty(document, "domain", {
  get() {
    return alloy.url.hostname;
  },
  set(value) {
    return value;
  },
});

var proxify = {
  url: (url, decode) => {
    if (!url) return;

    // Decode mode: decode proxified URL
    if (decode) {
      try {
        const cleanUrl = url.startsWith("/") ? url.substring(1) : url;

        // New full URL encoding format: _<base64fullurl>_/
        if (cleanUrl.startsWith("_") && cleanUrl.includes("_/")) {
          const parts = cleanUrl.split("_");
          if (parts.length >= 3 && parts[1]) {
            return atob(parts[1]);
          }
        }

        // Fallback to old format (compatibility)
        const parts = cleanUrl.split("_");
        if (parts.length >= 3) {
          const decodedOrigin = atob(parts[1]);
          const pathPart = parts.slice(2).join("_").replace(/^\//, "");
          return decodedOrigin + (pathPart ? "/" + pathPart : "");
        }

        return url;
      } catch (e) {
        console.error("Failed to decode proxified URL:", e);
        return url;
      }
    }

    // Encode mode: encode full URL
    try {
      if (
        url.match(/^(#|about:|data:|blob:|mailto:|javascript:|{|\*)/) ||
        url.startsWith(alloy.prefix) ||
        url.startsWith(window.location.origin + alloy.prefix)
      )
        return url;

      if (
        url.startsWith(window.location.origin + "/") &&
        !url.startsWith(window.location.origin + alloy.prefix)
      )
        url = "/" + url.split("/").splice(3).join("/");

      if (url.startsWith("//")) url = "http:" + url;
      if (url.startsWith("/") && !url.startsWith(alloy.prefix))
        url = alloy.url.origin + url;

      if (typeof url === "string") {
        url = new URL(url);
      }
      const encodedFullUrl = btoa(url.href);

      return alloy.prefix + "_" + encodedFullUrl + "_/";
    } catch (e) {
      console.error("Failed to encode URL:", e);
      return url;
    }
  },
};

proxify.url_http = (url) => {
  if (
    url.match(/^(#|about:|data:|blob:|mailto:|javascript:|{|\*)/) ||
    url.startsWith(alloy.prefix) ||
    url.startsWith(window.location.origin + alloy.prefix)
  )
    return url;

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("//")
  )
    return proxify.url(url);
  else if (alloy.baseURL) {
    if (url.startsWith("/"))
      return (url = proxify.url(
        alloy.baseURL.split("/").splice(0, 3).join("/") + url
      ));
    else
      return (url = proxify.url(
        alloy.baseURL.split("/").slice(0, -1).join("/") + "/" + url
      ));
  } else return proxify.url(url);
};

let originalFetch = window.fetch,
  originalXMLOpen = window.XMLHttpRequest.prototype.open,
  originalOpen = window.open,
  originalPostMessage = window.postMessage,
  originalSendBeacon = window.Navigator.prototype.sendBeacon;

window.fetch = function (url, options) {
  if (url)
    url.replace(location.hostname, alloy.url.hostname),
      (url = proxify.url_http(url));
  return originalFetch.apply(this, arguments);
};
window.XMLHttpRequest.prototype.open = function (
  method,
  url,
  async,
  user,
  password
) {
  if (url)
    url.replace(location.hostname, alloy.url.hostname),
      (url = proxify.url_http(url));
  return originalXMLOpen.apply(this, arguments);
};
window.open = function (url, windowName, windowFeatures) {
  if (url) url = proxify.url(url);
  return originalOpen.apply(this, arguments);
};
window.postMessage = function (msg, origin, transfer) {
  if (origin) origin = location.origin;
  return originalPostMessage.apply(this, arguments);
};
window.Navigator.prototype.sendBeacon = function (url, data) {
  if (url) url = proxify.url(url);
  return originalSendBeacon.apply(this, arguments);
};

window.WebSocket = new Proxy(window.WebSocket, {
  construct(target, args) {
    var protocol;
    if (location.protocol == "https:") protocol = "wss://";
    else protocol = "ws://";

    args[0] =
      protocol +
      location.origin.split("/").splice(2).join("/") +
      alloy.prefix +
      "?ws=" +
      btoa(args[0]) +
      "&origin=" +
      btoa(alloy.url.origin);

    return Reflect.construct(target, args);
  },
});

proxify.elementHTML = (element_array) => {
  element_array.forEach((element) => {
    Object.defineProperty(element.prototype, "innerHTML", {
      set(value) {
        const elem = new DOMParser()
          .parseFromString(
            Object.getOwnPropertyDescriptor(
              window.Element.prototype,
              "outerHTML"
            ).get.call(this),
            "text/html"
          )
          .body.querySelectorAll("*")[0];
        Object.getOwnPropertyDescriptor(
          window.Element.prototype,
          "innerHTML"
        ).set.call(elem, value);
        elem
          .querySelectorAll(
            "script[src], iframe[src], embed[src], audio[src], img[src], input[src], source[src], track[src], video[src]"
          )
          .forEach((node) =>
            node.setAttribute("src", node.getAttribute("src"))
          );
        elem
          .querySelectorAll("object[data]")
          .forEach((node) =>
            node.setAttribute("data", node.getAttribute("data"))
          );
        elem
          .querySelectorAll("a[href], link[href], area[href")
          .forEach((node) =>
            node.setAttribute("href", node.getAttribute("href"))
          );
        return Object.getOwnPropertyDescriptor(
          window.Element.prototype,
          "innerHTML"
        ).set.call(this, elem.innerHTML);
      },
      get() {
        return Object.getOwnPropertyDescriptor(
          window.Element.prototype,
          "innerHTML"
        ).get.call(this);
      },
    });
    Object.defineProperty(element.prototype, "outerHTML", {
      set(value) {
        const elem = new DOMParser().parseFromString(
          Object.getOwnPropertyDescriptor(
            window.Element.prototype,
            "outerHTML"
          ).get.call(this),
          "text/html"
        ).body;
        Object.getOwnPropertyDescriptor(
          window.Element.prototype,
          "outerHTML"
        ).set.call(elem.querySelectorAll("*")[0], value);
        elem
          .querySelectorAll(
            "script[src], iframe[src], embed[src], audio[src], img[src], input[src], source[src], track[src], video[src]"
          )
          .forEach((node) =>
            node.setAttribute("src", node.getAttribute("src"))
          );
        elem
          .querySelectorAll("object[data]")
          .forEach((node) =>
            node.setAttribute("data", node.getAttribute("data"))
          );
        elem
          .querySelectorAll("a[href], link[href], area[href")
          .forEach((node) =>
            node.setAttribute("href", node.getAttribute("href"))
          );
        return Object.getOwnPropertyDescriptor(
          window.Element.prototype,
          "outerHTML"
        ).set.call(this, elem.innerHTML);
      },
      get() {
        return Object.getOwnPropertyDescriptor(
          window.Element.prototype,
          "outerHTML"
        ).get.call(this);
      },
    });
  });
};

proxify.elementAttribute = (element_array, attribute_array) => {
  element_array.forEach((element) => {
    if (element == window.HTMLScriptElement) {
      Object.defineProperty(element.prototype, "integrity", {
        set(value) {
          return this.removeAttribute("integrity");
        },
        get() {
          return this.getAttribute("integrity");
        },
      });
      Object.defineProperty(element.prototype, "nonce", {
        set(value) {
          return this.removeAttribute("nonce");
        },
        get() {
          return this.getAttribute("nonce");
        },
      });
    }

    element.prototype.setAttribute = new Proxy(element.prototype.setAttribute, {
      apply(target, thisArg, [element_attribute, value]) {
        attribute_array.forEach((array_attribute) => {
          if (
            array_attribute == "srcset" &&
            element_attribute.toLowerCase() == array_attribute
          ) {
            var arr = [];

            value.split(",").forEach((url) => {
              url = url.trimStart().split(" ");
              url[0] = proxify.url_http(url[0]);
              arr.push(url.join(" "));
            });

            return Reflect.apply(target, thisArg, [
              element_attribute,
              arr.join(", "),
            ]);
          }

          if (element_attribute.toLowerCase() == array_attribute)
            value = proxify.url_http(value);
        });
        return Reflect.apply(target, thisArg, [element_attribute, value]);
      },
    });

    attribute_array.forEach((attribute) => {
      Object.defineProperty(element.prototype, attribute, {
        set(value) {
          return this.setAttribute(attribute, value);
        },
        get() {
          return this.getAttribute(attribute);
        },
      });
    });
  });
};

document.write = new Proxy(document.write, {
  apply(target, thisArg, args) {
    var processedHTML = new DOMParser().parseFromString(args[0], "text/html");

    processedHTML
      .querySelectorAll(
        "script[src], iframe[src], embed[src], audio[src], img[src], input[src], source[src], track[src], video[src]"
      )
      .forEach((node) => node.setAttribute("src", node.getAttribute("src")));
    processedHTML
      .querySelectorAll("object[data]")
      .forEach((node) => node.setAttribute("data", node.getAttribute("data")));
    processedHTML
      .querySelectorAll("a[href], link[href], area[href")
      .forEach((node) => node.setAttribute("href", node.getAttribute("href")));

    return Reflect.apply(target, thisArg, [
      processedHTML.querySelector("html").outerHTML,
    ]);
  },
});

proxify.elementHTML([window.HTMLDivElement]);

proxify.elementAttribute(
  [window.HTMLAnchorElement, window.HTMLLinkElement, window.HTMLAreaElement],
  ["href"]
);

proxify.elementAttribute(
  [
    window.HTMLScriptElement,
    window.HTMLIFrameElement,
    window.HTMLEmbedElement,
    window.HTMLAudioElement,
    window.HTMLInputElement,
    window.HTMLTrackElement,
    window.HTMLVideoElement,
  ],
  ["src"]
);

proxify.elementAttribute(
  [window.HTMLImageElement, HTMLSourceElement],
  ["src", "srcset"]
);

proxify.elementAttribute([window.HTMLObjectElement], ["data"]);

proxify.elementAttribute([window.HTMLFormElement], ["action"]);

window.History.prototype.pushState = new Proxy(
  window.History.prototype.pushState,
  {
    apply(target, thisArg, args) {
      if (
        alloy.url.origin == atob("aHR0cHM6Ly9kaXNjb3JkLmNvbQ==") &&
        args[2] == "/app"
      ) {
        args[2] = proxify.url(args[2]);
        Reflect.apply(target, thisArg, args);
        return window.location.reload();
      }

      args[2] = proxify.url(args[2]);
      return Reflect.apply(target, thisArg, args);
    },
  }
);

window.History.prototype.replaceState = new Proxy(
  window.History.prototype.replaceState,
  {
    apply(target, thisArg, args) {
      args[2] = proxify.url(args[2]);
      return Reflect.apply(target, thisArg, args);
    },
  }
);

window.Worker = new Proxy(window.Worker, {
  construct(target, args) {
    args[0] = proxify.url(args[0]);
    return Reflect.construct(target, args);
  },
});

Object.defineProperty(document, "cookie", {
  get() {
    var cookie = Object.getOwnPropertyDescriptor(
        window.Document.prototype,
        "cookie"
      ).get.call(this),
      new_cookie = [],
      cookie_array = cookie.split("; ");

    cookie_array.forEach((cookie) => {
      const cookie_name = cookie.split("=").splice(0, 1).join(),
        cookie_value = cookie.split("=").splice(1).join();

      if (alloy.url.hostname.includes(cookie_name.split("@").splice(1).join()))
        new_cookie.push(
          cookie_name.split("@").splice(0, 1).join() + "=" + cookie_value
        );
    });
    return new_cookie.join("; ");
  },
  set(value) {
    return Object.getOwnPropertyDescriptor(
      window.Document.prototype,
      "cookie"
    ).set.call(this, value);
  },
});

document.addEventListener("DOMContentLoaded", function () {
  document.title = presetTitle;

  var faviconLink = document.querySelector('link[rel="icon"]');
  if (!faviconLink) {
    faviconLink = document.createElement("link");
    faviconLink.rel = "icon";
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = presetFavicon;

  Object.defineProperty(document, "title", {
    set(value) {
      document.title = presetTitle;
    },
    get() {
      return document.title;
    },
    configurable: true,
    enumerable: true,
  });

  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "attributes") {
        if (mutation.target.rel === "icon") {
          mutation.target.href = presetFavicon;
        }
      }
    });
  }).observe(document.head, {
    childList: true,
    attributes: true,
    subtree: true,
  });
});

document.currentScript.remove();
