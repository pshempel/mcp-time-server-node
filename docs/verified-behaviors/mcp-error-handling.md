# Error Handling

From SDK source:
- Validates tool output against schema using AJV
- Throws `McpError` with `ErrorCode.InvalidParams` on validation failure
- Skips validation if tool reports error