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

import org.arb.extractor.AbstractCodeUnit;
import org.arb.extractor.CodeReplacement;
import org.arb.extractor.TreeWalker;

import org.json.JSONObject;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

/**
 * TreeWalker for HTML DOM tree.
 */
public class DomTreeWalker implements TreeWalker {

  /** All element id found in this html file.*/
  private Set<String> elementIdSet = new HashSet<String>();

  /** All arb id found in this html file.*/
  private Set<String> arbIdSet = new HashSet<String>();
  
  private JSONObject resourceBundle;
  
  public DomTreeWalker(JSONObject resourceBundle) {
    this.resourceBundle = resourceBundle;
  }
  
  @Override
  public void setOption(final String name, final String value) {
  }
  
  /**
   * This method provide TreeWalker the chance to go through all the source code units before
   * actual resource extraction. In Javascript processing, we collect all identifiers in this
   * pass.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   */
  @Override
  public void preprocessingPass(AbstractCodeUnit codeUnit) {
    Document doc = codeUnit.getDomDocument();
    Elements elements = doc.getElementsByTag("html");
    for (int i = 0; i < elements.size(); ++i) {
      collectIdsOnElement(elements.get(i), codeUnit);
    }
  }
  
  private void collectIdsOnElement(Element element, AbstractCodeUnit codeUnit) {
    if (element.hasAttr("id")) {
      elementIdSet.add(element.attr("id")); 
    }
    if (element.hasAttr("arb:id")) {
      arbIdSet.add(element.attr("arb:id"));
    }
    for (int i = 0; i < element.children().size(); i++) {
      collectIdsOnElement(element.child(i), codeUnit);
    }
  }

  @Override
  public boolean isResourceIdAcceptable(String identifier) {
    return !elementIdSet.contains(identifier) && !arbIdSet.contains(identifier);
  }

  /**
   * Rewrite the source code with resource extracted.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   * @return source code after resource replacement. 
   */
  @Override
  public String rewriteSource(AbstractCodeUnit codeUnit) {
    // Apply all the replacements 
    ArrayList<CodeReplacement> replacementList = codeUnit.getReplacementList();
    for (CodeReplacement replacement : replacementList) {
      DomCodeReplacement domReplacement = (DomCodeReplacement)replacement;
      if (domReplacement.isNewId()) {
        if (domReplacement.shouldUseArbId()) {
          domReplacement.getElement().attr("arb:id", replacement.getResourceId());
        } else {
          domReplacement.getElement().attr("id", replacement.getResourceId());
        }
      }
    }
    
    // return things back
    Document doc = codeUnit.getDomDocument();
    Elements elements = doc.getElementsByTag("html");
    return elements.outerHtml();
  }

  
  /**
   * Generate replacement code for a replacement.
   * 
   * @param replacement CodeReplacement instance. 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   * @return replacement code.
   */
  @Override
  public String generateReplacementCode(CodeReplacement replacement, AbstractCodeUnit codeUnit) {
    DomCodeReplacement domReplacement = (DomCodeReplacement)replacement;
    if (domReplacement.isNewId()) {
      if (domReplacement.shouldUseArbId()) {
        domReplacement.getElement().attr("arb:id", replacement.getResourceId());
      } else {
        domReplacement.getElement().attr("id", replacement.getResourceId());
      }
    }
    
    String ret = domReplacement.getElement().outerHtml();
    
    // restore the added id
    if (domReplacement.isNewId()) {
      if (domReplacement.shouldUseArbId()) {
        domReplacement.getElement().removeAttr("arb:id");
      } else {
        domReplacement.getElement().removeAttr("id");
      }
    }
    return ret;
  }

  @Override
  public String getOriginalCodeWithContext(CodeReplacement replacement, AbstractCodeUnit codeUnit) {
    DomCodeReplacement domReplacement = (DomCodeReplacement)replacement;
    return domReplacement.getElement().outerHtml();
  }
  
  @Override
  public String getNewCodeWithContext(CodeReplacement replacement, AbstractCodeUnit codeUnit) {
    return generateReplacementCode(replacement, codeUnit);
  }
  
  /**
   * Extract localizable resource from a code unit.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   */
  @Override
  public void extractResource(AbstractCodeUnit codeUnit) {
    Document doc = codeUnit.getDomDocument();
    Elements elements = doc.getElementsByTag("html");
    for (int i = 0; i < elements.size(); ++i) {
      extractResourceOnElement(elements.get(i), codeUnit);
    }
  }

  /**
   * Get the existing resource id from the element. Resource id can be specified with either
   * arb:id or id, with arb:id taking priority.
   * 
   * @param elem the element to be checked.
   * @return resource id or null.
   */
  private String getElementResourceId(Element elem) {
    if (elem.hasAttr("arb:id")) {
      return elem.attr("arb:id"); 
    } 
    if (elem.hasAttr("id")) {
      return elem.attr("id");
    }
    return null;
  }
  
  private boolean hasResource(Element elem) {
    String resourceId = getElementResourceId(elem);
    return resourceId != null && resourceBundle.has(resourceId);
  }
  
  /**
   * Extract resource from an element and all its children.
   *  
   * @param element the target element.
   * @param codeUnit used to record all found replacement.
   */
  private void extractResourceOnElement(Element element, AbstractCodeUnit codeUnit) {
    String ownText = element.ownText();
    if (!ownText.isEmpty() && !hasResource(element)) {
      DomCodeReplacement replacement = new DomCodeReplacement();
      replacement.setElement(element);
      replacement.setResourceText(ownText);
      replacement.setResourceId(getElementResourceId(element));
      if (replacement.getResourceId() == null) {
        replacement.setNewId(true);
        replacement.setUseArbId(true);
      }
      codeUnit.addReplacement(replacement);
    }
    for (int i = 0; i < element.children().size(); i++) {
      extractResourceOnElement(element.child(i), codeUnit);
    }
  }
}
