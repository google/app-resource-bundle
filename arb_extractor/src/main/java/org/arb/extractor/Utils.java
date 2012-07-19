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

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.Arrays;
import java.util.Properties;

/**
 * A collection of utility methods here.
 */
public class Utils {
  public enum Language {
    JAVASCRIPT, HTML
  }
  
  /**
   * Case insensitive check if a String ends with a specified suffix.
   *
   * @see java.lang.String#endsWith(String)
   * @param str  the String to check, may be null
   * @param suffix the suffix to find, may be null
   * @return <code>true</code> if the String ends with the suffix, case insensitive, or
   *  both <code>null</code>
   */
  public static boolean endsWithIgnoreCase(String str, String suffix) {
      if (str == null || suffix == null) {
          return (str == null && suffix == null);
      }
      int strOffset = str.length() - suffix.length();
      return str.regionMatches(true, strOffset, suffix, 0, suffix.length());
  }
  
  /**
   * Read a text file and return its content as string.
   * @param filePath file path of the text file.
   * @return file content as string. In case of failure, return empty string.
   */
  public static String readTextFile(String filePath) {
    File file = new File(filePath);
    StringBuffer contents = new StringBuffer();
    BufferedReader reader = null;
    try {
      reader = new BufferedReader(new FileReader(file));
      String text = null;
      // repeat until all lines is read
      while ((text = reader.readLine()) != null) {
        contents.append(text).append(System.getProperty("line.separator"));
      }
    } catch (FileNotFoundException e) {
    } catch (IOException e) {
    } finally {
      try {
        if (reader != null) {
          reader.close();
        }
      } catch (IOException e) {
        e.printStackTrace();
      }
    }
    return contents.toString();
  }

  /**
   * Write a string to a file.
   * 
   * @param content content in form of string.
   * @param filename file path of the to be written file.
   */
  public static void writeStringToFile(String content, String filename) {
    try {
      FileOutputStream outStream = new FileOutputStream(filename);
      OutputStreamWriter outWriter = new OutputStreamWriter(outStream, "UTF-8");
      outWriter.write(content);
      outWriter.close();
    } catch (Exception e) {
      e.printStackTrace();
    }
  }
  
  /**
   * Rename a file.
   * @param file original file name.
   * @param toFile new file name.
   */
  public static void renameFile(String file, String toFile) {
    File toBeRenamed = new File(file);
    if (!toBeRenamed.exists() || toBeRenamed.isDirectory()) {
        System.out.println("File does not exist: " + file);
        return;
    }
    File newFile = new File(toFile);
    if (!toBeRenamed.renameTo(newFile)) {
        System.out.println("Error renmaing file");
    }
  }
  
  /**
   * Unescape a string.
   * 
   * String obtained from parse tree is the original string with everything unescaped, like \"
   * is not interpreted as ". This method will perform this "unescape" operation.
   * 
   * @param a string to be unquoted.
   * @return unquoted string.
   */
  public static String unescape(String a) {
    int spaceCount = 0;
    while (a.length() > spaceCount && a.charAt(spaceCount) == ' ') {
      spaceCount++;
    }
    
    Properties prop = new Properties();
    try {
       prop.load(new ByteArrayInputStream(("x=" + a).getBytes()));
    }
    catch (IOException ignore) {}
    
    if (spaceCount == 0) {
      return prop.getProperty("x");
    }
    char[] spaces = new char[spaceCount];
    Arrays.fill(spaces, ' ');
    return new String(spaces) + prop.getProperty("x");
 }

  /**
   * Get the filename from a path.
   * @param filePath file path.
   * @return filename.
   */
  public static String getFilename(String filePath) {
    int sep = filePath.lastIndexOf("/");
    if (sep == -1) {
      sep = filePath.lastIndexOf("\\");
    }
    if (sep == -1) {
      return filePath;
    }
    return filePath.substring(sep + 1);
  }  
}

