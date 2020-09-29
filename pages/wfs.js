import HeaderMenu from './../components/HeaderMenu'
import {Container, Form, Button, Header, Table, Ref, Icon, Segment, Message, Progress} from 'semantic-ui-react'
import fetch from 'unfetch';
import ReactDOM from 'react-dom';
import PostWFSParams from "../components/PostWFSParams";
import scrollIntoView from 'scroll-into-view';
import UserPathParams from "../components/UserPathParams";
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig();

const ASSET_PREFIX = publicRuntimeConfig.ASSET_PREFIX;

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
  'wfs': PostWFSParams,
}

const endpointToUrlPartGetter = {
  'wfs': ({user}) => `/${user}/wfs`,
}

const endpointToPathParams = {
  'wfs': ['user'],
}

const endpointToPathParamsClass = {
  'wfs': UserPathParams,
}

const getEndpointDefaultParamsState = (endpoint, state) => {
  const getters = {}
  const getter = getters[endpoint];
  return getter ? getter(state) : {};
}

const getEndpointParamsProps = (endpoint, component) => {
  const user_props = {
    user: component.state.user,
    handleUserChange: component.handleUserChange.bind(component),
  };
  const props = {
    'wfs': user_props,
  }
  return props[endpoint];
}

const requestToEndpoint = (request) => {
  return request;
}

const requestToQueryParams = {
}

const queryParamValueToString = (request, param_name, param_value) => {
  const fns = {
  };
  const fn = fns[`${request}.${param_name}`];
  return fn ? fn(param_value) : param_value;
};

class WFSPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user && props.user.username ? props.user.username : 'browser',
      request: 'wfs',
      publication_type: 'wfs',
      data: '',
      response: null,
    };
    this.formEl;
    this.respRef = React.createRef();
  }

  handleUserChange(event) {
    this.setState({user: event.target.value});
  }

  handleDataChange(event) {
    this.setState({data: event.target.value});
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

    console.log('this.state.data',this.state.data)
    console.log('this.state.user',this.state.user)

    const fetchOpts = {
      method: "POST",
      body: this.state.data,
      headers: {
        "Content-Type": "text/xml",
        "Accept": "text/xml"}
    };

    let resuming = false;

    const queryParamNames = (requestToQueryParams[this.state.request] || []).concat();
    const formData = new FormData(this.formEl);
    const queryParams = queryParamNames.reduce((obj, name) => {
      obj[name] = queryParamValueToString(this.state.request, name, formData.get(name));
      formData.delete(name);
      return obj;
    }, {});


    const endpoint = requestToEndpoint(this.state.request);
    const pathParams = (endpointToPathParams[endpoint] || []).concat();
    pathParams.forEach(pathParam => {
      formData.delete(pathParam);
    });
    fetchOpts['body'] = formData;

    queryParams.timestamp = (+new Date());
    const query_part = "request=Transaction";

    const url_path = this.getRequestUrlPath() + '?' + query_part;

    fetch(url_path, fetchOpts).then((r) => {
      response.status = r.status;
      response.ok = r.ok;
      if(r.ok && resuming) {
        response.resumable = true;
      }
      response.contentType = r.headers.get('content-type');
      return r.text();
    }).then( async (text) => {
        const ctext = text;
        response.text = ctext;
        try {
          response.json = JSON.parse(ctext);
        } catch (e) {}
      // authentication failed
      if(response.status === 403 && response.json && response.json.code === 32) {
        // await sleep(1000);
        await this.props.handle_authn_failed();
      }

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
      let resp_body;
      if(response.image_url) {
        resp_body = <img src={response.image_url} />
      } else {
        const resp_body_text = response.json ?
            JSON.stringify(response.json, null, 2) :
            response.text;
        resp_body = <code style={{whiteSpace: 'pre'}}>{resp_body_text}</code>
      }

      let resuming_body = null;
      let resuming_errors = null;
      if(response.resumable) {
        const resumable_header = response.resumable_progress < 1 ?
            <Message.Header><Icon loading name='spinner' />Uploading files</Message.Header>
            : <Message.Header>Upload finished!</Message.Header>;
        const positive = response.resumable_progress === 1
                      && !response.resumable_errors.length;
        const negative = !!response.resumable_errors.length;
        resuming_body =
            <Message positive={positive} negative={negative}>
              {resumable_header}
              <Progress percent={Math.ceil(response.resumable_progress*100)}
                  success={positive} warning={negative}
              />
            </Message>
        resuming_errors = response.resumable_errors.map((err, idx) => (
            <Message key={idx} negative>
              <Message.Header>Error during upload</Message.Header>
              {err.file ? <p>File name: {err.file.file.name}</p> : null}
              <code>${err.message}</code>
            </Message>
        ));
      }
      respEl =
          <div ref={this.respRef}>
            <Segment>
              {resuming_body}
              {resuming_errors}
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
                  <Table.HeaderCell>Endpoint</Table.HeaderCell>
                  <Table.HeaderCell>URL</Table.HeaderCell>
                  <Table.HeaderCell>GET</Table.HeaderCell>
                  <Table.HeaderCell>POST</Table.HeaderCell>
                  <Table.HeaderCell>PATCH</Table.HeaderCell>
                  <Table.HeaderCell>DELETE</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                <Table.Row>
                  <Table.Cell>WFS</Table.Cell>
                  <Table.Cell><code>/geoserver/&lt;user&gt;/wfs</code></Table.Cell>
                  <Table.Cell>x</Table.Cell>
                  <Table.Cell>
                    <Button
                        toggle
                        active={this.state.request === 'wfs'}
                        onClick={this.setRequest.bind(this, 'wfs')}
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
            <Header as='h1'>Test Client of Layman REST API</Header>
            <p>
              <a href="https://github.com/jirik/layman/blob/master/doc/rest.md"
                 target="_blank">Layman REST API Documentation</a>
            </p>
            <Header as='h2'>Endpoints and Actions</Header>
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

