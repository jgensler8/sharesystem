import React from 'react';
import { Challenge, ISearchEngine, Location, Resource, TrustTableEntry } from '../lib/lib-types';
import { Card, Button, CardGroup, Table, Form } from 'react-bootstrap';
import { Account } from '@solana/web3.js';

type ConnectedAppProps = {
    system: ISearchEngine
}

export type ConnectedAppState = {
    location?: Location,
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
                    return <tr>
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
    return <Form>
        <Form.Group controlId="trustTableForm.rawTrustTable">
            <Form.Control as="textarea" defaultValue={JSON.stringify(trustTable)} />
        </Form.Group>
        <Button onClick={onSubmit()}>Update</Button>
    </Form>
}

function ResourceCard(resource: Resource) {
    return <Card style={{ width: '18rem' }}>
        <Card.Body>
            <Card.Title>{resource.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{resource.location.zip}</Card.Subtitle>
            <Card.Text>
                <p>
                    trust threshold: {resource.trustThreshold}
                </p>
            </Card.Text>
            <Card.Link href={"https://explorer.solana.com/address/" + resource.address.toBase58()}>View on Solana Explorer</Card.Link>
        </Card.Body>
    </Card>
}

function IntentCard(resource: Resource) {
    <Card style={{ width: '18rem' }}>
        <Card.Body>
            <Card.Title>{resource.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{resource.location.zip}</Card.Subtitle>
            <Card.Text>
                <p>
                    trust threshold: {resource.trustThreshold}
                </p>
            </Card.Text>
            <Card.Link href={"https://explorer.solana.com/address/" + resource.address.toBase58()}>View on Solana Explorer</Card.Link>
        </Card.Body>
    </Card>
}

function ChallengeCard(challenge: Challenge) {
    return <Card style={{ width: '18rem' }}>
        <Card.Body>
            <Card.Title>unknown</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{challenge.toAddress.toBase58()}</Card.Subtitle>
            <Card.Text>
                <p>
                    status: {challenge.accepted ? "accepted 👍" : "rejected ⚠️"}
                </p>
                <Button>approve</Button>
                <Button variant="danger">reject</Button>
            </Card.Text>
        </Card.Body>
    </Card>
}

function ClaimCard(resource: Resource) {
    return <Card style={{ width: '18rem' }}>
        <Card.Body>
            <Card.Title>{resource.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{resource.location.zip}</Card.Subtitle>
            <Card.Text>
                <p>
                    trust value: {resource.trustThreshold}
                </p>
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
            location: new Location("94040"),
            system: props.system,

            trustTable: [new TrustTableEntry(new Account().publicKey, 10)],

            resources: [new Resource("Mr Farmer Potato", new Location("94040"), new Account().publicKey, 100), new Resource("Mr Farmer Potato", new Location("94040"), new Account().publicKey, 100)],
            intents: [],
            challenges: [new Challenge(new Account().publicKey, new Account().publicKey, false), new Challenge(new Account().publicKey, new Account().publicKey, false)],
            claims: [new Resource("Mr Farmer Potato", new Location("94040"), new Account().publicKey, 100)]
        };
    }

    onTrustTableUpdate() {
        console.log("would send request");
    }

    onSearch() {
        console.log("would search")
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
                    <Form>
                        <Form.Group controlId="resourceSearch">
                            <Form.Control type="text" />
                        </Form.Group>
                        <Button onClick={this.onSearch}>Search</Button>
                    </Form>
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