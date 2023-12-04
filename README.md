## Application Resource Bundle (ARB)

**See [the docs](docs/specification.md) for more details including the specification for ARB design.**

Application Resource Bundle (abbreviated ARB) is a localization resource format that is
* simple - based on JSON,
* extensible - vocabulary can be added without affecting existing tools and usage,
* directly usable - applications can access the resource directly from this format without converting to another form.

In ARB, localizable resources are encoded as a JSON object. Each resource will have a resource entry identified by resource key, and an optional resource attribute entry with resource attribute key.

**Example:**

```json
{
    "@@locale": "en",
    "@@context": "HomePage",
    "helloAndWelcome": "Welcome {firstName} {lastName}!",
    "@helloAndWelcome": {
        "description": "Initial welcome message",
        "placeholders": {
            "firstName": {
                "type": "String"
            },
            "lastName": {
                "type": "String"
            }
        }
    },
    "newMessages": "You have {newMessages, plural, =0{No new messages} =1 {One new message} two{Two new Messages} other {{newMessages} new messages}}",
    "@newMessages": {
        "type": "text",
        "description": "Number of new messages in inbox.",
        "placeholders": {
            "newMessages": {
                "type": "int"
            }
        }
    }
}
```

### lib

This is the ARB supporting library in Javascript. ARB is not restricted to any specific platform/language. Issues in web application has been addressed carefully, as this is where localization practice lacked behind.

### arb_editor

This is actually a sample app for use with our Javascript supporting library.

### arb_extractor

A tool written in Java to automate resource extraction. It uses a generic parser (Antlr), which allow it to deal with many kinds of languages.

### third_party

Third-party code used in ARB.

