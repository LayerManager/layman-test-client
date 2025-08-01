import React from 'react'
import HeaderMenu from './../components/HeaderMenu'
import {Button, Container, Form, Header, Icon, Message, Progress, Segment, Tab, Table} from 'semantic-ui-react'
import fetch from 'unfetch';
import PostWorkspaceLayersParams from "../components/PostWorkspaceLayersParams";
import scrollIntoView from 'scroll-into-view';
import PatchWorkspaceLayerParams from "../components/PatchWorkspaceLayerParams";
import Resumable from "resumablejs";
import PostWorkspaceMapsParams from "../components/PostWorkspaceMapsParams";
import PatchWorkspaceMapParams from "../components/PatchWorkspaceMapParams";
import WorkspacePathParams from "../components/WorkspacePathParams";
import WorkspaceLayerPathParams from "../components/WorkspaceLayerPathParams";
import WorkspaceMapPathParams from "../components/WorkspaceMapPathParams";
import UuidParams from "../components/UuidParams";
import PatchCurrentuserParams from "../components/PatchCurrentuserParams";
import GetPublicationsParams from "../components/GetPublicationsParams";
import DeleteUserParams from "../components/DeleteUserParams";
import getConfig from 'next/config'
import {
  containerStyle,
  getRequestTitle,
  isBlob,
  prettifyResponse,
  requestToEndpoint,
  requestToMethod
} from "../src/utils";

const { publicRuntimeConfig } = getConfig();

const ASSET_PREFIX = publicRuntimeConfig.ASSET_PREFIX;
let RESUMABLE_ENABLED = false;
const PREFER_RESUMABLE_SIZE_LIMIT = 1 * 1024 * 1024;

const PUBLICATION_TYPES = ['publication', 'layer', 'map', 'users'];

const HEADERS_TO_SHOW = ['Content-Type', 'X-Total-Count', 'Content-Range', 'Deprecation', 'Link'];

const publicationTypeToDefaultRequest = {
  'publication': 'get-publications',
  'layer': 'get-layers',
  'map': 'get-maps',
  'users': 'get-users',
};

const requestToParamsClass = {
  'get-publications': GetPublicationsParams,
  'get-layers': GetPublicationsParams,
  'get-workspace-layers': GetPublicationsParams,
  'post-workspace-layers': PostWorkspaceLayersParams,
  'patch-workspace-layer': PatchWorkspaceLayerParams,
  'get-maps': GetPublicationsParams,
  'get-workspace-maps': GetPublicationsParams,
  'post-workspace-maps': PostWorkspaceMapsParams,
  'patch-workspace-map': PatchWorkspaceMapParams,
  'patch-current-user': PatchCurrentuserParams,
  'delete-user': DeleteUserParams,
}

const requestToResumableParams = {
  'post-workspace-layers': ['file'],
  'patch-workspace-layer': ['file'],
}

const endpointToUrlPartGetter = {
  'publications': () => `/publications`,
  'layers': () => `/layers`,
  'workspace-layers': ({workspace}) => `/workspaces/${workspace}/layers`,
  'workspace-layer': ({workspace, layername}) => `/workspaces/${workspace}/layers/${layername}`,
  'layer-thumbnail': ({uuid}) => `/layers/${uuid}/thumbnail`,
  'workspace-layer-style': ({workspace, layername}) => `/workspaces/${workspace}/layers/${layername}/style`,
  'workspace-layer-metadata-comparison': ({workspace, layername}) => `/workspaces/${workspace}/layers/${layername}/metadata-comparison`,
  'maps': () => `/maps`,
  'workspace-maps': ({workspace}) => `/workspaces/${workspace}/maps`,
  'workspace-map': ({workspace, mapname}) => `/workspaces/${workspace}/maps/${mapname}`,
  'map-file': ({uuid}) => `/maps/${uuid}/file`,
  'map-thumbnail': ({uuid}) => `/maps/${uuid}/thumbnail`,
  'workspace-map-metadata-comparison': ({workspace, mapname}) => `/workspaces/${workspace}/maps/${mapname}/metadata-comparison`,
  'users': () => `/users`,
  'user': ({username}) => `/users/${username}`,
  'version': () => `/about/version`,
  'current-user': () => `/current-user`,
  'roles': () => `/roles`,
}

const endpointToPathParams = {
  'publications': [],
  'layers': [],
  'workspace-layers': ['workspace'],
  'workspace-layer': ['workspace', 'name'],
  'layer-thumbnail': ['uuid'],
  'workspace-layer-style': ['workspace', 'name'],
  'workspace-layer-metadata-comparison': ['workspace', 'name'],
  'maps': [],
  'workspace-maps': ['workspace'],
  'workspace-map': ['workspace', 'name'],
  'map-file': ['uuid'],
  'map-thumbnail': ['uuid'],
  'workspace-map-metadata-comparison': ['workspace', 'name'],
  'users': [],
  'user': ['username'],
  'version': [],
  'current-user': [],
  'roles': [],
}

const endpointToPathParamsClass = {
  'workspace-layers': WorkspacePathParams,
  'workspace-layer': WorkspaceLayerPathParams,
  'layer-thumbnail': UuidParams,
  'workspace-layer-style': WorkspaceLayerPathParams,
  'workspace-layer-metadata-comparison': WorkspaceLayerPathParams,
  'workspace-maps': WorkspacePathParams,
  'workspace-map': WorkspaceMapPathParams,
  'map-file': UuidParams,
  'map-thumbnail': UuidParams,
  'workspace-map-metadata-comparison': WorkspaceMapPathParams,
}

const requestToQueryParams = {
  'get-publications': ['full_text_filter', 'bbox_filter', 'bbox_filter_crs', 'order_by', 'ordering_bbox', 'ordering_bbox_crs', 'limit', 'offset', ],
  'get-layers': ['full_text_filter', 'bbox_filter', 'bbox_filter_crs', 'order_by', 'ordering_bbox', 'ordering_bbox_crs', 'limit', 'offset', ],
  'get-workspace-layers': ['full_text_filter', 'bbox_filter', 'bbox_filter_crs', 'order_by', 'ordering_bbox', 'ordering_bbox_crs', 'limit', 'offset', ],
  'get-maps': ['full_text_filter', 'bbox_filter', 'bbox_filter_crs', 'order_by', 'ordering_bbox', 'ordering_bbox_crs', 'limit', 'offset', ],
  'get-workspace-maps': ['full_text_filter', 'bbox_filter', 'bbox_filter_crs', 'order_by', 'ordering_bbox', 'ordering_bbox_crs', 'limit', 'offset', ],
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
    'workspace-layers': () => ({layername: ''}),
    'workspace-layer': ({layername}) => ({layername}),
    'layer-thumbnail': ({uuid}) => ({uuid}),
    'workspace-layer-style': ({layername}) => ({layername}),
    'workspace-layer-metadata-comparison': ({layername}) => ({layername}),
    'workspace-maps': () => ({mapname: ''}),
    'workspace-map': ({mapname}) => ({mapname}),
    'map-file': ({uuid}) => ({uuid}),
    'map-thumbnail': ({uuid}) => ({uuid}),
    'workspace-map-metadata-comparison': ({mapname}) => ({mapname}),
  }
  const getter = getters[endpoint];
  return getter ? getter(state) : {};
}

const getEndpointParamsProps = (endpoint, component) => {
  const workspace_props = {
    workspace: component.state.workspace,
    handleWorkspaceChange: component.handleWorkspaceChange.bind(component),
  };
  const layer_props = {
    ...workspace_props,
    layername: component.state.layername,
    handleLayernameChange: component.handleLayernameChange.bind(component),
  };
  const map_props = {
    ...workspace_props,
    mapname: component.state.mapname,
    handleMapnameChange: component.handleMapnameChange.bind(component),
  };
  const layer_uuid_props = {
    uuid: component.state.uuid,
    handleUuidChange: component.handleUuidChange.bind(component),
    label: 'Layer uuid',
    placeholder: 'Layer uuid',
  };
  const map_uuid_props = {
    uuid: component.state.uuid,
    handleUuidChange: component.handleUuidChange.bind(component),
    label: 'Map uuid',
    placeholder: 'Map uuid',
  };
  const user_props = {
    username: component.state.username,
    handleUsernameChange: component.handleUsernameChange.bind(component),
  };
  const props = {
    'publications': {},
    'layers': {},
    'workspace-layers': workspace_props,
    'workspace-layer': layer_props,
    'layer-thumbnail': layer_uuid_props,
    'workspace-layer-style': layer_props,
    'workspace-layer-metadata-comparison': layer_props,
    'maps': {},
    'workspace-maps': workspace_props,
    'workspace-map': map_props,
    'map-file': map_uuid_props,
    'map-thumbnail': map_uuid_props,
    'workspace-map-metadata-comparison': map_props,
    'users': {},
    'user': user_props,
    'version': {},
    'current-user': {},
    'roles': {},
  }
  return props[endpoint];
}

const requestResponseToLayername = (request, responseJson) => {
  const getters = {
    'post-workspace-layers': responseJson => responseJson[0]['name'],
    'patch-workspace-layer': responseJson => responseJson['name'],
  }
  const getter = getters[request];
  return getter ? getter(responseJson) : '';
}

const requestResponseToFilesToUpload = (request, responseJson) => {
  const getters = {
    'post-workspace-layers': responseJson => responseJson[0]['files_to_upload'],
    'patch-workspace-layer': responseJson => responseJson['files_to_upload'],
  }
  const getter = getters[request];
  return getter ? getter(responseJson) : '';
}


class IndexPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      workspace: props.user && props.user.username ? props.user.username : 'browser',
      request: 'get-layers',
      layername: '',
      mapname: '',
      uuid: '',
      username: '',
      publication_type: 'layer',
      response: null,
    };
    this.formElRef = React.createRef();
    this.respRef = React.createRef();
  }

  handleWorkspaceChange(event) {
    this.setState({workspace: event.target.value});
  }

  handleLayernameChange(event) {
    this.setState({layername: event.target.value});
  }

  handleMapnameChange(event) {
    this.setState({mapname: event.target.value});
  }
  handleUuidChange(event) {
    this.setState({uuid: event.target.value});
  }
  handleUsernameChange(event) {
    this.setState({username: event.target.value});
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
    const formData = new FormData(this.formElRef.current);
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

      response.headers = {};
      for (const header of HEADERS_TO_SHOW) {
        if(r.headers.get(header) !== null) {
          response.headers[header] = r.headers.get(header);
        }
      }

      return isBlob(response) ? r.blob() : r.text();
    }).then( async (textOrBlob) => {
      if(isBlob(response)) {
        const blob = textOrBlob;
        response.image_url = window.URL.createObjectURL(blob);
      } else {
        const text = textOrBlob;
        await prettifyResponse(response, text)
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
          target: `${ASSET_PREFIX}/rest/workspaces/${this.state.workspace}/layers/${layername}/chunk`,
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
      const domNode = this.respRef.current
      if(domNode) {
        scrollIntoView(domNode);
      }
    });

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
        let resp_body_text = response.pretty_text;
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
      const headers = Object.entries(response.headers).map(([key, value]) => {
        return <p key={key}>{key}: {value}</p>
      })
      respEl =
          <div>
            <Segment>
              {resuming_body}
              {resuming_errors}
              <Message positive={response.ok}  negative={!response.ok}>
                <Message.Header>Response</Message.Header>
                <p>Status code: {response.status}</p>
                {headers}
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
        menuItem: 'Publication', render: () => {
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
                      <Table.Cell>Publications</Table.Cell>
                      <Table.Cell><code>/rest/publications</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-publications'}
                            onClick={this.setRequest.bind(this, 'get-publications')}
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
                      <Table.Cell><code>/rest/layers</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-layers'}
                            onClick={this.setRequest.bind(this, 'get-layers')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Layer Thumbnail</Table.Cell>
                      <Table.Cell><code>/rest/layers/&lt;uuid&gt;/thumbnail</code></Table.Cell>
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
                    <Table.Row>
                      <Table.Cell>Workspace Layers</Table.Cell>
                      <Table.Cell><code>/rest/workspaces/&lt;workspace_name&gt;/layers</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-workspace-layers'}
                            onClick={this.setRequest.bind(this, 'get-workspace-layers')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'post-workspace-layers'}
                            onClick={this.setRequest.bind(this, 'post-workspace-layers')}
                        >POST</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'delete-workspace-layers'}
                            onClick={this.setRequest.bind(this, 'delete-workspace-layers')}
                        >DELETE</Button>
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Workspace Layer</Table.Cell>
                      <Table.Cell><code>/rest/workspaces/&lt;workspace_name&gt;/layers/&lt;layername&gt;</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-workspace-layer'}
                            onClick={this.setRequest.bind(this, 'get-workspace-layer')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'patch-workspace-layer'}
                            onClick={this.setRequest.bind(this, 'patch-workspace-layer')}
                        >PATCH</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'delete-workspace-layer'}
                            onClick={this.setRequest.bind(this, 'delete-workspace-layer')}
                        >DELETE</Button>
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Workspace Layer Style</Table.Cell>
                      <Table.Cell><code>/rest/workspaces/&lt;workspace_name&gt;/layers/&lt;layername&gt;/style</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-workspace-layer-style'}
                            onClick={this.setRequest.bind(this, 'get-workspace-layer-style')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Workspace Layer Metadata Comparison</Table.Cell>
                      <Table.Cell><code>/rest/workspaces/&lt;workspace_name&gt;/layers/&lt;layername&gt;/metadata-comparison</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-workspace-layer-metadata-comparison'}
                            onClick={this.setRequest.bind(this, 'get-workspace-layer-metadata-comparison')}
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
                      <Table.Cell><code>/rest/maps</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-maps'}
                            onClick={this.setRequest.bind(this, 'get-maps')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Map Thumbnail</Table.Cell>
                      <Table.Cell><code>/rest/maps/&lt;uuid&gt;/thumbnail</code></Table.Cell>
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
                    <Table.Row>
                      <Table.Cell>Map File</Table.Cell>
                      <Table.Cell><code>/rest/maps/&lt;uuid&gt;/file</code></Table.Cell>
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
                      <Table.Cell>Workspace Maps</Table.Cell>
                      <Table.Cell><code>/rest/workspaces/&lt;workspace_name&gt;/maps</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-workspace-maps'}
                            onClick={this.setRequest.bind(this, 'get-workspace-maps')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'post-workspace-maps'}
                            onClick={this.setRequest.bind(this, 'post-workspace-maps')}
                        >POST</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'delete-workspace-maps'}
                            onClick={this.setRequest.bind(this, 'delete-workspace-maps')}
                        >DELETE</Button>
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Workspace Map</Table.Cell>
                      <Table.Cell><code>/rest/workspaces/&lt;workspace_name&gt;/maps/&lt;mapname&gt;</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-workspace-map'}
                            onClick={this.setRequest.bind(this, 'get-workspace-map')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'patch-workspace-map'}
                            onClick={this.setRequest.bind(this, 'patch-workspace-map')}
                        >PATCH</Button>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'delete-workspace-map'}
                            onClick={this.setRequest.bind(this, 'delete-workspace-map')}
                        >DELETE</Button>
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Workspace Map Metadata Comparison</Table.Cell>
                      <Table.Cell><code>/rest/workspaces/&lt;workspace_name&gt;/maps/&lt;mapname&gt;/metadata-comparison</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-workspace-map-metadata-comparison'}
                            onClick={this.setRequest.bind(this, 'get-workspace-map-metadata-comparison')}
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
        menuItem: 'Others', render: () => {
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
                      <Table.Cell>Users</Table.Cell>
                      <Table.Cell><code>/rest/users</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-users'}
                            onClick={this.setRequest.bind(this, 'get-users')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>

                    <Table.Row>
                      <Table.Cell>User</Table.Cell>
                      <Table.Cell><code>/rest/users/&lt;username&gt;</code></Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>
                      <Button
                            toggle
                            active={this.state.request === 'delete-user'}
                            onClick={this.setRequest.bind(this, 'delete-user')}
                        >DELETE</Button></Table.Cell>
                    </Table.Row>

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

                    <Table.Row>
                      <Table.Cell>Roles</Table.Cell>
                      <Table.Cell><code>/rest/roles</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-roles'}
                            onClick={this.setRequest.bind(this, 'get-roles')}
                        >GET</Button>
                      </Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                      <Table.Cell>x</Table.Cell>
                    </Table.Row>

                    <Table.Row>
                      <Table.Cell>Version</Table.Cell>
                      <Table.Cell><code>/rest/about/version</code></Table.Cell>
                      <Table.Cell>
                        <Button
                            toggle
                            active={this.state.request === 'get-version'}
                            onClick={this.setRequest.bind(this, 'get-version')}
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
    ];

    const publ_idx = PUBLICATION_TYPES.indexOf(this.state.publication_type);

    return (
        <div>
          <HeaderMenu user={this.props.user} show_log={!!this.props.num_authn_providers} />

          <Container style={containerStyle}>
            <Header as='h1'>Test Client of Layman REST API</Header>
            <p>
              <a href="https://github.com/LayerManager/layman/blob/master/doc/rest.md"
                 target="_blank">Layman REST API Documentation</a>
            </p>
            <Header as='h2'>Endpoints and Actions</Header>
            <Tab panes={panes} activeIndex={publ_idx} onTabChange={this.handlePublicationTypeChange.bind(this)} />
            <Header as='h2'>{getRequestTitle(this.state.request)}</Header>
            <Header as='h3'>Parameters</Header>
            <Form ref={this.formElRef}>
              {pathParams}
              {params}
              <Button primary type='submit' onClick={this.handleSubmitClick.bind(this)}>Submit</Button>
            </Form>
            <div ref={this.respRef}>
            {respEl}
            </div>
          </Container>
        </div>
    );
  }
}

export default IndexPage;

