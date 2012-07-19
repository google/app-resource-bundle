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

import org.arb.extractor.DomTreeWalker;
import org.arb.extractor.TreeWalker;

import org.json.JSONObject;

/**
 * Utility class used to generate resource id.
 */
public class ResourceIdGenerator {

  /** Next of next string id for auto name generation. */
  public int nextStringIdNumber;

  /** Resource bundle in form of JSONObject. */
  JSONObject resourceBundle;
  
  private static final String DOM_RESOURCE_ID_PREFIX = "MSG_";
  
  private static final String GENERAL_RESOURCE_ID_PREFIX = "MSG_";
  
  public ResourceIdGenerator(JSONObject resourceBundle) {
    this.resourceBundle = resourceBundle;
    this.nextStringIdNumber = 0;
  }
  
  public void setResourceBundle(JSONObject resourceBundle) {
    this.resourceBundle = resourceBundle;
  }
  
  /** 
   * Generate a unique resource ID.
   * 
   * @return unique resource ID string.
   */
  public String createNewResourceId(TreeWalker treeWalker) {
    String newName;
    do {
      if (treeWalker instanceof DomTreeWalker) {
        newName = String.format("%s%05d", DOM_RESOURCE_ID_PREFIX, nextStringIdNumber);
      } else {
        newName = String.format("%s%05d", GENERAL_RESOURCE_ID_PREFIX, nextStringIdNumber);
      }
      nextStringIdNumber++;
    } while (resourceBundle.has(newName) || !treeWalker.isResourceIdAcceptable(newName));
    return newName;
  }
  
  /**
   * If the last generated resource id is not used, recycle it if possible.
   * @param resourceId the candidate resource id for recycling.
   */
  public void recycleResourceId(String resourceId) {
    if (resourceId.startsWith(DOM_RESOURCE_ID_PREFIX)) {
      int num = Integer.parseInt(resourceId.substring(5));
      if (num == nextStringIdNumber - 1) {
        nextStringIdNumber--;
      }
    } else if (resourceId.startsWith(GENERAL_RESOURCE_ID_PREFIX)) {
      int num = Integer.parseInt(resourceId.substring(4));
      if (num == nextStringIdNumber - 1) {
        nextStringIdNumber--;
      }
    }
  }
  
  
}