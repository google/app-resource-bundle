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

/**
* This class represents source code in form of string.
*/
public class CodeString extends AbstractCodeUnit {

  /** existing code content */
  private String codeString = "";
  
  /** create a new instance with a string given */
  CodeString(String code) {
    codeString = code;
  }
  
  @Override
  public String getCodeContent() {
    return codeString;
  }

  @Override
  public String getCodeUnitName() {
   return "";
  }

  @Override
  public Utils.Language getLanguage() {
    // Use Javascript as default because that's our first target.
    return Utils.Language.JAVASCRIPT;
  }
}

