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

import org.arb.extractor.Utils.Language;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

/**
 * Resource extractor coordinate the extraction of resource from string literals
 * and patterns that might need to be localized. It takes a series of source files,
 * an optional bundle, and invoke language specific TreeWalker to extract
 * localizable resource. Extracted resource will be added to the bundle, source 
 * files will also be modified accordingly. This class also provide user the chance
 * to review each change and suggest a resource id.
 */
public class ResourceExtractor {
  /** List of CodeFile, each CodeFile has data related to one source file. */
  ArrayList<AbstractCodeUnit> codeUnitList = new ArrayList<AbstractCodeUnit>();
  
  /** Resource bundle in form of JSONObject. */
  JSONObject resourceBundle = new JSONObject();
  
  /** File path of resource bundle file. */
  String bundleFileName;
  
  /** Name space of the resource bundle. */
  String namespace = null;
  
  /** If silentMode is set to true, all confirmation prompts will be skipped. */
  boolean silentMode = false;
  
  ResourceIdGenerator idGenerator = new ResourceIdGenerator(resourceBundle);

  Map<Utils.Language, TreeWalker> treeWalkerMap = new HashMap<Utils.Language, TreeWalker>();
  
  /** Create a new {@code ResourceExtractor} instance. */
  public ResourceExtractor() {
    resourceBundle = new JSONObject();
    treeWalkerMap.put(Language.JAVASCRIPT, new JavascriptTreeWalker(resourceBundle));
    treeWalkerMap.put(Language.HTML, new DomTreeWalker(resourceBundle));
  }

  /**
   * Load existing resource bundle file.
   * 
   * @param existingBundleFilePath file path of existing resource bundle.
   */
  public void loadExistingResourceBundle(String existingBundleFilePath) {
    String jsonString = Utils.readTextFile(existingBundleFilePath);
    if (jsonString.isEmpty()) {
      resourceBundle = new JSONObject();
    } else {
      try {
        resourceBundle = new JSONObject(jsonString);
      } catch (JSONException e) {
        resourceBundle = new JSONObject();
      }
    }
    idGenerator.setResourceBundle(resourceBundle);
  }
  
  public void setNamespace(String namespace) {
    this.namespace = namespace;
  }

  public void setOption(Utils.Language language, String name, String value) {
    treeWalkerMap.get(language).setOption(name, value);
  }

  public void setSilentMode(boolean b) {
    silentMode = b;
  }

  /**
   * Add a source file to extractor. This source file will be parsed. 
   * 
   * @param codeUnit an {@code AbstractCodeUnit} instance about a code unit.
   * @throws IOException
   */
  protected void addCodeUnit(AbstractCodeUnit codeUnit) throws IOException {
    if (!codeUnit.parse()) {
      System.out.println("Error in parsing " + codeUnit.getCodeUnitName());
    }
    codeUnitList.add(codeUnit);  
  }
  
  public ArrayList<AbstractCodeUnit> getCodeUnits() {
    return codeUnitList;
  }

  /**
   * Get the updated resource string (original + newly extracted).
   * 
   * @return updated resource string.
   * @throws JSONException
   */
  public String getResourceContent() throws JSONException {
    StringBuffer resourceContent = new StringBuffer();
    
    // the existence of "namespace" indicates the intention to generate a valid JavaScript code
    // that is directly usable. Without it, output is pure JSON.
    if (namespace != null) {
      resourceContent.append("arb.register(\"");
      resourceContent.append(namespace);
      resourceContent.append("\", ");
    }
    String jsonText = "";
    jsonText = resourceBundle.toString(2);
    resourceContent.append(jsonText);

    // Finish the wrapping for Javascript.
    if (namespace != null) {
      resourceContent.append(");");
      resourceContent.append(System.getProperty("line.separator"));
    }
    
    return resourceContent.toString();
  }

  /**
   * Prompt to user and ask for a resource id.
   * 
   * @param resourceId existing resourceId if available, or null. 
   * @param codeUnit codeUnit has all information related to a source code unit.
   * @return resource id string.
   */
  private String promptForResourceId(String resourceId, AbstractCodeUnit codeUnit) {
    TreeWalker treeWalker = treeWalkerMap.get(codeUnit.getLanguage());

    if (resourceId != null) {
      System.out.print("An existing id can be used for resource, do you like it(Y/n): " + resourceId);
      BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
      String answer = "";
      try {
        answer = reader.readLine();
      } catch (IOException e) {
        System.out.println("IO error.");
        System.exit(1);
      }
      if (answer.isEmpty() || answer.equalsIgnoreCase("y") || answer.equalsIgnoreCase("yes")) {
        return resourceId;
      }
    }

    resourceId = idGenerator.createNewResourceId(treeWalker);
    System.out.print(
        String.format("Enter to accept the suggested resourceId (%s) or input a new one here: ", resourceId));
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String answer = "";

    while (true) {
      try {
        answer = reader.readLine();
      } catch (IOException e) {
        System.out.println("IO error.");
        System.exit(1);
      }
      if (answer.isEmpty()) {
        return resourceId;
      }
      
      if (resourceBundle.has(answer) || !treeWalker.isResourceIdAcceptable(answer)) {
        System.out.print(
            String.format("This one has been used, input another one or press enter use this one (%s):",
                          resourceId));
      } else {
        // If suggested id is not used, keep the room.
        if (!resourceId.equals(answer)) {
          idGenerator.recycleResourceId(resourceId);
        }
        break;
      }
    }
    return answer;
  }

  /**
   * Revisit extracted replacements that belong to specified AST tree, confirm the replacement and
   * assign a resource id.
   * 
   * @param codeUnit codeUnit has all information related to a source code unit.
   * @throws JSONException 
   */
  private void finalizeReplacements(AbstractCodeUnit codeUnit) throws JSONException {
    ArrayList<CodeReplacement> replacementList = codeUnit.getReplacementList();
    TreeWalker treeWalker = treeWalkerMap.get(codeUnit.getLanguage());
    
    for (CodeReplacement replacement : replacementList) {
      if (silentMode) {
        if (replacement.getResourceId() == null) {
          replacement.setResourceId(idGenerator.createNewResourceId(treeWalker));
        }
        resourceBundle.put(replacement.getResourceId(), replacement.getResourceText());
      } else {
        if (!confirmCandidate(replacement, codeUnit)) {
          codeUnit.removeReplacement(replacement);
        } else {
          replacement.setResourceId(promptForResourceId(replacement.getResourceId(), codeUnit));
          resourceBundle.put(replacement.getResourceId(), replacement.getResourceText());
        }
        
      }
    }
  }
  
  /**
   * Confirm a source code change due to resource extraction is a good candidate.
   * 
   * @param replacement code replacement of a resource extraction action.
   * @param codeUnit codeUnit has all information related to a source code unit.
   * @return true if successful.
   */
  private boolean confirmCandidate(CodeReplacement replacement, AbstractCodeUnit codeUnit) {
    // TODO(shanjian): we might want to give user a chance to correct a mistake instead of
    // rejecting it. This method could return a string, or null if it is rejected completely.
    
    TreeWalker treeWalker = treeWalkerMap.get(codeUnit.getLanguage());
    boolean useTemporaryId = false;
    if (replacement.getResourceId() == null) {
      replacement.setResourceId(idGenerator.createNewResourceId(treeWalker));
      useTemporaryId = true;
    }
    
    System.out.println("*******************************************************************************");
    System.out.println(treeWalker.getOriginalCodeWithContext(replacement, codeUnit));
    System.out.println("-------------------------------------------------------------------------------");
    System.out.println(treeWalker.getNewCodeWithContext(replacement, codeUnit));
    System.out.println("-------------------------------------------------------------------------------");
    System.out.print("Does this change make sense to you (resourceId can be changed later)? (Y/n):");
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    String answer = "";
    try {
      answer = reader.readLine();
    } catch (IOException e) {
      System.out.println("IO error.");
      System.exit(1);
    }
    if (useTemporaryId) {
      replacement.setResourceId(null);
    }
    return answer.isEmpty() || answer.equalsIgnoreCase("y") || answer.equalsIgnoreCase("yes");
  }
  
  /** Perform resource extraction. 
   * @throws JSONException (finalizeReplacement operate on bundle JSON file.)*/
  public void process() throws JSONException {
    // Collect identifiers
    for (int i = 0; i < codeUnitList.size(); i++) {
      AbstractCodeUnit codeUnit = codeUnitList.get(i);
      TreeWalker treeWalker = treeWalkerMap.get(codeUnit.getLanguage());
      treeWalker.preprocessingPass(codeUnit);
    }    
    
    // extract resources.
    for (int i = 0; i < codeUnitList.size(); i++) {
      AbstractCodeUnit codeUnit = codeUnitList.get(i);
      TreeWalker treeWalker = treeWalkerMap.get(codeUnit.getLanguage());
      treeWalker.extractResource(codeUnitList.get(i));
    }    

    for (int i = 0; i < codeUnitList.size(); i++) {
      finalizeReplacements(codeUnitList.get(i));
    }    

    // rewrite source code.
    for (int i = 0; i < codeUnitList.size(); i++) {
      AbstractCodeUnit codeUnit = codeUnitList.get(i);
      TreeWalker treeWalker = treeWalkerMap.get(codeUnit.getLanguage());
      codeUnit.setNewCode(treeWalker.rewriteSource(codeUnit));
    } 
  }
}
