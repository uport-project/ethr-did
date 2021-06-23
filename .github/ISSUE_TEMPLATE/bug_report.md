---
name: Bug report
about: Create a report to help us improve
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Using this piece of code 
```typescript
import { EthrDID } from 'ethr-did'

const ethrDid = new EthrDID({/*...*/})
const helloJWT = await ethrDid.signJWT({hello: 'world'})
/// ... show some code that fails to act as expected
```
2. in this context...
3. I see this error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Samples**
The ideal bug report links to a sample project that reproduces the error,
or includes a failing test that will pass once the error is fixed. 

**Versions:**
 - OS: [e.g. iOS]
 - Browser/Node [e.g. chrome, safari, node 14.17.0]
 - ethr-did Version [e.g. 2.1.4]
 - versions of other DID libraries: 

**Additional context**
Add any other context about the problem here.
