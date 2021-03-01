import React from 'react';
import { Challenge, ISearchEngine, Location, Resource, TrustTableEntry } from '../lib/lib-types';
import { Card, Button, CardGroup, Table, Form, Alert } from 'react-bootstrap';
import { Account, PublicKey } from '@solana/web3.js';

type ConnectedAppProps = {
    system: ISearchEngine
}

export type ConnectedAppState = {
    loading: boolean,
    error?: Error,

    system: ISearchEngine,

    trustTable: Array<TrustTableEntry>,

    resources: Array<Resource>,
    intents: Array<Resource>,
    challenges: Array<Challenge>,
    claims: Array<Resource>,
}

function TrustTableElement(trustTable: Array<TrustTableEntry>) {
    return <Table striped bordered hover>
        <thead>
            <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            {
                trustTable.map(entry => {
                    return <tr key={entry.id.toBase58()}>
                        <td>unknown</td>
                        <td>{entry.id.toBase58()}</td>
                        <td>{entry.value}</td>
                    </tr>
                })
            }
        </tbody>
    </Table>
}

function TrustTableForm(trustTable: Array<TrustTableEntry>, onSubmit: any) {
    let jsonArray = "{\n"
    for(let entry of trustTable) {
        jsonArray += `"${entry.id.toBase58()}": ${entry.value},\n`;
    }
    // trim last comma
    jsonArray = jsonArray.slice(0, jsonArray.length-2);
    jsonArray += "\n}";
    return <Form onSubmit={onSubmit}>
        <Form.Group controlId="trustTableForm.rawTrustTable">
            <Form.Control name="rawTable" as="textarea" defaultValue={jsonArray} />
            <Button type="submit">Update</Button>
        </Form.Group>
    </Form>
}

function ResourceCard(resource: Resource) {
    return <Card style={{ width: '18rem' }} key={resource.address.toBase58()}>
        <Card.Body>
            <Card.Title>{resource.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{resource.location.zip}</Card.Subtitle>
            <Card.Text>trust threshold: {resource.trustThreshold}</Card.Text>
            <Card.Link href={"https://explorer.solana.com/address/" + resource.address.toBase58()}>View on Solana Explorer</Card.Link>
        </Card.Body>
    </Card>
}

function IntentCard(resource: Resource) {
    <Card style={{ width: '18rem' }} key={resource.address.toBase58()}>
        <Card.Body>
            <Card.Title>{resource.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{resource.location.zip}</Card.Subtitle>
            <Card.Text>trust threshold: {resource.trustThreshold}</Card.Text>
            <Card.Link href={"https://explorer.solana.com/address/" + resource.address.toBase58()}>View on Solana Explorer</Card.Link>
        </Card.Body>
    </Card>
}

function ChallengeCard(challenge: Challenge) {
    return <Card style={{ width: '18rem' }} key={challenge.fromAddress.toBase58()}>
        <Card.Body>
            <Card.Title>unknown</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{challenge.toAddress.toBase58()}</Card.Subtitle>
            <Card.Text>
                status: {challenge.accepted ? "accepted 👍" : "rejected ⚠️"}
            </Card.Text>
            <Button>approve</Button>
            <Button variant="danger">reject</Button>
        </Card.Body>
    </Card>
}

function ClaimCard(resource: Resource) {
    return <Card style={{ width: '18rem' }} key={resource.address.toBase58()}>
        <Card.Body>
            <Card.Title>{resource.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{resource.location.zip}</Card.Subtitle>
            <Card.Text>
                trust value: {resource.trustThreshold}
            </Card.Text>
            <Button variant="success">claim</Button>
        </Card.Body>
    </Card>
}

export class ConnectedApp extends React.Component<ConnectedAppProps, ConnectedAppState> {
    _async_cancel = false;

    constructor(props: ConnectedAppProps) {
        super(props);
        this.state = {
            loading: true,
            system: props.system,

            trustTable: [new TrustTableEntry(new Account().publicKey, 10)],

            resources: [new Resource("Mr Farmer Potato", new Location("94040"), new Account().publicKey, 100), new Resource("Mr Farmer Potato", new Location("94040"), new Account().publicKey, 100)],
            intents: [],
            challenges: [new Challenge(new Account().publicKey, new Account().publicKey, false), new Challenge(new Account().publicKey, new Account().publicKey, false)],
            claims: [new Resource("Mr Farmer Potato", new Location("94040"), new Account().publicKey, 100)]
        };
        
        this.onSearch = this.onSearch.bind(this);
    }

    onTrustTableUpdate(e: React.SyntheticEvent) {
        console.log("would send request");
        e.preventDefault()
        const t = e.target as typeof e.target & {
            rawTable: {value: string}
        };
        const kvTable = JSON.parse(t.rawTable.value);
        let trustTableEntries: Array<TrustTableEntry> = [];
        for(let key in kvTable) {
            trustTableEntries.push(new TrustTableEntry(new PublicKey(key), kvTable[key]));
        }
        console.log(trustTableEntries);
    }

    onSearch(e: React.SyntheticEvent) {
        console.log("would search")
        e.preventDefault()
        const t = e.target as typeof e.target & {
            searchField: {value: string}
        };
        const zip = t.searchField.value;
        this.state.system.listResources(new Location(zip)).then(resources => {
            this.setState({
                ...this.state,
                resources: resources,
            })
        })
    }

    async asyncLoadAll(): Promise<ConnectedAppState> {
        console.log("loading indexes");

        let resources = await this.state.system.listResources(new Location("94040"));
        console.log(resources);
        let se_account = await this.state.system.getDefaultSearchEngineAccount();
        console.log(se_account);
        let intents = await this.state.system.listIntents(se_account);
        console.log(intents);

        return {
            ...this.state,
            resources: resources,
            // intents: intents,
        };
    }

    componentDidMount() {
        this.asyncLoadAll()
            .then((state: ConnectedAppState) => {
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
                <div style={{paddingTop: '50px'}}>
                    <h1>Your Account</h1>
                    <h2 style={{paddingTop: '25px'}}>Trust Table</h2>
                    {
                        TrustTableElement(this.state.trustTable)
                    }
                    <h2 style={{paddingTop: '25px'}}>Edit</h2>
                    {
                        TrustTableForm(this.state.trustTable, this.onTrustTableUpdate)
                    }
                </div>
                <div style={{paddingTop: '75px'}}>
                    <h1>Resources</h1>
                    <Form onSubmit={this.onSearch}>
                        <Form.Group controlId="resourceSearch">
                            <Form.Control name="searchField" type="text" placeholder="example: 94040" />
                            <Button type="submit">Search</Button>
                        </Form.Group>
                    </Form>
                    {
                        this.state.resources.length === 0 ? <Alert variant="warning">No Search Results</Alert> : <div></div>
                    }
                    <CardGroup>{this.state.resources.map(resource => ResourceCard(resource))}</CardGroup>
                </div>
                <div style={{paddingTop: '75px'}}>
                    <h1>Intents</h1>
                    <CardGroup>{this.state.intents.map(resource => IntentCard(resource))}</CardGroup>
                </div>
                <div style={{paddingTop: '75px'}}> 
                    <h1>Challenges</h1>
                    <CardGroup>{this.state.challenges.map(challenge => ChallengeCard(challenge))}</CardGroup>
                </div>
                <div style={{paddingTop: '75px'}}>
                    <h1>Claims</h1>
                    <CardGroup>{this.state.claims.map(resource => ClaimCard(resource))}</CardGroup>
                </div>
            </div>
        );
    }
}

export default ConnectedApp;