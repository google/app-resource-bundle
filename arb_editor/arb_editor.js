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

goog.require('goog.Uri');
goog.require('goog.debug.DivConsole');
goog.require('goog.dom');
goog.require('goog.events.KeyCodes');
goog.require('goog.json');
goog.require('goog.net.Jsonp');
goog.require('goog.object');
goog.require('goog.ui.Button');
goog.require('goog.ui.ComboBox');
goog.require('goog.ui.ComboBoxItem');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Dialog.ButtonSet');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.Prompt');
goog.require('goog.ui.SplitPane');
goog.require('goog.ui.SplitPane.Orientation');
goog.require('goog.ui.Textarea');
goog.require('goog.ui.tree.TreeControl');

arb_editor = {};

/**
 * Appengine service url.
 */
var DEFAULT_SERVICE_URL = 'http://i18nsample.appspot.com';


/**
 * Shortcut reference to resource. There is nothing special why we choose this
 * name. Sticking to a consistent naming can help readability.
 */
var r$ = arb.getResource('arb_editor');


/**
 * Initialize arb UI.
 * @param {string} opt_serviceUrl optional url to get server support.
 */
arb_editor = function(baseNamespace, opt_serviceUrl) {
  /**
   * arb service url. It is used to get server side arb service. Google offer
   * such service hosted in AppEng service. Applications can also choose to host
   * its own service.
   * @type {string}
   * @private
   */
  this.serviceUrl_ = opt_serviceUrl || DEFAULT_SERVICE_URL;

  /**
   * arb project id. One must got to arb hosting service to create a project
   * first. A project id will be given there. That project id will be used
   * to uniquely identified the project.
   */
  this.projectId_ = 'arbeditor_5f2b38cb6eb84fd2a92d2072e930c84d';

  /**
   * Resource navigation tree.
   * @type {goog.ui.tree.TreeControl}
   * @private
   */
  this.tree_ = null;

  /**
   * Source locale, which is the locale used before localization.
   * @type {Object}
   * @private
   */
  this.sourceLocale_ = "en";

  /**
   * Flag to indicate unsaved (un-uploaded) changes.
   * @type {boolean}
   * @private
   */
  this.dirty_ = false;

  /**
   * The current resource id as displayed in edit box.
   * @type {string}
   * @private
   */
  this.resId_ = null;

  /**
   * Pending translation requests count.
   * @type {int}
   * @private
   */
  this.pendingTranslations_ = 0;

  /**
   * The base namespace used in this project (without locale part).
   */
  this.baseNamespace_ = baseNamespace;

  /**
   * UI ComboBox for switching locale.
   */
  this.setLocaleCombo_ = new goog.ui.ComboBox();

  /**
   * Logger.
   * @type {goog.debug.Logger}
   * @private
   */
  this.logger_ = goog.debug.Logger.getLogger('arbeditor');
  this.logger_.setLevel(goog.debug.Logger.Level.ALL);
};


/**
 * Create the demo UI.
 * @param {string} elementId elementId identifies the element that will be
 *        transformed into arb_editor UI.
 */
arb_editor.prototype.decorate = function(elementId) {
  this.drawButtons_();
  this.drawSelectLocaleCombo_();
  this.drawAddLocaleCombo_();
  this.makeSplitPane_();
  this.makeTree_();

  this.divConsole = new goog.debug.DivConsole(
      goog.dom.getElement('div_console'));
  this.divConsole.setCapturing(true);
};


/**
 * Updates the status field.
 *
 * @param {string} text status text.
 * @private
 */
arb_editor.prototype.updateStatus_ = function(text) {
  this.logger_.info(text);
};


/**
 * Makes resource navigation tree.
 *
 * @private
 */
arb_editor.prototype.makeTree_ = function() {
  this.updateStatus_("Start to makeTree");
  var treeConfig = goog.ui.tree.TreeControl.defaultConfig;
  treeConfig['cleardotPath'] = 'images/cleardot.gif';

  this.tree_ = new goog.ui.tree.TreeControl('root', treeConfig);
  this.tree_.setHtml('resource');

  this.loadAllResources_();
  this.tree_.render(goog.dom.getElement('arb_tree'));

  var that = this;
  goog.events.listen(this.tree_, goog.events.EventType.CHANGE,
    function(e) {
      that.updateStatus_('update value.');
      that.updateValue_(that.resId_);
      that.updateAttr_(that.resId_);
      that.updateDisplay_();
    });
};


/**
 * Enumerates all the resources in registry and loads them into tree.
 */
arb_editor.prototype.loadAllResources_ = function() {
  var that = this;
  var arbCallback = function(namespace) {
    that.updateStatus_("encounter namespace:" + namespace);
    var arbNode = that.tree_.getTree().createNode(namespace);
    arbNode.setClientData(namespace);
    that.tree_.add(arbNode);
    var resource = arb.getResource(namespace);
    var nameList = [];
    for (var name in resource) {
      if (name && (name[0] != '@' || name.length > 1 && name[1] == '@')) {
        nameList.push(name);
      }
    }
    nameList.sort();
    for (var i = 0; i < nameList.length; i++) {
        var childNode = that.tree_.createNode(nameList[i]);
        childNode.setClientData(nameList[i]);
        childNode.setHtml(nameList[i]);
        arbNode.add(childNode);
    }
  };
  arb.iterateRegistry(arbCallback);
};


/**
 * Removes all resources from the tree.
 */
arb_editor.prototype.removeAllResources_ = function() {
  var that = this;
  var removeChildren = function(node) {
    var children = node.getChildren();
    for (var i = children.length - 1; i >= 0; i--) {
      removeChildren(children[i]);
      node.removeChild(children[i]);
      that.tree_.removeNode(children[i]);
    }
  }
  removeChildren(that.tree_);
};


/**
 * Get the current active resource as indicated by tree.
 * @return {Object.<string, string|Object>} current active resource.
 */
arb_editor.prototype.getCurrentResource_ = function() {
  var namespace = this.getCurrentFullNamespace_();
  if (namespace) {
    return arb.getResource(namespace);
  }
  return null;
};


/**
 * Get the current resource's full namespace.
 *
 * @return {string} current resource's full namespace.
 */
arb_editor.prototype.getCurrentFullNamespace_ = function() {
  var selectedItem = this.tree_.getSelectedItem();

  // If selected item is not a leaf, reset display.
  switch(selectedItem.getDepth()) {
    case 1:
      return selectedItem.getClientData();
    case 2:
      return selectedItem.getParent().getClientData();
    default:
      return null;
  }
};


/**
 * Update item display (right panel) for selected item.
 * @private
 */
arb_editor.prototype.updateDisplay_ = function() {
  var selectedItem = this.tree_.getSelectedItem();

  // If selected item is not a leaf, reset display.
  if (selectedItem.getDepth() < 2) {
    this.resId_ = null;
    this.resIdField.setValue('');
    this.valueTextBox.setValue('');
    this.attrTextBox.setValue('');
    return;
  }
  this.resId_ = selectedItem.getClientData();
  if (!this.resId_) {
    this.resIdField.setValue('');
    this.valueTextBox.setValue('');
    this.attrTextBox.setValue('');
  } else {
    var resource = this.getCurrentResource_();
    this.resIdField.setValue(this.resId_);
    this.resIdField.setEnabled(false);
    this.valueTextBox.setValue(resource[this.resId_]);

    if (this.resId_[0] != '@') {
      // normal resource key
      var attrName = '@' + this.resId_;
      this.attrTextBox.setValue(
          resource.hasOwnProperty(attrName) ?
          goog.json.serialize(resource[attrName]) : '');
    } else {
      // special resource key (prefixed with '@@')
      this.attrTextBox.setValue('');
    }
  }
};


/**
 * Insert a resource item (leaf) into the tree.
 *
 * @param {string} key
 * @private
 */
arb_editor.prototype.insertToTree_ = function(key) {
  var selectedItem = this.tree_.getSelectedItem();
  if (!selectedItem ) {
    return false;
  }
  var parent = null;
  switch (selectedItem.getDepth()) {
    case 1:
      parent = selectedItem;
      break;
    case 0:
      parent = selectedItem.getFirstChild();
      break;
    default:
      parent = selectedItem.getParent();
  }
  if (!parent) {
    return false;
  }
  var childNode = this.tree_.createNode(key);
  childNode.setClientData(key);
  childNode.setHtml(key);
  parent.add(childNode);
  this.tree_.setSelectedItem(childNode);
};


/**
 * Return date represented in ISO8601 UTC form, like 2011-11-05:09:28Z.
 *
 * @param {Date} d Date object to be formatted.
 * @return formatted date string in ISO8601 form.
 * @private
 */
arb_editor.formatDateInIso8601_ = function(d) {
  var str = '';
  str += d.getUTCFullYear().toString();
  var v = d.getUTCMonth();
  str += v < 10 ? '-0' : '-';
  str += v.toString();
  v = d.getUTCDate();
  str += v < 10 ? '-0' : '-';
  str += v.toString();
  v = d.getUTCHours();
  str += v < 10 ? 'T0' : 'T';
  str += v.toString();
  v = d.getUTCMinutes();
  str += v < 10 ? ':0' : ':';
  str += v.toString();
  str += 'Z';
  return str;
};


/**
 * Update the attribute from the data contained in UI element.
 *
 * @param {Element} element the UI DOM element that contains the attribute
 *        data.
 * @param {string} resId resource id for which attribute belong to.
 * @private
 */
arb_editor.prototype.updateAttr_ = function(resId) {
  var resource = this.getCurrentResource_();
  if (!resId || !resource) {
    return;
  }
  var value = this.attrTextBox.getValue();
  var attrKey = '@' + resId;
  if (!resource.hasOwnProperty(attrKey)) {
    if (value) {
      resource[attrKey] = goog.json.parse(value);
      this.insertToTree_(attrKey);
      resource['@@last_modified'] = arb_editor.formatDateInIso8601_(new Date());
      this.dirty_ = true;
    }
  } else {
    if (!value) {
      delete resource[attrKey];
    } else if (goog.json.serialize(resource[attrKey]) != value) {
      resource[attrKey] = goog.json.parse(value);
    }
    this.dirty_ = true;
    resource['@@last_modified'] = arb_editor.formatDateInIso8601_(new Date());
  }
};


/**
 * Update resource from UI element.
 *
 * @param {Element} element the UI DOM element that contains the value.
 * @param {string} resId resource's id.
 * @private
 */
arb_editor.prototype.updateValue_ = function(resId) {
  var resource = this.getCurrentResource_();
  if (!resId || !resource) {
    return;
  }
  var value = this.valueTextBox.getValue();
  if (resource.hasOwnProperty(resId)) {
    if (!value) {
      delete resource[resId];
    } else if (resource[resId] != value) {
      resource[resId] = value;
    }
    this.dirty_ = true;
    resource['@@last_modified'] = arb_editor.formatDateInIso8601_(new Date());
  } else {
    if (value) {
      resource[resId] = value;
      this.insertToTree_(resId);
      this.dirty_ = true;
      resource['@@last_modified'] = arb_editor.formatDateInIso8601_(new Date());
    }
  }
};


/**
 * Update resource from UI element.
 *
 * @param {Element} element the UI DOM element that contains the value.
 * @param {string} resId resource's id.
 * @private
 */
arb_editor.prototype.updateId_ = function() {
  var v = this.resIdField.getValue();
  if (v) {
    this.resId_ = v;
    this.dirty_ = true;
  }
};


/**
 * Prepare the splitPane UI, include text boxes on right side.
 * @private
 */
arb_editor.prototype.makeSplitPane_ = function() {
  var lhs = new goog.ui.Component();
  var rhs = new goog.ui.Component();

  // Set up splitpane with already existing DOM.
  var splitpane1 = new goog.ui.SplitPane(lhs, rhs,
      goog.ui.SplitPane.Orientation.HORIZONTAL);

  splitpane1.setInitialSize(200);
  splitpane1.setHandleSize(5);
  splitpane1.decorate(goog.dom.getElement('arb_panel'));
  splitpane1.setSize(new goog.math.Size(800, 500));

  this.valueTextBox = new goog.ui.Textarea();
  this.valueTextBox.decorate(goog.dom.getElement('res_value'));
  this.valueTextBox.setMaxHeight(50);
  this.valueTextBox.setMinHeight(50);
  this.attrTextBox = new goog.ui.Textarea();
  this.attrTextBox.decorate(goog.dom.getElement('res_attr'));
  this.attrTextBox.setMaxHeight(100);
  this.attrTextBox.setMinHeight(100);
  this.resIdField = new goog.ui.LabelInput();
  this.resIdField.decorate(goog.dom.getElement('res_id'));

  var that = this;
  goog.events.listen(this.valueTextBox.getElement(),
                     goog.events.EventType.BLUR,
                     function(e) {
                       that.updateValue_(that.resId_);
                     });
  goog.events.listen(this.attrTextBox.getElement(),
                     goog.events.EventType.BLUR,
                     function(e) {
                       that.updateAttr_(that.resId_);
                     });

  var newButton = new goog.ui.Button();
  newButton.decorate(goog.dom.getElement('new_entry_btn'));
  goog.events.listen(newButton, goog.ui.Component.EventType.ACTION,
      function(e) {
        that.valueTextBox.setValue('');
        that.attrTextBox.setValue('');
        that.resIdField.setValue('');
        that.resIdField.setEnabled(true);
      });

  var deleteButton = new goog.ui.Button();
  deleteButton.decorate(goog.dom.getElement('delete_entry_btn'));
  goog.events.listen(deleteButton, goog.ui.Component.EventType.ACTION,
      function(e) {
        var resource = that.getCurrentResource_();
        if (that.resId_ && resource) {
          delete resource[that.resId_];

          var selectedItem = that.tree_.getSelectedItem();
          var parent = selectedItem.getParent();
          parent.removeChild(selectedItem);
          delete selectedItem;

          attrName = '@' + that.resId;
          if (attrName in resource) {
            delete resource[attrName];
          }

          var children = parent.getChildren();
          for (var i = 0; i < children.length; i++) {
            if (children[i].getClientData() == attrName) {
              parent.removeChild(children[i]);
              delete children[i];
              that.tree_.setSelectedItem(parent);
              break;
            }
          }
        }
        that.valueTextBox.setValue('');
        that.attrTextBox.setValue('');
        that.resIdField.setValue('');
        that.resIdField.setEnabled(false);
      });

};


/**
 * Draw buttons on top of the splitpane.
 * @private
 */
arb_editor.prototype.drawButtons_ = function() {
  var that = this;
  var checkButton = new goog.ui.Button();
  checkButton.decorate(goog.dom.getElement('check_btn'));
  goog.events.listen(checkButton, goog.ui.Component.EventType.ACTION,
      function(e) {
        that.checkResourceConsistency();
      });

  var uploadButton = new goog.ui.Button();
  uploadButton.decorate(goog.dom.getElement('upload_btn'));
  goog.events.listen(uploadButton, goog.ui.Component.EventType.ACTION,
      function(e) {
        arb.iterateRegistry(function(namespace) {that.uploadResource_(namespace)});
      });

  var downloadButton = new goog.ui.Button();
  downloadButton.decorate(goog.dom.getElement('download_btn'));
  var that = this;
  goog.events.listen(downloadButton, goog.ui.Component.EventType.ACTION,
      function(e) {
        that.downloadAllResources_();
      });
};


/**
 * Draw select locale combo box.
 * @private
 */
arb_editor.prototype.drawSelectLocaleCombo_ = function() {
  this.setLocaleCombo_.setUseDropdownArrow(true);
  this.setLocaleCombo_.setDefaultText('Set active locale');
  var localeList = this.getLocaleList_();
  for (var ind in localeList) {
    this.setLocaleCombo_.addItem(new goog.ui.ComboBoxItem(localeList[ind]));
  }
  this.setLocaleCombo_.render(goog.dom.getElement('locale_combo'));

  var that = this;
  goog.events.listen(this.setLocaleCombo_.getMenu(),
    goog.ui.Component.EventType.ACTION,
    function(e) {
      var value = e.target.getValue();
      arb.setResourceSelector(value);
      arb.localizeHtml();
      that.updateStatus_('Language switched.');
    });
};


/**
 * Draws add locale combo box.
 * @private
 */
arb_editor.prototype.drawAddLocaleCombo_ = function() {
  var addLanguageCb = new goog.ui.ComboBox();
  addLanguageCb.setUseDropdownArrow(true);
  addLanguageCb.setDefaultText('Add language');
  for (var ind in arb_editor.localeList_) {
    addLanguageCb.addItem(
        new goog.ui.ComboBoxItem(arb_editor.localeList_[ind]));
  }
  addLanguageCb.render(goog.dom.getElement('add_lang_combo'));

  var that = this;
  goog.events.listen(addLanguageCb.getMenu(),
      goog.ui.Component.EventType.ACTION,
      function(e) {
        var value = e.target.getValue();
        if (value == arb_editor.localeList_[0]) {
          // user choose to add a new locale
          var myPrompt = new goog.ui.Prompt(
              r$.MSG_INFO_REQUIRED,
              r$.MSG_INPUT_PROMPT,
              function(result) {
                that.updateStatus_(arb.msg(r$.MSG_ADD_LOCALE, result));
                cb.addItem(new goog.ui.ComboBoxItem(result + ':user defined'));
                that.addLocale_(result);
              });
          myPrompt.setVisible(true);
        } else {
          // user choose a existing locale.
          that.addLocale_(value.split(':', 1)[0]);
        }
      });
};


/**
 * Checks if Array contains certain element.
 *
 * @param a Array object as the container.
 * @param obj The element to be checked for its existence.
 *
 * @return true if element can be found in the array.
 */
arb_editor.contains = function(a, obj) {
  var i = a.length;
  for(var i = 0; i < a.length; i++) {
    if (a[i] == obj) {
      return true;
    }
  }
  return false;
};


/**
 * Get the locale list for all the resources.
 *
 * @return {array.string} locale list.
 */
arb_editor.prototype.getLocaleList_ = function() {
  var localeList = [];
  arb.iterateRegistry(function(fullNamespace) {
    var locale = fullNamespace.split(':', 2)[1];
    if (locale && !arb_editor.contains(localeList, locale)) {
      localeList.push(locale);
    }});
  return localeList;
};


/**
 * Download the resource from server for specified language. If it is
 * not available, translated one using google translation.
 * @private
 */
arb_editor.prototype.addLocale_ = function(locale) {
  var namespace = this.baseNamespace_ + ':' + locale;
  var resource = arb.getResource(namespace);
  if (!arb.isEmpty(resource) && resource['@@locale'] == locale) {
    alert('Resource for ' + namespace + ' already exists.');
    return;
  }

  this.updateStatus_(r$.MSG_TRANSLATE_NOTIFICATION);
  var srcNamespace = namespace.replace(/:.*/, ':' + this.sourceLocale_);
  var srcResource = arb.getResource(srcNamespace);
  resource = {'@@locale': locale};
  arb.register(namespace, resource);
  this.startTranslation_(srcResource, resource);
};


/**
 * Check if two objects are equivalent.
 * @param {Object} obj1 first object to compare.
 * @param {Object} obj2 second object to compare.
 * @return {boolean} true if the two objects have the same values.
 * @private
 */
arb_editor.isEqual_ = function(obj1, obj2) {
  var t1 = goog.typeOf(obj1);
  if (t1 != goog.typeOf(obj2)) {
    return false;
  }
  if (t1 == 'string' || t1 == 'number') {
    return obj1 == obj2;
  }

  if (t1 == 'array') {
    if (obj1.length != obj2.length) {
      return false;
    }
    for (var i = 0; i < obj1.length; i++) {
      if (!arb_editor.isEqual_(obj1[i], obj2[i])) {
        return false;
      }
    }
  } else if (t1 == 'object') {
    for (var k in obj1) {
      if (!arb_editor.isEqual_(obj1[k], obj2[k])) {
        return false;
      }
    }
    for (var k in obj2) {
      if (!(k in obj1)) {
        return false;
      }
    }
  }
  return true;
};


/**
 * Construct a string that enumerate all namespaces as options.
 *
 * @return {Array.string} An array of option strings that has all namespaces
 *         as options.
 */
arb_editor.prototype.getNamespaceOptions_ = function() {
  var options = [];
  arb.iterateRegistry(function(fullNamespace) {
    options.push('<option value="' + fullNamespace + '">' +
        fullNamespace + '</option>');
  });
  return options;
};


/**
 * Check the consistency of resources of two locales.
 * @private
 */
arb_editor.prototype.checkResourceConsistency = function() {
  var dialog = new goog.ui.Dialog(null, true);
  dialog.setTitle('Choose resource to check.');
  dialog.setButtonSet(goog.ui.Dialog.ButtonSet.OK_CANCEL);
  var options = this.getNamespaceOptions_();
  var optionStr1 = options.join();
  if (options.length > 1) {
    var t = options[0];
    options[0] = options[1];
    options[1] = t;
  }
  var optionStr2 = options.join();
  var dialogContent = '<table style="width: 360px" align=center>' +
    '<tr><td colspan="3">' +
    'Please choose two namespaces to check. These 2 namespaces should have ' +
    'the same base namespaces but of different locales. Target resource ' +
    'will be checked against baseline resource.' +
    '</td></tr><tr><td width="10%"></td><td>Baseline Resource</td><td><select id="baseline_resource">' +
    optionStr1 +
    '</select></td></tr><tr><td></td><td>Target Resource</td><td>' +
    '<select id="target_resource">' +
    optionStr2 +
    '</select></td><tr></table>';
  dialog.setContent(dialogContent);

  var baseline = '';
  var target = '';
  var that = this;
  goog.events.listen(dialog, goog.ui.Dialog.EventType.SELECT, function(e) {
    if (e.key == 'ok') {
      var el = goog.dom.getElement('baseline_resource');
      baseline = el.options[el.selectedIndex].value;
      el = goog.dom.getElement('target_resource');
      target = el.options[el.selectedIndex].value;
      that.doConsistencyCheck_(baseline, target);
    }
  });
  dialog.setVisible(true);
};


/**
 * Perform consistency check on target resource against baseline.
 *
 * @param {string} baseline The namespace of baseline resource.
 * @param {string} target The namespace of target resource.
 */
arb_editor.prototype.doConsistencyCheck_ = function(baseline, target) {
  var baselineRes = arb.getResource(baseline);
  var targetRes = arb.getResource(target);
  var errorCount = 0;
  this.pendingTranslations_ = 0;
  for (var name in baselineRes) {
    if (name == '@@locale') {
      if (baselineRes[name] == targetRes[name]) {
        errorCount += 1;
        alert(r$.MSG_SAME_LOCALE_NAME);
        return;
      }
    } else if (name.lastIndexOf('@', 0) == 0) {
      if (!(name in targetRes)) {
        errorCount += 1;
        var answer = confirm(arb.msg(r$.MSG_MISSING_ATTR, name));
        if (answer) {
          targetRes[name] = baselineRes[name];
          this.dirty_ = true;
        }
      } else if (!arb_editor.isEqual_(baselineRes[name], targetRes[name])) {
        errorCount += 1;
        var answer = confirm(arb.msg(r$.MSG_ATTR_DIFF, name));
        if (answer) {
          targetRes[name] = baselineRes[name];
          this.dirty_ = true;
        }
      }
    } else {
      if (!(name in targetRes)) {
        errorCount += 1;
        var answer = confirm(arb.msg(r$.MSG_NEED_TRANSLATE, name));
        if (answer) {
          this.pendingTranslations_++;
          this.translate_(name, baselineRes, targetRes);
        }
      }
    }
  }

  for (var name in targetRes) {
    if (!(name in baselineRes)) {
      errorCount += 1;
      var answer = confirm(arb.msg(r$.MSG_NAME_DROPPED, name));
      if (answer) {
        delete targetRes[name];
        this.dirty_ = true;
      }
    }
  }

  if (errorCount == 0) {
    alert(r$.MSG_NO_ERROR);
  }

  if (this.dirty_ && this.pendingTranslations_ == 0) {
    arb.register(target, targetRes);
    this.removeAllResources_();
    this.loadAllResources_();
    this.updateDisplay_();
  }
};


/**
 * Download current resource from app service.
 */
arb_editor.prototype.downloadAllResources_ = function() {
  var namespace = this.getCurrentFullNamespace_();
  var resource = arb.getResource(namespace);
  var jsonp = new goog.net.Jsonp(this.serviceUrl_ +
      '/arb_get?projectId=' + this.projectId_ +
      '&arbName=' + namespace);
  var that = this;
  jsonp.send(null,
      function(reply) {
        that.updateStatus_(r$.MSG_FOUND_ARB);
        if (reply && '@@locale' in reply) {
          arb.register(namespace, reply);
          resource = arb.getResource(namespace);
          that.removeAllResources_();
          that.loadAllResources_();
          that.updateDisplay_();
        }
      },
      function(payload) {
        that.updateStatus_(r$.MSG_FAILED_TO_REACH_APP_SERVER);
      }
  );
};


/**
 * Uploads resource as specified by namespace.
 *
 * @param namespace the fully qualified namespace of the resource to
 *        uploaded.
 */
arb_editor.prototype.uploadResource_ = function(namespace) {
  var resource = arb.getResource(namespace);

  var arbCopy = goog.cloneObject(resource);
  var that = this;
  var sendOne = function(namespace, arbCopy) {
    if (goog.object.isEmpty(arbCopy)) {
      that.updateStatus_(arb.msg(r$.MSG_RESOURCE_UPLOADED, namespace));
      that.dirty_ = false;
      return;
    }
    var key = goog.object.getAnyKey(arbCopy);
    var value = goog.json.serialize(arbCopy[key]);
    var uri = new goog.Uri(that.serviceUrl_ + '/arb_update');
    uri.setParameterValue('arbName', namespace);
    uri.setParameterValue('projectId', that.projectId_);
    uri.setParameterValue('key', key);
    uri.setParameterValue('value', value);
    var jsonp = new goog.net.Jsonp(uri);
    jsonp.send(null, function(reply) {
      if (reply.indexOf('https://www.google.com/accounts/ServiceLogin') != -1) {
        alert('Please sign in to your google account by click on the ' +
              '"Sign In" link. A new window (or tab) will be opened for ' +
              ' you to sign in to your Google account. After you signed ' +
              'in, please close that window(tab) and re-upload.');
        var signinLink = goog.dom.getElement('signin_link');
        signinLink.href = reply;
        return;
      }
      goog.object.remove(arbCopy, key);
      that.updateStatus_(arb.msg(r$.MSG_UPDATING_KEY, key));
      sendOne(namespace, arbCopy);
    });
  }
  sendOne(namespace, arbCopy);
};


/**
 * Check if target locale is supported by Google's translation service. If so,
 * start the real translation.
 * @param src
 * @private
 */
arb_editor.prototype.startTranslation_ = function(srcRes, dstRes) {
  for (var name in srcRes) {
    var resType = arb.dbg.getType(srcRes, name);
    if (resType == 'text' || resType == '') {
      this.pendingTranslations_++;
      this.translate_(name, srcRes, dstRes);
    }
  }
};


/**
 * Translate a resource in asynchronous manner.
 * @param {string} resId resource id for resource to be translated.
 * @private
 */
arb_editor.prototype.translate_ = function(resId, srcRes, dstRes) {
  var uriPrefix = this.serviceUrl_ + '/arb_translate' +
      '?projectId=' + this.projectId_ +
      '&source=' + srcRes['@@locale'] +
      '&target=' + dstRes['@@locale'] + '&q=';
  var jsonp = new goog.net.Jsonp(new goog.Uri(uriPrefix +
      escape(srcRes[resId])));
  var that = this;
  jsonp.send(null,
      function(resId) {
        return function(reply) {
          dstRes[resId] = reply.data.translations[0].translatedText;
          that.dirty_ = true;

          if (that.pendingTranslations_ != 0) {
            that.pendingTranslations_--;
            if (that.pendingTranslations_ == 0) {
              that.setLocaleCombo_.addItem(new goog.ui.ComboBoxItem(dstRes['@@locale']));
              that.removeAllResources_();
              that.loadAllResources_();
              that.updateDisplay_();
              return;
            }
          }
          if (resId == that.resId_) {
            that.updateDisplay_();
          }
        };
      }(resId),
      function(err) {
        that.updateStatus_(err);
      });
};


/**
 * List of popular locales that is used to populate locale selection box.
 * @private
 */
arb_editor.localeList_ = [
  'add new locale',       // A special item to add locale not in the list.
  'en:English(American)',
  'ar:Arabic',
  'zh-CN:Chinese(Simplified)',
  'zh-TW:Chinese(Traditional)',
  'nl:Dutch',
  'en-GB:English(British)',
  'fr:French(European)',
  'de:German',
  'it:Italian',
  'ja:Japanese',
  'ko:Korean',
  'pl:Polish',
  'pt:Portuguese(Brazilian)',
  'ru:Russian',
  'es:Spanish(European)',
  'th:Thai',
  'tr:Turkish',
  'bg:Bulgarian',
  'ca:Catalan',
  'hr:Croatian',
  'cs:Czech',
  'da:Danish',
  'fil:Filipino',
  'fi:Finnish',
  'el:Greek',
  'iw:Hebrew',
  'hi:Hindi',
  'hu:Hungarian',
  'id:Indonesian',
  'lv:Latvian',
  'lt:Lithuanian',
  'no:Norwegian(Bokmål)',
  'pt-PT:Portuguese(European)',
  'ro:Romanian',
  'sr:Serbian(Cyrillic)',
  'sk:Slovak',
  'sl:Slovenian',
  'sv:Swedish',
  'uk:Ukrainian',
  'vi:Vietnamese',
  'fa:Persian',
  'es-419:Spanish(Latin American)',
  'af:Afrikaans',
  'am:Amharic',
  'bn:Bengali',
  'et:Estonian',
  'is:Icelandic',
  'ms:Malay',
  'mr:Marathi',
  'sw:Swahili',
  'ta:Tamil',
  'zu:Zulu',
  'eu:Basque',
  'zh-HK:Chinese(Hong Kong)',
  'fr-CA:French(Canadian)',
  'gl:Galician',
  'gu:Gujarati',
  'kn:Kannada',
  'ml:Malayalam',
  'te:Telugu',
  'ur:Urdu'
];

