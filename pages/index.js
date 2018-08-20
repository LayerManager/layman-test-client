import HeaderMenu from './../components/HeaderMenu'
import {Container, Form, Button, Header, Table, Ref, Segment} from 'semantic-ui-react'
import fetch from 'unfetch';

const containerStyle = {
  position: 'absolute',
  top: '40px',
  padding: '1em',
};

const clickableCell = {
  cursor: 'pointer'
};


class IndexPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      user: 'browser',
      request: 'post-layers',
      response: null,
    };
    this.formEl;
    this.formRef = React.createRef();
  }

  handleUserChange(event) {
    this.setState({user: event.target.value});
  }

  setRequest(request) {
    this.setState({
      request,
      response: null
    });
  }

  handleSubmitClick(event) {
    console.log('submit click', this.formEl);
    const formData = new FormData(this.formEl);
    console.log('formData', formData)
    for (var [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const response = {};

    fetch(`/rest/${this.state.user}/layers`, {
      method: 'POST',
      body: formData
    }).then( r => {
      response.status = r.status;
      console.log('statusCode', r.status)
      return r.json()
    }).then( json => {
      response.json = json;
    }).finally(() => {
      this.setState({response});
    });

  }

  handleFormRef(formElement) {
    console.log('handleFormRef', formElement);
    this.formEl = formElement;
  }

  render() {
    const {response} = this.state;
    let respEl = null;
    if(response) {
      respEl = <Segment>
        <Header as='h2'>Response</Header>
        <Header as='h3'>Status code {response.status}</Header>
        <code>{JSON.stringify(response.json, null, 2)}</code>
      </Segment>
    }
    return (
        <div>
          <HeaderMenu/>

          <Container style={containerStyle}>
            <Header as='h1'>Simple Client to Test Layman REST API</Header>
            <p>
              <a href="https://github.com/jirik/gspld/blob/master/REST.md"
                 target="_blank">Documentation</a>
            </p>
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
                  <Table.Cell
                      style={clickableCell}
                      onClick={this.setRequest.bind(this, 'get-layers')}
                      active={this.state.request === 'get-layers'}
                      >GET</Table.Cell>
                  <Table.Cell
                      style={clickableCell}
                      onClick={this.setRequest.bind(this, 'post-layers')}
                      active={this.state.request === 'post-layers'}
                      >POST</Table.Cell>
                  <Table.Cell>x</Table.Cell>
                  <Table.Cell>x</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Layer</Table.Cell>
                  <Table.Cell><code>/rest/&lt;user&gt;/layers/&lt;layername&gt;</code></Table.Cell>
                  <Table.Cell
                      style={clickableCell}
                      onClick={this.setRequest.bind(this, 'get-layer')}
                      active={this.state.request === 'get-layer'}
                      >GET</Table.Cell>
                  <Table.Cell>x</Table.Cell>
                  <Table.Cell
                      style={clickableCell}
                      onClick={this.setRequest.bind(this, 'put-layer')}
                      active={this.state.request === 'put-layer'}
                      >PUT</Table.Cell>
                  <Table.Cell
                      style={clickableCell}
                      onClick={this.setRequest.bind(this, 'delete-layer')}
                      active={this.state.request === 'delete-layer'}
                      >DELETE</Table.Cell>
                </Table.Row>
              </Table.Body>

            </Table>
            <Ref innerRef={this.handleFormRef.bind(this)}>
              <Form>
                <Form.Field inline >
                  <label>Vector data file</label>
                  <input name="file" type="file" accept=".geojson,.json" multiple />
                </Form.Field>
                <Form.Input inline name="user" label='User name' placeholder='User name' value={this.state.user} onChange={this.handleUserChange.bind(this)} />
                <Form.Input inline name="name" label='Layer name' placeholder='Layer name' />
                <Form.Input inline name="title" label='Layer title' placeholder='Layer title' />
                <Form.Input inline name="description" label='Layer description' placeholder='Layer description' />
                <Form.Input inline name="crs" label='CRS' placeholder='CRS' />
                <Form.Field inline >
                  <label>SLD style</label>
                  <input name="sld" type="file" accept=".sld,.xml" />
                </Form.Field>
                <Button type='submit' onClick={this.handleSubmitClick.bind(this)}>Submit</Button>
              </Form>
            </Ref>
            {respEl}
          </Container>
        </div>
    );
  }
}

export default IndexPage;

