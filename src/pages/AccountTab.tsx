import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './AccountTab.css';
import { SolanaConnectionState } from '../components/SolanaConnection';
import React from 'react';
import TrustTableEditor from '../components/TrustTableEditor';
import AccountCreator from '../components/AccountCreator';

type AccountTabProps = {
  state: SolanaConnectionState
}

class AccountTab extends React.Component<AccountTabProps> {
  render() {
    return (
      /* TODO(jeffg) remove IonHeader as I don't think it does anything */
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Your Account</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Account</IonTitle>
            </IonToolbar>
          </IonHeader>
          <AccountCreator state={this.props.state}/>
          <ExploreContainer name="Tab 1 page" />
          <TrustTableEditor state={this.props.state}/>
          {this.props.state.loading && <div>loading</div>}
          {this.props.state.error && <div>err: {this.props.state.error.message}</div>}
          {this.props.state.system && <div>system is ready</div>}
        </IonContent>
      </IonPage>
    );
  }
};

export default AccountTab;
