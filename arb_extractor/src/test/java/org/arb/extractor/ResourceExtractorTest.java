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

import junit.framework.TestCase;

/**
 * Class for testing resource extraction.
 */
public class ResourceExtractorTest extends TestCase {
  private ResourceExtractor extractor = new ResourceExtractor();
  
  @Override
  protected void setUp() throws Exception {
    super.setUp();
    // code here will be called before *each* test method
    extractor.setOption(Utils.Language.JAVASCRIPT, "resourceVar", "r$");
    extractor.setSilentMode(true);
  }
  
  @Override
  protected void tearDown() throws Exception {
    // code here will be called after *each* test method
    super.tearDown();
  }

  protected void extractResource(String oldCode, String expectedCode, String expectedResource) throws Exception {
    CodeString codeUnit = new CodeString(oldCode);
    extractor.addCodeUnit(codeUnit);
    extractor.process();
    String newCode = codeUnit.getNewCode();
    String resource = extractor.getResourceContent();
    assertEquals(expectedCode, newCode);
    assertEquals(expectedResource, resource);    
  }
  
  public void testLiteralStringExtraction() throws Exception {
    extractResource(
        "alert('Hello World');",
        "alert(r$.MSG_00000);",
        "{\"MSG_00000\": \"Hello World\"}");
  }

  public void testLiteralStringConcatenation() throws Exception {
    extractResource(
        "var s = 'Hello ' + 'World';",
        "var s = r$.MSG_00000;",
        "{\"MSG_00000\": \"Hello World\"}");
  }

  public void testLiteralStringConcatenation2() throws Exception {
    extractResource(
        "var s = 'Hello ' + 'World' + '!';",
        "var s = r$.MSG_00000;",
        "{\"MSG_00000\": \"Hello World!\"}");
  }

  public void testSimepleMessageComposition() throws Exception {
    extractResource(
        "var s = 'Hello ' + name;",
        "var s = arb.msg(r$.MSG_00000, name);",
        "{\"MSG_00000\": \"Hello {0}\"}");
  }
  
  public void testSimepleMessageComposition2() throws Exception {
    extractResource(
        "var s = 'Hello ' + name + '!';",
        "var s = arb.msg(r$.MSG_00000, name);",
        "{\"MSG_00000\": \"Hello {0}!\"}");
  }

  public void testSimepleMessageComposition3() throws Exception {
    extractResource(
        "var s = 'x + x = ' + function(x){return x + x;}(12);",
        "var s = arb.msg(r$.MSG_00000, function(x){return x + x;}(12));",
        "{\"MSG_00000\": \"x + x = {0}\"}");
  }

  public void testSimepleMessageComposition4() throws Exception {
    extractResource(
        "var s = 'Finished ' + n + ' of ' + total + ', ' + Math.round(n * 10000 / total) / 100 + '% done.';",
        "var s = arb.msg(r$.MSG_00000, n, total, Math.round(n * 10000 / total) / 100);",
        "{\"MSG_00000\": \"Finished {0} of {1}, {2}% done.\"}");
  }

  public void testSwithMessageComposition() throws Exception {
    extractResource(
        "var s = 'switch state:' + (state ? 'on' : 'off');",
        "var s = arb.msg(r$.MSG_00000, (state ? r$.MSG_00001 : r$.MSG_00002));",
        "{\n  \"MSG_00000\": \"switch state:{0}\",\n  \"MSG_00001\": \"on\",\n  \"MSG_00002\": \"off\"\n}");
  }
}
