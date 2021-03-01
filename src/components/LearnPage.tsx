import { Image, Jumbotron } from 'react-bootstrap';

function LearnPage() {
    return <div>
        <Image src="./quarter_pie.svg" fluid width="100%" />
        <Jumbotron fluid>
            <p>
                ShareSystem is a <u>"best-effort" resource management system</u> backed by Solana's blockchain.
                    </p>
        </Jumbotron>
        <Jumbotron fluid>
            <p>
                There are two parties in ShareSystem's architecture: <u>Resource Owners</u> and <u>Recipients</u>.
                    </p>
            <p>
                Resource Owners <u>register</u> their resource using some geographic location.
                    </p>
            <p>
                After registering a resource, Recipients can signal an <u>intent</u> to collect a particular resource.
                    </p>
            <p>
                Over time, <u>Resource Instances</u> are submitted to the Share System. This creates a way to quantify and audit how many resources are available for distribution.
                    </p>
            <p>
                After some time, the Resource Owner signals to <u>distribute</u> the resource. The total number of resources is calculated based on the Resource Instance data.
                    </p>
            <p>
                Following a resource moving into distribution, a <u>challenge</u> is issued between each of the Recipients.
                    </p>
            <p>
                When creating a resource, the Resource Owner creates a <u>Trust Threshold</u> to signal the <u>Total Trust Value</u> a Recipient needs to <u>Claim</u> a resource.
                    </p>
            <p>
                Recipients edit a <u>Trust Table</u> to record how much trust they have in other participents.
                      This trust value is an integer between zero to one hundred and the sum of all values in a Trust Table must be less than one hundred.
                    </p>
            <p>
                The Total Trust Value calculation is: <u>the trust value between the Resource Owner and the Recipient</u> multiplied by <u>the sum of accepted challenges targeting a Recipient</u>.
                    </p>
            <p>
                If this calculation is greater than the Trust Threshold, the Recipient is allowed to <u>claim</u> their fair share of the Resource.
                    </p>
        </Jumbotron>
        <Jumbotron>
            <p>
                To learn more about the internal architecture of the project, head to <a href="https://github.com/jgensler8/sharesystem" target="_blank" rel="noreferrer">the README on Github</a>.
                    </p>
        </Jumbotron>
    </div>
}

export default LearnPage;