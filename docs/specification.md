
# Application Resource Bundle Specification
- [Application Resource Bundle Specification](#application-resource-bundle-specification)
  - [Simple, extensible and directly usable](#simple-extensible-and-directly-usable)
  - [Sample resource file](#sample-resource-file)
  - [Resource Id](#resource-id)
  - [Resource Value](#resource-value)
  - [Placeholder in resource](#placeholder-in-resource)
  - [Plural and Gender support](#plural-and-gender-support)
  - [CSS resource](#css-resource)
  - [Resource attributes](#resource-attributes)
  - [Predefined resource attributes](#predefined-resource-attributes)
  - [Global attributes](#global-attributes)
  - [Customized attributes](#customized-attributes)
  - [Resource Linking](#resource-linking)
  - [Verbose and Compact versions of ARB](#verbose-and-compact-versions-of-arb)
  - [ARB namespace and registration](#arb-namespace-and-registration)
    - [ARB namespace](#arb-namespace)
  - [Namespace reference with or without variation part](#namespace-reference-with-or-without-variation-part)
  - [ARB file organization](#arb-file-organization)
  - [Using ARB in JavaScript](#using-arb-in-javascript)
    - [Manipulating ARB Instance](#manipulating-arb-instance)
    - [Resource String in ARB](#resource-string-in-arb)
  - [Using ARB in HTML](#using-arb-in-html)
    - [Text in HTML](#text-in-html)
    - [Image in HTML](#image-in-html)
    - [CSS](#css)
  - [Common Mistakes when creating resource in ARB format](#common-mistakes-when-creating-resource-in-arb-format)
   
## Simple, extensible and directly usable
Application Resource Bundle (abbr. ARB) is a localization resource format that is simple (based on JSON), extensible (vocabulary can be added without affecting existing tools and usage), and directly usable (applications can access the resource directly from this format without converting to another form).

In ARB, localizable resources are encoded as a JSON object. Each resource will have a resource entry identified by resource key, and an optional resource attribute entry with resource attribute key.

## Sample resource file
Before diving into the details of the ARB format, it will help to look at an example of how an ARB file looks like.

```json
{
  // this special attribute marks the locale of this 
  // resource bundle
  "@@locale": "en_US",
  "@@context": "HomePage",

  // resource id can reuse the dom id of a element whose text content should
  // be replaced by this string.
  "title_bar": "My Cool Home",
  "@title_bar": {
    "type": "text",
    "context": "HomePage",
    "description": "Page title."
  },

  // A typical text string that JS code can reference directly.
  "MSG_OK": "Everything works fine.",

  // A message that contains a placeholder, referenced by JS code.
  "FOO_123": "Your pending cost is {COST}",
  "@FOO_123": {
    "type": "text",
    "context": "HomePage:MainPanel",
    "description": "balance statement.",
    "source_text": "Your pending cost is {COST}",
    "placeholders": {
       "COST": {
          "example": "$123.45",
          "description": "cost presented with currency symbol"
       }
    },
    "screen": "data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/
//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U
g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC",
    "video": "http://www.youtube.com/ajigliech"
  },

  "BAR_231": "images/image_bar.jpg",
  "@BAR_231": {
    "type": "image",
    "context": "HomePage:MainPanel",
    "description": "brand image",
    "screen": "file://screenshot/welcome_page.jpg",
    "video": "http://www.youtube.com/user_interaction.mp4"
  },

  "FOOTER_STYLE": "#footer:{font-family: arial}",
  "@FOOTER_STYLE": {
    "context": "HomePage"
  }
}
```

## Resource Id
The resource id is the identifier for the resource in a given name space. Its naming should follow the convention for constant string in the target language. Because the naming is local to name space, developers only need to avoid name collision within the scope of name space.

```json
"MSG_HELLO":  "Hello",
"title": "My application"
```

In the above example, "MSG\_HELLO" and "title" are both resource IDs.

Resource id for HTML has a special convention "elem\_id@attribute\_name"
as shown in the following example. Please refer to section "Reference resource in ARB" for detailed explanation.
```json
"logo-image@src": "images/mylogo.jpg",
"logo-image@alt": "my logo"
```

## Resource Value
Resource values in an ARB file are always in the form of a string. Most of those strings represent translatable text. Some strings could be urls, or represent other types of data like image or audio. To present data that is binary in nature, data url (refer to RFC 2397 ) is used in ARB format. For example, in the sample resource file above, the value for the resource ID "screen" is specified as a data url.


## Placeholder in resource
In an ARB resource, the placeholder is marked by a curly bracket. Either the position or variable name can be used inside the bracket.
```json
"MSG_HELLO_STATEMENT": "Hello {0}"
```
Variable name inside {} must be a valid identifier:
```json
"MSG_SUMMARY": "You bought {num} units of {product}, total price: {total}"
```

The actual replacement of placeholder will only happen when the positional argument is given or a named variable is provided. Otherwise placeholders will be interpreted as literal strings. That helps solve the possible collision issue. This rule allows for this simple placeholder syntax, which will address 99% of use cases. In those rare cases when a valid placeholder syntax is meant for a literal, it is always possible to keep those placeholder untouched ( and thus be interpreted as literal) by avoiding the use of positional argument (if the intended literal string has a valid positional placeholder syntax) or choosing different identifier name for real placeholder.

The above approach raises a challenge for ARB tools. Without knowing how a message is being used, it is impossible for tools to figure out if a placeholder is indeed a placeholder or it is just a literal string that happens to have a valid placeholder syntax. This problem will be addressed by use of placeholder attributes, which will be covered later.

Developers should use resource attribute entry to pass this information to ARB support tools.

Some examples in Javascript show this behavior. "arb.msg" is a method in our Javascript supporting library that handles message placeholder replacements.

```js
arb.msg("{0} stays as literal");
arb.msg("{0} stays as literal but {name} is replaced", {"name": "replacement"});
arb.msg("{literal} stays but {placeholder} got replaced.", {"placeholder": "replacement"});
```

In the above example, a localizable string is hardcoded in message reference code to keep the code simple. In actual code you should reference the string through a resource key instead of hard-coding the string in code.

A special placeholder syntax (with "@" directly after the open curly bracket) is defined to guard certain content from being modified by translators in the localization process. For example,
```html
"Hello <b>World</b>."
```

A mechanism is needed to mask ` <b> ` and ` </b> ` out. Not all translators understand what that tag means and they are not supposed to change it either. One approach is to put tags in placeholders, like:

```json
"MSG": "Hello {start_tag}World{end_tag}.",
alert(r$.msg(MSG, {"start_tag":"<b>", "end_tag": "</b>"});
```

With this special syntax, the above message can be simply written as,

```js
"MSG": "Hello {@<b>}World{@</b>}",
alert(r$.msg(MSG);
```

## Plural and Gender support
In ARB, we use the ICU syntax to support plural and gender in messages.

```json
"MSG_EMAILS_TO_SEND": "{NUM_EMAILS_TO_SEND, plural, " +
    "=0 {unused plural form}" + 
    "=1 {One email will be sent.}" +
    "other {# emails will be sent.}}"
```

And it will be referenced as follows, about the same as other messages with placeholders.

```js
arb.msg(r$.MSG_EMAILS_TO_SEND, {"NUM_EMAILS_TO_SEND": 5});
```

Plural and gender support can be very complicated. People in ICU are working on this bleeding edge. We might expect some change or enhancement in ICU specification. Plural and Gender support in ICU is likely to change and ARB will track the change in ICU. So you should consider plural and gender support in ARB to be experimental.

## CSS resource
Localizable CSS resources should be specified in HTML as a "STYLE" element with an id. A default version is recommended to be coded in place. In the resource bundle, the style element is identified the same way as other HTML elements. Both arb:id and dom id will work, and "arb:id" takes priority. Here is an example:

```css
"localestyle": "p {margin: 2px;}"
```

In an HTML file, the above resource can be referenced as:

```html
<STYLE arb:id="localestyle">
    p {margin: 5px;}
</STYLE>
```

## Resource attributes
Besides resource id and resource value, a resource can also have a set of additional attributes. Those attributes are embedded in an attribute item keyed by original resource id plus a prefix character ‘@’. The value part of an attribute item is a map object that contains a list of attributes as name/value pairs.

The creation of the ARB file and its further modification can all happen with the help of tools. Those documentation requirements (must have description, must have placeholder examples, etc) can be enforced by tools. The separation of resource itself and resource attributes enforce the distinction between what is needed in run time and what is really for the localization process. A compact version of ARB in run time can be achieved by simply removing all keys prefixed with "@", no more, no less.

For Example, the attribute entry to resource "FOO\_123" could be like:

```json
"@FOO_123": {
  "type": "text",
  "context": "homepage",
}
```


## Predefined resource attributes
We support a set of predefined attributes. These attributes will all be wrapped under the resource’s corresponding attribute key, "@MSG\_123" for resource "MSG\_123" as explained in the previous section.

  * type
Describes the type of resource. Possible values are "text", "image", "css". Program should not rely on this attribute in run time. It is mainly for the localization tools.

  * context
It describes (in text) the context in which this resource applies. Context is organized in hierarchy, and level separated by ":".  Tools can use this information to restore the tree structure from ARB’s flat layout. When this information is missing, it defaults to global.

Example:
```json
"context":"homePage:Print dialog box"
```

  * description
A short paragraph describing the resource and how it is being used by the app, and messages that need to be passed to the localization process and translators.


  * placeholders
A map from placeholder id to placeholder properties, including description and example. Placeholder can be specified using number  (as in "{0}") or name (as in "{num}"). Number starts from 0 and the corresponding argument(s) are passed directly as function arguments. Named arguments are provided through an map object that maps each name to its value.

A string in a valid placeholder syntax will be interpreted as literal string if no valid replacement argument provided. ARB has not escape mechanism. Developer can always choose to use different argument name to keep certain string as literal. For example, in "{apple} is delicious.", as long as "apple" is not used as variable name in message construction call, it will be interpreted as literal.

For ARB processing tools, as it has no idea how a message will be used, it needs to get this information from attributes. For this purpose, we have 2 important rules,
  1. All placeholders in valid syntax should be interpreted as placeholder if there is no "placeholders" property in attributes.
  1. A placeholder in valid syntax will be treated as literal if the messages does has "placeholders" property, but the placeholder has no corresponding entry in "placeholders" map. In other words, if "placeholders" property is available, it must be complete. This rule applies to the special placeholder syntax "{@string}" as well.

A message cannot use both at the same time.

Example:
```json
{
  "CURR_LOCALE": "current locale is {0}.",
  "@CURR_LOCALE": {
    "placeholders": {
      "0": {
        "description": "current locale name.",
        "example": "zh"
      }
    }
  },

  "NON_PLACEHOLDER": "{0} is a literal.",
  "@NON_PLACEHOLDER": {
    "placeholders": {
    }
  },

  "TRANSLATE": "Translate from {source} to {target}",
  "@TRANSLATE": {
    "placeholders": {
      "source": {
        "description": "source locale name",
        "example": "en_US"
      },
      "target": {
        "description": "target locale name",
        "example": "ja_JP"
      }
    }
  }
}
```


  * screenshot
A URL to the image location or base-64 encoded image data.

  * video
A URL to a video of the app/resource/widget in action

  * source\_text
The source of the text from where this message is translated from. This is used to track source arb change and determine if this message need to be updated.

## Global attributes
On top level in ARB resource structure, there could be a set of "global" attributes that apply to resource bundle as a whole. Those attribute names are prefixed with "@@" to avoid possible conflicts with attribute key of resource with the same name. Application often find it convenient to query the current locale, but `@@locale` is not different from other attributes start with "@". It could be stripped in the runtime version. Application that need to keep this information should use resource named `locale`, `LOCALE` or whatever instead of relying on `@@locale`.


  * `@@locale`
The locale for which messages/resources are stored in this file.

  * `@@context`
It describes (in text) the context in which all these resources apply.

  * `@@last_modified`
The last modified time of this ARB file/data. It is presented in ISO8601 complete form with hour and minutes. Example like:
2011-09-08T09:42-07:00

  * `@@author`
The author of these messages. In the case of localized ARB files it can contain the names/details of the translator.


## Customized attributes
It is not unusual for application to pass around attributes that do not exist in the ARB specification.  Such practice is acceptable, but those names must be prefixed by `x-`. The meaning and representation form of attributes defined in this proposal will be kept consistent. And that is important for tools’ support. Some popular attribute names like `@@version` could not be included in this proposal because the it is nearly impossible to enforce a consistent version naming convention. Application should use `@@x-version` to encode their own version information.

## Resource Linking
The resource can be "linked statically" with the help of certain "compiler"-like tools, just like what JSCompiler does. In such preprocessing steps, Javascript string can be inlined and html text can be replaced. After such processing, if all ARB resources are substituted in place where they are needed, there could be no need for ARB in runtime at all. Another typical usage pattern is to reference the resource dynamically in runtime. That is especially convenient in developing mode, in small projects or when the resource need to be served over network through AJAX.

## Verbose and Compact versions of ARB
ARB file could be quite verbose because it can contain lots of information that is useful for localization. All these extra information is optional and could be stripped away when it is used in production. Generating such a compact ARB is much simple than general JS compilation. With a few simple rules, it can be done quickly in any programming language.

Some system can go extra miles by inlining those resource in deploy time. That will totally eliminate resource bundle. Such usage is not always desired because of various reasons, like the extra process step and too many copies of permutations.

Verbose ARB is a strict superset of Compact ARB, it can be used where compact form is used. That make it very convenient in development mode and also in debugging translations.

## ARB namespace and registration
A typical WebApp project might use modules from several sources or developed independently by multiple developers. Modules might be localized in various stage of the whole process. There is also a big concern of name (resource id) conflicts. To deal with those issues, ARB has a namespace resolution mechanism. Developer can choose an appropriate granularity for their ARB objects.

### ARB namespace
Resources are expressed in ARB as a JSON object with resource id as the key. Name conflicts will be an issue if multiple modules in a project share a single resource id namespace. We propose a namespace mechanism that allow multiple JSON objects to be used without the risk of name conflicts. Each such JSON object in the proposed format is called an ARB instance. Each ARB instance register itself with a qualified namespace. A qualified namespace has two parts separated by ":", the base namespace (often the application and/or module name), and the variant part (locale name or scheme). For example, `"myapp:en\_US", "homePage:marineSkin"`.

An ARB instance can be referenced by either its base or full namespace from HTML through HTML attribute `"arb:namespace"` associated with a tag. A namespace will have a scope, which is the same scope as the tag to which it is attached to. At run time when ARB supporting code traverses the DOM tree, it will always use the ARB instance that is in designated scope to do localization. For any HTML element, if there is no ARB namespace specified in any of its parent, a default anonymous ARB instance will be picked up, this is the last ARB instance registered. For a simple web application with only one ARB instance, we don’t need to worry about namespace at all. At any moment, no more than one "arb:namespace" will be active. Whenever one `"arb:namespace"` is specified, existing `"arb:namespace"` will be pushed to a stack and becomes inactive. It will become active again when traversal go beyond the scope of DOM element that has the overriding ARB namespace.

In Javascript code, the resource object should first be obtained from the registry by its namespace. All resource references will be done through this resource object. Application can also reference resource to multiple resource objects at the same time.


## Namespace reference with or without variation part

Webapp can use qualified namespace or base namespace to reference an ARB. The latter is often desired. To keep variation resolution separate, it will give the application more flexibility to configure and switch locales and schemes. There are several way to resolve the variation part:
At deploy time, if only one variation ARB instance is included, that will be the one to be used.
If multiple ARB is included, a global locale/scheme selection can be used to select desired instance.
Application can reference a specific ARB instance by its qualified namespace.

## ARB file organization

Resource resolution is done through registering mechanism and has no requirement on how ARB file should be organized. A recommended practice is to keep resource close to where it is being referenced. That enables easy code reuse.

## Using ARB in JavaScript
It is very convenient and light-weight to reference resource from JavaScript code. JSON format is derived from JavaScript, and ARB is represented in JSON. The processing of placeholder and support of namespace need some simple Javascript methods, which are provided in open source form. This light-weight library will have no dependency on any other JavaScript library. We provide this reference implementation to show the whole picture about how ARB can be used in JavaScript program. But this library itself is not part of this specification in strict sense.

### Manipulating ARB Instance
JSON structure itself is not executable in JavaScript. Resources in ARB is made available to JavaScript code by registering itself into the registry. That will associate a ARB instance with a namespace.
```js
arb.register("arb_editor:en", { … });
```

Program can use namespace to get hold of any ARB instance. Here is one example:
```js
arb.setResourceSelector("en");
var r$ = arb.getResource("arb_editor");
```

ARB instance is usually registered with variant name ("arb\_editor:en" part), but referenced with base name ("arb\_editor"). The variant selection part is usually done through separate method call. A consistent naming using "r$" will make the program more readable. This variable name choice is not enforced and it is up to developers.

### Resource String in ARB

Javascript code can reference the string directly using resource id. Like:
```js
alert(r$.MSG_HELLO);
```

(Here we use "r$" as the name of the current ARB object. Application can choose to use any variable name.)
Dealing with placeholder
String with placeholder need to be substituted through the help of a method provided by the supporting library. For positional placeholder, argument is served as a list of arguments to the function. For example:
```js
//MSG_HELLO_STATEMENT: "Hello {0}"
alert(arb.msg(r$.MSG_HELLO_STATEMENT, ‘Tom’));
         // MSG_001: "{0} is chasing {1}."
alert(arb.msg(r$.MSG_001, ‘Tom’, ‘Jerry’));
"{0}" will be replaced by "Tom", and "{1}" will be replaced by "Jerry".
```

Named parameter(s) is passed as Javascript object. Usage looks like:
```js
    // MSG_SUMMARY: 
    // "You ordered {num} units of {product}, total: {total}"
    alert(goog.msg(r$.MSG_SUMMARY, {
            ‘num’: 3, ‘product’: ‘bark’, ‘total’: ‘$234.00’}));
```

## Using ARB in HTML
HTML itself does not support resource referencing and replacement, but this can be achieved with a little help from JavaScript code.

In HTML file, resource id is specified using DOM ID or HTML attribute "arb:id". HTML attribute "arb:id" is preferred and it take priority when both exists. "arb:id" should not be used for anything else. With this restriction, "arb:id" can be removed from the source code in deploy time if the actual message is inlined through the use of preprocessing tools. For projects that use this practice, the use of "arb:id" should be enforced.
```json
"MSG_HELLO":  "Hello",
"title": "My application"
```

In HTML, the value of the resource is restricted to plain text form, but not necessarily end user visible text. It can be urls, css text, etc. The use of HTML tag is strongly discouraged and this rule could be enforced by ARB supporting tools unless tag are coded using special placeholder syntax, as shown in next section.
```json
MSG_INPUT_PROMPT: "Please input {@<em>} password {@</em>}"
arb.msg(r$.MSG_INPUT_PROMPT);
```

In HTML the target of the resource is the text content of that element by default. Some HTML elements might have localizable text in their attribute values, and some might have multiple such values. Examples like the "alt" value and "src" value in "IMG" tag, "value" in "INPUT" tag, etc. Resources targeting attributes are represented in form of "elem\_id@attribute\_name". For example, a image with both "src" and "alt" attributes might look like this,
```json
  "logo-image@src": "images/mylogo.jpg",
  "logo-image@alt": "my logo",
```

ARB only supports the following HTML attributes for security reason. The guideline is to only support those attributes that affect display, not those that will change the behavior of the action.

  * AREA: alt
  * IMG : src, alt
  * INPUT: value, placeholder, defaultValue
  * OBJECT: standby
  * OPTGROUP: label
  * OPTION: value, label

### Text in HTML
There is no special markup needed for text in HTML that needs to be externalized/localized. The only requirement is that the resource be enclosed in a element with a unique dom id or arb:id. As good practice, developer should try to reuse existing HTML tags like ` <p> `, ` <li> `, ` <em> `, etc. It is is discouraged to create new element using ` <div> ` and ` <span> `, but you might have to if only part of the text in an existing element need to be replaced.  Localized text will replace all the text in the element as identified by the id. If that’s not desirable, developer should create additional element (span or div) to enclose only the translatable text. A version of text in default language is recommended to be present in HTML file. That provides a fallback in case client program does not have JavaScript support.

Example:
```html
<span arb:id="name_label">Please enter your username:</span><input type="text" />
```

### Image in HTML
Image resources in HTML are very similar to text in HTML. The difference is the resource itself is a url to the image, and it will replace "src" attribute of the img element. Image element is identified by its DOM id, and url injection is done through Javascript. Just like text in HTML, an image URL in default locale is highly recommended to be put there.

Example:
```html
<img arb:id="submit_btn_image" src="images/submit_en.png" />
```


### CSS
CSS is handled the same way as other HTML element. A style element need to be present with a unique arb:id or dom id. CSS resource will be inserted into that element.


## Common Mistakes when creating resource in ARB format
  * Invalid JSON format: the last item in a map/array should not be terminated by comma.
  * Invalid JSON format: directional quotation marks (left quotation (“;U+201C) + right quotation (”;U+201D)) are used instead of non-directional quotation marks (";U+0022).
  * Attribute not defined in ARB specification must be prefixed by `x-`
