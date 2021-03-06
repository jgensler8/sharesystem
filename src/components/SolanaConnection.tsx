
import React from 'react';
import {SearchEngineAPI} from '../lib/lib';
import {ISearchEngine} from '../lib/lib-types';
import { MockSearchEngineAPI } from '../lib/lib-mock';
import {establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment, Store, loadDatabaseAddressFromEnvironment} from '../lib/util';
import { Account } from '@solana/web3.js';

type SolanaConnectionProps = {
    render(state: SolanaConnectionState): JSX.Element
}

export type SolanaConnectionState = {
    loading: boolean,
    error?: Error,
    system?: ISearchEngine,
    searchEnginePayerAccount?: Account,
}

export class SolanaConnection extends React.Component<SolanaConnectionProps, SolanaConnectionState> {
    _async_cancel = false;

    constructor(props: SolanaConnectionProps) {
        super(props);
        this.state = {
            loading: true,
        };
    }

    async asyncLoadAll(): Promise<SolanaConnectionState> {
        const useMock = true;
        let system: ISearchEngine;
        if(useMock) {
            system = new MockSearchEngineAPI(new Store());
        } else {
            let searchEngineProgramId = await loadSearchEngineAddressFromEnvironment();
            let connection = await establishConnection();
            let payerAccount = await loadAccountFromEnvironment();
            let databaseAccount = await loadDatabaseAddressFromEnvironment();

            system = new SearchEngineAPI(connection, searchEngineProgramId, databaseAccount.publicKey, new Store(), payerAccount);
        }
        let searchEnginePayerAccount = new Account();
        await system.createDefaultSearchEngineAccount(searchEnginePayerAccount, "default");
        return {...this.state, system: system, searchEnginePayerAccount: searchEnginePayerAccount, loading: false}
    }

    componentDidMount() {
        this.asyncLoadAll()
            .then((state: SolanaConnectionState) => {
                if(this._async_cancel){
                    return;
                }
                this.setState(state)
            })
            .catch((error: any) => {
                if(this._async_cancel){
                    return;
                }
                this.setState({ error: error, loading: false })
            })
    }

    componentWillUnmount() {
        this._async_cancel = true;
    }

    render() {
        return (
            <div>
                {this.props.render(this.state)}
            </div>
        );
    }
}

export default SolanaConnection;