# ShareSytem

ShareSystem is a Solana-backed "best-effort" resource management system.

ShareSystem allows resource owners to distribute resources to anyone provided trust exists:
* between the resource owner and Recipient
* between the Recipient and other Recipients

## How to Use

### For Resource Providers

* Deploy Resource Program to Solana
* Register Program with ShareSystem's SearchEngine
* Move resource to Distribute mode to share

### For Resource Recipients

* Create Account
* Search for Resources though SearchEnging
* Approve challenges when Resource is distributed

## Wallet Support

TODO

## Developers

### Code Layout

#### Front End (React + TypeScript)

[`./src/lib/*`](./src/lib) contains a non-React TypeScript API to interact with the ShareSystem

[`./src/components/SolanaConnection.tsx`](./src/components/SolanaConnection.tsx) contains a React component with a render-prop to inject the TypeScript API into any React application

#### Back End (Rust)

[`./src/program-rust-searchengine`](./src/program-rust-searchengine) contract that supports finding and indexing Resources

[`./src/program-rust-resource`](./src/program-rust-resource) contract that supports storing Resource-specific data and resolving per-recipient resource allocation when distributed