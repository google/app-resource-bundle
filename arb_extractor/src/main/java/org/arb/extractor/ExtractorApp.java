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

import org.arb.extractor.ResourceExtractor;

import java.util.ArrayList;

/**
 * This is the application code responsible for interpreting commandline options and drive
 * the ResourceExtractor.
 */
public class ExtractorApp {
  
  public static void usage() {
    System.out.println(
        "This is a commandline tool that can help you extract localizable\n" +
        "strings from Javascript and HTML files. \n" +
        "  --bundle: the resource bundle file where extracted resource will be saved.\n" +
        "  --code: source file whose localizable strings will be extracted. There can \n" +
        "          be multiple files specified.\n" +
        "  --namespace: the namespace used for registering the resource, see ARB\n" +
        "          specification for details.\n" +
        "  --resource_var: the variable name used in Javascript file to reference resource\n" +
        "          bundle. Default is 'r$'\n" +
        "  --output_to_console: if specified, output will be sent to console.\n" +
        "  --silent_mode: if specified, extraction will be done without prompting user\n" +
        "          for confirmations.\n"
        );
  }
  
  public static void main(String args[]) throws Exception {
    String bundleFileName = null;
    String namespace = null;
    String resourceVar = null;
    boolean consoleMode = false;
    boolean silentMode = false;
    
    ArrayList<String> sourceFiles = new ArrayList<String>();
    if (args.length <= 1) {
      usage();
      return;
    }
    
    for (int i = 0; i < args.length; i++) {
      if (args[i].equals("--bundle") && i + 1 < args.length) {
        bundleFileName = args[i+1];
      } else if (args[i].equals("--code") && i + 1 < args.length) {
        sourceFiles.add(args[i + 1]);
      } else if (args[i].equals("--namespace") && i + 1 < args.length) {
        namespace = args[i + 1];
      } else if (args[i].equals("--resource_var") && i + 1 < args.length) {
        resourceVar = args[i + 1];
      } else if (args[i].equals("--output_to_console")) {
        consoleMode = true;
      } else if (args[i].equals("--silent_mode")) {
        silentMode = true;
      } else if (args[i].equals("--help")) {
        usage();
        return;
      } 
    }
    
    ResourceExtractor extractor = new ResourceExtractor();
    
    if (bundleFileName == null) {
      System.out.println("Missing argument --bundle.");
      return;
    }
    extractor.loadExistingResourceBundle(bundleFileName);
    
    if (namespace != null) {
      extractor.setNamespace(namespace);
    }
    if (resourceVar != null) {
      extractor.setOption(Utils.Language.JAVASCRIPT, "resourceVar", "r$");
    }
    if (silentMode) {
      extractor.setSilentMode(true);
    }
    
    for (int i = 0; i < sourceFiles.size(); i++) {
      extractor.addCodeUnit(new CodeFile(sourceFiles.get(i)));
    }

    extractor.process();
    
    for (AbstractCodeUnit codeUnit: extractor.getCodeUnits()) {
      if (consoleMode) {
        System.out.println(codeUnit.getNewCode());
      } else {
        if (codeUnit instanceof CodeFile) {
          ((CodeFile)codeUnit).writeToFile();
        }
      }
    }
    
    if (consoleMode) {
      System.out.println(extractor.getResourceContent());
    } else {
      Utils.writeStringToFile(extractor.getResourceContent(), bundleFileName);
    }
  }
}
