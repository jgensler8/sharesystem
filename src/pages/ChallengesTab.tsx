import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';
import ExploreContainer from '../components/ExploreContainer';
import { SolanaConnectionState } from '../components/SolanaConnection';
import './ChallengesTab.css';

type ChallengesTabProps = {
  state: SolanaConnectionState,
}

class ChallengesTab extends React.Component<ChallengesTabProps> {
  render(){
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Challenges</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Challenge</IonTitle>
            </IonToolbar>
          </IonHeader>

          <div>
              request resource
              <input placeholder="quantity (recommended 2)" />
          </div>
          in flight
          <table>
            <tr>from 111, to 222, challenge score: 3, suggested threshold: 2, challenged: 333,444,555 <button>claim</button> </tr>
            <tr>from 111, to 333, challenge score: 0, suggested threshold: 2, challenged: 222,444,555 </tr>
          </table>
          challenges
          <table>
            <tr>from 111, to 222, graph value: 0.5, suggested threshold: 2 <button>approve</button> </tr>
          </table>
          <ExploreContainer name="Tab 3 page" />
        </IonContent>
      </IonPage>
    );
  }
};

export default ChallengesTab;
