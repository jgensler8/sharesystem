
import React from 'react';
import {SearchEngineAPI} from '../lib/lib';
import {ISearchEngine} from '../lib/lib-types';
import { MockSearchEngineAPI } from '../lib/lib-mock';
import {establishConnection, loadSearchEngineAddressFromEnvironment, loadAccountFromEnvironment, Store} from '../lib/util';

type SolanaConnectionProps = {
    render(state: SolanaConnectionState): JSX.Element
}

export type SolanaConnectionState = {
    loading: boolean,
    error?: Error,
    system?: ISearchEngine,
}

export class SolanaConnection extends React.Component<SolanaConnectionProps, SolanaConnectionState> {
    _async_cancel = false;

    constructor(props: SolanaConnectionProps) {
        super(props);
        this.state = {
            loading: true,
        };
    }

    async loadEverything(): Promise<SolanaConnectionState> {
        const useMock = true;
        let system: ISearchEngine;
        if(useMock) {
            system = new MockSearchEngineAPI(new Store());
        } else {
            let searchEngineProgramId = await loadSearchEngineAddressFromEnvironment()
            let connection = await establishConnection()
            let payerAccount = await loadAccountFromEnvironment()
            system = new SearchEngineAPI(connection, searchEngineProgramId, new Store(), payerAccount);    
        }
        return {...this.state, system: system, loading: false}
    }

    componentDidMount() {
        this.loadEverything()
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