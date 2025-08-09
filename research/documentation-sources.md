# Documentation Sources Log

## Purpose
Quick capture of where we found important information via Ref/Context7.
Update wiki "Tools and Resources" periodically with important ones.

## Session 109 - Error Handling Discovery
- **Source:** MCP SDK protocol.js (via manual inspection)
- **Location:** `node_modules/@modelcontextprotocol/sdk/dist/protocol.js`
- **Finding:** SDK catches errors and auto-formats them at line ~359
- **Key Code:**
  ```javascript
  .catch((error) => {
    return transport.send({
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: error["code"] || ErrorCode.InternalError,
        message: error.message ?? "Internal error",
      }
    });
  })
  ```
- **Should have used:** `mcp__Ref__ref_search_documentation` for "MCP SDK error handling"

## Template for Future Captures
```
## Session XXX - Topic
- **Source:** [Tool used]
- **Query:** [What I searched for]
- **URL/Library:** [If applicable]
- **Finding:** [What we learned]
- **Code/Quote:** [Specific evidence]
```

## Session 110 - CI/CD Resources
- **Source:** Philip (direct link)
- **URL:** https://git.linuxhardcore.com/help/ci/components/_index#cicd-catalog
- **Finding:** GitLab's own CI/CD component catalog
- **Note:** For future pipeline setup - reusable components

---
*When finding critical info, capture it HERE immediately, move to wiki later*