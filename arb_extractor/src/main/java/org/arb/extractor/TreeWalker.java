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

/**
 * TreeWalker interface that encapsulate language specific processing.
 */
public interface TreeWalker {

  /** set language specific options. */
  void setOption(final String name, final String value);
  
  /**
   * This method provide TreeWalker the chance to go through all the source code units before
   * actual resource extraction.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   */
  void preprocessingPass(AbstractCodeUnit codeUnit);
  
  /**
   * Check if the given resource id is acceptable.
   * @param identifier proposed identifier name.
   * @return true if it is acceptable.
   */
  boolean isResourceIdAcceptable(String identifier);

  /**
   * Rewrite the source code of a AST tree, with all replacement in replacementMap
   * processed.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   * @return source code after resource replacement. 
   */
  String rewriteSource(AbstractCodeUnit codeUnit);

  /**
   * Generate replacement code for a replacement.
   * 
   * @param replacement CodeReplacement instance. 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   * @return replacement code.
   */
  String generateReplacementCode(CodeReplacement replacement, AbstractCodeUnit codeUnit);

  
  String getOriginalCodeWithContext(CodeReplacement replacement, AbstractCodeUnit codeUnit);
  
  String getNewCodeWithContext(CodeReplacement replacement, AbstractCodeUnit codeUnit);
  
  /**
   * Perform resource extraction on the code unit.
   * 
   * @param codeUnit AbstractCodeUnit instance that has all information related to a source file.
   */
  void extractResource(AbstractCodeUnit codeUnit);
 
}
