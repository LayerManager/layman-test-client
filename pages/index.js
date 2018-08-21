import HeaderMenu from './../components/HeaderMenu'
import {Container, Form, Button, Header, Table, Ref, Segment, Label, Message} from 'semantic-ui-react'
import fetch from 'unfetch';
import PostLayersParams from "../components/PostLayersParams";
import GetLayerParams from "../components/GetLayerParams";

const containerStyle = {
  position: 'absolute',
  top: '40px',
  padding: '1em',
};

const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
};

const getRequestTitle = (request) => {
  const parts = request.split('-')
  parts[0] = parts[0].toUpperCase();
  const title = toTitleCase(parts.join(' '));
  return title;
}

const requestToParamsClass = {
  'post-layers': PostLayersParams,
  'get-layer': GetLayerParams,
}

const endpointToUrlPartGetter = {
  'layers': () => '/layers',
  'layer': ({layername}) => `/layers/${layername}`,
}

const endpointToPathParams = {
  'layers': [],
  'layer': ['name'],
}

const getEndpointDefaultParamsState = (endpoint, state) => {
  const getters = {
    'layers': () => ({layername: ''}),
    'layer': ({layername}) => ({layername}),
  }
  const getter = getters[endpoint];
  return getter ? getter(state) : {};
}

const requestToEndpoint = (request) => {
  const parts = request.split('-')
  parts.shift();
  return parts.join('-');
}

const requestToMethod = (request) => {
  return request.split('-', 1)[0];
}

class IndexPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      user: 'browser',
      request: 'post-layers',
      layername: '',
      response: null,
    };
    this.formEl;
    this.formRef = React.createRef();
  }

  handleUserChange(event) {
    this.setState({user: event.target.value});
  }

  handleLayernameChange(event) {
    this.setState({layername: event.target.value});
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

    const method = requestToMethod(this.state.request);
    const fetchOpts = {
      method: method.toUpperCase(),
    };

    if(method !== 'get') {
      const formData = new FormData(this.formEl);
      const endpoint = requestToEndpoint(this.state.request);
      const pathParams = (endpointToPathParams[endpoint] || []).concat();
      pathParams.push('user');
      pathParams.forEach(pathParam => {
        formData.delete(pathParam);
      })
      fetchOpts['body'] = formData;
    }

    fetch(this.getRequestUrlPath(), fetchOpts).then( r => {
      response.status = r.status;
      response.ok = r.ok;
      return r.text()
    }).then( text => {
      response.text = text;
      try {
        response.json = JSON.parse(text);
      } catch (e) {}
    }).finally(() => {
      this.setState({response});
    });

  }

  handleFormRef(formElement) {
    this.formEl = formElement;
  }

  getRequestUrlPath() {
    const endpoint = requestToEndpoint(this.state.request);
    const getter = endpointToUrlPartGetter[endpoint];
    const urlPart = getter ? getter(this.state) : '';
    const url = `/rest/${this.state.user}${urlPart}`;
    return url
  }

  render() {
    const {response} = this.state;
    let respEl = null;
    if(response) {
      const respBody = response.json ?
          JSON.stringify(response.json, null, 2) :
          response.text;
      respEl =
  <Message positive={response.ok}  negative={!response.ok}>
    <Message.Header>Response</Message.Header>
    <p>Status code {response.status}</p>
    <code style={{whiteSpace: 'pre'}}>{respBody}</code>
  </Message>
    }

    const paramsClass = requestToParamsClass[this.state.request];
    const params = paramsClass ? React.createElement(
        paramsClass,
        {
          layername: this.state.layername,
          onLayernameChange: this.handleLayernameChange.bind(this),
        }
    ) : null;

    return (
        <div>
          <HeaderMenu/>

          <Container style={containerStyle}>
            <Header as='h1'>Simple Client to Test Layman REST API</Header>
            <p>
              <a href="https://github.com/jirik/gspld/blob/master/REST.md"
                 target="_blank">Documentation</a>
            </p>
            <Header as='h2'>Endpoints and Actions</Header>
            <Table celled>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Endpoint</Table.HeaderCell>
                  <Table.HeaderCell>URL</Table.HeaderCell>
                  <Table.HeaderCell>GET</Table.HeaderCell>
                  <Table.HeaderCell>POST</Table.HeaderCell>
                  <Table.HeaderCell>PUT</Table.HeaderCell>
                  <Table.HeaderCell>DELETE</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                <Table.Row>
                  <Table.Cell>Layers</Table.Cell>
                  <Table.Cell><code>/rest/&lt;user&gt;/layers</code></Table.Cell>
                  <Table.Cell>
                    <Button
                        toggle
                        active={this.state.request === 'get-layers'}
                        onClick={this.setRequest.bind(this, 'get-layers')}
                    >GET</Button>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                        toggle
                        active={this.state.request === 'post-layers'}
                        onClick={this.setRequest.bind(this, 'post-layers')}
                    >POST</Button>
                  </Table.Cell>
                  <Table.Cell>x</Table.Cell>
                  <Table.Cell>x</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Layer</Table.Cell>
                  <Table.Cell><code>/rest/&lt;user&gt;/layers/&lt;layername&gt;</code></Table.Cell>
                  <Table.Cell>
                    <Button
                        toggle
                        active={this.state.request === 'get-layer'}
                        onClick={this.setRequest.bind(this, 'get-layer')}
                    >GET</Button>
                  </Table.Cell>
                  <Table.Cell>x</Table.Cell>
                  <Table.Cell>
                    <Button
                        toggle
                        active={this.state.request === 'put-layer'}
                        onClick={this.setRequest.bind(this, 'put-layer')}
                    >PUT</Button>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                        toggle
                        active={this.state.request === 'delete-layer'}
                        onClick={this.setRequest.bind(this, 'delete-layer')}
                    >DELETE</Button>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>

            </Table>
            <Header as='h2'>{getRequestTitle(this.state.request)}</Header>
            <Header as='h3'>Parameters</Header>
            <Ref innerRef={this.handleFormRef.bind(this)}>
              <Form>
                <Form.Input
                    inline
                    className="mandatory"
                    name="user"
                    label='User name'
                    placeholder='User name'
                    value={this.state.user}
                    onChange={this.handleUserChange.bind(this)}/>
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

export default IndexPage;

