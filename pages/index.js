import HeaderMenu from './../components/HeaderMenu'
import {Container, Form, Button, Header, Table, Ref, Icon, Segment, Message, Progress} from 'semantic-ui-react'
import fetch from 'unfetch';
import ReactDOM from 'react-dom';
import PostLayersParams from "../components/PostLayersParams";
import GetLayerParams from "../components/GetLayerParams";
import GetLayerThumbnailParams from "../components/GetLayerThumbnailParams";
import scrollIntoView from 'scroll-into-view';
import PutLayerParams from "../components/PutLayerParams";
import DeleteLayerParams from "../components/DeleteLayerParams";
import Resumable from "resumablejs";

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

const getRequestTitle = (request) => {
  const parts = request.split('-')
  parts[0] = parts[0].toUpperCase();
  const title = toTitleCase(parts.join(' '));
  return title;
}

const requestToParamsClass = {
  'post-layers': PostLayersParams,
  'put-layer': PutLayerParams,
  'get-layer': GetLayerParams,
  'delete-layer': DeleteLayerParams,
  'get-layer-thumbnail': GetLayerThumbnailParams,
}

const requestToResumableParams = {
  'post-layers': ['file'],
  'put-layer': ['file'],
  'get-layer': [],
  'delete-layer': [],
  'get-layer-thumbnail': [],
}

const endpointToUrlPartGetter = {
  'layers': () => '/layers',
  'layer': ({layername}) => `/layers/${layername}`,
  'layer-thumbnail': ({layername}) => `/layers/${layername}/thumbnail`,
}

const endpointToPathParams = {
  'layers': [],
  'layer': ['name'],
  'layer-thumbnail': ['name'],
}

const getEndpointDefaultParamsState = (endpoint, state) => {
  const getters = {
    'layers': () => ({layername: ''}),
    'layer': ({layername}) => ({layername}),
    'layer-thumbnail': ({layername}) => ({layername}),
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

const requestResponseToLayername = (request, responseJson) => {
  const getters = {
    'post-layers': responseJson => responseJson[0]['name'],
    'put-layer': responseJson => responseJson['name'],
  }
  const getter = getters[request];
  return getter ? getter(responseJson) : '';
}

const requestResponseToFilesToUpload = (request, responseJson) => {
  const getters = {
    'post-layers': responseJson => responseJson[0]['files_to_upload'],
    'put-layer': responseJson => responseJson['files_to_upload'],
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
      user: 'browser',
      request: 'post-layers',
      layername: '',
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

    if(method !== 'get') {
      const formData = new FormData(this.formEl);
      const endpoint = requestToEndpoint(this.state.request);
      const pathParams = (endpointToPathParams[endpoint] || []).concat();
      pathParams.push('user');
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

    const url_path = this.getRequestUrlPath() + '?' + (+new Date());
    fetch(url_path, fetchOpts).then( r => {
      response.status = r.status;
      response.ok = r.ok;
      if(r.ok && resuming) {
        response.resumable = true;
      }
      response.contentType = r.headers.get('content-type');
      return isBlob(response) ? r.blob() : r.text();
    }).then( textOrBlob => {
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
    }).then( () => {
      if(response.resumable && response.json) {
        const layername = requestResponseToLayername(this.state.request,
            response.json);
        // console.log('create resumable');
        const resumable = new Resumable({
          target: `/rest/${this.state.user}/layers/${layername}/chunk`,
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
    const url = `/rest/${this.state.user}${urlPart}`;
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
            <Header as='h1'>Test Client of Layman REST API</Header>
            <p>
              <a href="https://github.com/jirik/gspld/blob/master/REST.md"
                 target="_blank">Layman REST API Documentation</a>
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

