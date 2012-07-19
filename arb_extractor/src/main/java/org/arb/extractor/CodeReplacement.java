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

package org.arb.extractor;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * This is a data only class contains data about one code replacement.
 */
abstract class CodeReplacement {
  /** resource id of the resource being extracted. */
  protected String resourceId;

  /** the resource text with placeholder(s). */
  protected String resourceTextTemplate;
  
  /** JSONObject to hold attributes collected in extraction process. */
  protected final JSONObject resourceAttr;
  
  // Indicate the resource is a simple literal string, which means resourceTextTemplate is the
  // resource text itself.
  protected boolean pureLiteral;
  
  CodeReplacement() {
    resourceAttr = new JSONObject();
  }

  /** add a resource attribute (name/value pair) */
  public void addResourceAttr(final String name, final String value) throws JSONException {
    resourceAttr.append(name, value);
  }
  
  /** return resource attributes as a JSON string. */
  public String getResourceAttrs() {
    return resourceAttr.toString();
  }
  
  /**
   * @return the location key for this replacement. In AST tree, that will be
   *   the hashCode of tree node; in DOM tree, it will be the hashCode of the
   *   DOM element.
   */
  public abstract Object getSyntaxObject();
  
  /**
   * @return whether this is a pure literal.
   */
  public boolean isPureLiteral() {
    return pureLiteral;
  }

  
  /**
   * @return the resource string that will be saved to resource bundle. If the
   *   resource uses placeholders, named or positional placeholders need to be
   *   inserted.
   */
  public String getResourceText() {
    return resourceTextTemplate;
  }

  /** set the resource text. */
  public void setResourceText(String resourceText) {
    resourceTextTemplate = resourceText;
    pureLiteral = true;
  }
  
  /** append resource text to the end of existing resource string. */
  public void appendResourceText(String resourceText) {
    resourceTextTemplate += resourceText;
  }
  
  /** prepend resource text before existing resource string. */
  public void prependResourceText(String resourceText) {
    resourceTextTemplate = resourceText + resourceTextTemplate;
  }

  /** append resource text to the end of existing resource string. */
  public void appendPlaceholder(String placeholder) {
    resourceTextTemplate += placeholder;
    pureLiteral = false;
  }
  
  /** prepend resource text before existing resource string. */
  public void prependPlaceholder(String placeholder) {
    resourceTextTemplate = placeholder + resourceTextTemplate;
    pureLiteral = false;
  }

  /**
   * @return the resourceId
   */
  public String getResourceId() {
    return resourceId;
  }

  /**
   * @param resourceId the resourceId to set
   */
  public void setResourceId(String resourceId) {
    this.resourceId = resourceId;
  }
}
