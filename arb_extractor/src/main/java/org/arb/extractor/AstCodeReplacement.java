// Copyright 2012 Google Inc. All Rights Reserved.

package org.arb.extractor;

import org.antlr.runtime.tree.CommonTree;

import java.util.ArrayList;

/**
 * @author shanjian@google.com (Shanjian Li)
 *
 */
public class AstCodeReplacement extends CodeReplacement {
  /** start token (included) in original code about this change */
  private int startTokenIndex;
  
  /** end token (not included) in original code about this change. */
  private int endTokenIndex;

  // This field is for AST tree processing.
  private CommonTree tree;
  
  /**
   * @return the tree
   */
  public CommonTree getTree() {
    return tree;
  }

  /**
   * @param tree the tree to set
   */
  public void setTree(CommonTree tree) {
    this.tree = tree;
  }

  // arguments for placeholder. They are the set of AST nodes covered by replacement but not replaced.
  final ArrayList<CommonTree> argumentList;
  
  public AstCodeReplacement() {
    super();
    argumentList = new ArrayList<CommonTree>();
  }
  
  @Override
  public Object getSyntaxObject() {
    return tree;
  }

  /**
   * Get resource text for this replacement. If the resource is not a simple literal string, resourceTextTemplate
   * will be processed to create the resource text.
   *
   * @return resource text.
   */
  @Override
  public String getResourceText() {
    if (pureLiteral) {
      return resourceTextTemplate;
    }
    String resText = resourceTextTemplate;
    for (int i = 0; i < argumentList.size(); i++) {
      resText = resText.replaceFirst("\\{%d\\}", String.format("{%d}", i));
    }
    return resText;
  }

  /**
   * @return the startTokenIndex
   */
  public int getStartTokenIndex() {
    return startTokenIndex;
  }

  /**
   * @param startTokenIndex the startTokenIndex to set
   */
  public void setStartTokenIndex(int startTokenIndex) {
    this.startTokenIndex = startTokenIndex;
  }

  /**
   * @return the endTokenIndex
   */
  public int getEndTokenIndex() {
    return endTokenIndex;
  }

  /**
   * @param endTokenIndex the endTokenIndex to set
   */
  public void setEndTokenIndex(int endTokenIndex) {
    this.endTokenIndex = endTokenIndex;
  }
  
}
