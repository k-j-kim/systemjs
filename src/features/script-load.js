/*
 * Supports loading System.register via script tag injection
 */

import { systemJSPrototype } from '../system-core';
import { hasDocument, baseUrl, resolveUrl } from '../common';

const systemRegister = systemJSPrototype.register;
systemJSPrototype.register = function (deps, declare) {
  systemRegister.call(this, deps, declare);
};

systemJSPrototype.createScript = function (url, crossOrigin) {
  const script = document.createElement('script');
  script.charset = 'utf-8';
  script.async = true;
  script.crossOrigin = crossOrigin;
  script.src = url;
  return script;
};

let lastWindowErrorUrl, lastWindowError;
if (hasDocument)
  window.addEventListener('error', function (evt) {
    lastWindowErrorUrl = evt.filename;
    lastWindowError = evt.error;
  });

systemJSPrototype.instantiate = function (url, firstParentUrl, config) {
  const loader = this;
  return new Promise(function (resolve, reject) {
    const script = systemJSPrototype.createScript(url, getCrossOrigin(config));
    script.addEventListener('error', function () {
      reject(Error('Error loading ' + url + (firstParentUrl ? ' from ' + firstParentUrl : '')));
    });
    script.addEventListener('load', function () {
      document.head.removeChild(script);
      // Note that if an error occurs that isn't caught by this if statement,
      // that getRegister will return null and a "did not instantiate" error will be thrown.
      if (lastWindowErrorUrl === url) {
        reject(lastWindowError);
      }
      else {
        resolve(loader.getRegister());
      }
    });
    document.head.appendChild(script);
  });
};

if (hasDocument) {
  window.addEventListener('DOMContentLoaded', loadScriptModules);
  loadScriptModules();
}

function getCrossOrigin(config) {
  return (config && config.crossOrigin && typeof config.crossOrigin === 'string' && config.crossOrigin.toLowerCase() === 'use-credentials') ? 'use-credentials' : 'anonymous';
}

function loadScriptModules() {
  Array.prototype.forEach.call(
    document.querySelectorAll('script[type=systemjs-module]'), function (script) {
      if (script.src) {
        System.import(script.src.slice(0, 7) === 'import:' ? script.src.slice(7) : resolveUrl(script.src, baseUrl));
      }
    });
}