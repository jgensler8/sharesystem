import ConnectedAppState from './ConnectedApp';
import SolanaConnection from "./SolanaConnection";
import {Alert} from "react-bootstrap";

function AppPage() {
    return <div>
        <SolanaConnection render={(state) => {
            if (state.error) {
                return <Alert variant="danger">
                    Error connecting to Solana: {state.error.toString()}
                </Alert>
            } else if (state.loading) {
                return <Alert variant="info">
                    loading...
                </Alert>
            } else if (state.system && state.searchEnginePayerAccount) {
                return <ConnectedAppState system={state.system} searchEnginePayerAccount={state.searchEnginePayerAccount}></ConnectedAppState>
            }
            return <div></div>
        }}/>
    </div>
}

export default AppPage;