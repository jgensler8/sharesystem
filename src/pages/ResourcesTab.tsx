import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';
import ExploreContainer from '../components/ExploreContainer';
import ResourceEditor from '../components/ResourceEditor';
import { SolanaConnectionState } from '../components/SolanaConnection';
import './ResourcesTab.css';

type AccountTabProps = {
  state: SolanaConnectionState
}

class ResourcesTab extends React.Component<AccountTabProps>  {
  render(){
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Sign Up For Resources</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Resources</IonTitle>
            </IonToolbar>
          </IonHeader>
          <ResourceEditor state={this.props.state}/>
          <ExploreContainer name="Tab 2 page" />
        </IonContent>
      </IonPage>
    );
  }
};

export default ResourcesTab;
