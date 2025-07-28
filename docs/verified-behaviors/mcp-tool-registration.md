# Tool Registration (from SDK v1.16.0)

- Uses Zod for parameter validation
- `inputSchema` accepts Zod schemas or plain objects
- Known issues:
  - All-optional parameters can cause validation failures
  - Tools without arguments have type issues