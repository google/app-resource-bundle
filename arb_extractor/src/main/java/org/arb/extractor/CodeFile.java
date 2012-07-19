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

/**
 * This class wraps data of a source file with a parse method to generate those data.
 */
public class CodeFile extends AbstractCodeUnit {
  
  /** file path of source file */
  private String filePath = null;
  
  /** create a new instance with file path given */
  CodeFile(String filePath) {
    this.filePath = filePath;
  }
  
  /** Return code unit name for use in recording context information. */
  @Override
  public String getCodeUnitName() {
    return filePath;
  }

  /** Return language type based on file extension. Javascript is the default for now.
   *  TODO(shanjian): revisit default language, or probably add UNKNOWN. In that
   *      case, caller of this method will have to check and they can't do much.
   *      That complicates things.   
   */
  @Override
  public Utils.Language getLanguage() {
    if (Utils.endsWithIgnoreCase(filePath, ".js")) {
      return Utils.Language.JAVASCRIPT;
    }
    if (Utils.endsWithIgnoreCase(filePath, ".html") || Utils.endsWithIgnoreCase(filePath, ".htm")) {
      return Utils.Language.HTML;
    }
    return Utils.Language.JAVASCRIPT;
  }
  
  /** Write the code to file, make a copy of that file before it is overridden. */
  public void writeToFile() {
    Utils.renameFile(filePath, filePath + ".bak");
    Utils.writeStringToFile(getNewCode(), filePath);
  }
  
  @Override
  public String getCodeContent() {
    return Utils.readTextFile(filePath);
  }
}
