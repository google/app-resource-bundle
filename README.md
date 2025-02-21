# ![] Application Resource Bundle (ARB)

**See [Wiki](https://github.com/google/app-resource-bundle/wiki/ApplicationResourceBundleSpecification) for more details including the specification for ARB design.**

Application Resource Bundle (abbr. ARB) is a localization resource format that is simple 
(based on JSON), extensible (vocabulary can be added without affecting existing tools and
usage), and directly usable (applications can access the resource directly from this format 
without converting to another form).

In ARB, localizable resources are encoded as a JSON object. Each resource will have a 
resource entry identified by resource key, and an optional resource attribute entry with 
resource attribute key.
