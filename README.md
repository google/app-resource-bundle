## Application Resource Bundle (ARB)

**See [the docs](docs/specification.md) for more details including the specification for ARB design, or [the schema](schema/arb.json) for validation.**

Application Resource Bundle (abbreviated ARB) is a localization resource format that is
* simple - based on JSON,
* extensible - vocabulary can be added without affecting existing tools and usage,
* directly usable - applications can access the resource directly from this format without converting to another form.

In ARB, localizable resources are encoded as a JSON object. Each resource will have a resource entry identified by resource key, and an optional resource attribute entry with resource attribute key.

**Example:**

https://github.com/google/app-resource-bundle/blob/08652e17ea4f800a8cf3898961a242603a379c96/example/simple.arb
