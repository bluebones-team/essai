```mermaid
graph TB

subgraph Client
    user(("user"))
    ==>|path,rawInput,codeCbs| createResponseCbs
    ==>|path,rawInput,responseCbs| checkInputByPath
    ==>|path,filteredInput,responseCbs| mergeRequest
    ==>|path,filteredInput,responseCbs| sendRequest
    ==>|responseCbs| callResponseCbs
    ==>|path,rawOutput,codeCbs| checkOutputByPath
    ==>|path,filteredOutput,codeCbs| callCodeCbs
    mergeRequest & callCodeCbs
    -->|path,rawInput,codeCbs| createResponseCbs
end
subgraph Server
    sendRequest
    ==>|path,filteredInput| checkInputByPath2
    ==>|path,safeInput| callMiddlesByPath
    ==>|rawOutput| callResponseCbs
end
ApiRecords -->|apiRecord| callMiddlesByPath & checkInputByPath2 & checkInputByPath & checkOutputByPath

```
