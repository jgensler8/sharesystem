import React from 'react';
import './App.css';
import {Navbar, Nav, Container, Row, Col} from 'react-bootstrap';
// import 'bootstrap/dist/css/bootstrap.css';
import './bootstrap.css';
import { Route, BrowserRouter as Router, Switch, Redirect } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import LearnPage from './components/LearnPage';
import AppPage from './components/AppPage';

function App() {
  return (
    <div className="App">
      <Router>
        <Navbar className="justify-content-center" bg="light" expand="sm">
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
          </Navbar.Collapse>
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <LinkContainer to="/learn">
                <Nav.Link>Learn</Nav.Link>
              </LinkContainer>
              <Nav.Link></Nav.Link>
              <LinkContainer to="/learn">
                <Navbar.Brand className="mr-auto" >ShareSystem</Navbar.Brand>
              </LinkContainer>
              <Nav.Link></Nav.Link>
              <LinkContainer to="/app">
                <Nav.Link>Use</Nav.Link>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Navbar>

        <Container>
          <Row>
            <Col lg xl></Col>
            <Col lg={10} xl={10}>
              <Switch>
                <Route path="/app">
                  <AppPage />
                </Route>
                <Route path="/learn">
                  <LearnPage />
                </Route>
                <Redirect from="/" to="learn" />
              </Switch>
            </Col>
            <Col lg xl></Col>
          </Row>
        </Container>
      </Router>
    </div>
  );
}

export default App;
