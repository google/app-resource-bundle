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
import org.arb.extractor.Utils;

import org.antlr.runtime.CommonTokenStream;
import org.antlr.runtime.Token;
import org.antlr.runtime.tree.CommonTree;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

/**
 * TreeWalker for JavaScript language.
 */
public class JavascriptTreeWalker implements TreeWalker {
  
  /** All possible identifiers found in all given source file. */
  Set<String> identifierSet = new HashSet<String>();

  /** Variable name used in JavaScript file to identify resource bundle. */
  String resourceVar = "r$";

  public JavascriptTreeWalker(JSONObject resourceBundle) {
  }
  
  @Override
  public void setOption(final String name, final String value) {
    if (name.equals("resourceVar")) {
      this.resourceVar = value;   
    }
  }
  
  /**
   * This method provide TreeWalker the chance to go through all the source code units before
   * actual resource extraction. In JavaScript processing, we collect all identifiers in this
   * pass.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   */
  @Override
  public void preprocessingPass(AbstractCodeUnit codeUnit) {
    CommonTree tree = codeUnit.getAstTree();
    CommonTokenStream tokens = codeUnit.getTokens();
    collectIdentifiers(tree, tokens);
  }
  /**
   * Collect identifiers from a AST tree (or subtree).
   * 
   * In this implementation, variable declarations and function names are collected.
   * Further scope examination is not performed. It is generally good practice to
   * avoid using same name for different things. But it is not absolutely necessary
   * as the resource is referenced through resource bundle variable.
   *  
   * @param tree AST tree (or subtree) to be examined. 
   * @param tokens token stream of the whole file.
   */
  private void collectIdentifiers(CommonTree tree, CommonTokenStream tokens) {
    String text = tree.getText();
    if (text != null) {
      if (text.equals("VAR_DECL_DEF")) {
        int tokenIndex = tree.getTokenStartIndex();
        identifierSet.add(tokens.get(tokenIndex).getText());
        return;
      }
      if (text.equals("function")) {
        int tokenIndex = tree.getTokenStartIndex();
        identifierSet.add(((CommonTree)tree.getChild(0)).getText());
        return;
      }
    }
    for (int i = 0; i < tree.getChildCount(); i++) {
      collectIdentifiers((CommonTree)tree.getChild(i), tokens);
    }
  }

  @Override
  public boolean isResourceIdAcceptable(String identifier) {
    // TODO(shanjian): needs implementation.
    return true;
  }

  /**
   * Rewrite the source code with resource extracted.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   * @return source code after resource replacement. 
   */
  @Override
  public String rewriteSource(AbstractCodeUnit codeUnit) {
    CommonTree tree = codeUnit.getAstTree();
    return rewriteSource(tree, codeUnit);
  }

  
  /**
   * Rewrite the source code with resource extracted.
   * 
   * @param tree AST tree (or subtree) to be examined. 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   * @return source code after resource replacement. 
   */
  private String rewriteSource(CommonTree tree, AbstractCodeUnit codeUnit) {
    CommonTokenStream tokens = codeUnit.getTokens();

    AstCodeReplacement replacement = (AstCodeReplacement)codeUnit.getReplacement(tree);
    if (replacement != null) {
      return generateReplacementCode(replacement, codeUnit); 
    }

    int ind = tree.getTokenStartIndex();
    /*System.out.println(tree.toStringTree());
    System.out.println(tree.getTokenStartIndex());
    System.out.println(tree.getTokenStopIndex());
    */
    StringBuilder sourceCode = new StringBuilder();
    for (int i = 0; i < tree.getChildCount(); i++) {
      CommonTree child = (CommonTree)tree.getChild(i);
      for (; ind < child.getTokenStartIndex(); ind++) {
        sourceCode.append(tokens.get(ind).getText());
      }
      sourceCode.append(rewriteSource(child, codeUnit));
      ind = child.getTokenStopIndex() + 1;
    }
    for (; ind <= tree.getTokenStopIndex(); ind++) {
      // ANTLR 3.4 added an artificial EOF token.
      String text = tokens.get(ind).getText();
      if (!text.equals("<EOF>")) {
        sourceCode.append(tokens.get(ind).getText());
      }
    }
    return sourceCode.toString();
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
    AstCodeReplacement astReplacement = (AstCodeReplacement)replacement;
    StringBuilder newCode = new StringBuilder();
    if (astReplacement.isPureLiteral()) {
      newCode.append(resourceVar);
      newCode.append(".");
      newCode.append(astReplacement.getResourceId());
    } else {
      newCode.append("arb.msg(");
      newCode.append(resourceVar);
      newCode.append(".");
      newCode.append(astReplacement.getResourceId());
      
      for (int i = 0; i < astReplacement.argumentList.size(); i++) {
        newCode.append(", ");
        newCode.append(rewriteSource(astReplacement.argumentList.get(i), codeUnit));
      }
      newCode.append(")");
    }
    return newCode.toString();
  }

  /** How many lines should be presented in context about a change. */
  private final int CONTEXT_LINES = 2; 

  /**
   * Get the first token index (included) of a context display for a token.
   * 
   * Suppose the token given is in line 25, and we want to show line 23 to line 27.
   * The returned token index is index of the first token in line 23.
   *
   * @param tokens token stream about a source file.
   * @param tokenInd interested token index.
   * 
   * @return start token index (included) of the context.
   */
  private int getStartTokenIndexInContext(CommonTokenStream tokens, int tokenInd) {
    Token token = tokens.get(tokenInd);
    int line = token.getLine();
    int startInd = tokenInd;
    int startLine = line > CONTEXT_LINES ? line - CONTEXT_LINES : 0; 
    while (startInd > 0 && tokens.get(startInd - 1).getLine() >= startLine) {
      startInd--;
    }
    return startInd;
  }
  
  /**
   * Get the last token index (not included) of a context display for a token.
   * 
   * Suppose the token given is in line 25, and we want to show line 23 to line 27.
   * The returned token index is the one after the last token in line 27.
   * 
   * @param tokens token stream about a source file.
   * @param tokenInd interested token index.
   * 
   * @return end token index (not included) of the context.
   */
  private int getEndTokenIndexInContext(CommonTokenStream tokens, int tokenInd) {
    Token token = tokens.get(tokenInd);
    int line = token.getLine();
    int endInd = tokenInd;
    int endLine = line + CONTEXT_LINES; 
    while (endInd < tokens.size() - 1 && tokens.get(endInd + 1).getLine() <= endLine) {
      endInd++;
    }
    return endInd;
  }

  /**
   * Return the replacement that covers the specified token as indicated by token index.
   * @param ind token index of the token being examined.
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   * @return the replacement that covers the specified token or null.
   */
  private AstCodeReplacement getReplacementFromTokenIndex(int ind, AbstractCodeUnit codeUnit) {
    ArrayList<CodeReplacement> replacementList = codeUnit.getReplacementList();
    for (CodeReplacement replacement : replacementList) {
      AstCodeReplacement jsReplacement = (AstCodeReplacement)replacement;
      if (ind >= jsReplacement.getStartTokenIndex() && ind < jsReplacement.getEndTokenIndex()) {
        return jsReplacement;
      }
    }
    return null;
  }
  
  @Override
  public String getOriginalCodeWithContext(CodeReplacement replacement, AbstractCodeUnit codeUnit) {
    CommonTokenStream tokens = codeUnit.getTokens();
    AstCodeReplacement jsReplacement = (AstCodeReplacement)replacement;
    int startInd = getStartTokenIndexInContext(tokens, jsReplacement.getStartTokenIndex());
    int endInd = getEndTokenIndexInContext(tokens, jsReplacement.getEndTokenIndex());
    StringBuffer sb = new StringBuffer();
    for (int i = startInd; i < endInd; i++) {
      if (i < jsReplacement.getStartTokenIndex()) {
        AstCodeReplacement previousReplacement = getReplacementFromTokenIndex(i, codeUnit);
        if (previousReplacement != null) {
          sb.append(generateReplacementCode(previousReplacement, codeUnit));
          i = previousReplacement.getEndTokenIndex();
          continue;
        }
      }
      sb.append(tokens.get(i).getText());
    }
    return sb.toString();
  }
  
  @Override
  public String getNewCodeWithContext(CodeReplacement replacement, AbstractCodeUnit codeUnit) {
    CommonTokenStream tokens = codeUnit.getTokens();
    AstCodeReplacement jsReplacement = (AstCodeReplacement)replacement;
    
    int startInd = getStartTokenIndexInContext(tokens, jsReplacement.getStartTokenIndex());
    int endInd = getEndTokenIndexInContext(tokens, jsReplacement.getEndTokenIndex());
    StringBuffer sb = new StringBuffer();
    for (int i = startInd; i < endInd; i++) {
      if (i < jsReplacement.getStartTokenIndex()) {
        AstCodeReplacement previousReplacement = getReplacementFromTokenIndex(i, codeUnit);
        if (previousReplacement != null) {
          sb.append(generateReplacementCode(previousReplacement, codeUnit));
          i = previousReplacement.getEndTokenIndex();
          continue;
        }
      } else if (i < jsReplacement.getEndTokenIndex()) {
        sb.append(generateReplacementCode(replacement, codeUnit));
        i = jsReplacement.getEndTokenIndex();
        continue;
      }
      sb.append(tokens.get(i).getText());
    }
    return sb.toString();
  }

  
  /** Get unquoted literal string represented by tree.
   * 
   * @param tree AST node that represents the literal string.
   * @param tokens token stream.
   * @return unquoted literal string.
   */
  private String getLiteralText(CommonTree tree, CommonTokenStream tokens) {
    String tokenText = tokens.get(tree.getTokenStartIndex()).getText();
    return Utils.unescape(tokenText.substring(1, tokenText.length() - 1));
  }
  
  /**
   * Create a CodeReplacement instance from a AST node that represents literal string.
   * @param tree AST node that represents a literal string.
   * @param tokens token stream.
   * @return newly created replacement.
   */
  private AstCodeReplacement createCodeReplacementFromLiteralString(CommonTree tree, CommonTokenStream tokens) {
    AstCodeReplacement replacement = new AstCodeReplacement();
    int tokenIndex = tree.getTokenStartIndex();
    replacement.setStartTokenIndex(tokenIndex);
    replacement.setEndTokenIndex(tokenIndex + 1);
    replacement.setResourceText(getLiteralText(tree, tokens));
    replacement.setTree(tree);
    return replacement;
  }

  /**
   * Combine 2 branches of a string concatenation operation. 
   * 
   * @param replacement CodeReplacement instance that will replace the left branch.
   * @param rightBranch AST node of right branch.
   * @param tokens token stream.
   * @return the CodeReplacement instance that cover both left and right branch.
   */
  private AstCodeReplacement combineCodeReplacement(AstCodeReplacement replacement,
      CommonTree rightBranch, CommonTokenStream tokens) {
    replacement.setEndTokenIndex(rightBranch.getTokenStopIndex());
    if (rightBranch.getText() == "STRING_LITERAL_DEF") {
      replacement.appendResourceText(getLiteralText(rightBranch, tokens));
      return replacement;
    }
    replacement.appendPlaceholder("{%d}");
    replacement.argumentList.add(rightBranch);
    return replacement;
  }
  
  /**
   * Combine 2 branches of a string concatenation operation. 
   * 
   * @param leftBranch AST node of left branch.
   * @param replacement CodeReplacement instance that will replace the right branch.
   * @param tokens token stream.
   * @return the CodeReplacement instance that cover both left and right branch.
   */
  private AstCodeReplacement combineCodeReplacement(CommonTree leftBranch,
      AstCodeReplacement replacement, CommonTokenStream tokens) {
    replacement.prependPlaceholder("{%d}");
    replacement.argumentList.add(0, leftBranch);
    replacement.setStartTokenIndex(leftBranch.getTokenStartIndex());
    return replacement;
  }

  
  /**
   * Extract localizable resource from a code unit.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   */
  @Override
  public void extractResource(AbstractCodeUnit codeUnit) {
    extractResourceOnTree(codeUnit.getAstTree(), codeUnit);    
  }

  /**
   * Extract localizable resource from the AST tree.
   * 
   * @param tree AST tree of a source file.
   * @param codeFile CodeFile instance that has all information related to a source file.
   */
  private AstCodeReplacement extractResourceOnTree(CommonTree tree, AbstractCodeUnit codeFile) {
    CommonTokenStream tokens = codeFile.getTokens();

    // One thing important to understand this code. Replacement is always popped
    // up to its parent. The parent can decide if replacement generated by children
    // should be combined. If the whole subtree has one replacement, pops up to its
    // parent for further merging. Otherwise, the parent add the replacement to
    // codeFile.
    
    String text = tree.getText();
    if (text != null) {
      if (text.equals("STRING_LITERAL_DEF")) {
        // encounter a piece of literal text.
        AstCodeReplacement replacement = createCodeReplacementFromLiteralString(tree, tokens);
        
        try {
          replacement.addResourceAttr("context", "file:" + Utils.getFilename(codeFile.getCodeUnitName()));
        } catch (JSONException e) {
          // do nothing.
        }
        return replacement;
      } else if (text.equals("+")) {
        // encounter a "+" operator, this could be a string concatenation if either of its
        // two branches can generate a replacement.
        AstCodeReplacement replacement = extractResourceOnTree((CommonTree)tree.getChild(0), codeFile);

        // if left branch has replacement, try to merge to its right branch. If successful,
        // return to its parent for further processing.
        if (replacement != null) {
          AstCodeReplacement newReplacement = combineCodeReplacement(
              replacement, (CommonTree)tree.getChild(1), tokens);
          if (newReplacement != null) {
            newReplacement.setTree(tree);
          }
          return newReplacement;
        }
        
        // if left branch has not replacement, try its right branch.
        replacement = extractResourceOnTree((CommonTree)tree.getChild(1), codeFile);
        
        // if right branch has replacement, try to see if it can combine with left branch. 
        if (replacement != null) {
          AstCodeReplacement newReplacement = combineCodeReplacement(
              (CommonTree)tree.getChild(0), replacement, tokens);
          if (newReplacement != null) {
            newReplacement.setTree(tree);
          }
          return newReplacement;
        }
        return null;
      }
    }
    
    // in rest cases, just add replacement generated by children.
    for (int i = 0; i < tree.getChildCount(); i++) {
      AstCodeReplacement replacement = extractResourceOnTree((CommonTree)tree.getChild(i), codeFile);
      if (replacement != null) {
        for (CommonTree branch : replacement.argumentList) {
          extractResourceOnTree(branch, codeFile);
        }
        codeFile.addReplacement(replacement);
      }
    }
    return null;
  }
}
