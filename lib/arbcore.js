/*
 * Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Application Resource Bundle (ARB) supporting library.
 * This library provides a set of API to access resource stored in ARB and
 * methods to localize the HTML DOM tree using those resources.
 * @author shanjian@google.com (Shanjian Li)
 */


/**
 * Creates arb namespace.
 */
var arb = {};


/**
 * This is the global resource selector that can be used to switch locale,
 * scheme, etc. globally. Empty string is a valid value that means no global
 * selector.
 * @type {string}
 * @private
 */
arb.resourceSelector_ = '';


/**
 * Sets resource selector. This will affect all future resource selection.
 *
 * @param {string} selector resource selection string joined by ':'.
 */
arb.setResourceSelector = function(selector) {
  arb.resourceSelector_ = selector;
};


/**
 * DOM text node type.
 */
arb.TEXT_NODE_TYPE = 3;


/**
 * Cross-browser function for setting the text content of an element.
 * Code is borrowed from Closure.
 *
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content.
 * @private
 */
arb.setTextContent_ = function(element, text) {
  if ('textContent' in element) {
    element.textContent = text;
  } else if (element.firstChild &&
             element.firstChild.nodeType == arb.TEXT_NODE_TYPE) {
    // If the first child is a text node we just change its data and remove the
    // rest of the children.
    while (element.lastChild != element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.firstChild.data = text;
  } else {
    var child;
    while ((child = element.firstChild)) {
      node.removeChild(child);
    }
    element.appendChild(element.ownerDocument.createTextNode(text));
  }
};


/**
 * Performs message substitution in DOM tree.
 */
arb.localizeHtml = function() {
  var resource = arb.getResource();
  arb.localizeSubtree(document, resource);
};


/**
 * Localizes a DOM subtree start from given elem.
 *
 * @param {Document | Element} elem the root of the subtree to be visited.
 * @param {Object.<string, string|Object>} resource ARB resource object.
 */
arb.localizeSubtree = function(elem, resource) {
  if (elem) {
    var origResource = resource;
    // If namespace is specified in the element, use it in its scope.
    if (elem.getAttribute && elem.getAttribute('arb:namespace')) {
      resource = arb.getResource(elem.getAttribute('arb:namespace')) ||
          resource;
    }

    // If no resource specified, don't do anything. There is nothing wrong
    // about it. A page can choose to skip localization this way.
    if (resource) {
      arb.localizeNode(elem, resource);
      for (var i = 0; i < elem.childNodes.length; i++) {
        var child = elem.childNodes[i];
        arb.localizeSubtree(child, resource);
      }
    }
    resource = origResource;
  }
};


/**
 * Localizes a DOM element. Different type of element has different type of
 * attribute to be localized, not necessarily text content.
 *
 * @param {Document | Element} elem the DOM element to be localized.
 * @param {Object.<string, string|Object>} resource resource bundle.
 */
arb.localizeNode = function(elem, resource) {
  var resId = elem.getAttribute && elem.getAttribute('arb:id') || elem.id;

  if (!resId) {
    return;
  }

  switch(elem.nodeName) {
    case 'IMG':
      arb.localizeElement_(elem, resId, resource, ['src', 'alt']);
      break;
    case 'INPUT':
      arb.localizeElement_(elem, resId, resource,
                           ['value', 'placeholder', 'defaultValue']);
      break;
    case 'AREA':
      arb.localizeElement_(elem, resId, resource, ['alt']);
      break;
    case 'OBJECT':
      arb.localizeElement_(elem, resId, resource, ['standby']);
      break;
    case 'OPTION':
      arb.localizeElement_(elem, resId, resource, ['value', 'label']);
      break;
    case 'OPTGROUP':
      arb.localizeElement_(elem, resId, resource, ['label']);
      break;
    case 'STYLE':
      if (resId in resource) {
        if (elem.styleSheet) {
          elem.styleSheet.cssText = resource[resId];
        } else {
          arb.setTextContent_(elem, resource[resId]);
        }
      }
      break;
    default:
      (resId in resource) && arb.setTextContent_(elem, resource[resId]);
  }
};


/**
 * Injects localized resource into element's attribute.
 *
 * @param {Element} elem the DOM element that need to have resource injected.
 * @param {string} resId ARB resource id.
 * @param {Object.<string, string|Object>} resource  ARB resource bundle.
 * @param {Array.<string>} attrs possible attributes in this element that may
 *     take localization resource.
 * @private
 */
arb.localizeElement_ = function(elem, resId, resource, attrs) {
  for (var i = 0; i < attrs.length; i++) {
    var fieldId = resId + '@' + attrs[i];
    (fieldId in resource) && (elem[attrs[i]] = resource[fieldId]);
  }
};


/**
 * Replaces placeholder in string with given values. For the time being
 * {} is used to mark placeholder. Placeholder will only be replaced if
 * a named argument or positional argument is available.
 *
 * @param {string} str message string possibly with placeholders.
 * @param {string} opt_values if it is a map, its key/value will be
 *     interpreted as named argument. Otherwise, it should be interpreted as
 *     positional argument.
 * @return {string} string with placeholder(s) replaced.
 */
arb.msg = function(str, opt_values) {
  // Plural support is an optional feature. When it is desired, developer
  // should include arbplural.js, where arb.processPluralRules_ is defined.
  if (arb.processPluralRules_) {
    str = arb.processPluralRules_(str, opt_values);
  }
  var type = typeof opt_values;
  if (type == 'object' || type == 'function') {
    for (var key in opt_values) {
      var value = ('' + opt_values[key]).replace(/\$/g, '$$$$');
      str = str.replace(new RegExp('\\{' + key + '\\}', 'gi'), value);
    }
  } else {
     for (var i = 1; i < arguments.length; i++) {
       str = str.replace(
           new RegExp('\\{' + (i - 1) + '\\}', 'g'), arguments[i]);
     }
  }
  return str;
};


/**
 * Resource name part as it appears in regular expression.
 * @type {number}
 * @private
 */
arb.RESOURCE_NAME_PART_ = 1;


/**
 * Obtains the resouce name from URL. That will allow resource to be selected
 * through use of url parameter.
 *
 * @return {string} arb name as passed in Url.
 */
arb.getParamFromUrl = function(paramName) {
  var regex = new RegExp('[\\\\?&]' + paramName + '=([^&#]*)', 'i');
  var m = regex.exec(window.location.href);
  return m ? m[arb.RESOURCE_NAME_PART_] : null;
};


/**
 * Maps ARB namespace into ARB instance.
 * @type {Object.<string, Object>}
 * @private
 */
arb.resourceMap_ = {};


/**
 * Checks if an object is empty or not.
 *
 * @param  {Object} obj An object to be checked for emptiness.
 * @return {boolean} true if the object has not direct properties.
 * @private
 */
arb.isEmpty = function(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
};


/**
 * Namespace delimiter.
 * @type {string}
 * @private
 */
arb.NAMESPACE_DELIMITER_ = ':';


/**
 * Registers a ARB resource object.
 *
 * @param {string|array.string} namespaces ARB resource object's namespaces.
 *     This parameter can be either a string or an array, the later allows a
 *     resource to be registered under different names.
 * @param {Object.<string, string|Object>} resource ARB resource object.
 */
arb.register = function(namespaces, resource) {
  if (typeof namespaces == 'string') {
    arb.resourceMap_[namespaces] = resource;
  } else {
    for (var i = 0; i < namespaces.length; i++) {
      arb.resourceMap_[namespaces[i]] = resource;
    }
  }
};


/**
 * Calls the callback for all the registerd namespace/locale pairs. This
 * function only iterates through fully qualified namespaces.
 *
 * @param {function(string)} arbCallback
 */
arb.iterateRegistry = function(arbCallback) {
  for (var namespace in arb.resourceMap_) {
    if (arb.resourceMap_.hasOwnProperty(namespace)) {
      arbCallback(namespace);
    }
  }
};


/**
 * Retrieves ARB resource object that best fits selector given. The algorithm
 * of this method tries to satisfy the selector as much as possible, and does
 * it in the specified priority. Selector given to this method takes priority
 * over global resource selector set through "setResourceSelector".
 *
 * @param {?string} opt_selector resource selector used to choose desired ARB
 *        resource object together with global resource selector.
 *
 * @return {Object.<string, string|Object>} The ARB resource object desired.
 *     or empty object if no ARB resource object registered with given
 *     namespace.
 */
arb.getResource = function(opt_selector) {
  var candidates = arb.resourceMap_;
  if (!opt_selector) {
    opt_selector = arb.resourceSelector_;
  } else if (arb.resourceSelector_) {
    opt_selector += arb.NAMESPACE_DELIMITER_ + arb.resourceSelector_;
  }

  // If opt_namespace is not given, default namespace will be used.
  if (opt_selector) {
    // This will only be true if opt_namespace is fully qualified.
    if (opt_selector in arb.resourceMap_) {
        return arb.resourceMap_[opt_selector];
    }

    var parts = opt_selector.split(arb.NAMESPACE_DELIMITER_);
    for (var i = 0; i < parts.length; i++) {
      var newCandidates = {};
      var pattern = new RegExp('(:|^)' + parts[i] + '(:|$)');
      for (var namespace in candidates) {
        if (pattern.test(namespace)) {
          newCandidates[namespace] = candidates[namespace];
        }
      }
      if (!arb.isEmpty(newCandidates)) {
        candidates = newCandidates;
      }
    }
  }

  var minLength = Number.MAX_VALUE;
  var bestNamespace = '';
  for (var namespace in candidates) {
    if (!namespace) { // empty string
      bestNamespace = namespace;
      break;
    }
    var len = namespace.split(arb.NAMESPACE_DELIMITER_).length;
    if (len < minLength) {
      minLength = len;
      bestNamespace = namespace;
    }
  }

  if (arb.resourceMap_.hasOwnProperty(bestNamespace)) {
    return arb.resourceMap_[bestNamespace];
  }
  return {};
};

/**
 * Checks if the given arb instance is in compact form.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @return {boolean} true if it is in compact form.
 */
arb.isCompact = function(resource) {
  for (var prop in resource) {
    if (resource.hasOwnProperty(prop) && prop[0] == '@') {
      return false;
    }
  }
  return true;
};


/**
 * Creates namespace for development mode methods.
 */
arb.dbg = {};


/**
 * Returns type of data as identified by resource id.
 * The type information might not be available for specified resource. Empty
 * string will be returned in such case.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId resource id.
 *
 * @return {string} type string if available, or empty string.
 */
arb.dbg.getType = function(resource, resId) {
  if (resId.charAt(0) == '@') {
    return 'attr';
  }
  var atResId = '@' + resId;
  if (resource.hasOwnProperty(atResId) &&
      resource[atResId].hasOwnProperty('type')) {
    return resource[atResId]['type'];
  }
  return '';
};


/**
 * Checks if the resource identified by resId is in given context. If the
 * resource has no context or if the desired context is the prefix of
 * resource's context, it will return true as well.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId resource id to be checked.
 * @param {string} context context desired.
 *
 * @return {boolean} true if the resource is in given context.
 */
arb.dbg.isInContext = function(resource, resId, context) {
  var contextRegex = new RegExp('^' + context + '($|:.*)');
  var atResId = '@' + resId;
  return resId.charAt(0) != '@' &&
      (!resource.hasOwnProperty(atResId) ||
       !resource[atResId].hasOwnProperty('context') ||
       contextRegex.test(resource[atResId]['context']));
};


/**
 * Returns the value of an attribute for a resource. Empty string will
 * be returned if attribute is not available.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId id of the resource to be checked.
 * @param {string} attrName attribute name of interest.
 *
 * @return {string} attribute value desired, or empty string.
 */
arb.dbg.getAttr = function(resource, resId, attrName) {
  var atResId = '@' + resId;
  if (!resource.hasOwnProperty(atResId)) {
    return '';
  }

  var msgAttr = resource[atResId];
  return msgAttr.hasOwnProperty(attrName) ? msgAttr[attrName] : '';
};

