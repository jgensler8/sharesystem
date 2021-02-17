import { SolanaConnectionState } from "./SolanaConnection";
import React from 'react';

type ResourceEditorProps = {
    state: SolanaConnectionState
}

export type ResourceEditorState = {
}

export class ResourceEditor extends React.Component<ResourceEditorProps, ResourceEditorState> {
    constructor(props: ResourceEditorProps) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        // props.state.connection.loggedIn() ? nothing : <form request_airdrop_from_xyz() />
    }

    render() {
        return (
            <div>
                <div>
                    create shared resource
                    <input placeholder="item name"/>
                    <input placeholder="item threshold"/>
                </div>

                <div>
                    resource signup
                    <input placeholder="ZIP code" /><button>search</button>
                    <table>
                        <tr>Farmers Market Peaches 01/07 <button>intent</button></tr>
                        <tr>Farmers Market Peaches 01/14 <button>intent</button></tr>
                        <tr>Farmers Market Peaches 01/21 <button>intent</button></tr>
                    </table>
                </div>
            </div>
        );
    }
}

export default ResourceEditor;