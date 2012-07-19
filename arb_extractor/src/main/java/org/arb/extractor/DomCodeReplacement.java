// Copyright 2012 Google Inc. All Rights Reserved.

package org.arb.extractor;

import org.jsoup.nodes.Element;

/**
 * @author shanjian@google.com (Shanjian Li)
 *
 */
public class DomCodeReplacement extends CodeReplacement {
  // This field is for DOM tree processing.
  private Element element;
  
  // indicate the DOM element will use arb:id for resource id
  private boolean useArbId;
  
  // indicate a new attribute is added to element 
  private boolean isNewId;
  
  /**
   * @return the element
   */
  public Element getElement() {
    return element;
  }

  /**
   * @param element the element to set
   */
  public void setElement(Element element) {
    this.element = element;
  }

  @Override
  public Object getSyntaxObject() {
    return element;
  }

  /**
   * @return the useArbId
   */
  public boolean shouldUseArbId() {
    return useArbId;
  }

  /**
   * @param useArbId the useArbId to set
   */
  public void setUseArbId(boolean useArbId) {
    this.useArbId = useArbId;
  }

  /**
   * @return the isNewId
   */
  public boolean isNewId() {
    return isNewId;
  }

  /**
   * @param isNewId the isNewId to set
   */
  public void setNewId(boolean isNewId) {
    this.isNewId = isNewId;
  }  
}
