
import {
    Connection,
} from '@solana/web3.js';

import React from 'react';
import { sys } from 'typescript';
import ResourceShareSystem from '../lib/ResourceShareSystem';
import {establishConnection, loadProgramAddressFromEnvironment} from '../lib/util';

type SolanaConnectionProps = {
    render(state: SolanaConnectionState): JSX.Element
}

export type SolanaConnectionState = {
    loading: boolean,
    error?: Error,
    system?: ResourceShareSystem
}

export class SolanaConnection extends React.Component<SolanaConnectionProps, SolanaConnectionState> {
    constructor(props: SolanaConnectionProps) {
        super(props);
        this.state = {
            loading: true
        };
    }

    componentDidMount() {
        loadProgramAddressFromEnvironment()
            .then((programId: string) => {
                establishConnection()
                    .then((connection: Connection) => this.setState({...this.state, system: new ResourceShareSystem(connection, programId), loading: false}))
            })
            .catch((error: any) => this.setState({ error: error, loading: false }))
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