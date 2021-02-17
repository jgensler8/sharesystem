import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import AccountTab from './pages/AccountTab';
import ResourcesTab from './pages/ResourcesTab';
import ChallengesTab from './pages/ChallengesTab';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { SolanaConnection, SolanaConnectionState } from './components/SolanaConnection';

const App: React.FC = () => (
  <IonApp>
    <SolanaConnection render={(state: SolanaConnectionState) =>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/account">
              <AccountTab state={state} />
            </Route>
            <Route exact path="/resources">
              <ResourcesTab state={state}/>
            </Route>
            <Route path="/challenges">
              <ChallengesTab state={state}/>
            </Route>
            <Route exact path="/">
              <Redirect to="/account" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="tab1" href="/account">
              <IonIcon icon={triangle} />
              <IonLabel>Account</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab2" href="/resources">
              <IonIcon icon={ellipse} />
              <IonLabel>Resources</IonLabel>
            </IonTabButton>
            <IonTabButton tab="tab3" href="/challenges">
              <IonIcon icon={square} />
              <IonLabel>Challenges</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    } />
  </IonApp>
);

export default App;
