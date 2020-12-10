import HeaderMenu from './../components/HeaderMenu'
import {Button, Container, Form, Header, Message, Ref, Segment, Table} from 'semantic-ui-react'
import fetch from 'unfetch';
import ReactDOM from 'react-dom';
import WfsPostTransactionParams from "../components/WfsPostTransactionParams";
import scrollIntoView from 'scroll-into-view';
import UserPathParams from "../components/WorkplacePathParams";
import getConfig from 'next/config'
import {containerStyle, getRequestTitle, requestToEndpoint, prettifyResponse} from "../src/utils";

const { publicRuntimeConfig } = getConfig();

const ASSET_PREFIX = publicRuntimeConfig.ASSET_PREFIX;

const requestToParamsClass = {
  'post-transaction': WfsPostTransactionParams,
}

const endpointToUrlPartGetter = {
  'transaction': ({user}) => `/${user}/wfs`,
}

const endpointToPathParamsClass = {
  'transaction': UserPathParams,
}

const getEndpointDefaultParamsState = (endpoint, state) => {
  const getters = {}
  const getter = getters[endpoint];
  return getter ? getter(state) : {};
}

const getEndpointParamsProps = (endpoint, component) => {
  const user_props = {
    user: component.state.user,
    data: component.state.data,
    handleUserChange: component.handleUserChange.bind(component),
    handleDataChange: component.handleDataChange.bind(component),
  };
  const props = {
    'transaction': user_props,
  }
  return props[endpoint];
}

const requestToQueryParamValues = {
  'post-transaction': {
    'request': 'Transaction',
  },
}

class WFSPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user && props.user.username ? props.user.username : 'browser',
      request: 'post-transaction',
      data: '',
      response: null,
    };
    this.formEl;
    this.respRef = React.createRef();
  }

  handleUserChange(event) {
    this.setState({user: event.target.value});
  }

  handleDataChange(data) {
    this.setState({data});
  }

  setRequest(request) {
    const endpoint = requestToEndpoint(request);
    this.setState({
      ...getEndpointDefaultParamsState(endpoint, this.state),
      request,
      response: null
    });
  }

  handleSubmitClick(event) {
    this.setState({response: null});

    const response = {};

    const fetchOpts = {
      method: "POST",
      body: this.state.data,
      headers: {
        "Content-Type": "text/xml",
        "Accept": "text/xml"}
    };

    const queryParamsOrig = requestToQueryParamValues[this.state.request] || {};
    // Clone param dictionary, so we do not change it
    const queryParams = JSON.parse(JSON.stringify(queryParamsOrig));

    queryParams.timestamp = (+new Date());
    const query_part = Object.keys(queryParams).map(k => {
      const v = queryParams[k];
      return encodeURIComponent(k) + "=" + encodeURIComponent(v);
    }).join('&');

    const url_path = this.getRequestUrlPath() + '?' + query_part;

    fetch(url_path, fetchOpts).then((r) => {
      response.status = r.status;
      response.ok = r.ok;
      response.contentType = r.headers.get('content-type');
      return r.text();
    }).then( async (text) => {
      // authentication failed
      if(response.status === 403 && response.json && response.json.code === 32) {
        // await sleep(1000);
        await this.props.handle_authn_failed();
      }
      await prettifyResponse(response, text)

    }).finally(() => {
      this.setState({response});
      const domNode = ReactDOM.findDOMNode(this.respRef.current)
      if(domNode) {
        scrollIntoView(domNode);
      }
    });

  }

  handleFormRef(formElement) {
    this.formEl = formElement;
  }

  getRequestUrlPath() {
    const endpoint = requestToEndpoint(this.state.request);
    const getter = endpointToUrlPartGetter[endpoint];
    const urlPart = getter ? getter(this.state) : '';
    const url = `${ASSET_PREFIX}/geoserver${urlPart}`;
    return url
  }

  render() {
    const {response} = this.state;
    let respEl = null;
    if(response) {
      const resp_body= <code style={{whiteSpace: 'pre'}}>{response.pretty_text}</code>

      respEl =
          <div ref={this.respRef}>
            <Segment>
              <Message positive={response.ok}  negative={!response.ok}>
                <Message.Header>Response</Message.Header>
                <p>Status code: {response.status}</p>
                <p>Content-Type: {response.contentType}</p>
                {resp_body}
              </Message>
            </Segment>
          </div>
    }

    const endpoint = requestToEndpoint(this.state.request);
    const paramsProps = getEndpointParamsProps(endpoint, this);
    const pathParamsClass = endpointToPathParamsClass[endpoint];
    let pathParams = null;
    if (pathParamsClass) {
      pathParams = React.createElement(
          pathParamsClass,
          paramsProps
      )
    }

    const paramsClass = requestToParamsClass[this.state.request];
    let params = null;
    if (paramsClass) {
      params = React.createElement(
          paramsClass,
          paramsProps
      )
    }

    const renderEndpointTable = (
            <Table celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Request</Table.HeaderCell>
                  <Table.HeaderCell>URL</Table.HeaderCell>
                  <Table.HeaderCell>GET</Table.HeaderCell>
                  <Table.HeaderCell>POST</Table.HeaderCell>
                  <Table.HeaderCell>PATCH</Table.HeaderCell>
                  <Table.HeaderCell>DELETE</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                <Table.Row>
                  <Table.Cell>Transaction</Table.Cell>
                  <Table.Cell><code>/geoserver/&lt;user&gt;/wfs</code></Table.Cell>
                  <Table.Cell>x</Table.Cell>
                  <Table.Cell>
                    <Button
                        toggle
                        active={this.state.request === 'post-transaction'}
                        onClick={this.setRequest.bind(this, 'post-transaction')}
                    >POST</Button>
                  </Table.Cell>
                  <Table.Cell>x</Table.Cell>
                  <Table.Cell>x</Table.Cell>
                </Table.Row>
          </Table.Body>
        </Table>
        )

    return (
        <div>
          <HeaderMenu user={this.props.user} show_log={!!this.props.num_authn_providers} />

          <Container style={containerStyle}>
            <Header as='h1'>Test Client of Layman WFS Endpoint</Header>
            <p>
              <a href="https://github.com/jirik/layman/blob/master/doc/endpoints.md#web-feature-service"
                 target="_blank">Layman WFS Endpoint Documentation</a>
            </p>
            <Header as='h2'>Requests and Actions</Header>
            {renderEndpointTable}
            <Header as='h2'>{getRequestTitle(this.state.request)}</Header>
            <Header as='h3'>Parameters</Header>
            <Ref innerRef={this.handleFormRef.bind(this)}>
              <Form>
                {pathParams}
                {params}
                <Button primary type='submit' onClick={this.handleSubmitClick.bind(this)}>Submit</Button>
              </Form>
            </Ref>
            {respEl}
          </Container>
        </div>
    );
  }
}

export default WFSPage;

