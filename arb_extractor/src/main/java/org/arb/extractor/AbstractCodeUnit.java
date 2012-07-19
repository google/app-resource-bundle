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

import org.antlr.runtime.ANTLRStringStream;
import org.antlr.runtime.CommonTokenStream;
import org.antlr.runtime.RecognitionException;
import org.antlr.runtime.tree.CommonTree;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Abstract class to encapsulate code unit (be it file or a string, or whatever).
 */
public abstract class AbstractCodeUnit {
  /** token stream as used in ANTLR parser */
  private CommonTokenStream tokens = null;
  
  /** AST tree generated through ANTLR parser */
  private CommonTree astTree = null;
  
  /** DOM document generated through Jsoup */
  private Document document = null;
  
  /** Collection of code replacement as map with the syntax object as key. The actual type of syntax
   *  object depends on the implementation class. For AST parser, it is AST node. For DOM parser, it
   *  is DOM element. 
   */
  private Map<Object, CodeReplacement> replacementMap = new HashMap<Object, CodeReplacement>();

  /** new code after resource extraction */
  private String newCode = "";
  
  private boolean parseToAstTree()  throws IOException {
    JavascriptLexer lex = new JavascriptLexer(new ANTLRStringStream(getCodeContent()));
    tokens = new CommonTokenStream(lex);
    JavascriptParser g = new JavascriptParser(tokens);
    JavascriptParser.program_return ret;
    try {
      ret = g.program();
    } catch (RecognitionException e) {
      e.printStackTrace();
      return false;
    }
    astTree = (CommonTree)ret.getTree();
    astTree.setUnknownTokenBoundaries();
    return true;
  }
  
  private boolean parseToDomTree() throws IOException {
    document = Jsoup.parse(getCodeContent());
    return true;    
  }
  
  /** parse the source code depending on its language. */
  public boolean parse() throws IOException {
    switch (getLanguage()) {
      case JAVASCRIPT:
        return parseToAstTree();
      case HTML:
        return parseToDomTree();
    }
    return false;
  }
  
  
  abstract public String getCodeContent() throws IOException;
  
  /**
   * Returns AST tree if the code unit has bee parsed into an AST tree.
   * @return the AST tree.
   */
  public CommonTree getAstTree() {
    return astTree;
  }

  /**
   * Returns the DOM Document if the code unit has been parsed as a DOM
   * document.
   * @return the DOM document.
   */
  public Document getDomDocument() {
    return document;
  }
  
  
  public void setNewCode(String str) {
    newCode = str;
  }
  
  /**
   * If code unit is parsed to an AST tree, this function returns the token
   * stream.
   * @return the CommonTokenStream of a AST tree.
   */
  public CommonTokenStream getTokens() {
    return tokens;
  }
  
  /**
   * Records a CodeReplacement.
   * @param replacement a CodeReplace instance to be recorded.
   */
  public void addReplacement(CodeReplacement replacement) {
    replacementMap.put(replacement.getSyntaxObject(), replacement);
  }
  
  /**
   * Retrieves the CodeReplacement from its syntax object.
   * @param syntaxObj the syntax object (Tree in AST, DOM Element in DOM).
   * @return the corresponding CodeReplacement instance.
   */
  public CodeReplacement getReplacement(Object syntaxObj) {
    if (replacementMap.containsKey(syntaxObj)) {
      return replacementMap.get(syntaxObj);
    }
    return null;
  }
  
  private void fillReplacementList(CommonTree tree, ArrayList<CodeReplacement> replacementList) {
    if (replacementMap.containsKey(tree)) {
      CodeReplacement replacement = replacementMap.get(tree);
      replacementList.add(replacement);
    }
    for (int i = 0; i < tree.getChildCount(); i++) {
      fillReplacementList((CommonTree)tree.getChild(i), replacementList);
    }
  }
  
  private void fillReplacementList(Element elem, ArrayList<CodeReplacement> replacementList) {
    if (replacementMap.containsKey(elem)) {
      CodeReplacement replacement = replacementMap.get(elem);
      replacementList.add(replacement);
    }
    for (int i = 0; i < elem.children().size(); i++) {
      fillReplacementList(elem.child(i), replacementList);
    }
  }
  
  /**
   * Returns all CodeReplacement instances for this CodeUnit.
   * @return ArrayList of CodeReplacement.
   */
  public ArrayList<CodeReplacement> getReplacementList() {
    ArrayList<CodeReplacement> replacementList = new ArrayList<CodeReplacement>();
    if (astTree != null) {
      fillReplacementList(astTree, replacementList);
    } 
    if (document != null) {
      Elements elements = document.getElementsByTag("html");
      for (int i = 0; i < elements.size(); ++i) {
        fillReplacementList(elements.get(i), replacementList);
      }
      
    }
    return replacementList;
  }

  /**
   * Removes a CodeReplacement instance.
   * @param replacement the CodeReplacement instance to be removed.
   */
  public void removeReplacement(CodeReplacement replacement) {
    if (replacementMap.containsKey(replacement.getSyntaxObject())) {
      replacementMap.remove(replacement.getSyntaxObject());
    }
  }
  
  /**
   * Returns CodeUnit name. This will be the filename if the CodeUnit is a file.
   * @return CodeUnit name.
   */
  abstract public String getCodeUnitName();
  
  /**
   * Returns the CodeUnit instance's language, like Javascript, HTML, etc.
   * @return Language enum.
   */
  abstract public Utils.Language getLanguage();
  
  /**
   * Returns the new code after replacement of this code unit.
   * @return new code as string.
   */
  public String getNewCode() {
    return newCode;
  }
}
