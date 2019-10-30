import HeaderMenu from './../components/HeaderMenu'
import {Container, Form, Button, Header, Table, Ref, Icon, Segment, Message, Progress, Tab} from 'semantic-ui-react'
import fetch from 'unfetch';
import ReactDOM from 'react-dom';
import PostLayersParams from "../components/PostLayersParams";
import scrollIntoView from 'scroll-into-view';
import PatchLayerParams from "../components/PatchLayerParams";
import Resumable from "resumablejs";
import PostMapsParams from "../components/PostMapsParams";
import PatchMapParams from "../components/PatchMapParams";
import UserPathParams from "../components/UserPathParams";
import LayerPathParams from "../components/LayerPathParams";
import MapPathParams from "../components/MapPathParams";
import PatchCurrentuserParams from "../components/PatchCurrentuserParams";
import getConfig from 'next/config'
const { publicRuntimeConfig } = getConfig();

const ASSET_PREFIX = publicRuntimeConfig.ASSET_PREFIX;
let RESUMABLE_ENABLED = false;
const PREFER_RESUMABLE_SIZE_LIMIT = 1 * 1024 * 1024;

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

const PUBLICATION_TYPES = ['layer', 'map', 'current-user'];

const publicationTypeToDefaultRequest = {
  'layer': 'post-layers',
  'map': 'post-maps',
  'current-user': 'get-current-user',
};

const getRequestTitle = (request) => {
  const parts = request.split('-')
  parts[0] = parts[0].toUpperCase();
  const title = toTitleCase(parts.join(' '));
  return title;
}

const requestToParamsClass = {
  'post-layers': PostLayersParams,
  'patch-layer': PatchLayerParams,
  'post-maps': PostMapsParams,
  'patch-map': PatchMapParams,
  'patch-current-user': PatchCurrentuserParams,
}

const requestToResumableParams = {
  'post-layers': ['file'],
  'patch-layer': ['file'],
}

const endpointToUrlPartGetter = {
  'layers': ({user}) => `/${user}/layers`,
  'layer': ({user, layername}) => `/${user}/layers/${layername}`,
  'layer-thumbnail': ({user, layername}) => `/${user}/layers/${layername}/thumbnail`,
  'maps': ({user}) => `/${user}/maps`,
  'map': ({user, mapname}) => `/${user}/maps/${mapname}`,
  'map-file': ({user, mapname}) => `/${user}/maps/${mapname}/file`,
  'map-thumbnail': ({user, mapname}) => `/${user}/maps/${mapname}/thumbnail`,
  'current-user': () => `/current-user`,
}

const endpointToPathParams = {
  'layers': ['user'],
  'layer': ['user', 'name'],
  'layer-thumbnail': ['user', 'name'],
  'maps': ['user'],
  'map': ['user', 'name'],
  'map-file': ['user', 'name'],
  'map-thumbnail': ['user', 'name'],
  'current-user': [],
}

const endpointToPathParamsClass = {
  'layers': UserPathParams,
  'layer': LayerPathParams,
  'layer-thumbnail': LayerPathParams,
  'maps': UserPathParams,
  'map': MapPathParams,
  'map-file': MapPathParams,
  'map-thumbnail': MapPathParams,
}

const requestToQueryParams = {
  'patch-current-user': ['adjust_username'],
}

const queryParamValueToString = (request, param_name, param_value) => {
  const fns = {
    'patch-current-user.adjust_username': v => v || 'false',
  };
  const fn = fns[`${request}.${param_name}`];
  return fn ? fn(param_value) : param_value;
};


const getEndpointDefaultParamsState = (endpoint, state) => {
  const getters = {
    'layers': () => ({layername: ''}),
    'layer': ({layername}) => ({layername}),
    'layer-thumbnail': ({layername}) => ({layername}),
    'maps': () => ({mapname: ''}),
    'map': ({mapname}) => ({mapname}),
    'map-file': ({mapname}) => ({mapname}),
    'map-thumbnail': ({mapname}) => ({mapname}),
  }
  const getter = getters[endpoint];
  return getter ? getter(state) : {};
}

const getEndpointParamsProps = (endpoint, component) => {
  const user_props = {
    user: component.state.user,
    handleUserChange: component.handleUserChange.bind(component),
  };
  const layer_props = {
    ...user_props,
    layername: component.state.layername,
    handleLayernameChange: component.handleLayernameChange.bind(component),
  };
  const map_props = {
    ...user_props,
    mapname: component.state.mapname,
    handleMapnameChange: component.handleMapnameChange.bind(component),
  };
  const props = {
    'layers': user_props,
    'layer': layer_props,
    'layer-thumbnail': layer_props,
    'maps': user_props,
    'map': map_props,
    'map-file': map_props,
    'map-thumbnail': map_props,
    'current-user': {},
  }
  return props[endpoint];
}

const requestToEndpoint = (request) => {
  const parts = request.split('-')
  parts.shift();
  return parts.join('-');
}

const requestToMethod = (request) => {
  return request.split('-', 1)[0];
}

const requestResponseToLayername = (request, responseJson) => {
  const getters = {
    'post-layers': responseJson => responseJson[0]['name'],
    'patch-layer': responseJson => responseJson['name'],
  }
  const getter = getters[request];
  return getter ? getter(responseJson) : '';
}

const requestResponseToFilesToUpload = (request, responseJson) => {
  const getters = {
    'post-layers': responseJson => responseJson[0]['files_to_upload'],
    'patch-layer': responseJson => responseJson['files_to_upload'],
  }
  const getter = getters[request];
  return getter ? getter(responseJson) : '';
}

const isBlob = (response) => {
  return ['image/png'].includes(response.contentType);
}


class IndexPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      user: props.user && props.user.username ? props.user.username : 'browser',
      request: 'post-layers',
      layername: '',
      mapname: '',
      publication_type: 'layer',
      response: null,
    };
    this.formEl;
    this.respRef = React.createRef();
  }

  handleUserChange(event) {
    this.setState({user: event.target.value});
  }

  handleLayernameChange(event) {
    this.setState({layername: event.target.value});
  }

  handleMapnameChange(event) {
    this.setState({mapname: event.target.value});
  }

  handlePublicationTypeChange(event, {activeIndex}) {
    const ptype = PUBLICATION_TYPES[activeIndex];
    this.setState({
      publication_type: ptype,
      request: publicationTypeToDefaultRequest[ptype],
    });
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

    let resuming = false;
    let files_to_upload = [];

    const queryParamNames = (requestToQueryParams[this.state.request] || []).concat();
    const formData = new FormData(this.formEl);
    const queryParams = queryParamNames.reduce((obj, name) => {
      obj[name] = queryParamValueToString(this.state.request, name, formData.get(name));
      formData.delete(name);
      return obj;
    }, {});

    if(method !== 'get') {
      const endpoint = requestToEndpoint(this.state.request);
      const pathParams = (endpointToPathParams[endpoint] || []).concat();
      pathParams.forEach(pathParam => {
        formData.delete(pathParam);
      });
      console.log('RESUMABLE_ENABLED', RESUMABLE_ENABLED);
      if(RESUMABLE_ENABLED) {
        const resumableParams = (requestToResumableParams[this.state.request] || [])
            .concat()
            .filter(resumableParam => formData.has(resumableParam));
        const sum_file_size = resumableParams.reduce((prev, resumableParam) => {
          return prev + formData.getAll(resumableParam)
              .filter(f => f.name)
              .reduce((prev, f) => prev + f.size, 0)
        }, 0);
        resuming = sum_file_size >= PREFER_RESUMABLE_SIZE_LIMIT;
        console.log(`Sum of file sizes: ${sum_file_size} B`);
        console.log(`Use upload by chunks: ${resuming}`);
        if(resuming) {
          resumableParams.forEach(resumableParam => {
            const files = formData.getAll(resumableParam)
                .filter(f => f.name);
            files.forEach(file => {
              files_to_upload.push({
                'layman_original_parameter': resumableParam,
                'file': file,
              });
            });
            const file_names = files.map(f => f.name);
            formData.delete(resumableParam);
            file_names.forEach(fn => formData.append(resumableParam, fn));
          });
        }
      }
      fetchOpts['body'] = formData;
    }

    queryParams.timestamp = (+new Date());
    const query_part = Object.keys(queryParams).map(k => {
      const v = queryParams[k];
      return encodeURIComponent(k) + "=" + encodeURIComponent(v);
    }).join('&');

    const url_path = this.getRequestUrlPath() + '?' + query_part;

    fetch(url_path, fetchOpts).then((r) => {
      response.status = r.status;
      response.ok = r.ok;
      if(r.ok && resuming) {
        response.resumable = true;
      }
      response.contentType = r.headers.get('content-type');
      return isBlob(response) ? r.blob() : r.text();
    }).then( async (textOrBlob) => {
      if(isBlob(response)) {
        const blob = textOrBlob;
        response.image_url = window.URL.createObjectURL(blob);
      } else {
        const text = textOrBlob;
        response.text = text;
        try {
          response.json = JSON.parse(text);
        } catch (e) {}
      }
      // authentication failed
      if(response.status === 403 && response.json && response.json.code === 32) {
        // await sleep(1000);
        await this.props.handle_authn_failed();
      }

    }).then( () => {
      if(response.resumable && response.json) {
        const layername = requestResponseToLayername(this.state.request,
            response.json);
        // console.log('create resumable');
        const resumable = new Resumable({
          target: `${ASSET_PREFIX}/rest/${this.state.user}/layers/${layername}/chunk`,
          query: resumable_file => ({
            'layman_original_parameter': files_to_upload.find(
                fo => fo.file === resumable_file.file
            ).layman_original_parameter
          }),
          testChunks: true,
        });
        response.resumable_progress = 0;
        response.resumable_errors = [];

        resumable.on('progress', () => {
          response.resumable_progress = resumable.progress();
          this.setState({
            response: {...response}
          });
        });
        const expected_files_to_upload = requestResponseToFilesToUpload(
            this.state.request, response.json
        );
        files_to_upload = files_to_upload.filter(fo =>
          !!expected_files_to_upload.find(exp_fo =>
              fo.layman_original_parameter === exp_fo.layman_original_parameter
                  &&
              fo.file.name === exp_fo.file
          )
        );
        // console.log(`adding ${files_to_upload.length} files`);
        resumable.addFiles(files_to_upload.map(fo => fo.file));

        resumable.on('filesAdded', (files) => {
          // console.log(`added ${files.length} to resumable, starting upload`);
          resumable.upload();
        });

        resumable.on('error', (message, file, next) => {
          response.resumable_errors.push({
            message,
            file,
          });
          response.resumable_progress = resumable.progress();
          this.setState({
            response: {...response}
          });
        });
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
    const url = `${ASSET_PREFIX}/rest${urlPart}`;
    return url
  }

  componentDidMount() {
    // console.log('componentDidMount');
    RESUMABLE_ENABLED = (new Resumable()).support;
  }


  componentDidUpdate() {
    // console.log('componentDidUpdate');
    RESUMABLE_ENABLED = (new Resumable()).support;
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

    const panes = [
      {
        menuItem: 'Layer', render: () => {
          return (
              <Tab.Pane>
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
                            active={this.state.request === 'patch-layer'}
                            onClick={this.setRequest.bind(this, 'patch-layer')}
                        >PATCH</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'delete-layer'}
                            onClick={this.setRequest.bind(this, 'delete-layer')}
                        >DELETE</Button>
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Layer Thumbnail</Table.Cell>
                      <Table.Cell><code>/rest/&lt;user&gt;/layers/&lt;layername&gt;/thumbnail</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-layer-thumbnail'}
                            onClick={this.setRequest.bind(this, 'get-layer-thumbnail')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Tab.Pane>
          );
        },
      },
      {
        menuItem: 'Map', render: () => {
          return (
              <Tab.Pane>
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
                      <Table.Cell>Maps</Table.Cell>
                      <Table.Cell><code>/rest/&lt;user&gt;/maps</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-maps'}
                            onClick={this.setRequest.bind(this, 'get-maps')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'post-maps'}
                            onClick={this.setRequest.bind(this, 'post-maps')}
                        >POST</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Map</Table.Cell>
                      <Table.Cell><code>/rest/&lt;user&gt;/maps/&lt;mapname&gt;</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-map'}
                            onClick={this.setRequest.bind(this, 'get-map')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'patch-map'}
                            onClick={this.setRequest.bind(this, 'patch-map')}
                        >PATCH</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'delete-map'}
                            onClick={this.setRequest.bind(this, 'delete-map')}
                        >DELETE</Button>
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Map File</Table.Cell>
                      <Table.Cell><code>/rest/&lt;user&gt;/maps/&lt;mapname&gt;/file</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-map-file'}
                            onClick={this.setRequest.bind(this, 'get-map-file')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Map Thumbnail</Table.Cell>
                      <Table.Cell><code>/rest/&lt;user&gt;/maps/&lt;mapname&gt;/thumbnail</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-map-thumbnail'}
                            onClick={this.setRequest.bind(this, 'get-map-thumbnail')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Tab.Pane>
          )
        },
      },
      {
        menuItem: 'Current User', render: () => {
          return (
              <Tab.Pane>
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
                      <Table.Cell>Current User</Table.Cell>
                      <Table.Cell><code>/rest/current-user</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-current-user'}
                            onClick={this.setRequest.bind(this, 'get-current-user')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'patch-current-user'}
                            onClick={this.setRequest.bind(this, 'patch-current-user')}
                        >PATCH</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'delete-current-user'}
                            onClick={this.setRequest.bind(this, 'delete-current-user')}
                        >DELETE</Button>
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </Tab.Pane>
          )
        },
      },
    ];

    const publ_idx = PUBLICATION_TYPES.indexOf(this.state.publication_type);

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
            <Tab panes={panes} activeIndex={publ_idx} onTabChange={this.handlePublicationTypeChange.bind(this)} />
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

export default IndexPage;

