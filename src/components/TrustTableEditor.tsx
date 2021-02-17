import { SolanaConnectionState } from "./SolanaConnection";
import React from 'react';

type TrustTableProps = {
    state: SolanaConnectionState
}

type TrustTableKey = string;
type TrustTableValue = {
    id: string,
    value: number,
}

type TrustTable = {
    records: Map<TrustTableKey, TrustTableValue>
}

export type TrustTableState = {
    table?: TrustTable,
}

export class TrustTableEditor extends React.Component<TrustTableProps, TrustTableState> {
    constructor(props: TrustTableProps) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        // props.state.connection.GetTrustTable()
    }

    render() {
        return (
            <div>
                trust table
                {this.state.table && Array.from(this.state.table.records).map((value) => {
                  <div>{value[0]} {value[1].id} {value[1].value}</div>  
                })}
            </div>
        );
    }
}

export default TrustTableEditor;