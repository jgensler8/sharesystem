import { SolanaConnectionState } from "./SolanaConnection";
import React from 'react';
import {IonInput, IonItem, IonButton} from '@ionic/react';


type AccountCreatorProps = {
    state: SolanaConnectionState
}

export type AccountCreatorState = {
    name: string
    zip: string
}

export class AccountCreator extends React.Component<AccountCreatorProps, AccountCreatorState> {
    constructor(props: AccountCreatorProps) {
        super(props);
        this.state = {
            name: "",
            zip: ""
        };
    }

    componentDidMount() {
        // props.state.connection.loggedIn() ? nothing : <form request_airdrop_from_xyz() />
    }

    setName(name: string) {
        this.state = {
            ...this.state,
            name: name,
        };
    }

    setZip(zip: string) {
        this.state = {
            ...this.state,
            zip: zip,
        };
    }

    render() {
        return (
            <div>
                <IonItem>
                    <IonInput value={this.state.name} placeholder="Enter Name" onIonChange={e => this.setName(e.detail.value!)}></IonInput>
                </IonItem>
                <IonItem>
                    <IonInput value={this.state.zip} placeholder="Enter ZIP Code" onIonChange={e => this.setZip(e.detail.value!)}></IonInput>
                </IonItem>
                <IonButton color="primary">Create</IonButton>
            </div>
        );
    }
}

export default AccountCreator;