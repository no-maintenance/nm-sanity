/* pinterest wrapper */

declare global {
  interface Window {
    pintrk: () => void;
  }
}
let initialized = false;
const debug = false;

const verifyInit = () => {
  if (!initialized) {
    console.warn(
      'Pixel not initialized before using call ReactPixel.init with required params',
    );
  }
  return initialized;
};

const log = (...args) => {
  console.info(...['[pinterest-tracking]'].concat(args));
};

//
const defaultOptions = {
  debug: false,
};

export default {
  init(uniqueTagId, userEmail, options = defaultOptions) {
    const em = {
      em: userEmail,
    };
    console.log('pinterest init', uniqueTagId, options);
    // eslint-disable
    // @ts-ignore
    !(function (e) {
      if (!window.pintrk) {
        window.pintrk = function () {
          window.pintrk.queue.push(Array.prototype.slice.call(arguments));
        };
        const n = window.pintrk;
        (n.queue = []), (n.version = '3.0');
        const t = document.createElement('script');
        (t.async = !0), (t.src = e);
        const r = document.getElementsByTagName('script')[0];
        r.parentNode.insertBefore(t, r);
      }
    })('https://s.pinimg.com/ct/core.js');
    pintrk('load', uniqueTagId, {em: userEmail});
    initialized = true;
  },

  pageView() {
    if (!verifyInit()) {
      return;
    }

    if (debug) {
      log("called pintrk('page');");
    }
  },

  track(title, data) {
    console.log('verifyInit()', verifyInit());
    if (!verifyInit()) {
      return;
    }

    pintrk('track', title, data);

    if (debug) {
      log(`called pintrk('track', '${title}');`);
      if (data) {
        log('with data', data);
      }
    }
  },

  pintrk(...args) {
    if (!verifyInit()) {
      return;
    }

    pintrk(...args);

    if (debug) {
      log(`called pintrk('${args.slice(0, 2).join("', '")}')`);

      if (args[2]) {
        log('with data', args[2]);
      }
    }
  },
};
