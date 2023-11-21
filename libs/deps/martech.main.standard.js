(function () {
  'use strict';

  var w = window;

  var d = document;

  var defineProperty = Object.defineProperty;

  /* eslint-disable no-useless-escape */

  var S_replace = 'replace';

  var redact = function (url) {

    url = url
    
    /* eslint-disable no-unexpected-multiline */

    // double encoded
    [S_replace](/%2523access_token%253D.*?%2526/gmi, '%2526')
    // single encoded
    [S_replace](/%23access_token%3D.*?%26/gmi, '%26')
    // not encoded
    [S_replace](/#access_token=.*?&/gmi, '&')

    // remove information query values
    [S_replace](/information=[^\&]+/, '')
    
    // remove puser query values
    [S_replace](/puser=[^\&]+/, '')
    
    // remove fnuser query values
    [S_replace](/fnuser=[^\&]+/, '')
    
    // remove lnuser query values
    [S_replace](/lnuser=[^\&]+/, '');

    /* eslint-enable no-unexpected-multiline */

    return url;

  };

  function fixReferrer () {
    try {
      var
        S_referrer = 'referrer',
        r = d[S_referrer],
        redacted = redact(r);

      // if something was removed and now they are not the same, redefine referrer
      // NOTE: We don't want to ALWAYS redefine referrer.  That might have some 
      // side-effects we weren't expecting or possibly performance implications.
      // So do this ONLY when necessary.
      if (redacted !== r) {
        defineProperty(d, S_referrer, {
          configurable: true,
          value: redacted
        });
      }

    } catch (e) {
      // console.error(e);
    }
  }

  var head = d.head;

  var marketingtech = w.marketingtech;

  var decode = decodeURIComponent;

  //----------------------------------------------------------------------------
  // readCookie function
  //----------------------------------------------------------------------------
  function readCookie (name) {
    var
      cookies,
      i, il,
      keyValue,
      key;
      
    // get cookies
    cookies = d.cookie ? d.cookie.split('; ') : [];

    // loop through each cookie
    for (i = 0, il = cookies.length; i < il; i++) {

      // get the key value pair 
      // keyValue = cookies[i].split('=');
      keyValue = cookies[i];

      // get the name
      // key = decodeURIComponent(keyValue[0]);
      key = decode(keyValue.substr(0, keyValue.indexOf('=')));

      if (key === name) {
        return decode(keyValue.substr(keyValue.indexOf('=') + 1));
      }
    }

  }

  function prehidingSnippet () {
    var
      ALLOY_STYLE_ID = 'alloy-prehiding',
      // ALLOY_STYLE = '.personalization-container{opacity:0.01 !important}',
      ALLOY_STYLE = 
        '@keyframes alloyShow{from {opacity: 0.01;} to {opacity: 1;}}' +
        'body,.personalization-container{opacity:0.01 !important;animation: 0s 3s forwards alloyShow}',
      TIMEOUT = 3000,

      optanonConsentCookie,
      alloyStyle,
      removeStyle;

    // check if it exists first
    alloyStyle = d.getElementById(ALLOY_STYLE_ID);

    // remove style
    removeStyle = function (style) {
      try {
        if (
          style && 
          style.parentNode
        ) {
          style.parentNode.removeChild(style);
        }
      } catch (e) {
        // nothing
      }
    };

    //------------------------------------------------------------------------------
    // insert prehiding snippet if necessary
    //------------------------------------------------------------------------------
    if (
      // make sure that the head element is available
      head && 
      // make sure that there is a flag set indicating we want to use target
      (
        marketingtech &&
        marketingtech.adobe &&
        marketingtech.adobe.target
      ) &&
      // they haven't diabled body hiding through the targetGlobalSettings flags
      (
        // there is no targetGlobalSettings object
        !w.targetGlobalSettings ||
        // or we found it and body hiding is enabled
        w.targetGlobalSettings.bodyHidingEnabled
      ) &&
      // make sure that mboxEdit is nowhere to be found in the url
      // TODO: Figure out why alloy snippet isn't checking the search string
      w.location.href.indexOf('mboxEdit') === -1 &&
      // make sure that mboxDisable is also nowhere to be found in the search string
      w.location.search.indexOf('mboxDisable=1') === -1 && 
      // make sure that adobe_authoring_enabled is also nowhere to be found in the
      // search string
      w.location.search.indexOf('adobe_authoring_enabled') === -1 && 
      // make sure that the opt-out cookie is not present
      d.cookie.indexOf('adobe_optout') === -1 && 
      // onetrust says we are okay
      // check for explicit opt-out and negate that...meaning if the condition in 
      // the parenthesis evals to false, then we are okay
      !(
        // They have explicitly made a choice
        readCookie('OptanonChoice') &&
        // optanon cookie is set
        (optanonConsentCookie = readCookie('OptanonConsent')) && 
        // and functional category is set to be off
        optanonConsentCookie.indexOf('C0002:0') !== -1
      )
    ) {

      // insert the alloy style
      if (!alloyStyle) {
        // set styles
        alloyStyle = d.createElement('style');
        alloyStyle.id = ALLOY_STYLE_ID;
        alloyStyle.innerHTML = ALLOY_STYLE;

        try {
          // performance.mark(ALLOY_STYLE_ID);
          head.appendChild(alloyStyle);
        } catch (e) {
          // nothing
        }
      }

      // remove the style if it takes too long to load
      setTimeout(function () {
        // try to remove the style
        removeStyle(alloyStyle);
      }, TIMEOUT);

    //------------------------------------------------------------------------------
    // otherwise remove any prehiding
    //------------------------------------------------------------------------------
    } else {
      // if we found the style, remove it
      removeStyle(alloyStyle);
    }
  }

  var Promise$1 = Promise;

  function throwError (message) {
    throw Error(message);
  }

  function loadScript (src, onload) {

    var
      s = d.createElement('script'),
      called = false;

    s.src = src;
    s.async = true;

    // if there is an onload callback
    if (onload) {

      s.onload = s.onreadystatechange = function (e) {
        var 
          readyState = this.readyState;

        if (
          // only call the callback once
          !called && 
          (
            // either readyState doesn't exist
            !readyState || 
            // or it is set to complete or loaded
            (
              readyState === 'complete' ||
              readyState === 'loaded'
            )
          )
        ) {
          called = true;
          onload(e);
        }

      };

    }

    // if we found the head
    if (head) {
      head.appendChild(s);

    // if we didn't find the head, try the body
    } else if (d.body) {
      d.body.appendChild(s);

    // otherwise indicate we don't know where we can put this
    } else {
      throwError('no script parent');
    }

  }

  function launch () {
    var
      __satelliteLoadedCallback,
      __satelliteLoadedPromise,
      callbacks = [],
      launchScriptLoaded,
      loaded,
      adobe,
      launch,
      url;

    //----------------------------------------------------------------------------
    // callback for when launch loads
    //----------------------------------------------------------------------------
    __satelliteLoadedCallback = function (callback) {
      
      // if launch has already loaded, immediately call the callback
      if (loaded) {
        callback(w._satellite);
      } else {
        callbacks.push(callback);
      }  
    };
    // Promise version
    __satelliteLoadedPromise = new Promise$1(function (resolve) {
      __satelliteLoadedCallback(resolve);
    });

    // export
    w.__satelliteLoadedCallback = __satelliteLoadedCallback;
    w.__satelliteLoadedPromise = __satelliteLoadedPromise;

    launchScriptLoaded = function () {
      var 
        i, il,
        callback;

      // indicate we have loaded
      loaded = true;

      // loop through each of the callbacks and call them
      for (i = 0, il = callbacks.length; i < il; i++) {
        callback = callbacks[i];
        try {
          callback(w._satellite);
        } catch (e) {
          // Nothing
        }
      }
    };

    //----------------------------------------------------------------------------
    // load Adobe Launch
    //----------------------------------------------------------------------------
    if (
      marketingtech &&
      (adobe = marketingtech.adobe) &&
      (launch = adobe.launch) && 
      (url = launch.url)
    ) {

      // load the script
      loadScript(
        // container src
        url,
        // onload
        launchScriptLoaded
      );

      // default to global dev environment
      // url = 'https://assets.adobedtm.com/launch-EN9a7b3bd7db454856b44f27730f263fa0.min.js';
      // global prod environment
      // url = 'https://assets.adobedtm.com/launch-EN919758db9a654a17bac7d184b99c4820.min.js';

    }

  }

  var get = function (obj, path) {
    var
      segs = path.split('.'),
      temp = obj,
      i = 0,
      il = segs.length - 1;

    // get to the path
    for (; i < il; i++) {
      var seg = segs[i];
      if (!temp[seg]) {
        return undefined;
      }
      temp = temp[seg];
    }
    // get the value
    return temp[segs[i]];
  };

  var set = function (obj, path, value) {
    var
      segs = path.split('.'),
      temp = obj,
      i = 0,
      il = segs.length - 1;

    // get to the path
    for (; i < il; i++) {
      var seg = segs[i];
      temp[seg] = temp[seg] || {};
      temp = temp[seg];
    }
    // set the value
    temp[segs[i]] = value;

    return obj;
  };

  function init_alloy_all () {

    //------------------------------------------------------------------------------
    // alloy_all
    //------------------------------------------------------------------------------
    // The alloy_all object is an object that spans all of the other events.  It 
    // should only be used when you want data to be sent for ALL events.  Other
    // event data takes precedent over this one if there is a conflict.
    var alloy_all = w.alloy_all = w.alloy_all || {};
    // promises 
    alloy_all.promises = alloy_all.promises || [];
    // xdm
    alloy_all.xdm = alloy_all.xdm || {};
    // data
    alloy_all.data = alloy_all.data || {};

    // get
    alloy_all.get = function (path) {
      return get(alloy_all, path);
    };
    // set
    alloy_all.set = function (path, value) {
      return set(alloy_all, path, value);
    };


    return alloy_all;
  }

  function init_alloy_load () {

    //------------------------------------------------------------------------------
    // alloy_load
    //------------------------------------------------------------------------------
    // The alloy_load event is the first event that is fired on a page.  It is only
    // supposed to include data that is readily available when the page laods.
    // Data that is latent or is delayed in any way should NOT be included in the 
    // page load event.  It also really shouldn't have any promises.  Only when 
    // that data will be available very quickly.
    var alloy_load = w.alloy_load = w.alloy_load || {};
    // initiated
    alloy_load.i = false;
    // sent
    alloy_load.sent = new Promise$1(function (resolve, reject) {
      alloy_load.r = resolve;
      alloy_load.j = reject;
    });
    // promises
    alloy_load.promises = alloy_load.promises || [];
    // xdm
    alloy_load.xdm = alloy_load.xdm || {};
    // data
    alloy_load.data = alloy_load.data || {};

    // get
    alloy_load.get = function (path) {
      return get(alloy_load, path);
    };
    // set
    alloy_load.set = function (path, value) {
      return set(alloy_load, path, value);
    };

    return alloy_load;
  }

  function init_alloy_unload () {

    //------------------------------------------------------------------------------
    // alloy_unload
    //------------------------------------------------------------------------------
    // The alloy_unload event is fairly straitforward.  It is used for sending data
    // that only makes sense to send at the end of the "page" lifecycle.  (For 
    // example, data about how time spent on the page, data about scroll reach,
    // etc.)
    var alloy_unload = w.alloy_unload = w.alloy_unload || {};
    // initiated
    alloy_unload.i = false;
    // sent
    alloy_unload.sent = new Promise$1(function (resolve, reject) {
      alloy_unload.r = resolve;
      alloy_unload.j = reject;
    });
    // promises
    // NOTE: We shouldn't be waiting for anything the in unload event...
    // alloy_unload.promises = alloy_unload.promises || [];
    // xdm
    alloy_unload.xdm = alloy_unload.xdm || {};
    // data
    alloy_unload.data = alloy_unload.data || {};

    // get
    alloy_unload.get = function (path) {
      return get(alloy_unload, path);
    };
    // set
    alloy_unload.set = function (path, value) {
      return set(alloy_unload, path, value);
    };

    return alloy_unload;
  }

  function init_alloy () {
    init_alloy_all();
    init_alloy_load();
    init_alloy_unload();
  }

  function satelliteTrack () {
    var
      trackCalls = [];

    // get _satellite
    w._satellite = w._satellite || {};

    // set track function 
    w._satellite.track = function (directCallRuleName, detail) {

      // default it
      detail = detail || {};

      // save a property to indicate this was called before
      detail._beforeSatelliteLoaded = true;

      // push call on stack
      trackCalls.push([directCallRuleName, detail]);
      
    };

    // When _satellite has loaded
    w.__satelliteLoadedCallback(function () {
      var
        i, il,
        params;

      // loop through each of the calls
      for (i = 0, il = trackCalls.length; i < il; i++) {

        // params
        params = trackCalls[i];

        // recall _satellite.track
        w._satellite.track(params[0], params[1]);
      }

    });

    // First pageView call as first call so that it gets in the queue first
    // TODO: Should we add extra data here (like the current location and such)?
    _satellite.track('pageView');

  }

  function digitalDataFallback () {
    var digitalData = {
      _set: function (path, value) {
    
        // if the path doesn't start with "digitalData.", add it
        if (path.indexOf('digitalData') !== 0) {
          path = 'digitalData.' + path;
        }
        
        // if it a promise
        if (
          // value instanceof Promise
          (
            typeof value === 'object' ||
            typeof value === 'function'
          ) &&
          value.then && 
          typeof value.then === 'function'
        ) {
          // get the unresolved value if any
          value = value.unresolved || undefined;
        }
        
        // then set it at alloy_all.data._adobe_corpnew.digitalData.*
        set(
          w.alloy_all,
          'data._adobe_corpnew.' + path,
          value
        );
        
      },
    };
    
    // This is a fallback digitalData stub that will at least prevent most errors
    // from happening and will allow people to slowly migrate...Not sure how much
    // I actually want to use this or not. 
    w.digitalData = w.digitalData || digitalData;
  }

  if (w.location.search.indexOf('marketingtech=off') === -1) {
    fixReferrer();
    prehidingSnippet();
    launch();
    init_alloy();
    satelliteTrack();
    digitalDataFallback();
  }

})();
